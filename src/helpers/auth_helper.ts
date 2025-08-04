import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from './interface'
import { getFromRedis } from './redis_initializer'
import { jwt_secret } from './constants'
const jwt = require('jsonwebtoken')

export const email_exist = async(req: Request, res: Response, next: NextFunction)=>{
    const {email} = req.body
    try {
        const [patient, physician] = await Promise.all([
            prisma.patient.findUnique({where: {email}}),
            prisma.physician.findUnique({where: {email}}),
        ])

        if (patient || physician){
            return res.status(409).json({msg: 'email already registered to another user' })
        }

        return next()
    } catch (err:any) {
        console.log('Error occured while checking if email exist ', err)
        return res.status(500).json({msg: 'Error occured while checking if email exist ', error: err})
        
    }
}

export const is_registered_user = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const [patient, physician] = await Promise.all([
            prisma.patient.findUnique({where: {email: req.body.email}}),
            prisma.physician.findUnique({where: {email: req.body.email}}),
        ]) 

        if (!patient && !physician){ 
            return res.status(404).json({msg: `User with email ${req.body.email} not found` }) 
        }

        // if (!patient){ return res.status(404).json({msg: `User with email ${req.body.email} not found` }) }

        // if (!physician){ return res.status(404).json({msg: `User with email ${req.body.email} not found` }) }

        req.user_email = patient?.email || physician?.email

        return next()
        
    } catch (err:any) {
        console.log('Error occured in is registered user funciton ', err);
        return res.status(500).json({msg: 'Error occured while checking if user is registered ', error: err})
    }
}

export const is_registered_physician = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const physician = await prisma.physician.findUnique({where: {email: req.body.email}})

        if (!physician){ return res.status(404).json({msg: `User with email ${req.body.email} not found` }) }

        if (physician.phone_number){
            req.phone_number = physician.phone_number
        }

        req.user_email = physician.email

        return next()
    } catch (err:any) {
        console.log('Error occured in is registered physician funciton ', err);
        return res.status(500).json({msg: 'Error occured while checking if physician is registered ', error: err})
    }
}

export const verify_otp_status = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {email} = req.body
    try {

        const value: any = await getFromRedis(`${email}`)

        if (!value){
            return res.status(401).json({msg: "OTP session id has expired, generate a new OTP and re verify..."})
        }
        
        const otp_data = await jwt.verify(value, jwt_secret)
        req.otp_data = otp_data
        req.user_email = otp_data.email

        return next()
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(410).json({msg: `jwt token expired, generate and verify OTP`, error:err })
        }

        console.log('Error in verify otp status funciton', err)
        return res.status(500).json({msg: 'Error in verify otp status function ', error:err })
    }
}

export const socket_verify_auth_id = async (auth_id: string): Promise<{ statusCode: number; data?: any; message?: string }> => {
    try {
        if (!auth_id) { return { statusCode: 401, message: 'x-id-key is missing' }; }

        const value = await getFromRedis(`${auth_id}`)

        if (!value) {  return { statusCode: 404, message: 'Auth session id expired. Please generate OTP.' }; }

        const decode_value = await jwt.verify(value, jwt_secret)
        
        const patient_id = decode_value.user.patient_id || null
        const physician_id =decode_value.user.physician_id || null
        
        if (patient_id == null && physician_id == null){
            return {statusCode: 401, message: 'Please enter the correct x-id-key'}
        }
        
        return { statusCode: 200, data: decode_value.user }

    } catch (err: any) {
        console.error(err);
        return { statusCode: 500, message: `err: ${err}`, };
    }
}

export const verify_auth_id = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const auth_id = req.headers['x-id-key'];
        if (!auth_id) {
            return res.status(401).json({msg: 'x-id-key is missing' })
        }
        
        const value = await getFromRedis(`${auth_id}`)
        
        if (!value) {
            return res.status(401).json({msg: `auth session id expired, please generate otp`})
        }        
        
        const decode_value = await jwt.verify(value, jwt_secret)        
        
        const patient_id = decode_value.user.patient_id || null
        const physician_id =decode_value.user.physician_id || null
        
        if (patient_id == null && physician_id == null){
            return res.status(401).json({msg: 'Please enter the correct x-id-key'})
        }
        
        req.account_holder = decode_value
        return next()
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(410).json({msg: `jwt token expired, regenerate OTP` })
        }
        console.error('Error in verify auth id function : ', err)
    }
}


export const check_user_availability = async (user_id:any) => {
    try {
        if (!user_id) { return {statusCode: 400, message: "user id not provided to check current availability"}  }


        const value = await getFromRedis(`${user_id}`)

        if (!value) { return ({statusCode: 200, message: "the user you are trying to call is available..."}) }
        
        const decoded_value = await jwt.verify(value, jwt_secret)

        if (!decoded_value.availability.is_avialable && !decoded_value.availability.users.includes(user_id)){
            return {statusCode: 409, message: "The user you are trying to call is currently not available", value: decoded_value}
        }

        return {statusCode: 200, message: "The user you are trying to reach is available", value: decoded_value}
        
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return {statusCode: 410, message: 'jwt token expired, generate regenerate OTP'}
        }
    }
}