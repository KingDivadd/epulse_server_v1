import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma_initializer'
import { salt_round } from '../helpers/constants'
import converted_datetime from '../helpers/date_time_elements'
import { redis_auth_store, redis_otp_store, redis_value_update } from '../helpers/redis_funtions'
import {generate_otp, generate_referral_code} from '../helpers/generated_entities'
import {send_mail_account_unverified_to_physician, send_mail_account_verified_to_physician} from '../helpers/emails'
import { CustomRequest } from '../helpers/interface'
import {send_sms_otp} from '../helpers/sms_funtions'
import { handle_decrypt } from '../helpers/encryption_decryption'
import { physician_consultation_validation } from '../validations'
import { account_created_mail,send_mail_otp } from '../helpers/email_controller'

const bcrypt = require('bcrypt')

export const patient_signup = async(req: Request, res: Response, next: NextFunction)=>{
    
    try {
        const encrypted_password = await bcrypt.hash(req.body.password, salt_round);

        req.body.password = encrypted_password
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()
        req.body.referral_code = generate_referral_code()
        
        const user = await prisma.patient.create({ data: req.body })

        if (user){
            await prisma.account.create({
                data:{
                    available_balance: 0,
                    patient_id: user?.patient_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            })
        }

        const x_id_key = await redis_auth_store(user, 60 * 60 * 23)
        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }

         // generate otp
        const otp = generate_otp()
        
        await redis_otp_store(req.body.email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min
        
        account_created_mail(user, otp)

        console.log('otp    ',otp)
        
        return res.status(201).json({msg: 'User created successfully, proceed to setting up your profile.'})
    } catch (err:any) {
        console.log('Error during _ent signup ',err)
        return res.status(500).json({msg: 'Error during patient signup ', error: err})
        
    }
}

export const physician_signup = async(req: Request, res: Response, next: NextFunction)=>{
    
    try {
        const encrypted_password = await bcrypt.hash(req.body.password, salt_round);

        req.body.password = encrypted_password
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()
        
        const user = await prisma.physician.create({ data: req.body })

        if (user){
            await prisma.account.create({
                data:{
                    available_balance: 0,
                    physician_id: user?.physician_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            })
        }

        const x_id_key = await redis_auth_store(user, 60 * 60 * 23)

        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }

        
        // generate otp
        const otp = generate_otp()
        
        await redis_otp_store(req.body.email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min
        
        
        account_created_mail(user, otp)

        console.log('otp    ',otp)

        
        return res.status(201).json({msg: 'User created successfully, proceed to setting up your profile.'})

    } catch (err:any) {
        console.log('Error during physician signup ',err)
        return res.status(500).json({msg: 'Error during physician signup ', error: err})
    }
}

export const user_login = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        let user
        const [patient, physician] = await Promise.all([
            prisma.patient.findUnique({ where: { email: req.body.email }}),
            prisma.physician.findUnique({ where: { email: req.body.email }}),
        ])

        user = patient || physician

        if (!user){
            console.log('Incorrect email address')
            return res.status(404).json({msg: 'Incorrect email address, check email and try again'})
        } 

        if (!user?.is_verified) {

            const otp = generate_otp()
        
            await redis_otp_store(req.body.email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min

            send_mail_otp(req.body.email, otp)

            return res.status(403).json({msg: 'Your account is not verified, please verify before proceeding.',  is_verified: user.is_verified })
        }
        
        const encrypted_password = user.password
        const match_password: boolean = await bcrypt.compare(req.body.password, encrypted_password)

        if (!match_password) {
            console.log('Incorrect password')
            return res.status(401).json({msg: `Incorrect password.` })
        }

        if (req.body.device_type === 'web'){ 
            const new_auth_id = await redis_auth_store(user, 60 * 60 * 24);
            if (new_auth_id){ res.setHeader('x-id-key', new_auth_id) }  
        }

        else if (req.body.device_type === 'mobile'){ 
            const new_auth_id = await redis_auth_store(user, 60 * 60 * 24 * 365); 
            if (new_auth_id){ res.setHeader('x-id-key', new_auth_id) } 
        }

        
        return res.status(200).json({ msg: "Login successful", user_data: user })
        
    } catch (err:any) {
        console.log('Error occured during User login ', err);
        return res.status(500).json({msg: 'Error occured during user login ', error: err})
    }
}

export const physician_login = async(req: Request, res: Response, next: NextFunction)=>{
    
    try {
        const user:any = await prisma.physician.findUnique({ where: { email: req.body.email }})

        if (!user){
            console.log('Incorrect email address')
            return res.status(404).json({msg: 'Incorrect email address, check email and try again'})
        }

        if (!user?.is_verified) {
            console.log('Account not verified')

            const otp = generate_otp()
        
            await redis_otp_store(req.body.email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min

            send_mail_otp(req.body.email, otp)

            return res.status(403).json({msg: 'Your account is not verified, please verify before proceeding.',  is_verified: user.is_verified })
        }
        
        const encrypted_password = user.password
        const match_password: boolean = await bcrypt.compare(req.body.password, encrypted_password)

        if (!match_password) {
            console.log('Incorrect password')
            return res.status(401).json({msg: `Incorrect password, correct password and try again.` })
        }

        let new_auth_id:any

        if (req.body.device_type === 'web'){ 
            const new_auth_id = await redis_auth_store(user, 60 * 60 * 24);
            if (new_auth_id){ res.setHeader('x-id-key', new_auth_id) }  
        }

        else if (req.body.device_type === 'mobile'){ 
            const new_auth_id = await redis_auth_store(user, 60 * 60 * 24 * 365); 
            if (new_auth_id){ res.setHeader('x-id-key', new_auth_id) } 
        }
                
        return res.status(200).json({ msg: "Login successful", user_data: user })
        
    } catch (err:any) {
        console.log('Error occured during physician login ', err);
        return res.status(500).json({msg: 'Error occured during physician login ', error: err})
    }
}

export const generate_user_otp = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const email = req.user_email

        if (!email){
            console.log('email not found')
            return res.status(500).json({msg: 'Email not found'})
        }

        const otp = generate_otp()

        await redis_otp_store(email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min

        send_mail_otp(email, otp)

        if (req.phone_number) { send_sms_otp(req.phone_number, otp) }
        
        return res.status(201).json({ msg: `A six digit unique code has been sent to you, and it's only valid for 10min`})

    } catch (err:any) {
        console.log('Error occured while generating otp ',err)
        return res.status(500).json({msg: 'Error occured while genrating otp ', error: err})
    }
}

export const verify_user_otp = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const { otp, email } = req.body

    try {
        const otp_data = req.otp_data

        if (otp !== otp_data.sent_otp) {
            return res.status(401).json({msg: 'Incorrect otp provided'})
        }

        const [patient, physician] = await Promise.all([
            prisma.patient.findUnique({ where: { email: req.otp_data.email } }),
            prisma.physician.findUnique({ where: { email: req.otp_data.email } })
        ])

    let user;
    if (patient) {
        user = await prisma.patient.update({
            where: { email },
            data: { is_verified: true, updated_at: converted_datetime() },
        });
    } else if (physician) {
        user = await prisma.physician.update({
            where: { email },
            data: { is_verified: true, updated_at: converted_datetime() },
        });
    } else {
        return res.status(404).json({ msg: 'User not found' });
    }

    const auth_id = await redis_auth_store(user, 60 * 60 * 23);

    if (auth_id) {
        res.setHeader('x-id-key', auth_id);
    }

    return res.status(200).json({ msg: 'Verification successful', user });
    
    } catch (err:any) {
        console.log('Error while verifying patient otp ',err)
        return res.status(500).json({msg: 'Error while verifying patient otp ', error: err})
    }
}

