import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser, { text } from 'body-parser';
import webpush from 'web-push'
import apn from 'apn'
import cors from 'cors';
import colors from 'colors';
require('colors')
import dotenv from 'dotenv'; 
const jwt = require('jsonwebtoken')
import { CORS_OPTION, general_physician_chat_percentage, port, specialist_physician_chat_percentage, vapid_private_key, vapid_public_key } from './helpers/constants';
import connect_to_mongo_db from './config/mongodb';
import index from './routes/index'
import not_found from  './middlewares/not_found'
import check_network_availability from './middlewares/network_availability'
import { chat_validation, notification_validation, video_validation } from './validations';
import { check_user_availability, socket_verify_auth_id } from './helpers/auth_helper';
import { call_appointment_consultaion_data_update, caller_availability, create_chat, patient_physician_account_update, receiver_availability, validate_appointment } from './controllers/chat_controller';
import prisma from './helpers/prisma_initializer';
import { appointment_tracker } from './controllers/appointment';
import { update_notification } from './controllers/notification_controller';
import { apn_call_notification } from './controllers/push_notification';
import converted_datetime, { readable_date } from './helpers/date_time_elements';
import { physician_tracker } from './controllers/users_controller';

dotenv.config();

const app = express();

const server = http.createServer(app);

const io:any = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }});

app.use(express.json());
app.use(cors(CORS_OPTION));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// config webpush.js

if (vapid_public_key && vapid_private_key) { 
    webpush.setVapidDetails( 'mailto:iroegbu.dg@gmail.com', vapid_public_key, vapid_private_key);
}

// Sockets area

