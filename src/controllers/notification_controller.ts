import { NextFunction, Request, Response } from "express"
import { CustomRequest } from "../helpers/interface"
import prisma from "../helpers/prisma_initializer"


export const all_notifications = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const patient_id = req.account_holder.user.patient_id || null;

        const physician_id = req.account_holder.user.physician_id || null;

        const notification = await prisma.notification.findMany({
            where: {
                OR: [
                    { patient_id: patient_id || undefined },
                    { physician_id: physician_id || undefined },
                ],

                status: { contains: "", mode: "insensitive" },

                notification_for_patient: patient_id ? true : undefined,

                notification_for_physician: physician_id ? true : undefined,
            },
            include: {patient: true, physician: true, appointment: true, case_note: true, transaction: true,},

            
            orderBy: { created_at: 'desc' },
        });

        return res.status(200).json({ nbHit: notification.length, msg: `${patient_id ? "Patient": "Physician" } Notification`, notification });

    } catch (err: any) {
        console.log(`Error fetching all notifications: `, err);
        return res.status(500).json({msg: `Error fetching all notifications`, error: err });
    }
};
        
export const filter_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {status} = req.body
    try {
        const patient_id = req.account_holder.user.patient_id || null;
        
        const physician_id = req.account_holder.user.physician_id || null;

        const notification = await prisma.notification.findMany({
            where: {
                OR: [
                    { patient_id: patient_id || undefined },
                    { physician_id: physician_id || undefined },
                ],

                status: { contains: status, mode: "insensitive" },

                notification_for_patient: patient_id ? true : undefined,

                notification_for_physician: physician_id ? true : undefined,
            },
            include: { patient: true, physician: true, appointment: true, case_note: true, transaction: true, },
            orderBy: { created_at: 'desc' },
        });

        return res.status(200).json({ nbHit: notification.length, msg: `${patient_id ? "Patient": "Physician" } Notification`, notification });

    } catch (err: any) {
        console.log(`Error fltering notifications err: `, err)
        return res.status(500).json({msg: `Error filtering notifications err `, error: err})
    }
}
        
export const delete_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {notification_id} = req.params
        const patient_id = req.account_holder.user.patient_id || null
        const physician_id = req.account_holder.user.physician_id || null

        const notification_exist = await prisma.notification.findUnique({
            where: {notification_id: notification_id, }
        })

        if (!notification_exist){
            return res.status(404).json({msg: 'Selected notification not found, might be deleted.'})
        }
        
        if ( patient_id !== notification_exist.patient_id || physician_id !== notification_exist.physician_id ){
            return res.status(401).json({msg: `You're not authorized to deleted selected notification.`})
        }

        const remove_notification = await prisma.notification.delete({
            where: {  notification_id: notification_id,  patient_id,  physician_id }
        })

        return res.status(200).json({msg: "Selected notification deleted successfully."})
    } catch (err:any) {
        console.log(`Error deleting selected err: `, err)
        return res.status(500).json({msg: `Error deleting selected error err: `, error: err})
    }
}

export const update_notification = async(data:any)=>{
    try {
        const {notification_id, is_read} = data

        const notification = await prisma.notification.findUnique({
            where: {notification_id}
        })

        if (!notification){return {statusCode: 404, message: 'Incorrect notification id passed'}}

        if (is_read){

            const update_notification = await prisma.notification.update({
                where: {notification_id},
                data: {
                    is_read: true,
                }
            })
            
            return {statusCode: 200, message: "notification read status updated successfully", notificationData:notification, is_read:is_read}
            
        }else{
            
            return {statusCode: 200, message: "notification read status is false ", notificationData:notification, is_read:is_read}
        }
        
    } catch (err:any) {
        return { statusCode: 500, message: `Error occured while checking receivers availability`, error: err };
    }
}