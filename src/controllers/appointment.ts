import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { booking_fee, jwt_secret } from '../helpers/constants'
import converted_datetime, { readable_date } from '../helpers/date_time_elements'
import {send_mail_accepted_appointment, send_mail_appointment_cancelled, send_mail_appointment_cancelled_by_patient, send_mail_appointment_in_session_to_patient, send_mail_appointment_in_session_to_physician, send_mail_booking_appointment, send_mail_patient_out_of_credit, send_mail_upcoming_appointment_to_patient, send_mail_upcoming_appointment_to_physician,} from '../helpers/emails'
import { CustomRequest } from '../helpers/interface'
import { create_meeting_id } from './video_chat_controller'
import { patient_socket_messanger, physician_socket_messanger } from '../helpers/socket_events'
import { function_web_push_notification } from './push_notification'
import { call_appointment_consultaion_data_update, chat_appointment_consultaion_data_update, consultation_completion_data } from './chat_controller'
import { delFromRedis, getFromRedis } from '../helpers/redis_initializer'
import { booking_appointment_mail, patient_appointment_acceptance_mail, patient_appointment_in_session_mail, patient_out_of_credit_mail, patient_upcoming_appointment_mail, physician_appointment_in_session_mail, physician_upcoming_appointment_mail } from '../helpers/email_controller'
const jwt = require('jsonwebtoken')

export const appointment_available_for_consultation = async (req:CustomRequest, res:Response) => {
    try {
        const user = req.account_holder.user

        const appointments = await prisma.appointment.findMany({

            where:{ allow_consultation: true, patient_id:user.patient_id, physician_id:user.physician_id,  },

            include:{
                patient: true, physician:true
            },

            orderBy:{ updated_at: 'desc'  }
        })

        // Filter to keep only the latest appointment per physician
        const latest_appointments = appointments.reduce((new_array:any[], current_iteration) => {
            // If physician_id is not yet in new_array, add the current appointment
            if (!new_array.some((appt:any) => appt.physician_id === current_iteration.physician_id)) {
                new_array.push(current_iteration);
            }
            return new_array;
        }, []);

        return res.status(200).json({msg: 'Appointment available for consultation', appointments:latest_appointments})
    } catch (err){
        return res.status(500).json({msg: "Error fetching all appointments available for chat"})
    }
}

export const book_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const { url, ...data_without_url } = req.body;
    try {
        let booking_amount = booking_fee || 100

        const patient_id = req.account_holder.user.patient_id;

        const [account, existing_appointment, physician ] = await Promise.all([

            prisma.account.findFirst({  where: {patient_id}, select: {account_id: true, available_balance: true} }),
            prisma.appointment.findFirst({ where: { patient_id: patient_id, }, orderBy: { created_at: 'desc' }, take: 1 }),
            prisma.physician.findUnique({ where: {physician_id: req.body.physician_id }, select: {is_verified_by_admin: true} })

        ])

        if (!physician?.is_verified_by_admin) {
            return res.status(400).json({msg: `Doctor hasn't been verified yet, please choose another.`})
        }
        // Ensure Patient has enough money for an appointment booking

        if (account && account?.available_balance < booking_amount){
            return res.status(402).json({msg: 'Insufficient balance, please fund your account before proceeding.'})
        }

        const current_time = Math.floor(Date.now() / 1000)

        console.log(current_time, 'passed time', req.body.time)

        if (current_time > req.body.time){
            return res.status(400).json({msg: 'You cannot book an appointment in the past.'})
        }        

        data_without_url.patient_id = patient_id;
        data_without_url.created_at = Date.now();
        data_without_url.updated_at = Date.now();
        data_without_url.meeting_id = await create_meeting_id()

        // Ensure appointment are within a minimum of 30min interval
        if (existing_appointment != null) {
            const difference_in_milliseconds = Math.abs(req.body.time - Number(existing_appointment.time));

            console.log('diff in ms ', difference_in_milliseconds)
            
            const difference_in_minutes = difference_in_milliseconds / 60000; 

            // if (difference_in_minutes < 30) {
            //     console.log('New Appointment should be at 30 minutes or more after the previous appointment, past appointment')
            //     return res.status(406).json({msg: 'New Appointment should be at 30 minutes or more after the previous appointment.' });
            // }
        }

        const new_appointment = await prisma.appointment.create({
            data: data_without_url,
            include: {patient: true, physician: true}
        });

        if (new_appointment){
            const  patient_physician_appointment_notification = await prisma.notification.create({
                data: {
                    appointment_id: new_appointment.appointment_id,
                    patient_id: new_appointment.patient_id,
                    physician_id: new_appointment.physician_id, 
                    notification_type: "Appointment",
                    notification_sub_type: "appointment_booking",
                    notification_for_patient: true,
                    notification_for_physician:true,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            })

            booking_appointment_mail(new_appointment.physician, new_appointment.patient, new_appointment)
            
            // create the various notifications

            // send a socket to both patient and physician
            if (patient_physician_appointment_notification){ 
                patient_socket_messanger('notification', new_appointment, patient_physician_appointment_notification) 
            }
            
            if (patient_physician_appointment_notification){ 
                physician_socket_messanger('notification', new_appointment, patient_physician_appointment_notification) 
            }

            req.pushNotificationData = {
                title: 'New Appointment Booking', 
                body: `${new_appointment.patient?.last_name} ${new_appointment.patient?.first_name} has booked an appointment with you`, 
                avatar: new_appointment.patient?.avatar, 
                messge: 'Appointment Created', 
                data: new_appointment, 
                physician_id:new_appointment.physician_id, 
                patient_id:new_appointment.patient_id, 
                notification_to: 'physician' 
            }
            
            return next()
        }
        
    } catch (err:any) {
        console.log('Error occured while booking appontment ', err);
        return res.status(500).json({msg: 'Error occured while booking appointment ', error: err})
    }
}

