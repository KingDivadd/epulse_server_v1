import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'


export const incomming_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const incomming_appt = await prisma.appointment.findMany({
            where: { status: 'accepted' }, 
            include: {patient: true, physician: true, ambulance: true, case_note: true, },
            orderBy: {created_at: 'desc'}
        })

        return res.status(200).json({total_appointment: incomming_appt.length, appointment:incomming_appt})

    } catch (err:any) {
        console.log('Error occured while fetching incomming appointments');
        return res.status(500).json({msg:'Error occured while fetching incomming appointments', error: err});
    }
}


export const ongoing_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const ongoing_appt = await prisma.appointment.findMany({
            where: {status: 'accepted', in_session: true }, 
            include: {patient: true, physician: true, ambulance: true, case_note: true, },
            orderBy: {created_at: 'desc'}
        })

        return res.status(200).json({total_appointment: ongoing_appt.length, appointment:ongoing_appt})

    } catch (err:any) {
        console.log('Error occured while fetching ongoing appointments');
        return res.status(500).json({msg:'Error occured while fetching ongoing appointments', error: err});
    }
}


export const completed_appointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
    
        const completed_appt = await prisma.appointment.findMany({
            where: {status: 'completed' }, 
            include: {patient: true, physician: true, ambulance: true, case_note: true, },
            orderBy: {created_at: 'desc'}
        })

        return res.status(200).json({total_appointment: completed_appt.length, appointment:completed_appt})

    } catch (err:any) {
        console.log('Error occured while fetching completed appointments');
        return res.status(500).json({msg:'Error occured while fetching completed appointments', error: err});
    }
}