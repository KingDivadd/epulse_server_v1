import { NextFunction, Request, Response } from "express"
import Chat_Model from '../models/chat_model'
import { CustomRequest } from "../helpers/interface"
import prisma from "../helpers/prisma_initializer"
import { jwt_secret, specialist_physician_chat_amount, general_physician_chat_amount, specialist_physician_chat_percentage, general_physician_chat_percentage } from "../helpers/constants"
import { addToRedis, delFromRedis, getFromRedis } from "../helpers/redis_initializer"
import { redis_call_store } from "../helpers/redis_funtions"
import { gen_token } from "../helpers/generated_entities"
import { function_web_push_notification } from "./push_notification"
import converted_datetime from "../helpers/date_time_elements"
import { patient_socket_messanger } from "../helpers/socket_events"
const jwt = require('jsonwebtoken')



export const clear_chat = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const {appointment_id} = req.params

        const chats:any = await Chat_Model.deleteMany({appointment_id})
        
        return res.status(200).json({msg: 'Appointment deleted successfully.', chats})
    } catch (err) {
        console.log('Error occured while deleting appointment chats ', err)
    }
}

export const get_appointment_chats = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {patient_id, physician_id} = req.params
        
        const patient = req.account_holder.user.patient_id
        const physician = req.account_holder.user.physician_id

        if (![patient_id, physician_id].includes(patient || physician)){
            return res.status(401).json({msg: `You are not allowed to view another user's chat messages`})
        }

        const chats = await Chat_Model.find({patient_id, physician_id})

        return res.status(200).json({nbHit: chats.length, chats})

    } catch (err:any) {
        console.log('Error while getting user chats')
        return res.status(500).json({msg: `Error occured while getting user chat err_message : ${err}`})
    }
}

export const validate_appointment = async(data:any)=>{
    const {appointment_id, caller_id, receiver_id} = data

    try {
        const appointment = await prisma.appointment.findUnique({ where: {appointment_id}, include: {patient: true, physician: true} })

        if (!appointment){ return {statusCode: 404, message: 'Appointment not found'} }
        
        const current_time = Math.floor(Date.now()/1000); 

        const appointment_start_time = Number(appointment.time)

        const appointment_end_time = appointment_start_time + (30 * 60);


        if (appointment?.status == 'pending'){
            return {statusCode: 400, message: `Dr ${appointment?.physician?.first_name} ${appointment?.physician?.last_name} hasn't accepted your appointment. ` }
        }

        if ( current_time >= appointment_start_time && current_time <= appointment_end_time && !appointment.in_session ){
            await prisma.appointment.update({
                where: {appointment_id},
                data: {in_session: true}
            })
        }

        // if (appointment?.status == 'completed' || appointment?.status == 'cancelled' || appointment_end_time < current_time) {
        //     await prisma.appointment.update({
        //         where: {appointment_id},
        //         data: {in_session: false}
        //     })

        //     console.log('appointment start time .... ',appointment_start_time,'\nappointment end_time ....', appointment_end_time, '\ncurrent-time ... ',current_time)
            
        //     return {
        //         statusCode: 400, 
        //         message: `Appointment with Dr ${appointment?.physician?.first_name} ${appointment?.physician?.last_name} already expired, to continue chatting or video calling, please book a new appointment. `}
        // }
        
        if (!appointment.available_during_session && (appointment.patient_id == caller_id || appointment.patient_id == data.patient_id)){
            await prisma.appointment.update({
                where: {appointment_id},
                data: {available_during_session: true}
            })
        }

        return {
            statusCode: 200, 
            patient_id: appointment.patient_id, physician_id: appointment.physician_id, 
            message: 'Appointment still in session'
        }

    } catch (err) {
        console.log(err);
        return { statusCode: 500, message: 'Internal Server Error' }; 
    }
}

