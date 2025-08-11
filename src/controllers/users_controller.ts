import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elements'
import { admin_verified_physician_mail } from '../helpers/email_controller'

export const verify_physician_id = async (req:CustomRequest, res: Response) => {
    try {

        const {id} = req.params

        const physician = await prisma.physician.findUnique({
            where:{
                physician_id: id
            }
        })

        if (!physician) {
            return res.status(404).json({msg: 'Physician not found'})
        }

        return res.status(200).json({msg: 'Physician registered', physician})

        
    } catch (err) {
        return res.status(500).json({msg: "Error verifying physician id", error:err})
    }
}

export const all_physicians_2 = async(req: CustomRequest, res: Response )=>{
    try {

        const {page_number, limit} = req.params

        const items_per_page = Number(limit) || 10
        
        const [number_of_physicians, physicians] = await Promise.all([
            prisma.physician.count({
                where:{
                    is_verified_by_admin:true
                }
            }),

            prisma.physician.findMany({
                where:{
                    is_verified_by_admin:true,
                },

                skip: (Math.abs(Number(page_number)) - 1) * items_per_page,

                take: items_per_page,

                orderBy: { created_at: 'desc' }
                
            })
        ])

        const number_of_pages = (number_of_physicians <= items_per_page) ? 1 : Math.ceil(number_of_physicians/items_per_page)

        return res.status(200).json({ 
            message:'All Physicians', 
            data: {
                total_number_of_physicians: number_of_physicians, 
                total_number_of_pages: number_of_pages, 
                physicians: physicians
            } 
        })

    } catch (err:any) {
        console.log('Error occured while fetching all physicians ', err);
        return res.status(500).json({msg: 'Error occured while fetching all physicians.', error: err})
    }
}

export const physician_tracker = async () => {
    try {
        
        const all_physicians = await prisma.physician.findMany({})

        const un_verified_appointment: any[] = []

        all_physicians.map((physicians:any)=>{

            const {first_name, last_name, registered_as, specialty, avatar, bio, country, state, address, languages_spoken, medical_license, is_verified_by_admin} = physicians

            if ((first_name && last_name && registered_as && specialty && bio && avatar && country && state && address && languages_spoken && medical_license && !is_verified_by_admin) ){
                
                un_verified_appointment.push(physicians)

            }
        })

        // Batch verify the unverified physician

        if (un_verified_appointment.length) {
            
            const physician_data_promise = un_verified_appointment.map(async(physician:any)=>{

                console.log('begin verifying unverifed doctors with completed profile')
                
                if (!physician.is_verified_by_admin) {

                    return prisma.physician.update({
                        where:{ physician_id: physician.physician_id},
                        data:{
                            is_verified_by_admin:true
                        }
                    })
                    
                }

            })

            await Promise.all(physician_data_promise)

            const create_notification_promise = un_verified_appointment.map(async(physician:any)=>{

                admin_verified_physician_mail(physician)

                return prisma.notification.create({
                    data:{
                        status: 'completed',
                        notification_type: 'Account',
                        notification_sub_type: 'Verification',
                        physician_id: physician.physician_id,
                        notification_for_physician: true,

                        created_at: converted_datetime(),
                        updated_at: converted_datetime()
                    }
                })
            })

            await Promise.all(create_notification_promise)

        }

        


    } catch (err) {
        console.log('Error while tracking physicians ', err)
    }
}

export const patient_dashboard = async (req:CustomRequest, res:Response) => {
    
    try {

        const user = req.account_holder.user;

        const {page_num, page_num_1, limit, limit_1} = req.params

        const page_number = Number(page_num) || 1

        const page_number_1 = Number(page_num_1) || 1

        const items_per_page = Number(limit) || 8

        const items_per_page_1 = Number(limit_1) || 8


        const [wallet_balance, credit_transaction, debit_transaction, number_of_appointments, appointments, number_of_transaction, user_transaction ] = await Promise.all([

            prisma.account.findFirst({

                where: {patient_id: user.patient_id},

                select:{ available_balance:true  }

            }),

            prisma.transaction.findMany({
                where:{patient_id: user.patient_id, transaction_type: 'credit'},
                select:{
                    amount: true, transaction_type:true,
                }
            }),

            prisma.transaction.findMany({
                where:{patient_id: user.patient_id, transaction_type: 'debit'},
                select:{
                    amount: true, transaction_type:true,
                }
            }),

            prisma.appointment.count({  where:{ patient_id: user.patient_id },  }),

            prisma.appointment.findMany({

                where: { patient_id: user.patient_id },

                skip: (Math.abs(Number(page_number)) - 1) * items_per_page,

                take: items_per_page,
                
                include: {patient: true, physician: true},

                orderBy: { created_at: 'desc' }
            }),

            prisma.transaction.count({  where:{ patient_id: user.patient_id },  }),

            prisma.transaction.findMany({

                where: { patient_id: user.patient_id },

                skip: (Math.abs(Number(page_number_1)) - 1) * items_per_page_1,

                take: items_per_page_1,
                
                include: {patient: true, physician: true},

                orderBy: { created_at: 'desc' }
            }),


        ])

        
        const total_amount_credited:number = credit_transaction.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

        const total_amount_debited:number = debit_transaction.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

        const number_of_pages = (number_of_appointments <= items_per_page) ? 1 : Math.ceil(number_of_appointments/items_per_page)

        const number_of_pages_1 = (number_of_transaction <= items_per_page_1) ? 1 : Math.ceil(number_of_transaction/items_per_page_1)


        return res.status(200).json({ 
            msg:'Patient Dashboard Information', 
            data: {
                wallet_balance: wallet_balance?.available_balance, total_amount_credited, total_amount_debited,
                total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments,
                total_number_of_transactions: number_of_transaction, total_number_of_pages_1: number_of_pages_1, transactions: user_transaction
            } 
        })

        
    } catch (err) {

        return res.status(500).json({msg:'Error fetching user dashboard ', error:err})

    }
}