try {
    io.on("connection", (socket:any) => {
        
        socket.on('read-notification', async(data:any, callback:any) =>{
            try {
                const validation = await notification_validation(data)

                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }

                const notification_data = await update_notification(data)

                if (notification_data?.statusCode != 200){
                    console.log(notification_data);
                    callback({statusCode: notification_data.statusCode, message: notification_data.message})
                }

                callback({
                    statusCode: notification_data.statusCode,
                    message: notification_data.message,
                    notificationData: notification_data.notificationData,
                    is_read: notification_data.is_read
                });


            } catch (err:any) {
                callback({
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                });
            }
        })

        socket.on('typing', async(data: any, callback:any) =>{
            try {
                const validation = await chat_validation(data)

                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }

                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                const userAuth = await socket_verify_auth_id(data.token);

                if (userAuth.statusCode === 401) {
                    socket.emit(`${user_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        idempotency_key: data.idempotency_key,
                    });
                    return;
                }else if (userAuth.statusCode === 404) {
                    socket.emit(`${user_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }else if (userAuth.statusCode === 500){
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }

                // sender receives a callback when in the chat page
                socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, {
                    statusCode: 200,
                    message: "Typing... ",
                    is_typing: true,
                    userData: userAuth.data,
                });


            } catch (er:any) {
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                socket.broadcast.emit(`${user_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                });
            }
        })

        // for chat
        socket.on('send-chat-text', async (data: any, callback: any) => {         
            try {

                const validation = await chat_validation(data)
                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }

                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                const userAuth = await socket_verify_auth_id(data.token);

                if (userAuth.statusCode === 401) {

                    socket.emit(`${user_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        idempotency_key: data.idempotency_key,
                    });
                    return;
                }
                else if (userAuth.statusCode === 404) {
                    socket.emit(`${user_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }else if (userAuth.statusCode === 500){
                    callback( {
                        statusCode: 500,
                        message: userAuth.message,
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }

                const appointmentValidation = await validate_appointment(data)
                if (appointmentValidation.statusCode === 400 || appointmentValidation.statusCode === 404 || appointmentValidation.statusCode === 500 ){

                    socket.emit(`${user_id}`, {
                        statusCode: appointmentValidation.statusCode,
                        message: appointmentValidation.message,
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }

                
                const patient_physician_payment = await patient_physician_account_update(userAuth.data, data)
                if (patient_physician_payment?.statusCode === 404 || 
                    patient_physician_payment?.statusCode === 401 || 
                    patient_physician_payment?.statusCode === 500){

                    socket.emit(`${user_id}`, {
                        statusCode: patient_physician_payment.statusCode,
                        message: patient_physician_payment.message,
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                
                const saved_chat:any = await create_chat(data, userAuth.data);
                if (saved_chat.statusCode === 500 ){
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Error sending messages",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                
                // sender receives a callback
                socket.emit(`${user_id}`, {
                    statusCode: 200,
                    message: "Message sent succesfully. ",
                    idempotency_key: data.idempotency_key,
                    chat: saved_chat,
                });
                
                // Get the receiver ID
                const receiver_id = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);

                // Broadcast to the receiver only
                socket.broadcast.emit(`${receiver_id}`, {
                    statusCode: 200,
                    chat: saved_chat,
                    senderData: userAuth.data,
                    idempotency_key: data.idempotency_key,
                    note: 'received'
                });
                
                // Broadcast to patient-physician (sender and receinver)
                socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, {
                    statusCode: 200,
                    chat: saved_chat,
                    is_typing: false,
                    idempotency_key: data.idempotency_key
                });
                                    
            } catch (error) {    
                console.log(error)
            
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                socket.broadcast.emit(`${user_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    idempotency_key: data.idempotency_key
                });
            
            }
        });

        // FOR VIDEO CALL

        // Listening for call

        socket.on('place-call', async(data:any, callback:any)=>{
            
            const validation = await video_validation(data)
            if(validation?.statusCode == 422){
                console.log(validation);
                callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                return;
            }

            const {meeting_id, caller_id, receiver_id, appointment_id } = data

            // this will get the user data of the event emitter
            const userAuth = await socket_verify_auth_id(data.token);
            if (userAuth.statusCode === 401) {
                socket.emit(`${caller_id}`, {
                    statusCode: 401,
                    message: userAuth.message,
                    appointment_id: appointment_id
                });
                return;
            }else if (userAuth.statusCode === 404) {
                socket.emit(`${caller_id}`, {
                    statusCode: 401,
                    message: "Auth session id expired. Please login and get new x-id-key.",
                    appointment_id: appointment_id
                });
                return;
            }else if (userAuth.statusCode === 500){
                socket.emit(`${caller_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error",
                    appointment_id: appointment_id
                });
                return;
            }

            const appointmentValidation = await validate_appointment(data)
            if (appointmentValidation.statusCode === 400 || appointmentValidation.statusCode === 404 || appointmentValidation.statusCode === 500 ){
                callback({
                    statusCode: appointmentValidation.statusCode,
                    message: appointmentValidation.message,
                    
                });
                return;
            }

            // check the availability of the receiver
            const availability = await check_user_availability(receiver_id)
            if (availability?.statusCode === 409){
                callback({statusCode: 409, message: 'User is unavailable at the moment try again later', appointment_id: appointment_id})
                return;
            }

            const apn_call = await apn_call_notification({
                caller_name: `${userAuth.data.first_name} ${userAuth.data.last_name}`,
                message: `You're receiving a call from ${userAuth.data.first_name} ${userAuth.data.last_name}`,
                meeting_id, 
                caller_id, 
                receiver_id,
                userData: userAuth.data,
                availability, appointment_id: appointment_id})


            callback({statusCode: 200, message: `You've placed a call`, meeting_id, caller_id, receiver_id, availability, appointment_id: appointment_id})

            // remember to trigger push notification to the reciever
            socket.broadcast.emit(`call-${receiver_id}`, {
                statusCode: 200,
                message: `You're receiving a call from ${userAuth.data.first_name} ${userAuth.data.last_name} `,
                meeting_id, caller_id, receiver_id,
                userData: userAuth.data,
                availability, appointment_id: appointment_id
            })
        })

        // Listening for the call-not-answered event
        socket.on('call-not-answered', async(data:any, callback:any) => {
            try {
                const validation = await video_validation(data)
                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }
                
                const {meeting_id, caller_id, receiver_id, appointment_id } = data

                const userAuth = await socket_verify_auth_id(data.token);
                if (userAuth.statusCode === 401) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        appointment_id: appointment_id
                    });
                    return;
                }else if (userAuth.statusCode === 404) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        appointment_id: appointment_id
                    });
                    return;
                }else if (userAuth.statusCode === 500){
                    socket.emit(`${caller_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        appointment_id: appointment_id
                    });
                    return;
                }

                // send a notification ( you missed a call )
                callback({statusCode: 200, message: `Call wasn't answered`, meeting_id, caller_id, receiver_id, appointment_id: appointment_id})            
        
                // Emit the response back to the caller
                socket.broadcast.emit(`call-not-answered-${data.caller_id}`, {
                    statusCode: 200,
                    message: `${userAuth.data.last_name} ${userAuth.data.first_name} isn't available at the moment, please try again later.`,
                    meeting_id, caller_id, receiver_id,
                    userData: userAuth.data, appointment_id: appointment_id
                } );
        
                } catch (error: any) {
                    console.log(error)
            
                    socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error in the catch block",
                        meeting_id: data.meeting_id,
                    });
                }
        });
    
        // Listening for the answered call event
        socket.on('call-answered', async (data: any, callback: any) => {
            try {
                const validation = await video_validation(data);
                if (validation?.statusCode === 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const { meeting_id, caller_id, receiver_id, appointment_id } = data;
    
                await caller_availability(data);
                await receiver_availability(data);
    
                const userAuth = await socket_verify_auth_id(data.token);
                if (userAuth.statusCode === 401) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        appointment_id: appointment_id
                    });
                    return;
                } else if (userAuth.statusCode === 404) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        appointment_id: appointment_id
                    });
                    return;
                } else if (userAuth.statusCode === 500) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        appointment_id: appointment_id
                    });
                    return;
                }
    
                callback({ statusCode: 200, message: `You've answered your call `, meeting_id, caller_id, receiver_id, appointment_id: appointment_id });
    
                // Emit the response back to the caller
                socket.broadcast.emit(`call-answered-${data.caller_id}`, {
                    statusCode: 200,
                    message: `${userAuth.data.last_name} ${userAuth.data.first_name} has accepted your call, you can now begin conferencing`,
                    meeting_id, caller_id, receiver_id,
                    userData: userAuth.data, appointment_id: appointment_id
                });
    
                // now make the availability of the caller and receiver false
    
                // Start billing the user every minute
                socket.call_start_time = Date.now();
                socket.billing_interval = setInterval(async () => {
                    try {
                        let earned_amount = 0;

                        let per_minute_charge = 0

                        const specialist_video_call_charge_per_minute = 500

                        const general_doctor_video_call_charge_per_minute = 400

                        const [caller_account, physician, appointment ] = await Promise.all([ 
                            prisma.account.findFirst({ where: { patient_id: caller_id } }),
                            prisma.physician.findUnique({where: {physician_id: receiver_id}}),
                            prisma.appointment.findUnique({where: {appointment_id: data.appointment_id}, include: {patient: true, physician: true}})
                        ])
                        const current_time = Date.now()
                        const appointment_end_time = Number(appointment?.time ) + ( 31 * 60 * 1000 )

                        if (current_time > appointment_end_time ){
                            
                            
                            socket.emit(`${appointment?.patient_id}`, {
                                statusCode: 400,
                                message: `Appointment session with Dr ${appointment?.physician?.last_name} ${appointment?.physician?.first_name} has ended`,
                                appointment_id: appointment_id
                            });

                            socket.emit(`${appointment?.physician_id}`, {
                                statusCode: 400,
                                message:  `Appointment session with ${appointment?.patient?.last_name} ${appointment?.patient?.first_name} has ended`,
                                appointment_id: appointment_id
                            });
                            clearInterval(socket.billing_interval);
                            return
                        }else{
                            if (physician?.specialty !== 'general_doctor'){

                                per_minute_charge = specialist_video_call_charge_per_minute

                                earned_amount = per_minute_charge * (specialist_physician_chat_percentage / 100);   
                                
                            }else if (physician?.specialty == 'general_doctor'){
                                
                                per_minute_charge = general_doctor_video_call_charge_per_minute

                                earned_amount = per_minute_charge * (general_physician_chat_percentage / 100);   

                            }

                            if (caller_account && caller_account?.available_balance < per_minute_charge) {
                                socket.emit(`${caller_id}`, {
                                    statusCode: 402,
                                    message: "Insufficient funds. This call will be ended.",
                                    appointment_id: appointment_id
                                });
                                socket.disconnect();
                                return;
                            }
        
                            await Promise.all([
                                call_appointment_consultaion_data_update(caller_id, per_minute_charge),
                                
                                prisma.account.update({
                                    where: { account_id: caller_account?.account_id },
                                    data: { available_balance: { decrement: per_minute_charge } }
                                }),

                                prisma.account.updateMany({
                                    where: {physician_id: physician?.physician_id},
                                    data: {available_balance: {increment: earned_amount }}
                                })
                            ])
                        }
                        
    
                    } catch (error) {
                        console.log('Error during billing:', error);
                        socket.emit(`${caller_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error during billing.",
                            appointment_id: appointment_id
                        });
                    }
                }, 60000);
    
            } catch (error: any) {
                console.log(error);
    
                socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    meeting_id: data.meeting_id
                });
            }
        });
    
        socket.on('disconnect', async () => {
            if (socket.billing_interval) {
                clearInterval(socket.billing_interval);
                console.log('Billing interval cleared');
            }
        
            console.log('A user disconnected');
        });
        

        socket.on('call-rejected', async(data:any, callback:any) => {
            try {
                const validation = await video_validation(data)
                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }
                const {meeting_id, caller_id, receiver_id, appointment_id } = data

                callback({statusCode: 200, message: `You've rejected an incomming call. `, meeting_id, caller_id, receiver_id, appointment_id: appointment_id})            
        
                // Emit the response back to the caller
                socket.broadcast.emit(`call-rejected-${caller_id}`, {
                    statusCode: 200,
                    message: `User is busy, Please try again later.`,
                    meeting_id, caller_id, receiver_id, appointment_id: appointment_id
                } );

                // Emit the response back to the receiver
                socket.broadcast.emit(`call-rejected-${receiver_id}`, {
                    statusCode: 200,
                    message: `User is busy, Please try again later, thank you.`,
                    meeting_id, caller_id, receiver_id, appointment_id: appointment_id
                })
        
                } catch (error: any) {
                    console.log(error)

                    socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error in the catch block",
                        meeting_id: data.meeting_id
                    });
                }
        });
    
        // Listening for the call disconnected event
        socket.on('call-disconnected', async(data:any, callback:any) => {
            try {

                console.log('ending call');
                
                if (socket.billing_interval) {
                    clearInterval(socket.billing_interval);
                    console.log('Billing interval cleared on call-disconnected event');
                }

                const validation = await video_validation(data)

                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }
                
                const {meeting_id, caller_id, receiver_id, appointment_id } = data

                callback({statusCode: 200, message: `You're no longer conected. `, meeting_id, caller_id, receiver_id, appointment_id: appointment_id})            
        
                // Emit the response back to the caller
                socket.broadcast.emit(`call-disconnected-${data.caller_id}`, {
                    statusCode: 200,
                    message: `User is disconnected.`,
                    meeting_id, caller_id, receiver_id, appointment_id: appointment_id
                } );
        
                } catch (error: any) {
                    console.log(error)
                
                    const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                    socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error in the catch block",
                        meeting_id: data.meeting_id
                    });
                }
        });

    });

    
} catch (err:any) {
    console.log('Caught error while trying to yse socket. ', err)
}

export {io}

// middleware
app.use(check_network_availability);

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const { method, url, ip, query } = req;
    console.log(`${timestamp} - ${method} ${url} from ${ip}`);
    console.log('Query:', query);
    next();
});

// routes
app.use('/api/v1/auth', index);
app.use('/api/v1/user', index);
app.use('/api/v1/chat', index);
app.use('/api/v1/message', index);
app.use('/api/v1/facility', index);
app.use('/api/v1/appointment', index);
app.use('/api/v1/transaction', index);
app.use('/api/v1/case-note', index);
app.use('/api/v1/report', index);
app.use('/api/v1/push-notification', index)
app.use('/api/v1/notification', index)
app.use('/api/v1/ambulance', index)
app.use('/api/v1/test', index);

app.use(not_found);

// run this script every 5 min
// apn_call_notification()
appointment_tracker()
setInterval(()=>{
    
    console.log('tracking begins');
    
    appointment_tracker()

    physician_tracker()

}, 30000 )


const start = async () => {
    const PORT = port || 4000;
    try {
        await connect_to_mongo_db();
        server.listen(PORT, () => console.log(`OHealth server started and running on port ${PORT}`.cyan.bold));
    } catch (err) {
        console.log(`something went wrong`.red.bold);
    }
}

start();