export const verify_user_auth = async (auth_id: string): Promise<{ statusCode: number; data?: any; message?: string }> => {
    try {
        if (!auth_id) { return { statusCode: 401, message: 'x-id-key is missing' }; }

        const value = await getFromRedis(`${auth_id}`);
        if (!value) {
            return { statusCode: 404, message: 'Auth session id expired. Please generate OTP.' };
        }

        const decoded_value = await jwt.verify(JSON.parse(value), jwt_secret);
        return { statusCode: 200, data: decoded_value.user }; // Return decoded value as data
    } catch (err) {
        console.error(err);
        return { statusCode: 500, message: `err: ${err}`, };
    }
};

export const patient_physician_account_update = async (userAuth:any, data: any) => {
    try {
        const {text, media} = data

        if (userAuth.physician_id){
            return {statusCode: 200, message: `Physician account should not be deducted`}
        }
        
        // only deduct from patient's account if the sender is patient

        const patient_id = data.patient_id;
        const physician_id = data.physician_id

        const [patient_account, physician, physician_account] = await Promise.all([ 
            prisma.account.findFirst({ where: { patient_id } }), 
            prisma.physician.findFirst({where: { physician_id }}),
            prisma.account.findFirst({ where: {physician_id  }})
        
        ])  
        
        if (!patient_account) {
            return {statusCode: 404, message: 'Patient account not found'}
        }
        if (!physician) {
            return {statusCode: 404, message: 'Physician not found'}
        }
        
        let deductible_amount:number = 0;
        
        let earned_amount:number = 0;

        // if the physician is a specialist

        if (physician.specialty  !== 'general_doctor'){
            
            if (patient_account?.available_balance < Number(specialist_physician_chat_amount)){
                return {statusCode: 401, message: 'Available balace is low, please top up your balance' }
            }

            if (text){
                const number_of_char = text.length

                const multiplier = Math.ceil(number_of_char / 160)

                deductible_amount = multiplier * specialist_physician_chat_amount

            }else if (media.length){
                const number_of_files = Number(media.length)

                deductible_amount = number_of_files * Number(specialist_physician_chat_amount)

            }else if (text && media.length){

                const number_of_char = text.length

                const multiplier = Math.ceil(number_of_char / 160)

                const text_deductible_amount = multiplier * specialist_physician_chat_amount

                const number_of_files = Number(media.length)

                const media_deductible_amount = number_of_files * Number(specialist_physician_chat_amount)

                deductible_amount = text_deductible_amount + media_deductible_amount

            }

            if (patient_account?.available_balance < Number(deductible_amount)){
                return {statusCode: 401, message: 'Available balace is low, please top up your balance' }
            }

            earned_amount = deductible_amount * (specialist_physician_chat_percentage / 100);

            await Promise.all([

                chat_appointment_consultaion_data_update(patient_id, deductible_amount),

                prisma.account.update({
                    where: {account_id: patient_account.account_id},
                    data: {available_balance: patient_account.available_balance - Number(deductible_amount)}
                }),
                prisma.account.update({
                    where: {account_id: physician_account?.account_id},
                    data: {available_balance: {increment: earned_amount}}
                })
            ]) 
            
            return {statusCode: 200, message: 'Account updated successfully'}

        // if the physician is a general_doctor
        }else if (physician.specialty === 'general_doctor'){
            if (patient_account?.available_balance < Number(general_physician_chat_amount)){
                return {statusCode: 401, message: 'Available balace is low, please top up your balance' }
            }

            if (text){

                const number_of_char = text.length

                const multiplier = Math.ceil(number_of_char / 160);

                deductible_amount = multiplier * general_physician_chat_amount

            }else if (media.length){

                const number_of_files = media.length

                deductible_amount = number_of_files * Number(general_physician_chat_amount)
                
            }else if (text && media.length){

                const number_of_char = text.length

                const multiplier = Math.ceil(number_of_char / 160)

                const text_deductible_amount = multiplier * general_physician_chat_amount

                const number_of_files = Number(media.length)

                const media_deductible_amount = number_of_files * Number(general_physician_chat_amount)

                deductible_amount = text_deductible_amount + media_deductible_amount

            }

            if (patient_account?.available_balance < Number(deductible_amount)){
                return {statusCode: 401, message: 'Available balace is low, please top up your balance' }
            }

            earned_amount = deductible_amount * (general_physician_chat_percentage / 100);

            await Promise.all([
                chat_appointment_consultaion_data_update(patient_id, deductible_amount),
                
                prisma.account.update({
                    where: {account_id: patient_account.account_id},
                    data: {available_balance: patient_account.available_balance - Number(deductible_amount)}
                }),
                prisma.account.update({
                    where: {account_id: physician_account?.account_id},
                    data: {available_balance: {increment: earned_amount}}
                })
            ]) 
            
            return {statusCode: 200, message: 'Account updated successfully'}
        }

        // when the doctor is not registered as a specialist or a general doctor
        else if (physician?.specialty === ''){   
            return {statusCode: 401, message: `Only doctors who are sepecialist or general doctors can attend to patients specialty ${physician.specialty} `}
        }
        
    } catch (err:any) {
        console.log('error during patient account deduction ...... ', err)
        return {statusCode: 500, message: `Error during patient account deduction error : ${err}`}
    }
};

