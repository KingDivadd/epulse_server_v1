import { Request, Response, NextFunction } from "express"
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elements'
import {physician_socket_messanger, patient_socket_messanger} from '../helpers/socket_events'
import { booking_fee } from "../helpers/constants"
import { send_mail_accepted_appointment, send_mail_booking_appointment, send_mail_patient_out_of_credit } from "../helpers/emails"
import { create_meeting_id } from "./video_chat_controller"

export const register_ambulance = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null
        const user = req.account_holder.user

        if (patient_id){ return res.status(401).json({msg: 'Only Hospitals are allowed to register ambulance'})}

        if (user.registered_as.toLowerCase() !== 'hospital')
            {  return res.status(401).json({msg: 'Only Hospitals are allowed to register ambulance'}) 
        }

        req.body.physician_id = physician_id

        const new_ambulance = await prisma.ambulance.create({
            data: {
                ...req.body,
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        if (!new_ambulance) {
            return res.status(500).json({msg: 'Unable to create ambulance, try again'})
        }

        return res.status(201).json({msg: 'Ambulance created successfully', ambulance: new_ambulance})

        
    } catch (err:any) {
        console.log('Error occured while registering ambulance ', err);
        return res.status(500).json({msg:'Error occured while registering ambulance ', error:err});
    }
}

export const update_ambulance_data = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null
        const user = req.account_holder.user

        const {ambulance_id} = req.params

        if (patient_id){ return res.status(401).json({msg: 'Only Hospitals are allowed to update ambulance data'})}

        if (user.registered_as.toLowerCase() !== 'hospital')
            {  return res.status(401).json({msg: 'Only Hospitals are allowed to update ambulance data'}) 
        }

        const ambulance = await prisma.ambulance.findUnique({where: {ambulance_id}})

        if (!ambulance) {
            return res.status(404).json({msg: 'Ambulance not found'})
        }

        if (ambulance.physician_id !== physician_id) {
            return res.status(401).json({msg: 'Not authorized to edit selected ambulance'})
        }


        const new_ambulance = await prisma.ambulance.update({
            where: {ambulance_id},
            data: {
                ...req.body,
                updated_at: converted_datetime()
            }
        })

        if (!new_ambulance) {
            return res.status(500).json({msg: 'Unable to create ambulance, try again'})
        }

        return res.status(201).json({msg: 'Ambulance updated successfully', ambulance: new_ambulance})

        
    } catch (err:any) {
        console.log('Error occured while registering ambulance ', err);
        return res.status(500).json({msg:'Error occured while registering ambulance ', error:err});
    }
}

export const all_ambulance = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        const ambulances = await prisma.ambulance.findMany({
            include: {physician: true}
        })

        return res.status(200).json({nbHit: ambulances.length, ambulances})

    } catch (err:any) {
        console.log('Error occured while fetching all ambulances ', err);
        return res.status(500).json({msg:'Error occured while fetching all ambulances ', error:err});
        
    }
}

export const all_paginated_ambulance = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_ambulance,ambulance] = await Promise.all([

            prisma.ambulance.count({ }),
            
            prisma.ambulance.findMany({
                
                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,
                
                include: {physician: true},

                orderBy: { created_at: 'desc' }

            })

        ]);

        const number_of_pages = (number_of_ambulance <= 15) ? 1 : Math.ceil(number_of_ambulance/15)

        return res.status(200).json({
            message: "All Ambulance", 
            data: {total_number_of_ambulance: number_of_ambulance, total_number_of_pages: number_of_pages, ambulance: ambulance} 
        })

    } catch (err:any) {
        console.log('Error occured while fetching all ambulances ', err);
        return res.status(500).json({msg:'Error occured while fetching all ambulances ', error:err});
        
    }
}



export const all_ambulance_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        const {page_number } = req.params;

        const [number_of_appointments, appointments] = await Promise.all([

            prisma.appointment.count({
                where: {
                    ambulance_id: { not: null },
                    OR: [
                        { patient_id: patient_id || undefined },
                        { physician_id: physician_id || undefined }
                    ]
                },
            }),

            prisma.appointment.findMany({
                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                where: {
                    ambulance_id: { not: null },
                    OR: [
                        { patient_id: patient_id || undefined },
                        { physician_id: physician_id || undefined }
                    ]
                }, 
                include: {ambulance: true, patient: true, physician: true, },

                orderBy: {created_at: 'desc'}
            })
        ])

        const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments/15)

        return res.status(200).json({message: "All Ambulance Appointments", data: {total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments} })


    } catch (err:any) {
        console.log('Error occured while fetching all ambulance appointment ', err);
        return res.status(500).json({msg:'Error occured while fetching all ambulance appointment ', error:err});
    }
}

export const filter_ambulance_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        const { status, page_number } = req.params;

        const [number_of_appointments, appointments] = await Promise.all([

            prisma.appointment.count({
                where: {
                    ambulance_id: { not: null },
                    status,
                    OR: [
                        { patient_id: patient_id || undefined },
                        { physician_id: physician_id || undefined }
                    ]
                },
            }),

            prisma.appointment.findMany({
                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                where: {
                    ambulance_id: { not: null },
                    status,
                    OR: [
                        { patient_id: patient_id || undefined },
                        { physician_id: physician_id || undefined }
                    ]
                },
                
                include: {ambulance: true, patient: true, physician: true, },

                orderBy: {created_at: 'desc'}
            })
        ])

        const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments/15)

        return res.status(200).json({message: "All Ambulance Appointments", data: {total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments} })

    } catch (err:any) {
        console.log('Error occured while fetching all ambulance appointment ', err);
        return res.status(500).json({msg:'Error occured while fetching all ambulance appointment ', error:err});
    }
}

