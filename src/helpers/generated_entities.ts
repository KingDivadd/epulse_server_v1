const jwt = require('jsonwebtoken');
import { jwt_secret } from "./constants";


export const gen_token = (payload: any, useful_time: number) => {
    return jwt.sign(payload, jwt_secret, {
        expiresIn: useful_time
    });
}

export function generate_otp() {
    const characters = '0123456789';
    let otp = '';

    for (let i = 0; i < 6; i++) {
        const random_index = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(random_index);
    }

    return otp;
}

export function generate_referral_code() {
    const characters = 'abcdefchijklmnoopqrstuvwxyz';
    let otp = '';

    for (let i = 0; i < 6; i++) {
        const random_index = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(random_index);
    }

    return otp;
}