export const accept_appointment = async(req: CustomRequest, res:Response, next: NextFunction)=>{

    const {appointment_id, status} = req.body

    try {
        const physician_id = req.account_holder.user.physician_id

        const appointment = await prisma.appointment.findUnique({where: {appointment_id}, include: {patient: true, physician: true }})

        if (!appointment){ console.log('Appointment not found'); return res.status(404).json({msg: 'Appointment not found'})}
        
        if (physician_id !== appointment.physician_id){
            console.log('Only doctors booked for an appointment can accept an appointment!')
            return res.status(401).json({msg: 'Only doctors booked for an appointment can accept an appointment!'})
        }

        const current_time = Math.floor(Date.now()/1000);

        const appointment_start_time = Number(appointment.time)

        const appointment_end_time = appointment_start_time + (30 * 60)

        if (current_time > appointment_end_time ){

            return res.status(400).json({msg: 'Appointment is already past session window.'})
        }

        if (appointment.status === 'missed'){
            console.log('Appointment already missed')
            return res.status(409).json({msg: 'Appointment already missed.'})
        }

        if (appointment.status === 'cancelled'){
            console.log('Appointment already cancelled')
            return res.status(409).json({msg: 'Appointment already cancelled.'})
        }

        if (appointment.status === 'accepted'){
            console.log('Appointment already accepted')
            return res.status(409).json({msg: 'Appointment already accepted.', appointment})
        }

        if (appointment.status === 'completed'){
            console.log('Appointment already completed')
            return res.status(409).json({msg: 'Appointment already completed.', appointment})
        }

        const patient_account = await prisma.account.findFirst({ where: {patient_id: appointment.patient_id }})

        if (patient_account && patient_account?.available_balance < 100) {
            console.log('Unfortunately, the patient do not have enough for you to accept the appointment.');

            // send push notification and  to patient
            req.pushNotificationData = {
                data: appointment, 
                body: `Insufficient amount kindly fund your account so your appointment can be accepted.`, avatar: appointment.physician?.avatar, 
                messge: 'Appointment', 
                title: 'Insufficient Amount', 
                physician_id:appointment.physician_id, 
                patient_id:appointment.patient_id, 
                notification_to: 'patient',
                status: 'completed'
            }

            patient_out_of_credit_mail(appointment.physician, appointment.patient, appointment)

            return res.status(402).json({msg: 'Unfortunately, the patient do not have enough credit to continue with the appointement. '})
        }

        const accept_appointment = await prisma.appointment.update({
            where: {appointment_id},
            data: {status, updated_at: converted_datetime()},
            include: {patient: true, physician: true }
        })

        if (accept_appointment){
            // send mail to the patient
            const [patient_physician_appointment_notification, patient_accout_update, patient_account_transaction] = await Promise.all([

                prisma.notification.create({
                    data: {
                        appointment_id: accept_appointment.appointment_id,
                        patient_id: accept_appointment.patient_id,
                        physician_id: accept_appointment.physician_id, 
                        notification_type: "Appointment",
                        notification_sub_type: "appointment_accepted",
                        status: 'in_progress',
                        notification_for_patient: true,
                        notification_for_physician:true,
                        created_at: converted_datetime(),
                        updated_at: converted_datetime(),
                    }
                }),

                prisma.account.update({
                    where: { account_id: patient_account?.account_id },
                    data: { available_balance: {decrement: 100}}
                }),

                prisma.transaction.create({
                    data: {
                        amount: 100,
                        transaction_type: 'debit',
                        narration: `Appointment booking for ${accept_appointment.physician?.specialty}`,
                        transaction_sub_type: 'appointment_booking',
                        patient_id: accept_appointment.patient_id,
                        physician_id: null,
                        account_id: patient_account?.account_id,
                        updated_at: converted_datetime(),
                        created_at: converted_datetime(),
                    }
                })
            ]) 

            // create the various notifications
            const patient_payment_notification = await prisma.notification.create({
                data: {
                    patient_id: accept_appointment.patient_id,
                    notification_type: "Transaction",
                    notification_sub_type: "appointment_booking",
                    notification_for_patient: true ,
                    transaction_id: patient_account_transaction.transaction_id,
                    status: "completed",
                    case_note_id: null,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            }) 

            patient_socket_messanger('notification', accept_appointment, patient_physician_appointment_notification ) 

            physician_socket_messanger('notification', accept_appointment, patient_physician_appointment_notification ) 


            req.pushNotificationData = {
                data: accept_appointment, 
                body: `Dr ${accept_appointment.physician?.last_name} ${accept_appointment.physician?.first_name} has accepted your appointment.`, avatar: accept_appointment.physician?.avatar, 
                messge: 'Appointment', 
                title: 'Appointment Accepted', 
                physician_id:accept_appointment.physician_id, 
                patient_id:accept_appointment.patient_id, 
                notification_to: 'patient'
            }

            patient_appointment_acceptance_mail( accept_appointment.patient, accept_appointment.physician, accept_appointment)

            return next()
        }
        
    } catch (err:any) {
        console.log('Error occured while accpting patient appointment ', err);
        return res.status(500).json({msg: 'Error occured while accepting patient appointment ', error: err})
    }
}

export const cancel_appointment = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    const {appointment_id, status} = req.body
    try {
        
        const physician_id = req.account_holder.user.physician_id

        const patient_id = req.account_holder.user.patient_id

        const appointment = await prisma.appointment.findUnique({where: {appointment_id}})

        if (!appointment){ console.log('Appointment not found'); return res.status(404).json({msg: 'Appointment not found'})}

        if ((patient_id && patient_id !== appointment.patient_id) || (physician_id && physician_id !== appointment.physician_id)){
            console.log('Appointment can only be cancelled by patient or physician for which the appointment is for')
            
            return res.status(401).json({msg: 'Appointment can only be cancelled by patient or physician for which the appointment is for'})
        }

        const current_time = Date.now();

        const appointment_start_time = Number(appointment.time)

        const appointment_end_time = appointment_start_time + (30 * 60)

        if (current_time >= appointment_start_time && current_time <= appointment_end_time ){
            return res.status(400).json({msg: 'Appointment is already in session and therefore cannot be cancelled.'})
        }

        if (appointment.status === 'cancelled'){
            console.log('Appointment is already cancelled')
            return res.status(409).json({msg: 'Appointment is already cancelled.', appointment})
        }

        if (appointment.status === 'completed'){
            console.log('Appointment is already completed')
            return res.status(409).json({msg: 'Appointment is already completed.', appointment})
        }

        const cancel_appointment = await prisma.appointment.update({
            where: {appointment_id},
            data: {status, updated_at: converted_datetime()},
            include: {patient: true , physician: true }
        })
        
        const patient_physician_appointment_notification = await prisma.notification.create({
                data: {
                    appointment_id: cancel_appointment.appointment_id,
                    notification_sub_type: 'appointment_cancelled',
                    notification_type: "Appointment",
                    notification_for_patient: true,
                    notification_for_physician: true,
                    patient_id: cancel_appointment.patient_id,
                    physician_id: cancel_appointment.physician_id,
                    status: 'cancelled',
                    updated_at: converted_datetime(),
                    created_at: converted_datetime(),
                }
            })

        if (cancel_appointment && physician_id ){

            // If a physician cancels, send the socket and mail to the patient

            if (patient_physician_appointment_notification){ 
                patient_socket_messanger('notification', appointment, patient_physician_appointment_notification ) }
            
            req.pushNotificationData = {
                data: cancel_appointment, 
                body: `Dr ${cancel_appointment.physician?.last_name} ${cancel_appointment.physician?.first_name} has cancelled your appointment.`, avatar: cancel_appointment.physician?.avatar, 
                messge: 'Appointment', 
                title: 'Appointment Cancelled', 
                physician_id:cancel_appointment.physician_id, 
                patient_id:cancel_appointment.patient_id, 
                notification_to: 'patient'
            }

            send_mail_appointment_cancelled(cancel_appointment.physician, cancel_appointment.patient, appointment)

            return next()
        }else if (cancel_appointment && patient_id) {

            // but if the appointment is cancelled by the patient, send mail and socket notification to the patient

            if (patient_physician_appointment_notification){ 
                physician_socket_messanger('notification', appointment, patient_physician_appointment_notification ) }

            req.pushNotificationData = {
                title: 'Appointment Cancelled', 
                body: `Your patient ${cancel_appointment.patient?.last_name} ${cancel_appointment.patient?.first_name} has cancelled ${cancel_appointment.patient?.gender == "female"? "her": "his"} appointment with you`, 
                avatar: cancel_appointment.patient?.avatar, 
                messge: 'Appointment', 
                data: cancel_appointment, 
                physician_id:cancel_appointment.physician_id, 
                patient_id:cancel_appointment.patient_id, 
                notification_to: 'physician'}

                // send mail to the doctor and trigger notification
                send_mail_appointment_cancelled_by_patient(cancel_appointment.physician, cancel_appointment.patient, appointment)

                return next()
        }

        
    } catch (err:any) {
        console.log('Error occured while canceling patient appointment ', err);
        return res.status(500).json({msg: 'Error occured while canceling patient appointment ', error: err})
    }
}

