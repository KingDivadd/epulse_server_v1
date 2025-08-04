import { Document, PopulatedDoc } from "mongoose";

export interface CustomRequest {
    params?: any ;
    query: { page?: number | undefined; perPage?: number | undefined; };
    decodedToken?: any;
    body: any;
    headers: any;
    registered_patient?: any;
    registered_physician?: any;
    phone_number?: string;
    account_holder?: any;
    otp_data?: any;
    path?: any;
    verifiedPatient?:any;
    verifiedPhysician?:any;
    user_1?:any;
    chat_users?:any;
    chat_user?:any;
    user_email?:string;
    updated_user?:any;
    patientModel?:any;
    physicianModel?:any;
    pushNotificationData?:any;
}


export interface UserInterface {
    first_name?: string,
    last_name?: string,
    other_names?: string,
    email?: string,
    gender?: string | null,
    date_of_birth?: string | null,
    avatar?: string | null,
    country_code?: string | null,
    phone_number?: string | null,
    referral_code?: string | null,
    registered_as?: string | null;
    speciality?: string | null;
    address?: string | null;
    state?: string | null;
    country?: string | null;
    medical_license?: string | null;
    professional_credentials?: string | null;
    verification_of_employment?: string | null;
}
export interface Media {
    media_name: string;
    media_type: string;
    media_url: string;
}

export interface ChatInterface extends Document {
    idempotency_key: string;
    appointment_id: string;
    text: string;
    media: Media[]; 
    physician_id: string;
    patient_id: string;
    is_patient: boolean;
    is_physician: boolean;
    date: number
}

export interface redisDataProps {
    user: any;
    life_time?: number;
}

export interface redisCallDataProps {
    user_id: any;
    availability: any;
    life_time?: number;
}

