import nodemailer from 'nodemailer';
import { email_password, email_username } from './constants';
import {format_date_from_unix} from '../lib/date_formarter'


// Setup the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email_username,
        pass: email_password,
    },
    tls: {
        rejectUnauthorized: false, // Use with caution, especially in production
    },
});


export const account_created_mail = (user:any, otp:string) => {

    const patient_template = `
        <div class="email-container">
            <h1 class="email-heading">Welcome to ePulse, ${user.first_name}!</h1>
            <p class="email-paragraph">We're thrilled to have you join ePulse Telemedicine. You will be able to access personalized healthcare services and connect with top physicians to manage your health with ease and from any where.</p>
            <p class="email-paragraph">To verify your account, please use the following one-time password (OTP):</p>
            <p class="email-paragraph"><strong>${otp}</strong></p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>`

    const physician_template = `

        <div class="email-container">
            <h1 class="email-heading">Welcome to ePulse, Dr. ${user.first_name}!</h1>
            <p class="email-paragraph">We're excited to welcome you to ePulse as a physician! Empower patients with your expertise and leverage our platform to deliver seamless telemedicine services.</p>
            <p class="email-paragraph">To verify your account, please use the following one-time password (OTP):</p>
            <p class="email-paragraph"><strong>${otp}</strong></p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
    `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${user.patient_id ? patient_template : physician_template}
            </body>
        </html>
    `;

    const mailOptions = {
            from: { name: "EPulse", address: 'epulse-ng@gmail.com' },
            to: user.email,
            subject: "EPulse: Account Created",
            html: htmlContent,
            text: 'Your account has been created.'
    };

    transporter.sendMail(mailOptions, (error:any, info:any) => {
        handle_email_response(error, info, user.email);
    });
};

export const send_mail_otp = (email:string, otp:string) => {

    const template = `
        <div class="email-container">
            <h1 class="email-heading">Hello,</h1>
            <p class="email-paragraph">Please use this verification code below to verify your email.</p>
            <p class="email-paragraph"><strong>${otp}</strong></p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>`


    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
            from: { name: "EPulse", address: 'epulse-ng@gmail.com' },
            to: email,
            subject: "EPulse: Verify your account",
            html: htmlContent,
            text: 'Your account has been created.'
    };

    transporter.sendMail(mailOptions, (error:any, info:any) => {
        handle_email_response(error, info, email);
    });
};

export const admin_verified_physician_mail = (user:any) => {

    const template = `
        <div class="email-container">
            <h1 class="email-heading">Congratulations, Dr. ${user.first_name}!</h1>
            <p class="email-paragraph">We are delighted to inform you that your ePulse account has been approved. You are now ready to receive patients and provide exceptional telemedicine services.</p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `


    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: user.email,
        subject: "ePulse: Account Approved - Ready to Receive Patients",
        html: htmlContent,
        text: 'Your ePulse account has been approved.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const booking_appointment_mail = (physician:any, patient:any, appointment:any) => {

    const date_time = format_date_from_unix(Number(appointment.time))

    const template = `
        <div class="email-container">
            <h1 class="email-heading">Hello Dr. ${physician.first_name}!</h1>
            <p class="email-paragraph">${patient.last_name} ${patient.first_name} has booked a/an ${appointment.appointment_type.replace(/_/, ' ')} appointment with you scheduled for ${date_time.date}, ${date_time.time} </p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: physician.email,
        subject: "ePulse: New Appointment Booking",
        html: htmlContent,
        text: 'A patient has booked an appointment with you.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, physician.email);
    });
};

export const patient_out_of_credit_mail = (physician:any, patient:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))
    const template = `
        <div class="email-container">
            <h1 class="email-heading">Hello ${patient.first_name}!</h1>
            <p class="email-paragraph">Your ${appointment.appointment_type.replace(/_/, " ")} appointment with Dr. ${physician.last_name} ${physician.first_name} " was discontinued due to insufficient credit.</p>
            <p class="email-paragraph">Please fund your account to continue the session.</p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: patient.email,
        subject: "ePulse: Appointment Discontinued",
        html: htmlContent,
        text: 'appointment discontinued due to insufficient credit.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, patient.email);
    });
};

export const patient_appointment_acceptance_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))

    const template = `
        <div class="email-container">
            <h1 class="email-heading">Hello ${patient.first_name}!</h1>
            <p class="email-paragraph">Good news, your ${appointment.appointment_type.replace(/_/, ' ')} appointment with Dr. ${physician.last_name} ${physician.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} has been accepted.</p>
            <p class="email-paragraph">Please endeviour to be available for the slated time.</p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: patient.email,
        subject: "ePulse: Appointment Accepted",
        html: htmlContent,
        text: 'Your appointment has been accepted.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, patient.email);
    });
};