export const complete_appointment = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    const {appointment_id, status} = req.body
    try {
        const physician_id = req.account_holder.user.physician_id

        const patient_id = req.account_holder.user.patient_id

        const appointment = await prisma.appointment.findUnique({where: {appointment_id}})

        if (!appointment){ console.log('Appointment not found'); return res.status(404).json({msg: 'Appointment not found'})}

        if ((patient_id && patient_id !== appointment.patient_id) || (physician_id && physician_id !== appointment.physician_id)){
            console.log('Appointment can only be marked as completed by patient or physician for which the appointment is for')
            
            return res.status(401).json({msg: 'Appointment can only be marked as completed by patient or physician for which the appointment is for'})
        }

        if (appointment.status === 'cancelled'){
            console.log('Appointment is already cancelled')
            return res.status(409).json({msg: 'Appointment is already cancelled.', appointment})
        }

        if (appointment.status === 'completed'){
            console.log('Appointment is already completed')
            return res.status(409).json({msg: 'Appointment is already completed.', appointment})
        }

        const complete_appointment = await prisma.appointment.update({
            where: {appointment_id},
            data: {status, updated_at: converted_datetime()},
            include: {patient: true , physician: true}
        })
        
        const patient_physician_appointment_notification = await prisma.notification.create({
                data: {
                    notification_type: "Appointment",
                    notification_sub_type: "appointment_completed",
                    appointment_id: complete_appointment.appointment_id,
                    status: 'completed',
                    notification_for_patient: true,
                    notification_for_physician: true,
                    patient_id: complete_appointment.patient_id,
                    physician_id: complete_appointment.physician_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            })

        if (complete_appointment && physician_id ){
            // If a physician completes the appointment, send the socket and mail to the patient

            if (patient_physician_appointment_notification){ 
                patient_socket_messanger('notification', appointment, patient_physician_appointment_notification ) }
            
            req.pushNotificationData = {
                data: complete_appointment, 
                body: `Dr ${complete_appointment.physician?.last_name} ${complete_appointment.physician?.first_name} has marked your appointment as complete.`, 
                avatar: complete_appointment.physician?.avatar, 
                messge: 'Appointment', 
                title: 'Appointment Completed', 
                physician_id:complete_appointment.physician_id, 
                patient_id:complete_appointment.patient_id, 
                notification_to: 'patient'
            }

            send_mail_appointment_cancelled(complete_appointment.physician, complete_appointment.patient, appointment)

            return next()
        }else if (complete_appointment && patient_id) {
            // but if the appointment is cancelled by the patient, send mail and socket notification to the patient

            if (patient_physician_appointment_notification){ 
                physician_socket_messanger('notification', appointment, patient_physician_appointment_notification ) }

            req.pushNotificationData = {
                title: 'Appointment Completed', 
                body: `Your patient ${complete_appointment.patient?.last_name} ${complete_appointment.patient?.first_name} has marked ${complete_appointment.patient?.gender == "female"? "her": "his"} with you as completed`, 
                avatar: complete_appointment.patient?.avatar, messge: 'Appointment', 
                data: complete_appointment, 
                physician_id:complete_appointment.physician_id, 
                patient_id:complete_appointment.patient_id, 
                notification_to: 'physician'}

                // send mail to the doctor and trigger notification
                send_mail_appointment_cancelled_by_patient(complete_appointment.physician, complete_appointment.patient, appointment)

                return next()
        }

        
    } catch (err:any) {
        console.log('Error occured while completing appointment ', err);
        return res.status(500).json({msg: 'Error occured while completing appointment ', error: err})
    }
}

