import { sendgrid_api_key } from "./constants"
import { readable_date } from "./date_time_elements"
import colors from 'colors'
require('colors')

const FROM_EMAIL = 'contact@ohealthng.com'

const FROM_NAME = 'Ohealth'


export async function send_mail_otp (email: String, otp: String) {

    try {

    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'Ohealth Verification Code',
    html: `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            p {
                color: #555;
                line-height: 1.6;
                margin: 15px 0;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            strong {
                display: block;
                margin: 20px 0;
                font-size: 1.1em;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello,</p>
            <p>Please use the verification code below to verify your email. You can complete your log in with the OTP below.</p>

            <strong>One Time Password (OTP)</strong>
            <p><b>${otp}</b></p>

            <p>This code expires in 10 minutes and should only be used in-app. Do not click any links or share with anybody.</p>

            <p>If you didn’t attempt to register on Ohealth EMR, please change your password immediately to protect your account. For further assistance, contact us at <a href="mailto:support@emr.ohealthng.com">support@emr.ohealthng.com</a>.</p>

            <p>Need help, or have questions? Please visit our <a href="ohealthng.com">contact us page</a> or reply to this message.</p>
        </div>
    </body>
    </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

        
        
    } catch (error) {

        console.log(error)
        
    }
    
}

// this email will be sent to the physician
export async function send_mail_booking_appointment (physician:any, patient:any, appointment:any) {

    try {


    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: physician.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'New Appointment Booking',
    html: `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Booking</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    background-color: #fff;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                p {
                    color: #555;
                    line-height: 1.6;
                    margin: 15px 0;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                strong {
                    display: block;
                    margin: 20px 0;
                    font-size: 1.1em;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Hello Dr ${physician.last_name} ${physician.first_name},</p>
                <p>${patient.last_name} ${patient.first_name} has booked a/an ${appointment.appointment_type} appointment with you scheduled for ${readable_date(parseInt(appointment.time) / 1000)}.</p>

                <p>Please confirm your availability for this appointment.</p>

                <p>Best regards,</p>
                <p>Ohealth</p>
            </div>
        </body>
        </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${physician.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

        
        
    } catch (error) {

        console.log(error)
        
    }

    
}
// this email will be sent to the physician
export async function send_mail_booking_ambulance_appointment (physician:any, patient:any, appointment:any) {

    try {


    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: physician.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'New Appointment Booking',
    html: `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Booking</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    background-color: #fff;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                p {
                    color: #555;
                    line-height: 1.6;
                    margin: 15px 0;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                strong {
                    display: block;
                    margin: 20px 0;
                    font-size: 1.1em;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Hello Dr ${physician.last_name} ${physician.first_name},</p>
                <p>${patient.last_name} ${patient.first_name} has booked an ambulance ${appointment.appointment_type} appointment with you scheduled for ${readable_date(parseInt(appointment.time) / 1000)}.</p>

                <p>Please confirm your availability for this appointment.</p>

                <p>Best regards,</p>
                <p>Ohealth</p>
            </div>
        </body>
        </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${physician.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

        
        
    } catch (error) {

        console.log(error)
        
    }

    
}

// This email will be sent to the patient
export async function send_mail_accepted_appointment (physician:any, patient:any, appointment:any) {

    try {
    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: patient.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'Appointment Booking',
    html: `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            p {
                color: #555;
                line-height: 1.6;
                margin: 15px 0;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            strong {
                display: block;
                margin: 20px 0;
                font-size: 1.1em;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello ${patient.last_name} ${patient.first_name},</p>
            <p>Your ${appointment.appointment_type} appointment with Dr. ${physician.last_name} ${physician.first_name} for the complaint of "${appointment.complain}" scheduled for ${readable_date(parseInt(appointment.time) / 1000)} has been accepted.</p>

            <p>Best regards,</p>
            <p>Ohealth</p>
        </div>
    </body>
    </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${physician.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

    
    
        
    } catch (error) {

        console.log(error)
        
    }
    
}

// This email will be sent to the Patient
export async function send_mail_appointment_denied (physician:any, patient:any, appointment:any) {

    try {
    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: patient.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'Appointment Denied',
    html: `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Denied</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            p {
                color: #555;
                line-height: 1.6;
                margin: 15px 0;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            strong {
                display: block;
                margin: 20px 0;
                font-size: 1.1em;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello ${patient.last_name} ${patient.first_name},</p>
            <p>Your appointment with Dr. ${physician.last_name} for the complaint of "${appointment.complain}" scheduled for ${readable_date(parseInt(appointment.time) / 1000)} has been denied.</p>

            <p>We apologize for any inconvenience this may cause. Please feel free to reschedule your appointment or contact our support team for further assistance.</p>

            <p>Best regards,</p>
            <p>Ohealth</p>
        </div>
    </body>
    </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${patient.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

    
    
        
    } catch (error) {

        console.log(error)
        
    }
    
}

export async function send_mail_appointment_cancelled (physician:any, patient:any, appointment:any) {

    try {
    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: patient.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'Appointment Cancellation',
    html: `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Cancellation</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            p {
                color: #555;
                line-height: 1.6;
                margin: 15px 0;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            strong {
                display: block;
                margin: 20px 0;
                font-size: 1.1em;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello ${patient.last_name} ${patient.first_name},</p>
            <p>Your ${appointment.appointment_type} appointment with Dr. ${physician.last_name} for the complaint of "${appointment.complain}" scheduled for ${readable_date(parseInt(appointment.time) / 1000)} has been cancelled.</p>

            <p>We apologize for any inconvenience this may cause. Please feel free to reschedule your appointment or contact our support team for further assistance.</p>

            <p>Best regards,</p>
            <p>Ohealth</p>
        </div>
    </body>
    </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${patient.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })    
        
    } catch (error) {

        console.log(error)
        
    }
    
}

export async function send_mail_appointment_cancelled_by_patient (physician:any, patient:any, appointment:any) {

    try {
    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: physician.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'Appointment Cancellation',
    html: `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Cancellation</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            p {
                color: #555;
                line-height: 1.6;
                margin: 15px 0;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            strong {
                display: block;
                margin: 20px 0;
                font-size: 1.1em;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello Dr. ${physician.last_name} ${physician.first_name},</p>
            <p>Your ${appointment.appointment_type} appointment with ${patient.last_name} ${patient.first_name} for the complaint of "${appointment.complain}" scheduled for ${readable_date(parseInt(appointment.time) / 1000)} has been cancelled.</p>

            <p>We apologize for any inconvenience this may cause. Please feel free to contact the patient for rescheduling or reach out to our support team for further assistance.</p>

            <p>Best regards,</p>
            <p>Ohealth</p>
        </div>
    </body>
    </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${physician.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })    
        
    } catch (error) {

        console.log(error)
        
    }
    
}

export async function send_mail_appointment_in_session_to_patient(physician:any, patient:any, appointment:any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: patient.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Your Appointment is Now in Session',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Appointment In Session</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello ${patient.last_name} ${patient.first_name},</p>
                        <p>Your ${appointment.appointment_type} appointment with Dr. ${physician.last_name} ${physician.first_name} for the complaint "${appointment.complain}" is now in session. Please join the session at your earliest convenience.</p>

                        <p>Best regards,</p>
                        <p>Ohealth</p>
                    </div>
                </body>
                </html>
`,
        };

        sgMail
            .send(msg)
            .then(() => {
                console.log(`Email sent to ${patient.email}`);
            })
            .catch((error:any) => {
                console.error(`${error}`);
            });
    } catch (error) {
        console.log(error);
    }
}

export async function send_mail_appointment_in_session_to_physician(physician:any, patient:any, appointment:any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: physician.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Your Appointment is Now in Session',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Appointment In Session</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello Dr. ${physician.last_name} ${physician.first_name},</p>
                        <p>Your ${appointment.appointment_type} appointment with ${patient.last_name} ${patient.first_name} for the complaint "${appointment.complain}" is now in session. Please join the session at your earliest convenience.</p>

                        <p>Best regards,</p>
                        <p>Ohealth</p>
                    </div>
                </body>
                </html>
`,
        };

        sgMail
            .send(msg)
            .then(() => {
                console.log(`Email sent to ${physician.email}`);
            })
            .catch((error:any) => {
                console.error(`${error}`);
            });
    } catch (error) {
        console.log(error);
    }
}

export async function send_mail_patient_out_of_credit(physician:any, patient:any, appointment:any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: patient.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Appointment Disconnected Due to Insufficient Credit',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Appointment Disconnected</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello ${patient.last_name} ${patient.first_name},</p>
                        <p>Your ${appointment.appointment_type} appointment with Dr. ${physician.last_name} ${physician.first_name} for the complaint "${appointment.complain}" was disconnected due to insufficient credit.</p>
                        <p>Please fund your account to continue the session.</p>

                        <p>Best regards,</p>
                        <p>Ohealth</p>
                    </div>
                </body>
                </html>
            `,
        };

        await sgMail.send(msg);
        console.log(`Email sent to ${patient.email}`);
    } catch (error) {
        console.error(`Error sending email: ${error}`);
    }
}

export async function send_mail_upcoming_appointment_to_patient(physician:any, patient:any, appointment:any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: patient.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Upcoming Appointment',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Upcoming Appointment</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello ${patient.last_name} ${patient.first_name},</p>
                        <p>This is a reminder that your ${appointment.appointment_type} appointment with Dr. ${physician.last_name} ${physician.first_name} for the complaint "${appointment.complain}" is starting soon. Please be ready to join the session.</p>

                        <p>Best regards,</p>
                        <p>Ohealth</p>
                    </div>
                </body>
                </html>
            `,
        };

        sgMail
            .send(msg)
            .then(() => {
                console.log(`Email sent to ${patient.email}`);
            })
            .catch((error:any) => {
                console.error(`${error}`);
            });
    } catch (error) {
        console.log(error);
    }
}

export async function send_mail_upcoming_appointment_to_physician(physician:any, patient:any, appointment:any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: physician.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Upcoming Appointment',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Upcoming Appointment</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello Dr. ${physician.last_name} ${physician.first_name},</p>
                        <p>This is a reminder that your ${appointment.appointment_type} appointment with ${patient.last_name} ${patient.first_name} for the complaint "${appointment.complain}" is starting soon. Please be ready to join the session.</p>

                        <p>Best regards,</p>
                        <p>Ohealth</p>
                    </div>
                </body>
                </html>
            `,
        };

        sgMail
            .send(msg)
            .then(() => {
                console.log(`Email sent to ${physician.email}`);
            })
            .catch((error:any) => {
                console.error(`${error}`);
            });
    } catch (error) {
        console.log(error);
    }
}

export async function send_mail_account_verified_to_physician(physician: any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: physician.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Welcome! Your Account is Verified for Consultation',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome! Your Account is Verified</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello Dr. ${physician.last_name} ${physician.first_name},</p>
                        <p>Congratulations! Your account has been successfully verified and you are now authorized to begin offering consultations on our platform.</p>
                        <p>We are excited to have you on board and look forward to seeing you provide exceptional care to patients.</p>
                        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

                        <p>Best regards,</p>
                        <p>The Ohealth Team</p>
                    </div>
                </body>
                </html>
            `,
        };

        sgMail
            .send(msg)
            .then(() => {
                console.log(`Welcome email sent to ${physician.email}`);
            })
            .catch((error: any) => {
                console.error(`${error}`);
            });
    } catch (error) {
        console.log(error);
    }
}

export async function send_mail_account_unverified_to_physician(physician: any) {
    try {
        sgMail.setApiKey(sendgrid_api_key);

        const msg = {
            to: physician.email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Notice: Your Account Has Been Unverified',
            html: `
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Unverified</title>
                    <style>
                        body {
                            text-align: center;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }

                        .container {
                            display: inline-block;
                            text-align: left;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            max-width: 600px;
                            background-color: #fff;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        p {
                            color: #555;
                            line-height: 1.6;
                            margin: 15px 0;
                        }

                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }

                        strong {
                            display: block;
                            margin: 20px 0;
                            font-size: 1.1em;
                            color: #333;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello Dr. ${physician.last_name} ${physician.first_name},</p>
                        <p>We regret to inform you that your account has been unverified. You are currently not authorized to provide consultations through our platform.</p>
                        <p>If you believe this is a mistake or have any questions, please contact our support team for further assistance.</p>

                        <p>Best regards,</p>
                        <p>The Ohealth Team</p>
                    </div>
                </body>
                </html>
            `,
        };

        sgMail
            .send(msg)
            .then(() => {
                console.log(`Unverification email sent to ${physician.email}`);
            })
            .catch((error: any) => {
                console.error(`${error}`);
            });
    } catch (error) {
        console.log(error);
    }
}



const sgMail = require('@sendgrid/mail')