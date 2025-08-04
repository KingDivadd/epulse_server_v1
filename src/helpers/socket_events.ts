import {io} from '../index'

export const patient_socket_messanger = (title:string, data:any, sending_data:any)=>{
    io.emit(`${title}-${data.patient_id}`, {
        statusCode: 200,
        notificationData: sending_data,
        is_read: false,
    })
}

export const physician_socket_messanger = (title:string, data:any, sending_data:any)=>{
    io.emit(`${title}-${data.physician_id}`, {
        statusCode: 200,
        notificationData: sending_data,
        is_read:false,
    })
}