export const filter_appointment = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    try {

        const user = req.account_holder.user;

        const {status, page_number } = req.params;

        if (!status || status.trim() === ''){ 
            console.log('Please provide appointment status'); return res.status(400).json({msg: 'Please provide appointment status'})
        }

        const [number_of_appointments, appointments] = await Promise.all([

            prisma.appointment.count({
                where: { patient_id: user.patient_id, physician_id: user.physician_id, status: { contains: status, mode: "insensitive" } }
            }),
            
            prisma.appointment.findMany({
                
                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,
                
                where: { patient_id: user.patient_id, physician_id: user.physician_id, status: { contains: status, mode: "insensitive" } },
                
                include: {patient: true, physician: true},

                orderBy: { created_at: 'desc' }

            })

        ]);

        const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments/15)

        return res.status(200).json({message: "Filtered Appointments", data: {total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments} })
        
    } catch (err:any) {
        console.log('Error occured while filtering appointments', err);
        return res.status(500).json({msg: 'Error occured while filtering appointment ', error: err})
    }
}

export const all_appointments = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    try {

        const user = req.account_holder.user;

        const {page_number, limit } = req.params;

        const items_per_page = Number(limit)

        const [appointment_status, number_of_appointments, appointments] = await Promise.all([

            prisma.appointment.findMany({
                where:{patient_id: user.patient_id, physician_id: user.physician_id},
                select:{
                    status:true
                }
            }),

            prisma.appointment.count({
                where: { patient_id: user.patient_id, physician_id: user.physician_id }
            }),
            
            prisma.appointment.findMany({
                
                where: { patient_id: user.patient_id, physician_id: user.physician_id, },
                
                skip: (Math.abs(Number(page_number)) - 1) * items_per_page,

                take: items_per_page,
                

                include: {patient: true, physician: true},
                

                orderBy: { created_at: 'desc' }

            })

        ]);

        const pending_appointment = appointment_status.filter((item:any)=> item.status == 'pending').length

        const accepted_appointment = appointment_status.filter((item:any)=> item.status == 'accepted').length

        const completed_appointment = appointment_status.filter((item:any)=> item.status == 'completed').length

        const number_of_pages = (number_of_appointments <= items_per_page) ? 1 : Math.ceil(number_of_appointments/items_per_page)

        return res.status(200).json({
            message: "All Appointments", 
            data: {
                pending_appointment,
                accepted_appointment,
                completed_appointment,
                total_number_of_appointments: number_of_appointments, 
                total_number_of_pages: number_of_pages, 
                appointments: appointments
            } 
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching all appointments', err);
        return res.status(500).json({msg: 'Error occured while fetching all appointments ', error: err})
    }
}

export const all_patient_appointments = async(req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        // Fetch all patients with their appointments and related data
        const patients = await prisma.patient.findMany({
            include: {
                appointment: {
                    include: { case_note: true, ambulance: true, physician: true }
                }
            }
        });

        // Transform the data to include the number of consultations (appointments)
        const transformed_patients = patients.map(patient => ({
            patient: {
                patient_id: patient.patient_id,
                last_name: patient.last_name,
                first_name: patient.first_name,
                avatar: patient.avatar,
                email: patient.email,
                phone_number: patient.phone_number,
                country: patient.country,
                gender: patient.gender,
                blood_group: patient.blood_group,
                genotype: patient.genotype
                
                
            },
            number_of_appointments: patient.appointment.length,
            
        }));

        // Respond with both the original and the transformed data
        return res.status(200).json({
            msg: 'All Patients',
            patient_consultation_summary: transformed_patients, 
            patient_consultation: patients, 
        });

    } catch (err: any) {
        console.log('Error occurred while fetching all patient appointments', err);
        return res.status(500).json({msg: 'Error occurred while fetching all patients appointments', error: err });
    }
};