export const verify_physician_otp = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const { otp } = req.body

    try {
        const otp_data = req.otp_data

        if (otp !== otp_data.sent_otp) {
            return res.status(401).json({msg: 'Incorrect otp provided'})
        }

        const user: any = await prisma.physician.update({

            where: { email: req.otp_data.email },
            data:{ is_verified: true, updated_at: converted_datetime() }

        })

        const auth_id = await redis_auth_store(user, 60 * 60 * 23);

        if (auth_id){
            res.setHeader('x-id-key', auth_id)
        }


        return res.status(200).json({ msg: 'Verification successful' })
    } catch (err:any) {
        console.log('Error while verifying physician otp ',err)
        return res.status(500).json({msg: 'Error while verifying physician otp ', error: err})
    }
}

export const admin_verify_physician = async(req: CustomRequest, res: Response, next:NextFunction)=>{
    const { encrypted_data } = req.body;
    try {
        const decrypted_data:any = await handle_decrypt(encrypted_data);
        const parsed_decrypted_data:any = JSON.parse(decrypted_data)

        let physician_id = parsed_decrypted_data?.physician_id || null;

        const verify_data = await physician_consultation_validation(parsed_decrypted_data)

        if (verify_data.statusCode !== 200) {
            return {statusCode: verify_data.statusCode, err: verify_data.err}
        }
        
        const verify_physician = await prisma.physician.update({
            where: {physician_id},
            data: {
                is_verified_by_admin: parsed_decrypted_data.is_verified_by_admin, updated_at: converted_datetime()
            }
        })
        if (verify_physician && parsed_decrypted_data.is_verified_by_admin) {
            send_mail_account_verified_to_physician(verify_physician)
        }else if (verify_physician && !parsed_decrypted_data.is_verified_by_admin) {
            send_mail_account_unverified_to_physician(verify_physician)
        }

        return res.status(200).json({msg: 'Physician consultation verification status ', physician:verify_physician})


    } catch (err:any) {
        console.log('Error updating physician data ',err);
        if (err.code == 'P2025'){
            return res.status(400).json({msg: 'Please send a valid physician id '})
        }
        return res.status(500).json({msg: 'Error updating physician data ', error: err});
    }
}

