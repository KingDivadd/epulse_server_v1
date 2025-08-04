import {Request, Response, NextFunction } from "express";
import { CustomRequest } from "../helpers/interface";
import prisma from "../helpers/prisma_initializer";
import webpush from 'web-push'
import converted_datetime from "../helpers/date_time_elements";
import { send_apn_notification, send_odoctor_apn_notification, send_voip_notification } from "../helpers/apn_server";


export const save_apn_token = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { voip_token, apn_token } = req.body;
    
    try {
        const { patient_id, physician_id } = req.account_holder.user;

        console.log('1');
        
        if (patient_id) {
            await prisma.patient.update({
                where: { patient_id },
                data: { apple_apn: apn_token, voip_token: voip_token, updated_at: converted_datetime() },
            });
        }
        console.log('2');
        
        if (physician_id) {
            await prisma.physician.update({
                where: { physician_id },
                data: {  apple_apn: apn_token, voip_token: voip_token, updated_at: converted_datetime() },
            });
        }

        console.log('3');
        return res.status(200).json({ message: "APN token saved successfully." });

    } catch (err: any) {
        console.log('Error occurred while saving APN tokens:', err);
        return res.status(500).json({msgor: 'Error occurred while saving APN tokens', details: err });
    }
};

export const save_subscription = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { subscription } = req.body;

    try {
        const patient_id = req.account_holder.user.patient_id || null;
        const physician_id = req.account_holder.user.physician_id || null;

        // Check if the subscription already exists
        const del_existing_sub = await prisma.subscription.deleteMany({ where: 
            { patient_id: patient_id , physician_id: physician_id }
        });

        const new_subscription = await prisma.subscription.create({
                data: {
                    patient_id: patient_id ,
                    physician_id: physician_id ,
                    subscription,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                },
            })
            
        // Create a new subscription

        return res.status(201).json({ msg: 'New subscription added', new_subscription });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return res.status(500).json({msgor: 'Error saving subscription' });
    }
};

export const push_notification = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {url} = req.body
    try {
        
        if (!url || url == ''){
            req.body.url = '/'
        }

        const { title, body, avatar, message, data, patient_id, physician_id, notification_to } = req.pushNotificationData;

        const patient = notification_to === 'patient' ? patient_id : null;
        const physician = notification_to === 'physician' ? physician_id : null;


        const payloadData = { title, body, icon: avatar, url: req.body.url };


        if (patient) { 
            try {
                const user = await prisma.patient.findFirst({
                where: { patient_id: patient }, 
                select: { apple_apn: true, voip_token: true } });

                const device_token = user?.apple_apn

                if (device_token){
                    await send_apn_notification(String(device_token), payloadData);
    
                    console.log('APN notification sent successfully to patient');
                }
    
            } catch (err) {
                console.error('Error sending APN notification:', err);
            }

        }

        if (physician) { 
            try {
                
                const user = await prisma.physician.findFirst({
                where: { physician_id: physician }, 
                select: { apple_apn: true, voip_token: true } });

                const device_token = user?.apple_apn

                if (device_token){
                    await send_odoctor_apn_notification(String(device_token), payloadData);
                    console.log('APN notification sent successfully to doctor');
                }

            } catch (err) {
                console.error('Error sending APN notification:', err);
            }

        }
        

        // Send web push notification separately
        const userSubscription = await prisma.subscription.findFirst({
            where: { patient_id: patient, physician_id: physician }, 
            orderBy: { created_at: 'desc' },
            take: 1
        });

        if (userSubscription) {
            const payload = JSON.stringify(payloadData);
            try {
                await webpush.sendNotification(JSON.parse(userSubscription.subscription), payload);
                console.log('Web push notification sent successfully');
            } catch (err) {
                console.error('Error sending web push notification:', err);
            }
        } else {
            console.warn('Receiver\'s subscription was not found.');
        }

        // Send the response after attempting to send notifications
        return res.status(200).json({ msg: title, data });

        
    } catch (err: any) {
        console.log('Error occurred during sending of web push notification, error:', err);
        return res.status(500).json({msg: 'Error occurred during sending of web push notification', error: err });
    }
};

