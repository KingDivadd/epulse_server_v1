import axios from "axios";
import { termii_api_key } from "./constants";

export async function send_sms_otp(phone_number: string, otp: string) {
    try {
        const data = {
            to: phone_number,
            from: "N-Alert",
            sms: `Hi, your Ohealth verification code is ${otp}. This is a one-time code. If you did not initiate this process, please ignore this message.`,
            type: "plain",
            api_key: termii_api_key,
            channel: "dnd",
        };

        await axios.post('https://api.ng.termii.com/api/sms/send', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(`Otp sent to ${phone_number}`.yellow.bold)
        
    } catch (error) {
        // Handle errors appropriately, such as displaying an error message to the user
        console.log(error);
    }
}
