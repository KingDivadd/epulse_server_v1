import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'

export const all_physicians_2 = async(req: CustomRequest, res: Response )=>{
    try {

        const {page_number, limit} = req.params
        
        const [number_of_physicians, physicians] = await Promise.all([
            prisma.physician.count({}),

            prisma.physician.findMany({

                skip: (Math.abs(Number(page_number)) - 1) * Number(limit),

                take: Number(limit),

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
    const {speciality} = req.body

    try {
        const {page_number} = req.params

        const [number_of_physicians, physicians] = await Promise.all([
            prisma.physician.count({
                where: { AND:[ {speciality: { contains: speciality, mode: "insensitive" },}, {speciality: {not: 'general_doctor'}} ] }
            }),

            prisma.physician.findMany({
                where: { AND:[  {speciality: { contains: speciality, mode: "insensitive" },}, {speciality: {not: 'general_doctor'}} ] },

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
                        {speciality: { contains: 'general_doctor', mode: "insensitive" }}

                    ]
                }
            }),
            
            prisma.physician.findMany({
                where: {
                    AND: [
                        {registered_as: {contains: 'specialist', mode: 'insensitive'}},
                        {speciality: { contains: 'general_doctor', mode: "insensitive" }}
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