export const patient_appointment_declined_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))

    const template = `
        <div class="email-container">
            <h1 class="email-heading">Hello ${patient.first_name}!</h1>
            <p class="email-paragraph">Unfortunately, your ${appointment.appointment_type.replace(/_/, ' ')} appointment with Dr. ${physician.last_name} ${physician.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} has been declined due to his unavailability.</p>

            <p class="email-paragraph">We apologize for any inconvenience this may cause. Please feel free to reschedule your appointment or contact our support team for further assistance.</p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: patient.email,
        subject: "ePulse: Appointment Declined",
        html: htmlContent,
        text: 'Your appointment has been declined due to the doctor\'s unavailability.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, patient.email);
    });
};

export const patient_appointment_cancelled_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))


    const template = `

        <div class="email-container">
            <h1 class="email-heading">Hello ${patient.first_name}!</h1>
            <p class="email-paragraph">Unfortunately, your ${appointment.appointment_type.replace(/_/, ' ')} appointment with Dr. ${physician.last_name} ${physician.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} has been cancelled due to his unavailability.</p>

            <p class="email-paragraph">We apologize for any inconvenience this may cause. Please feel free to reschedule your appointment or contact our support team for further assistance.</p>
            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: patient.email,
        subject: "ePulse: Appointment Cancelled",
        html: htmlContent,
        text: 'Your appointment has been cancelled due to the doctor\'s unavailability.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, patient.email);
    });
};

export const patient_appointment_in_session_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))


    const template = `

        <div class="email-container">
            <h1 class="email-heading">Hello ${patient.first_name}!</h1>
            <p class="email-paragraph">Kindly note that your ${appointment.appointment_type.replace(/_/, ' ')} appointment with Dr. ${physician.last_name} ${physician.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} is now in session.</p>

            <p class="email-paragraph">Please join to begin the consultation.</p>

            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: patient.email,
        subject: "ePulse: Appointment in Session",
        html: htmlContent,
        text: 'Your appointment is now in session.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, patient.email);
    });
};

export const physician_appointment_in_session_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))


    const template = `

        <div class="email-container">
            <h1 class="email-heading">Hello Dr. ${physician.first_name}!</h1>
            <p class="email-paragraph">Kindly note that your ${appointment.appointment_type.replace(/_/, ' ')} appointment with ${patient.last_name} ${patient.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} is now in session.</p>

            <p class="email-paragraph">Please join to begin the consultation.</p>

            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: physician.email,
        subject: "ePulse: Appointment in Session",
        html: htmlContent,
        text: 'Your appointment is now in session.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, physician.email);
    });
};

export const patient_upcoming_appointment_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))


    const template = `

        <div class="email-container">
            <h1 class="email-heading">Hello ${patient.first_name}!</h1>
            <p class="email-paragraph">This is a reminder that your ${appointment.appointment_type.replace(/_/, ' ')} appointment with Dr. ${physician.last_name} ${physician.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} is starting soon.</p>

            <p class="email-paragraph">Please be ready to join the session.</p>

            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: patient.email,
        subject: "ePulse: Upcoming Appointment",
        html: htmlContent,
        text: 'You have an appointment coming up soon.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, patient.email);
    });
};

export const physician_upcoming_appointment_mail = (patient:any, physician:any, appointment:any) => {


    const date_time = format_date_from_unix(Number(appointment.time))


    const template = `

        <div class="email-container">
            <h1 class="email-heading">Hello Dr. ${physician.first_name}!</h1>
            <p class="email-paragraph">This is a reminder that your ${appointment.appointment_type.replace(/_/, ' ')} appointment with ${patient.last_name} ${patient.first_name}" scheduled to hold on ${date_time.date} ${date_time.time} is starting soon.</p>

            <p class="email-paragraph">Please be ready to join the session.</p>

            <p class="email-paragraph">Best Regards,</p>
            <p class="email-paragraph">The ePulse Team.</p>
        </div>
        `
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to EPulse</title>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    body {
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    }
                    .email-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    background-color: #ffffff;
                    text-align: left;
                    }
                    .email-heading {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 700;
                    }
                    .email-paragraph {
                    color: #555;
                    line-height: 1.6;
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    }
                    .email-link {
                    color: #306CE9;
                    text-decoration: none;
                    font-weight: 500;
                    }
                    .email-list {
                    padding-left: 20px;
                    margin: 0 0 15px 0;
                    }
                    .email-list-item {
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #555;
                    }
                </style>
            </head>
            <body>
                ${template}
            </body>
        </html>
    `;

    const mailOptions = {
        from: { name: "ePulse", address: 'epulse-ng@gmail.com' },
        to: physician.email,
        subject: "ePulse: Upcoming Appointment",
        html: htmlContent,
        text: 'You have an appointment coming up soon.',
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, physician.email);
    });
};








const handle_email_response = (error: any, info: any, email: string) => {
    if (error) {
        console.error(`Failed to send email to ${email}:`, error);
    } else {
        console.log(`Email successfully sent to ${email}:`, info.response);
    }
};