export const reset_user_password = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const auth_id = req.headers['x-id-key'];

        const encrypted_password = await bcrypt.hash(req.body.new_password, salt_round);

        let updated_user:any;

        if (req.account_holder.user.patient_id) {
            updated_user = await prisma.patient.update({
                where: { patient_id: req.account_holder.user.patient_id },
                data: {
                    password: await encrypted_password,
                    updated_at: converted_datetime()
                }
            })
        } else if (req.account_holder.user.physician_id) {
            updated_user = await prisma.physician.update({
                where: { physician_id: req.account_holder.user.physician_id },
                data: {
                    password: await encrypted_password,
                    updated_at: converted_datetime()
                }
            })
        } else {
            return res.status(400).json({msg: 'Invalid user type'})
        }

        const x_id_key = await redis_value_update(auth_id, updated_user, 60 * 60 * 23)

        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }


        return res.status(200).json({ msg: 'Password updated successfully'})
        
    } catch (err:any) {
        console.log('Error occured while resetting user password ',err)
        return res.status(500).json({msg: 'Error occured while resetting user password ', error: err})
        
    }
}


export const reset_patient_password = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const auth_id = req.headers['x-id-key'];

        const encrypted_password = await bcrypt.hash(req.body.new_password, salt_round);

        const updated_user = await prisma.patient.update({
            where: { patient_id: req.account_holder.user.patient_id },
            data: {
                password: await encrypted_password,
                updated_at: converted_datetime()
            }
        })

        const x_id_key = await redis_value_update(auth_id, updated_user, 60 * 60 * 23)

        if (x_id_key){

            res.setHeader('x-id-key', x_id_key)
        }


        return res.status(200).json({ msg: 'Password updated successfully'})

    } catch (err:any) {
        console.log('Error occured while reseting patient password ',err);
        return res.status(500).json({msg: 'Error occured while resetting patient password'})
    }
}

export const reset_physician_password = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const auth_id = req.headers['x-id-key'];

        const encrypted_password = await bcrypt.hash(req.body.new_password, salt_round);

        const updated_user = await prisma.physician.update({
            where: { physician_id: req.account_holder.user.physician_id },
            data: {
                password: await encrypted_password,
                updated_at: converted_datetime()
            }
        })

        const x_id_key = await redis_value_update(auth_id, updated_user, 60 * 60 * 23)

        if (x_id_key){
            res.setHeader('x-id-key', x_id_key)
        }


        return res.status(200).json({ msg: 'Password updated successfully'})

    } catch (err:any) {
        console.log('Error occured while reseting physician password ',err);
        return res.status(500).json({msg: 'Error occured while resetting physician password'})
    }
}

export const patient_signup_profile_setup = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {date_of_birth, phone_number, country_code} = req.body
    try {
        if (date_of_birth){
            req.body.date_of_birth = converted_datetime(date_of_birth)
        }

        req.body.updated_at = converted_datetime(); 

        const patient_id = req.account_holder.user.patient_id;

        const number = Number(phone_number)

        req.body.phone_number = String(number)

        req.body.updated_at = converted_datetime()


        const user: any = await prisma.patient.update({ where: { patient_id }, data: req.body });

        return res.status(200).json({msg: 'Details added successfully', user})


    } catch (err:any) {
        console.log('Error occured while setting up patient profile after signup ', err);
        return res.status(200).json({msg: 'Error occured while setting up patient profile after signup ', error: err});
    }
}

export const physician_signup_profile_setup = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {date_of_birth, phone_number, speciality} = req.body
    try {
            req.body.date_of_birth = converted_datetime(date_of_birth)
            req.body.updated_at = converted_datetime(); 

            const physician_id = req.account_holder.user.physician_id

            const number = Number(phone_number)

            req.body.phone_number = String(number)

            if (speciality.trim().toLowerCase() == 'general doctor') { req.body.speciality = 'general_doctor' }

            const user:any = await prisma.physician.update({
                where: {physician_id },
                data: req.body
            })

            req.user_email = req.account_holder.user.email

            if (user.phone_number && user.country_code){
                req.phone_number = user.country_code + user.phone_number
            }

            return next()
    } catch (err:any) {
        console.log('Error occured while setting up physician profile after signup ', err);
        return res.status(200).json({msg: 'Error occured while setting up physician profile after signup ', error: err});
    }
}