export const create_chat = async (data: any, userAuth: any) => {
    try {
        const { idempotency_key, appointment_id, patient_id, physician_id, text, media } = data;

        const user = userAuth
        let is_patient:boolean = false;
        let is_physician:boolean = false;
        if (user.patient_id){
            is_patient = true

        }else if (user.physician_id){
            is_physician = true
        }
        const chat = new Chat_Model({ idempotency_key, appointment_id, patient_id, physician_id, text, media, is_patient, is_physician });

        const saved_chat = await chat.save();

        return { statusCode: 200, data: saved_chat };
    } catch (error) {
        console.log('Error creating chat:', error);
        return { statusCode: 500, message: `Failed to create chat, reason : ${error} ${{data}}` };
    }
};

export const caller_availability = async(data:any,) =>{
    try {
        const {caller_id, receiver_id} = data

        const availability = {is_avialable: false, users:[caller_id, receiver_id]}
        const life_time = 15 * 60 * 1000
        const availability_status = await redis_call_store(caller_id, availability, life_time)

        if (!availability_status){
            return {statusCode: 400, message: "something went wrong."}
        }

        return {statusCode: 200, message: "User availability stored successfully", value: availability_status}
    } catch (error:any) {
        return { statusCode: 500, message: `Error occured while checking receivers availability` };
    }
}

export const receiver_availability = async(data:any) =>{
    try {
        const {caller_id, receiver_id} = data

        const availability = {is_avialable: false, users:[caller_id, receiver_id]}
        const life_time = 60 * 30 * 1000
        const availability_status = await redis_call_store(receiver_id, availability, life_time)

        if (!availability_status){
            return {statusCode: 400, message: "something went wrong."}
        }

        return {statusCode: 200, message: "User availability stored successfully", value: availability_status}
    } catch (error:any) {
        return { statusCode: 500, message: `Error occured while checking receivers availability` };
    }
}

