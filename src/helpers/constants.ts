import dotenv from 'dotenv';
dotenv.config();


export const salt_round = Number(process.env.SALT_ROUND)
export const port = process.env.PORT
export const db_url = process.env.DATABASE_URL
export const redis_url = process.env.REDIS_URL
export const jwt_secret = process.env.JWT_SECRET
export const jwt_lifetime = process.env.JWT_LIFETIME
export const sendgrid_api_key = process.env.SENDGRID_API_KEY
export const termii_api_key = process.env.TERMII_API_KEY
export const mongo_uri = process.env.MONGO_URI
export const paystack_secret_key = process.env.PAYSTACK_SECRET_KEY
export const paystack_public_key = process.env.PAYSTACK_PUBLIC_KEY
export const msg_amount = process.env.AMOUNT
export const passPhrase = process.env.PASSPHRASE
export const chat_amount = Number(process.env.CHAT_AMOUNT)
export const general_physician_chat_amount = Number(process.env.GENERAL_PHYSYCIAN_CHAT_AMOUNT)
export const specialist_physician_chat_amount = Number(process.env.SPECIALIST_PHYSCIAN_CHAT_AMOUNT)

export const specialist_physician_chat_percentage  = Number(process.env.SPECIALIST_PHYSCIAN_CHAT_PERCENTAGE)
export const general_physician_chat_percentage  = Number(process.env.GENERAL_PHYSYCIAN_CHAT_PERCENTAGE)
export const booking_fee = Number(process.env.APPOINTMENT_BOOKING_FEE)
export const videosdk_api_key = process.env.VIDEO_SDK_API_KEY
export const videosdk_secret_key = process.env.VIDEO_SDK_API_SECRET
export const videosdk_endpoint = process.env.VIDEOSDK_API_ENDPOINT
export const vapid_public_key = process.env.VAPID_PUBLIC_KEY
export const vapid_private_key = process.env.VAPID_PRIVATE_KEY

export const ohealth_api_key_id = process.env.OHEALTH_APN_KEY_ID
export const odoctor_api_key_id = process.env.ODOCTOR_APN_KEY_ID
export const apn_team_id = process.env.APN_TEAM_ID
export const apn_key = process.env.APN_KEY

export const email_username = process.env.EMAIL_USERNAME
export const email_password = process.env.EMAIL_PASSWORD

export const CORS_OPTION ={
    origin: "*",
    credentials: true,
    exposedHeaders: ['x-id-key'],
    optionsSuccessStatus: 200
}

