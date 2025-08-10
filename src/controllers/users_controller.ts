import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elements'
import { admin_verified_physician_mail } from '../helpers/email_controller'

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