export const delete_appointment = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    try {
        const {appointment_id} = req.params

        if (!appointment_id){return res.status(400).json({msg: 'Please provide the appointment id'})}

        const user = req.account_holder.user

        const appointment = await prisma.appointment.findUnique({ where: {appointment_id} })

        if (!appointment) {  console.log('Appointment not found'); return res.status(404).json({msg: 'Appointment not found or already deleted.'}) }

        if (appointment.patient_id !== user.patient_id){
            console.log('You are not authorized to delete the selected appointment')
            return res.status(401).json({msg: 'You are not authorized to delete selected appointment.'})
        }

        const delete_appointment = await prisma.appointment.delete({  where: {appointment_id} })

        return next()
        
    } catch (err:any) {
        console.log('Error occured while deleting a selected appointment ', err);
        return res.status(500).json({msg: 'Error occured while deleting a selected appointment ', error: err})
    }
}

export const appointment_tracker_all_appointment = async(req: CustomRequest, res:Response, next: NextFunction)=> {
    try {
        const appointments = await prisma.appointment.findMany({
            select: {time: true, status: true, appointment_id: true, appointment_type: true, in_session: true,
                patient: {select: {last_name: true, first_name: true, other_names: true, email: true, avatar: true, gender: true,}},
                physician: {select: {last_name: true, first_name: true, other_names: true, email: true, avatar: true, gender: true,}},
            }
        })

        return res.status(200).json({number_of_appiontments: appointments.length, appointments:appointments})

    } catch (err: any) {
        console.log('Error occured while fetching all appointments in appointment tracker all appointment function ', err);
        return res.status(500).json({msg: 'Error occured while fetching all appointments in appointment tracker all appointment function ', error: err})
    }
}