export const consultation_completion_data = async(patient_id:string, appointment_id:string)=>{
    try {
        const [ value, appointment, patient_account] = await Promise.all([
            getFromRedis(`consultation-${patient_id}`),
            prisma.appointment.findFirst({ where: {appointment_id}, include: {patient: true, physician: true} }),
            prisma.account.findFirst({where: {patient_id}})
        ])

        if (value) {
            const decoded_value = await jwt.verify(value, jwt_secret)

            const spent_amount = decoded_value.amount;
            const consultation_type = decoded_value.consultation_type
            const appointment_end_time = Number(appointment?.time) + (30 * 60 * 1000);
            const start_time = consultation_type == 'chat' ? decoded_value.start_time : 0
            const spent_time = consultation_type == 'call' ? decoded_value.time : (Math.abs(appointment_end_time - start_time )/(60 * 1000))
                
            if (!appointment) { return {statusCode: 404, message: 'Appointment not found'} }
            
            const [transaction, updated_apppointment] = await Promise.all([
                prisma.transaction.create({
                    data: {
                        amount: spent_amount,
                        transaction_type: 'debit',
                        transaction_sub_type: 'consultation_amount',
                        patient_id: appointment.patient_id,
                        physician_id: null,
                        account_id: patient_account?.account_id,
                        updated_at: converted_datetime(),
                        created_at: converted_datetime(),
                    }
                }),
                prisma.appointment.update({
                    where: {appointment_id},
                    data: {
                        consultation_duration: spent_time,
                        total_consultation_amount: spent_amount,
                        updated_at: converted_datetime()
                    },
                    include: {patient: true, physician: true}
                })
        
            ]);

            const consultation_transaction_notification = await prisma.notification.create({
                data: {
                    patient_id: updated_apppointment.patient_id,
                    notification_type: "Transaction",
                    notification_sub_type: "consultation_amount",
                    notification_for_patient: true ,
                    transaction_id: transaction.transaction_id,
                    status: "completed",
                    case_note_id: null,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            }) 
            
            await delFromRedis(`consultation-${updated_apppointment.patient_id}`)
    
            patient_socket_messanger('notification', updated_apppointment, consultation_transaction_notification ) 
    
            if (updated_apppointment && updated_apppointment.patient_id && updated_apppointment.physician_id ) {

                const avatar  = updated_apppointment.patient?.avatar || ''
                const patient_id = updated_apppointment.patient_id
                const physician_id = updated_apppointment.physician_id

                function_web_push_notification(
                    "Consultation Information",
                    `You've completed your appointment with Dr. ${updated_apppointment.physician?.last_name} ${updated_apppointment.physician?.first_name} and your spent amount is ${Number(spent_amount).toLocaleString()} for a duration of ${spent_time} minutes.`,
                    avatar,
                    "Consultation Information",
                    updated_apppointment,
                    patient_id,
                    physician_id,
                    'patient'
                )
            }

        }

    } catch (err:any) {
        return { statusCode: 500, message: `Error occured while updating consultation time and amount `, error: err };
    }
}

export const call_appointment_consultaion_data_update = async(caller_id:string, physician_consultation_fee:number) =>{
    try {

        const value = await getFromRedis(`consultation-${caller_id}`)
        const useful_time = 30 * 60 * 1000;
        const consultation_fee = physician_consultation_fee || 500;

        if (!value) {
            const data = {consultation_type: 'call', amount: consultation_fee, time: 1 }
            const token = String(gen_token(data, useful_time ));
            await addToRedis(`consultation-${caller_id}`, token, useful_time)

            return {statusCode: 200, message: "Data stored successfully", current_data: data }
        }else{
            const decoded_value = await jwt.verify(value, jwt_secret)
            const new_data = {consultation_type: 'call', amount: decoded_value.amount + consultation_fee, time: decoded_value.time + 1 }
            const token = String(gen_token(new_data, useful_time ));
            await addToRedis(`consultation-${caller_id}`, token, useful_time)

            return {statusCode: 200, message: "Data stored successfully", current_data: new_data }
        }    
        
    } catch (err:any) {
        return { statusCode: 500, message: `Error occured while updating consultation time and amount `, error: err };
    }
}

export const chat_appointment_consultaion_data_update = async(patient_id:string, fee?:number) =>{
    try {

        const value = await getFromRedis(`consultation-${patient_id}`)
        const useful_time = 30 * 60 * 1000;
        const consultation_fee = fee || 150;

        if (!value) {
            const data = {consultation_type: 'chat', amount: consultation_fee, time: 1 , start_time: Date.now()}
            const token = String(gen_token(data, useful_time ));
            await addToRedis(`consultation-${patient_id}`, token, useful_time)

            return {statusCode: 200, message: "Data stored successfully", current_data: data }
        }else{
            const decoded_value = await jwt.verify(value, jwt_secret)
            const new_data = {consultation_type: 'chat', amount: decoded_value.amount + consultation_fee, time: decoded_value.time + 1, start_time:decoded_value.start_time }
            const token = String(gen_token(new_data, useful_time ));
            await addToRedis(`consultation-${patient_id}`, token, useful_time)

            return {statusCode: 200, message: "Data stored successfully", current_data: new_data }
        }    
        
    } catch (err:any) {
        return { statusCode: 500, message: `Error occured while updating consultation time and amount `, error: err };
    }
}