export const physician_dashboard = async (req:CustomRequest, res:Response) => {
    
    try {

        const user = req.account_holder.user;

        const {page_num, limit} = req.params

        const page_number = Number(page_num) || 1

        const items_per_page = Number(limit) || 8


        const [taken_appointment, appointment_pending, wallet_balance, credit_transaction, debit_transaction, number_of_appointments, appointments, ] = await Promise.all([

            prisma.appointment.count({
                where:{
                    status: 'completed',
                    physician_id: user.physician_id
                }
            }),

            prisma.appointment.count({
                where:{
                    status: 'pending',
                    physician_id: user.physician_id
                }
            }),

            prisma.account.findFirst({

                where: {physician_id: user.physician_id},

                select:{ available_balance:true  }

            }),

            prisma.transaction.findMany({
                where:{physician_id: user.physician_id, transaction_type: 'credit'},
                select:{
                    amount: true, transaction_type:true,
                }
            }),

            prisma.transaction.findMany({
                where:{physician_id: user.physician_id, transaction_type: 'debit'},
                select:{
                    amount: true, transaction_type:true,
                }
            }),

            prisma.appointment.count({  where:{ physician_id: user.physician_id },  }),

            prisma.appointment.findMany({

                where: { physician_id: user.physician_id },

                skip: (Math.abs(Number(page_number)) - 1) * items_per_page,

                take: items_per_page,
                
                include: {patient: true, physician: true},

                orderBy: { created_at: 'desc' }
            }),


        ])

        
        const total_amount_credited:number = credit_transaction.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

        const total_amount_debited:number = debit_transaction.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

        const number_of_pages = (number_of_appointments <= items_per_page) ? 1 : Math.ceil(number_of_appointments/items_per_page)


        return res.status(200).json({ 
            msg:'Patient Dashboard Information', 
            data: {
                wallet_balance: wallet_balance?.available_balance, total_amount_credited, total_amount_debited,
                appointments_taken: taken_appointment, pending_appointment: appointment_pending,
                total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments,
            } 
        })

        
    } catch (err) {

        return res.status(500).json({msg:'Error fetching user dashboard ', error:err})

    }
}

// -----------------------------------
export const all_physicians = async(req: CustomRequest, res: Response )=>{
    try {

        const {page_number} = req.params
        
        const [number_of_physicians, physicians] = await Promise.all([
            prisma.physician.count({}),

            prisma.physician.findMany({

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                orderBy: { created_at: 'desc' }
                
            })
        ])

        const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians/15)

        return res.status(200).json({ message:'All Physicians', data: {total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians} })

    } catch (err:any) {
        console.log('Error occured while fetching all physicians ', err);
        return res.status(500).json({msg: 'Error occured while fetching all physicians.', error: err})
    }
}

export const filter_physicians = async(req: CustomRequest, res: Response )=>{
    const {specialty} = req.body

    try {
        const {page_number} = req.params

        const [number_of_physicians, physicians] = await Promise.all([
            prisma.physician.count({
                where: { AND:[ {specialty: { contains: specialty, mode: "insensitive" },}, {specialty: {not: 'general_doctor'}} ] }
            }),

            prisma.physician.findMany({
                where: { AND:[  {specialty: { contains: specialty, mode: "insensitive" },}, {specialty: {not: 'general_doctor'}} ] },

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                orderBy: { created_at: 'desc' },
                
            })
        ])

        const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians/15)

        return res.status(200).json({ message:'Physicians', data: {total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians} })
    } catch (err:any) {
        console.log('Error while filtering all physicians ', err);
        return res.status(500).json({msg: 'Error occured while filtering all physicians ', error: err})
    }
}

export const all_general_doctors = async(req: CustomRequest, res: Response )=>{
    try {
        const {page_number} = req.params

        const [number_of_physicians, physicians] = await Promise.all([
            prisma.physician.count({
                where: {
                    AND: [
                        {registered_as: {contains: 'specialist', mode: 'insensitive'}},
                        {specialty: { contains: 'general_doctor', mode: "insensitive" }}

                    ]
                }
            }),
            
            prisma.physician.findMany({
                where: {
                    AND: [
                        {registered_as: {contains: 'specialist', mode: 'insensitive'}},
                        {specialty: { contains: 'general_doctor', mode: "insensitive" }}
                    ]
                },

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                orderBy: { created_at: 'desc' },
                
            })
        ])

        const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians/15)

        return res.status(200).json({ message:'All General Doctors', data: {total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians} })

    } catch (err:any) {
        console.log('Error occured while fetching all general doctors ', err);
        return res.status(500).json({msg: 'Error occured while fetching all general doctors ', error: err})
    }
}