export const appointment_tracker = async()=>{
    try {

        const appointments = await prisma.appointment.findMany({  include:{patient: true, physician: true}   })
        
        const current_time = Math.floor(Date.now()/1000);

        const overdue_appointment: any[] = []

        const upcoming_appointment: any[] = []

        const in_session_appointment: any[] = []

        const patient_unavailable_for_appointment: any[] = []

        appointments.map((appointment:any) => {

            const appointment_start_time = Number(appointment.time);

            const appointment_end_time = appointment_start_time + (30 * 60);

            const five_min_in_ms = 5 * 60

            if (appointment.status === 'accepted' && (appointment_start_time - current_time <= five_min_in_ms) && (appointment_start_time > current_time && appointment.reminded_for_appointment)){

                upcoming_appointment.push(appointment)
            }

            if ((appointment.status === 'pending' || appointment.status === 'accepted') && current_time > appointment_end_time) {
            
                overdue_appointment.push(appointment)

            }

            if (current_time >= appointment_start_time && current_time <= appointment_end_time && appointment.status === 'accepted' && 
                appointment.in_session == false  ){
                    
                in_session_appointment.push(appointment) 

            }

            if (current_time > appointment_end_time && !appointment.available_during_session && appointment.status == 'completed' ){
                
                patient_unavailable_for_appointment.push(appointment)

            }

        });
        
        // Batch update the overdue appointments in the database

        if (overdue_appointment.length){

            
            const consultation_data_promises = overdue_appointment.map(async(appointment:any) => {

                console.log('begin processing overdue appintment data');

                if (appointment.status === 'accepted') {
                    
                    consultation_completion_data(appointment.patient_id, appointment.appointment_id)

                }

            });

            await Promise.all(consultation_data_promises);

            const update_promises = overdue_appointment.map(async(appointment:any) => {

                if (appointment.status === 'accepted' || appointment.status === 'pending') {
                    
                    return prisma.appointment.update({
                        where: { appointment_id: appointment.appointment_id },
                        data: {
                            status: appointment.status === 'pending' ? 'cancelled' : 'completed', 
                            in_session: false,
                            updated_at: converted_datetime() }
                    });
                }
                
            });
    
            await Promise.all(update_promises);
    
            const create_notification_promises = overdue_appointment.map((appointment:any) => {
                if (appointment.status === 'pending' || appointment.status === 'accepted') {
                    
                    return prisma.notification.create({
                        data: {
                            appointment_id: appointment.appointment_id,
                            notification_type: "Appointment",
                            notification_sub_type: appointment.status === 'pending' ? 'appointment_cancelled' : 'appointment_completed',
                            patient_id: appointment.patient_id,
                            physician_id: appointment.physician_id,
                            notification_for_patient: true,
                            notification_for_physician: true,
                            status: appointment.status === 'pending' ? 'cancelled' : 'completed',
                            updated_at: converted_datetime(),
                            created_at: converted_datetime()
                        }
                    });
                }
            });

            await Promise.all(create_notification_promises);
        }

        // Batch update for appointments in session but not started.

        if (in_session_appointment.length){

            console.log('begin processing in session appointment')

            const update_promises = in_session_appointment.map((appointment:any) => {
                    
                    return prisma.appointment.update({
                        where: { appointment_id: appointment.appointment_id },
                        data: {
                            in_session: true,
                            allow_consultation: true,
                            updated_at: converted_datetime() }
                    });
            });
    
            await Promise.all(update_promises);

            const update_notif_promises = in_session_appointment.map(async(appointment:any) => {
                if ( appointment.status === 'accepted') {
                    
                    const notification = await prisma.notification.create({
                        data: {
                            appointment_id: appointment.appointment_id,
                            notification_type: "Appointment",
                            notification_sub_type: 'appointment_in_progress',
                            patient_id: appointment.patient_id,
                            physician_id: appointment.physician_id,
                            notification_for_patient: true,
                            notification_for_physician: true,
                            status: 'in_progress',
                            updated_at: converted_datetime(),
                            created_at: converted_datetime()
                        }
                    });

                    if (notification){
                        // send push notifications and email to both users

                        function_web_push_notification( 
                            "Appointment Reminder", 
                            `Your appointment with Dr ${appointment.physician?.last_name} ${appointment.physician?.first_name} is in session.`,  appointment.physician.avatar, 
                            "Appointment Reminder", 
                            appointment, 
                            appointment.patient_id, appointment.physician_id, 'patient' )

                        function_web_push_notification(
                            "Appointment Reminder", 
                            `Your appointment with ${appointment.patient?.last_name} ${appointment.patient?.first_name} is in session.`, 
                            appointment.patient.avatar, 
                            "Appointment Reminder", 
                            appointment, 
                            appointment.patient_id, appointment.physician_id, 'patient' 
                        )

                        // sending email notification 
                        
                        physician_appointment_in_session_mail(appointment.patient, appointment.physician, appointment)

                        patient_appointment_in_session_mail(appointment.patient, appointment.physician, appointment)

                    }
                }
            });
    
            await Promise.all(update_notif_promises);
        }

        // Batch request to charge patient who were unavailable for appoitnment that has been accepted

        if (patient_unavailable_for_appointment.length){
            
            const update_patient_account_promise = patient_unavailable_for_appointment.map(async (appointment: any) => {
                try {
                    
                    const patient_account = await prisma.account.findFirst({
    
                        where: { patient_id: appointment.patient_id },
    
                    });
                
                    if (patient_account) {
    
                        const { available_balance } = patient_account;
    
                        const deduction = Math.min(500, available_balance);
                
                        const [updated_patient_account, patient_transaction ] = await Promise.all([
    
                            await prisma.account.update({
                                where: { account_id: patient_account.account_id },
                                data: { available_balance: { decrement: deduction } }
                            }),
    
                            prisma.transaction.create({
                                data: {
                                    amount: deduction,
                                    transaction_type: 'debit',
                                    transaction_sub_type: 'patient_unavailabe_for_appointment',
                                    narration: 'Unavailable for consultation',
                                    patient_id: appointment.patient_id,
                                    physician_id: null,
                                    account_id: patient_account?.account_id,
                                    updated_at: converted_datetime(),
                                    created_at: converted_datetime(),
                                }
                            })

                        ])
    
                        if (updated_patient_account && patient_transaction){
                            
                            const [notification, updated_appointment] = await Promise.all([
                                prisma.notification.create({
                                    data: {
                                        patient_id: appointment.patient_id,
                                        notification_type: "Transaction",
                                        notification_sub_type: "patient_unavailabe_for_appointment",
                                        notification_for_patient: true ,
                                        transaction_id: patient_transaction.transaction_id,
                                        status: "completed",
                                        case_note_id: null,
                                        created_at: converted_datetime(),
                                        updated_at: converted_datetime(),
                                    }
                                }), 
                                prisma.appointment.update({
                                    where: {appointment_id: appointment.appointment_id},
                                    data: {available_during_session: true}
                                })
                            ]) 

                        }
    
                    }

                } catch (err:any) {
                    console.error(`Error processing account deduction for patient ${appointment.patient_id}:  `, err);
                }

            });
            
            await Promise.all(update_patient_account_promise);
            
        }

        // Batch request to remind patient and doctors of upcoming appointment

        if (upcoming_appointment.length) {
            console.log('begins processing upcoming appointment')
            
            const update_promises = upcoming_appointment.map(async(appointment:any) => {

                if (appointment.reminded_for_appointment) {
                    
                    return prisma.appointment.update({
                        where: { appointment_id: appointment.appointment_id },
                        data: {
                            reminded_for_appointment: true, 
                            updated_at: converted_datetime() }
                    });
                }
                
            });
    
            await Promise.all(update_promises);
            
            const notification_promises = upcoming_appointment.map(async (appointment: any) => {

                // Send push notifications and email to both users
                function_web_push_notification(
                    "Upcoming Appointment",
                    `Your appointment with Dr. ${appointment.physician?.last_name} ${appointment.physician?.first_name} is starting soon.`,
                    appointment.physician.avatar,
                    "Appointment Reminder",
                    appointment,
                    appointment.patient_id,
                    appointment.physician_id,
                    'patient'
                );

                function_web_push_notification(
                    "Upcoming Appointment",
                    `Your appointment with ${appointment.patient?.last_name} ${appointment.patient?.first_name} is starting soon.`,
                    appointment.patient.avatar,
                    "Appointment Reminder",
                    appointment,
                    appointment.patient_id,
                    appointment.physician_id,
                    'physician'
                );

                // Sending email notifications
                physician_upcoming_appointment_mail( appointment.patient, appointment.physician,appointment);
                patient_upcoming_appointment_mail(appointment.patient, appointment.physician, appointment);
            });

            await Promise.all(notification_promises);
        }


    } catch (err:any) {
        console.log('Error occured while tracking appointments : ', err);
    }
}