export const logged_in_patient = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        if (physician_id) {
            return res.status(400).json({msg: 'unauthorized x-id-key'})
        }
        
        const [logged_in_user, physicians, appointments] = await Promise.all([
            prisma.patient.findUnique({ where: {patient_id},  }),
            prisma.physician.findMany({}),
            prisma.appointment.findMany({
                where: {patient_id}, 
                include: {patient: true, physician: true}
            })
        ])

        const auth_id = req.headers['x-id-key'];

        res.setHeader('x-id-key', auth_id)
        
        return res.status(200).json({ logged_in_user: logged_in_user,  appointments: appointments, physicians: physicians, })
        
    } catch (err: any) {
        console.log('Error occured in logged in patient function ',err);
        return res.status(500).json({msg: 'Internal server error in logged in patient function ', error: err})
    }
}

export const fetch_user_data_from_key = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const data = req.account_holder.user

        return res.status(200).json({msg: 'User data fetched successfully', user: data})
    } catch (err:any) {
        console.log('Error occured while fetching user data from key ', err);
        return res.status(500).json({msg: 'Error occured while fetching user data from key ', error: err})
    }
}

export const logged_in_physician = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const physician_id = req.account_holder.user.physician_id || null
        const patient_id = req.account_holder.user.patient_id || null

        if (patient_id) {
            return res.status(400).json({msg: 'unauthorized x-id-key'})
        }

        const [logged_in_user, completed_appointment, total_appointment, account] = await Promise.all([ 
            prisma.physician.findFirst({ 
                where: {physician_id},
            }),

            prisma.appointment.findMany({ 
                where: {status: 'completed', physician_id},
                include: {patient: true, physician: true}
            }),  

            prisma.appointment.findMany({ 
                where: {physician_id}, 
                include: {patient: true, physician: true}
            }),  

            prisma.account.findFirst({ where: {physician_id}, select: {available_balance: true} }) 
        ])

        const auth_id = req.headers['x-id-key'];

        res.setHeader('x-id-key', auth_id)

        return res.status(200).json({ logged_in_user, total_appointment, completed_appointment, total_earnings: account?.available_balance })
        
    } catch (err: any) {
        console.log('Error occured in logged in physician function ',err);
        return res.status(500).json({msg: 'Internal server error in logged in physician function ', error: err})
    }
}

export const edit_patient_data = async(req: CustomRequest, res: Response)=>{
    const {date_of_birth, phone_number} = req.body
    try {
        const patient_id = req.account_holder.user.patient_id

        const auth_id = req.headers['x-id-key'];

        req.body.date_of_birth = converted_datetime(date_of_birth)

        req.body.updated_at = converted_datetime(); 

        if (phone_number){
            req.body.phone_number = String(phone_number)
        }
        
        const updated_patient_data = await prisma.patient.update({
            where: {patient_id},
            data: req.body
        })

        const new_auth_id:any = await redis_value_update(auth_id, updated_patient_data, 60 * 60 * 23);

        res.setHeader('x-id-key', new_auth_id)

        return res.status(200).json({ msg: 'Patient profile updated successfully', user: updated_patient_data})
    } catch (err:any) {
        console.log('Error occured while updating patient data ',err);
        return res.status(500).json({msg: 'Error occured while updating patient data ', error: err})
    }
}

export const edit_physician_data = async(req: CustomRequest, res: Response)=>{
    const {date_of_birth, phone_number} = req.body
    try {
        const physician_id = req.account_holder.user.physician_id

        const auth_id = req.headers['x-id-key'];

        req.body.date_of_birth = converted_datetime(date_of_birth)

        req.body.updated_at = converted_datetime(); 

        if (phone_number){
            req.body.phone_number = String(phone_number)
        }

        const update_physician_data = await prisma.physician.update({
            where: {physician_id},
            data: req.body
        })

        const new_auth_id:any = await redis_value_update(auth_id, update_physician_data, 60 * 60 * 23);

        res.setHeader('x-id-key', new_auth_id)

        return res.status(200).json({ msg: 'Physician profile updated successfully', user: update_physician_data})
        
    } catch (err:any) {
        console.log('Error occured while updating physician data ',err);
        return res.status(500).json({msg: 'Error occured while updating physician data ', error: err})
    }
}