export const function_web_push_notification = async (title:string, body: string, avatar: string, message: string, data: any, patient_id: string, physician_id: string, notification_to: string) => {
    try {

        const payloadData = { title: title, body: body, icon: avatar, url: '/' };

        const patient = notification_to === 'patient' ? patient_id : null

        const physician = notification_to === 'physician' ? physician_id : null

        if (patient) { 
            try {
                const user = await prisma.patient.findFirst({ where: { patient_id: patient },  select: { apple_apn: true, voip_token: true } });

                const device_token = user?.apple_apn

                if (device_token){
                    await send_apn_notification(String(device_token), payloadData);
    
                    console.log('APN notification sent successfully to patient');
                }
    
            } catch (err) {
                console.error('Error sending APN notification:', err);
            }

        }

        if (physician) { 
            try {
                const user = await prisma.physician.findFirst({
                where: { physician_id: physician }, 
                select: { apple_apn: true, voip_token: true } });

                const device_token = user?.apple_apn

                if (device_token){
                    await send_odoctor_apn_notification(String(device_token), payloadData);
                    console.log('APN notification sent successfully to doctor');
                }

            } catch (err) {
                console.error('Error sending APN notification:', err);
            }

        }
        

        const userSubscription = await prisma.subscription.findFirst({
            where: { patient_id: patient , physician_id: physician }, orderBy: { created_at: 'desc'  }, take: 1 
        });

        if (userSubscription) {

            const payload = JSON.stringify(payloadData);

            try {
                await webpush.sendNotification(JSON.parse(userSubscription.subscription), payload);

            } catch (err) {
                console.error('Error sending notification:', err);
                
                // Handle the error if needed, but don't send the response here
            }
        } else {
            return {statusCode: 404, msg: title, data, pushNotification: 'Receiver\'s subscription was not found.' };
        }

        // Send the response after attempting to send the push notification
        return {statusCode: 200, msg: title, data }
        
    } catch (err: any) {
        console.log('Error occurred during sending of web push notification, error:', err);
        return { statusCode: 500, err: 'Error occurred during sending of web push notification', error: err };
    }
};

export const socketWebPushNotification = async (user_id:string, user_data:any, title:string, body: string) => {
    try {

        // user data will contain the 1. callers avatar, 2. callers first and last_name
        // user data should contain 1. title, 2. avatar, 3. body (the message to be send the receiver), 4. 
        const { title, body, avatar, message, data } = user_data

        const userSubscription = await prisma.subscription.findFirst({
            where: {
                patient_id: user_id,
                physician_id: user_id,
            },
        });

        if (userSubscription) {
            const payloadData = {
                title: title,
                body: body,
                icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                url: '/'
            };

            const payload = JSON.stringify(payloadData);

            try {

                await webpush.sendNotification(JSON.parse(userSubscription.subscription), payload);
                console.log('Push notification sent successfully.');

            } catch (err) {

                console.error('Error sending notification:', err);
                // Handle the error if needed, but don't send the response here
            }
        } else {
            return {statusCode: 404, message: `Receiver's subscription was not found`}
        }

        // Send the response after attempting to send the push notification
        return {statusCode: 200, message: `Push notification sent successfully`}
        
            
    } catch (err: any) {
        console.log('Error occurred during sending of web push notification, error:', err);

        return {statusCode: 500, message: 'Error occured during sending of push notification'}
    }
};

export const apn_call_notification = async(data:any)=>{
    try {

        const {caller_name, message, meeting_id, caller_id, receiver_id, userData, availability, appointment_id} = data

        const [physician, appointment] = await Promise.all([
            prisma.physician.findFirst({where: {physician_id: receiver_id } , select:{voip_token: true}}),
            prisma.appointment.findUnique({ where: {appointment_id}})
        ])

        if (appointment){
            data.appointment_time = appointment.time
        }

        if (physician?.voip_token){
            await send_voip_notification(physician.voip_token, data)

            return {statusCode: 200, message: 'Apn push notification sent successfully'}
        }

        return {statusCode: 200, message: 'Physicians voip token not found.'}
        
    } catch (err:any) {
        return {statusCode:500, message: 'Error occured while sending voip call notifiation'}
    }
}