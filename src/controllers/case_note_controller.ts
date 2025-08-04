import { Request, Response, NextFunction } from "express"
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elements'
import {physician_socket_messanger, patient_socket_messanger} from '../helpers/socket_events'


export const all_case_note = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    
    const {patient_id} = req.params

    if (!patient_id){return res.status(400).json({msg: 'patient id is required'})}

    try {
        const case_notes = await prisma.case_note.findMany({ 
            where: { patient_id  }, 
            include: {patient: true, physician: true}, 
            orderBy: { created_at: 'desc' } })

        return res.status(200).json({nbHit: case_notes.length, case_notes})

    } catch (err: any) {
        console.log(`Error occured while fetching all case notes err: `,err)
        return res.status(500).json({msg: `Something went wrong while fetching case notes.`, error:err})
    }
}

export const create_case_note = async (req: CustomRequest, res: Response, next:NextFunction) => {
    try {
        const user = req.account_holder.user;
        if (!user.physician_id || user.physician_id == null) {
            return res.status(401).json({msg: 'Only doctors are allowed to create case notes' }) }

        const physician_id = user.physician_id;
    
        req.body.created_at = converted_datetime();
        req.body.updated_at = converted_datetime();
    
        // First create the casenote

        const new_case_note = await prisma.case_note.create({ data: {...req.body, physician_id} })

        const patient_physician_notification = await prisma.notification.create({
            data: {
                patient_id: new_case_note.patient_id,
                physician_id: new_case_note.physician_id, 
                notification_type: "Case Note",
                notification_for_physician: true,
                notification_for_patient: true,
                status: "completed",
                case_note_id: new_case_note.case_note_id,
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }, include: {case_note: true}
        })

        patient_socket_messanger('notification', new_case_note, patient_physician_notification )

        physician_socket_messanger('notification', new_case_note, patient_physician_notification )
    
        return res.status(201).json({ msg: 'New case note created', case_note: new_case_note });

        } catch (error) {
            console.log(`Error occurred while creating case note err: `, error);
            return res.status(500).json({msgor: `Something went wrong while creating case note`, err: error });
        }
};

export const edit_case_note = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const physician_id = req.account_holder.user.physician_id

        if (!physician_id || physician_id == null){ return res.status(401).json({msg: 'Only doctors are allowed to update case note'}) }

        const {case_note_id} = req.params

        if (!case_note_id){return res.status(400).json({msg: 'case note id is required.'})}
        
        const updated_case_note = await prisma.case_note.update({
            where: {case_note_id}, data: {...req.body, physician_id, updated_at: converted_datetime()},
            include: {patient: true, physician: true}
        })

        const patient_physician_notification = await  prisma.notification.updateMany({
            where: {case_note_id},
            data: {
                patient_id: updated_case_note.patient_id,
                physician_id: physician_id, 
                notification_type: "Case Note",
                notification_for_physician: true,
                notification_for_patient: true,
                status: "completed",
                case_note_id: updated_case_note.case_note_id,
                updated_at: converted_datetime(),
            }
        })
        
        return res.status(200).json({msg: 'Case note updated', case_note: updated_case_note})

    } catch (error: any) {
        console.log(`Error occured while updating case note err: `,error)
        return res.status(500).json({msg: `Something went wrong while updating case note`, error})
    }
}