export const book_ambulance_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {ambulance_id, current_location, urgent_need, other_attention_needed, emergency_severity, nature_of_emmergency, time} = req.body
    try {

        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        let booking_amount = booking_fee || 100

        if (physician_id){ return res.status(400).json({msg: 'Only patient are allowed to book appointment with ambulance'})}

        const [ambulance, patient_account] = await Promise.all([
            prisma.ambulance.findUnique({ where: {ambulance_id}}),
            prisma.account.findFirst({where: {patient_id}})
        ]) 

        if (!ambulance){return res.status(404).json({msg: 'Ambulance not found'})}

        if (!patient_account){ return res.status(404).json({msg: `Patient does not have a wallet`})}

        if (patient_account && patient_account?.available_balance < booking_amount){
            return res.status(402).json({msg: 'Insufficient balance, please fund your account before proceeding.'})
        }

        const current_time = Date.now();

        if (current_time > req.body.time){
            return res.status(400).json({msg: 'You cannot book an appointment in the past.'})
        }  

        let updated_time = time
        if (!time || time == 0 || time == null ) {
            updated_time = current_time + (5 * 60 * 1000);
        }

        const meeting_id = await create_meeting_id()

        const new_appointment = await prisma.appointment.create({
            data: { 
                nature_of_emmergency, emergency_severity, other_attention_needed, urgent_need, current_location, 
                time: updated_time || 0, physician_id: ambulance.physician_id, patient_id, ambulance_id:ambulance.ambulance_id,
                status: 'pending', complain: '', mode_of_consult: '', meeting_id: meeting_id || '',

                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }, include: {patient: true, physician: true, ambulance: true}
        })

        if (new_appointment) {
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

            send_mail_booking_appointment(new_appointment.physician, new_appointment.patient, new_appointment)
            
            // create the various notifications

            // send a socket to both patient and physician
            if (patient_physician_appointment_notification){ 
                patient_socket_messanger('notification', new_appointment, patient_physician_appointment_notification) 
            }
            
            if (patient_physician_appointment_notification){ 
                physician_socket_messanger('notification', new_appointment, patient_physician_appointment_notification) 
            }

            req.pushNotificationData = {
                title: 'Ambulance Appointment Booking', 
                body: `${new_appointment.patient?.last_name} ${new_appointment.patient?.first_name} has booked an appointment with you`, 
                avatar: new_appointment.patient?.avatar, 
                messge: 'Ambulance Appointment Created', 
                data: new_appointment, 
                physician_id:new_appointment.physician_id, 
                patient_id:new_appointment.patient_id, 
                notification_to: 'physician' 
            }
            
            return next()
            
        }

    } catch (err:any) {
        console.log('Error occured while booking ambulance appointment ', err);
        return res.status(500).json({msg:'Error occured while booking ambulance appointment ', error:err});
    }
}

export const accept_ambulance_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user = req.account_holder.user

        const {appointment_id} = req.params

        if (user.patient_id) { return res.status(401).json({msg: 'not authorized to accept ambulance appointment'}) }

        const appointment = await prisma.appointment.findUnique({ where: {appointment_id:appointment_id}, include: {patient: true, physician: true} })
        
        if (!appointment) { return res.status(404).json({msg: 'ambulance appointment not found'}) }

        if (appointment.physician_id !== user.physician_id) {
            return res.status(401).json({msg: 'not authorized to accept appointment'})
        }

        if (appointment.status === 'accepted'){
            console.log('Appointment already accepted')
            return res.status(409).json({msg: 'Appointment already accepted.', appointment})
        }

        if (appointment.status === 'completed'){
            console.log('Appointment already completed')
            return res.status(409).json({msg: 'Appointment already completed.', appointment})
        }

        const patient_account = await prisma.account.findFirst({ where:{patient_id: appointment.patient_id} })

        if (patient_account && patient_account?.available_balance < booking_fee) {
            console.log('Unfortunately, the patient do not have enough for you to accept the appointment.');

            // send push notification and  to patient
            req.pushNotificationData = {
                data: appointment, 
                body: `Insufficient amount kindly fund your account so your appointment can be accepted.`, avatar: appointment.physician?.avatar, 
                messge: 'Appointment', 
                title: 'Insufficient Amount', 
                physician_id:appointment.physician_id, 
                patient_id:appointment.patient_id, 
                notification_to: 'patient'
            }

            send_mail_patient_out_of_credit(appointment.physician, appointment.patient, appointment)

            return res.status(402).json({msg: 'Unfortunately, the patient do not have enough money to continue with the appointement and he has been notified. '})
        }

        const accept_appointment = await prisma.appointment.update({
            where: {appointment_id: appointment_id},
            data: {status: 'accepted', updated_at: converted_datetime()},
            include: {patient: true, physician: true, ambulance: true}
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
                    data: { available_balance: {decrement: booking_fee || 100}}
                }),

                prisma.transaction.create({
                    data: {
                        amount: booking_fee || 100,
                        transaction_type: 'debit',
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
                body: `Your ambulance appointment has been accepted.`, avatar: accept_appointment.physician?.avatar, 
                messge: 'Appointment', 
                title: 'Appointment Accepted', 
                physician_id:accept_appointment.physician_id, 
                patient_id:accept_appointment.patient_id, 
                notification_to: 'patient'
            }

            send_mail_accepted_appointment( accept_appointment.patient, accept_appointment.physician, accept_appointment)

            return next()
        }else{
            return res.status(500).json({msg: 'Unable to accept appiontment, please try again '})
        }

    } catch (err:any) {
        console.log('Error occured while booking ambulance appointment ', err);
        return res.status(500).json({msg:'Error occured while booking ambulance appointment ', error:err});
    }
}