export const add_user_rating = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    const {appointment_id} = req.body
    try {

        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        if (appointment_id) {
            const appointment = await prisma.appointment.findFirst({ 
                where: {
                OR: [
                    {patient_id: patient_id},
                    {physician_id: physician_id},
                ],
                appointment_id
                } 
            })

            if (!appointment) { return res.status(404).json({msg: 'Incorrect appointment id'}) }
        }
            
        req.body.patient_id = patient_id
        req.body.physician_id = physician_id
        req.body.appointment_id = appointment_id || null

        const add_review = await prisma.rating.create({
            data: {
                ...req.body,
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        if (!add_review) {
            return res.status(500).json({msg: 'Unable to add rating'})
        }

        return res.status(201).json({msg: 'Rating added successfully ', ratings: add_review})
        
    } catch (err: any) {
        console.log('Error occured while patient is adding a new rating ',err);
        return res.status(500).json({msg:'Error occured while patient is adding a new rating ', error:err});
        
    }
}

export const user_ratings = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        const all_ratings = await prisma.rating.findMany({
            where: {
                OR: [
                    {patient_id: patient_id},
                    {physician_id: physician_id}
                ]
            },
            include: {appointment: true},
            orderBy: {created_at: 'desc'}
        })

        return res.status(200).json({msg: 'Ratings', all_ratings })
        
    } catch (err:any) {
        console.log('Error occured while patient is fetching all rating ',err);
        return res.status(500).json({msg:'Error occured while patient is fetching all rating ', error:err});
    }
}

