import nodemailer from 'nodemailer';
import { email_password, email_username, sendgrid_api_key } from './constants';
// Import the SendGrid library
const sgMail = require('@sendgrid/mail');


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

    console.log("inside mail box ", otp)
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

    console.log("inside mail box ", otp)
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

const handle_email_response = (error: any, info: any, email: string) => {
    if (error) {
        console.error(`Failed to send email to ${email}:`, error);
    } else {
        console.log(`Email successfully sent to ${email}:`, info.response);
    }
};
