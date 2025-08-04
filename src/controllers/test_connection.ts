import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { redis_url } from '../helpers/constants'

export const test_basic_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        return res.status(200).json({msg: 'Server connected successfully.-()-'})
    } catch (err:any) {
        console.log('Error occured in test basic server connection controller ', err)
        return res.status(500).json({msg: 'Error occured in test basic server connection controller ', error: err})
        
    }
}

export const test_db_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const [patient, physician] = await Promise.all([
            prisma.patient.findMany({orderBy: {created_at: 'desc'}}), 
            prisma.physician.findMany({orderBy: {created_at: 'desc'}})
        ])

        return res.status(200).json({msg: 'Patient and Physician data fetched successfully', number_of_patient: patient.length, number_of_physicians: physician.length, patients: patient, physicians: physician})
    } catch (err:any) {
        console.log('Error occured in test db connection controller ', err)
        return res.status(500).json({msg: 'Error occured in test db connection controller ', error: err})
    }
}