export const selected_user_rating = async(req: CustomRequest, res:Response, next: NextFunction)=>{
    try {
        const {user_id} = req.params

        const all_ratings = await prisma.rating.findMany({
            where: {
                OR: [
                    {patient_id: user_id},
                    {physician_id: user_id},
                ]
            },
            include: {appointment: true},
            orderBy: {created_at: 'desc'}
        })

        return res.status(200).json({msg: 'Ratings', all_ratings })
        
    } catch (err:any) {
        console.log('Error occured while patient is fetching all rating ',err);
        return res.status(500).json({msg:'Error occured while patient is fetching all rating ', error:err});
    }
}

export const all_user_rating = async(req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        // Fetch all patients with their appointments and related data
        const [patients, physician] = await Promise.all([
            prisma.patient.findMany({
                include: {
                    ratings: {
                        include: { appointment: true }
                    }
                }
            }),
            prisma.physician.findMany({
                include: {
                    ratings: {
                        include: { appointment: true }
                    }
                }
            })
        ]) 

        // Transform the data to include the number of consultations (appointments)
        const patients_rating_summary = patients.map(patient => ({
            patient: {
                patient_id: patient.patient_id,
                last_name: patient.last_name,
                first_name: patient.first_name,
                avatar: patient.avatar,
                email: patient.email,
                phone_number: patient.phone_number,
                country: patient.country,
                gender: patient.gender,
                blood_group: patient.blood_group,
                genotype: patient.genotype
                
                
            },
            number_of_ratings: patient.ratings.length,
            
        }));

        const physician_rating_summary = physician.map(physician => ({
            physician: {
                physician_id: physician.physician_id,
                last_name: physician.last_name,
                first_name: physician.first_name,
                avatar: physician.avatar,
                email: physician.email,
                phone_number: physician.phone_number,
                country: physician.country,
                gender: physician.gender,
                registered_as: physician.registered_as,
                specialty: physician.specialty,
                
            },

            number_of_ratings: physician.ratings.length,
        }));

        
        return res.status(200).json({
            msg: 'All Users Rating Matrics',
            patients_rating_summary: patients_rating_summary,
            physician_rating_summary: physician_rating_summary,
            patient_rating: patients,
            physician_rating: physician
        });

    } catch (err: any) {
        console.log('Error occurred while fetching all patient appointments.', err);
        return res.status(500).json({msg: 'Error occurred while fetching all patients appointments', error: err });
    }
};


export const consultation = async(req: CustomRequest, res: Response)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        if (!patient_id) { return res.status(400).json({msg: 'Incorrect x id key'}) }

        const value = await getFromRedis(`consultation-${patient_id}`)

        console.log('consultation value ', value);
        
        let decoded_value;
        if (value) {
            decoded_value = await jwt.verify(value, jwt_secret)
        }
            
        // const info = await call_appointment_consultaion_data_update(patient_id)

        return res.status(200).json({data: value ? decoded_value : ''})
        
    } catch (err:any) {
        console.log('Error occured ', err);
        return res.status(500).json({msg: 'Error occured ', error: err})
    }
}

export const del_consultation_data = async(req: CustomRequest, res: Response)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        if (!patient_id) { return res.status(400).json({msg: 'Incorrect x id key'}) }

        const value = await delFromRedis(`consultation-${patient_id}`)
            
        return res.status(200).json({del_value: value})
        
    } catch (err:any) {
        console.log('Error occured ', err);
        return res.status(500).json({msg: 'Error occured ', error: err})
    }
}