import apn from 'apn';
import { ohealth_api_key_id, odoctor_api_key_id, apn_team_id, apn_key } from './constants';
import {saved_auth_key} from './auth_key'

if (!ohealth_api_key_id) {
    console.log('Ohealth APN key id is missing');
}

if (!odoctor_api_key_id) {
    console.log('Odoctor APN key id is missing');
}

if (!apn_team_id) {
    console.log('APN team ID is missing');
}

if (!apn_key) {
    console.log('APN key is missing');
}

const options = {
    token: {
        key: saved_auth_key,
        keyId: String(ohealth_api_key_id),
        teamId: String(apn_team_id)
    },
    production: false // Set to true for production environment
};


const apn_provider = new apn.Provider(options);


export const send_apn_notification = async (deviceToken: string, payload: any) => {
    let notification = new apn.Notification();

    notification.alert = {
        title: payload.title,
        body: payload.body,
    };
    
    notification.badge = 1;
    notification.sound = "ping.aiff";
    notification.topic = "org.ohealth"; // Replace with your app's bundle ID

    // Custom payload for additional data
    notification.payload = {
        url: payload.url,
        icon: payload.icon,
        messageFrom: "Ohealth"
    };

    try {
        let result = await apn_provider.send(notification, deviceToken);
        console.log("Sent:", result.sent.length);
        console.log("Failed:", result.failed.length);
        console.log(result.failed);
    } catch (err) {
        console.error("Error sending APN:", err);
    }
};

// For Odoctor

const odoctor_options = {
    token: {
        // key: String(apn_key).split(String.raw`\n`).join('\n'),
        key: saved_auth_key,
        keyId: String(ohealth_api_key_id),
        teamId: String(apn_team_id)
    },
    production: false // Set to true for production environment
};

const odoctor_apn_provider = new apn.Provider(odoctor_options);

export const send_odoctor_apn_notification = async (deviceToken: string, payload: any) => {
    let notification = new apn.Notification();

    notification.alert = {
        title: payload.title,
        body: payload.body,
    };
    
    notification.badge = 1;
    notification.sound = "ping.aiff";
    notification.topic = "com.Odoctor"; // Replace with your app's bundle ID

    // Custom payload for additional data
    notification.payload = {
        url: payload.url,
        icon: payload.icon,
        messageFrom: "Ohealth"
    };

    try {
        let result = await odoctor_apn_provider.send(notification, deviceToken);
        console.log("Sent:", result.sent.length);
        console.log("Failed:", result.failed.length);
        console.log(result.failed);
    } catch (err) {
        console.error("Error sending APN:", err);
    }
};

// For viop

const voip_options = {
    token: {
        // key: String(apn_key).split(String.raw`\n`).join('\n'),
        key: saved_auth_key,
        keyId: String(ohealth_api_key_id),
        teamId: String(apn_team_id),
    },
    production: false // Set to true for production environment
};

const voip_apn_provider = new apn.Provider(voip_options);

export const send_voip_notification = async (voip_token: string, payload: any) => {
    let notification = new apn.Notification();

    
    notification.badge = 1;
    notification.sound = "ping.aiff";
    notification.topic = "com.Odoctor.voip"; // Replace with your VoIP app's bundle ID

    // Custom payload for additional data

    notification.payload = {
        "apns": payload,
    };

    try {
        let result = await voip_apn_provider.send(notification, voip_token);
        console.log("Sent:", result.sent.length);
        console.log("Failed:", result.failed.length);
        console.log(result.failed);
    } catch (err) {
        console.error("Error sending VoIP APN:", err);
    }
};
