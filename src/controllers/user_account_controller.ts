import { Request, Response, NextFunction } from "express"
import prisma from '../helpers/prisma_initializer'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elements'
import {physician_socket_messanger, patient_socket_messanger} from '../helpers/socket_events'
import { handle_decrypt, handle_encrypt } from "../helpers/encryption_decryption"


export const encrypt_deposit_data = async(req: Request, res: Response, next: NextFunction)=>{
    try {   

        const encrypt_data_string = await handle_encrypt(JSON.stringify(req.body))

        return res.status(200).json({msg:'Encrypted successfully', encrypt_data_string})

    } catch (error:any) {
        console.log("error during transaction initialization", error)
        return res.status(500).json({msg: 'Error during transaction initialization ',error: error})
    }
}

export const decrypt_deposit_data = async(req: CustomRequest, res: Response, next: NextFunction) => {
    const { encrypted_data } = req.body;
    try {   
        const decrypted_data:any = await handle_decrypt(encrypted_data);
        const parsed_decrypted_data:any = JSON.parse(decrypted_data)

        // first get user
        let patient_id = parsed_decrypted_data?.patient_id || null;
        let physician_id = parsed_decrypted_data?.physician_id || null;

        const user_account = await prisma.account.findFirst({
            where: { patient_id: patient_id, physician_id: physician_id, }
        })
                
        if (user_account == null || !user_account ) { return res.status(404).json({msg: 'User not found'}) }
        
        if (user_account) {
            if (parsed_decrypted_data.transaction_type.toLowerCase() === 'credit'){
                
                const update_account = await prisma.account.update({
                    where: { account_id: user_account.account_id },
                    data: { available_balance: {  increment: parsed_decrypted_data.amount/100,  } }
                });
                
            }else{
                return res.status(400).json({msg: 'Invalid deposit trnsaction type.'})
            }
            
        }
        
        // now add to transaction table
        const new_transaction = await prisma.transaction.create({
            data: {
                amount: parsed_decrypted_data.amount/100,
                transaction_type: parsed_decrypted_data.transaction_type.toLowerCase(),
                transaction_sub_type: "account_deposit",
                patient_id: patient_id || null,
                physician_id: physician_id || null,
                account_id: user_account.account_id,
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        // the notification sent to the patient
        const notification = await prisma.notification.create({
            data: {
                appointment_id: null,
                patient_id: new_transaction?.patient_id || null,
                physician_id: new_transaction?.physician_id || null, 
                notification_type: "Transaction",
                notification_sub_type: "account_deposit",
                notification_for_patient: true,
                transaction_id: new_transaction.transaction_id ,
                status: "completed",
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        if (notification){ patient_socket_messanger('notification', new_transaction, notification) }

        return res.status(200).json({ msg: 'Account updated successfully',  });

    } catch (error: any) {
        console.log("error during transaction initialization", error);
        return res.status(500).json({msg: 'Error during transaction initialization ', error: error });
    }
}

export const decrypt_withdrawal_data = async(req: CustomRequest, res: Response, next: NextFunction) => {

    const { encrypted_data } = req.body;
    try {

        const decrypted_data:any = await handle_decrypt(encrypted_data);

        const parsed_decrypted_data:any = JSON.parse(decrypted_data)

        // first get user
        let patient_id = parsed_decrypted_data?.patient_id || null
        let physician_id = parsed_decrypted_data?.physician_id || null

        const user_account = await prisma.account.findFirst({ where: { patient_id: patient_id, physician_id: physician_id, } })
        
        if (user_account == null) { return res.status(404).json({msg: 'User not found'}) }
        
        if (user_account) {
            if ( parsed_decrypted_data.transaction_type.toLowerCase() === 'debit' ){
                if ( (Number(user_account.available_balance) -  Number( parsed_decrypted_data.amount / 100 )) < 0 ){
                    return res.status(400).json({msg: 'You cannot withdraw an amount greater than you available balance'})
                }

                const update_account = await prisma.account.update({
                    where: {  account_id: user_account.account_id  },
                    data: {  available_balance: {  decrement: parsed_decrypted_data.amount/100,  }  }
                });
            }else{
                return res.status(400).json({msg: 'Invalid withdrawal transaction type. should be debit.'})
            }
            
        }
        
        // adding the transaction data
        const new_transaction = await prisma.transaction.create({
            data: {
                amount: parsed_decrypted_data.amount/100,
                transaction_type: parsed_decrypted_data.transaction_type.toLowerCase(),
                transaction_sub_type: "account_withdrawal",
                patient_id: patient_id,
                physician_id: physician_id,
                account_id: user_account.account_id,
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        // notification sent to the patient or physician
        const notification = await prisma.notification.create({
            data: {
                appointment_id: null,
                patient_id: new_transaction?.patient_id || null,
                physician_id: new_transaction?.physician_id || null,
                notification_type: "Transaction",
                notification_sub_type: "account_withdrawal",
                notification_for_patient: patient_id ? true: false ,
                notification_for_physician: physician_id ? true: false,
                transaction_id: new_transaction.transaction_id,
                status: "completed",
                case_note_id: null,
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        const user_id = new_transaction.patient_id ? new_transaction.patient_id : 
        (new_transaction.physician_id ?  new_transaction.physician_id : null)

        if (patient_id){ patient_socket_messanger('notification', new_transaction, notification)}

        if (physician_id){ physician_socket_messanger('notification', new_transaction, notification)}

        return res.status(200).json({ msg: 'Account updated successfully',  });

    } catch (error: any) {
        console.log("error during transaction initialization", error);
        return res.status(500).json({msg: 'Error during transaction initialization ', error: error });
    }
}

export const patient_account = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const user = req.account_holder.user
    try {
        const patient_id = user.patient_id || null
        const physician_id = user.physician_id || null

        // getting patient account
        const user_account = await prisma.account.findFirst({ 
            where: { patient_id, physician_id },
        })  

        if (!user_account){ return res.status(404).json({msg: ' User doesn\'t have an account '}) }

        return res.status(200).json({msg: `Patient Account `, patient_account:user_account})


    } catch (err:any) {
        console.log('Error getting user\'s account ',err)
        return res.status(500).json({msgor: 'Error getting user\'s account ',err})
    }
}

export const physician_account = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const user = req.account_holder.user
    try {
        const physician_id = user.physician_id || null

        // getting patient account
        const user_account = await prisma.account.findFirst({ where: { physician_id }, })  

        if (!user_account){ return res.status(404).json({msg: ' User doesn\'t have an account '}) }

        return res.status(200).json({msg: `Physician Account `, physician_account:user_account})


    } catch (err:any) {
        console.log('Error getting user\'s account ',err)
        return res.status(500).json({msgor: 'Error getting user\'s account ',err})
    }
}

export const user_account_transaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{

    const physician_id = req.account_holder.user.physician_id || null

    const patient_id = req.account_holder.user.patient_id || null

    try {

        const  user_transaction = await prisma.transaction.findMany({ 
            where: { patient_id, physician_id  },

            orderBy: { created_at: 'desc' },

        })

        return res.status(200).json({ msg:'Transactions', transactions:user_transaction })
            
    } catch (err:any) {
        console.log('Error getting user\'s transactions ',err)
        return res.status(500).json({msgor: 'Error getting user\'s transactions ',err})
    }
}

export const paginated_account_transaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{

    const physician_id = req.account_holder.user.physician_id || null

    const patient_id = req.account_holder.user.patient_id || null

    try {

        const {page_number} = req.params

        const  [number_of_transaction, user_transaction] = await Promise.all([
            prisma.transaction.count({ 
                where: {patient_id, physician_id}
            }),

            prisma.transaction.findMany({ 
                where: { patient_id, physician_id  },

                skip: (Math.abs(Number(page_number)) - 1) * 15,
                
                take: 15,
                
                orderBy: { created_at: 'desc' },

            })
        ]) 

        const number_of_pages = (number_of_transaction <= 15) ? 1 : Math.ceil(number_of_transaction/15)

        return res.status(200).json({ msg:'Transactions', data: {total_number_of_transactions: number_of_transaction, total_number_of_pages: number_of_pages, transactions: user_transaction} })
            
    } catch (err:any) {
        console.log('Error getting user\'s transactions ',err)
        return res.status(500).json({msgor: 'Error getting user\'s transactions ',err})
    }
}


export const filter_user_account_transaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{

    const user = req.account_holder.user
    const patient_id = req.account_holder.user.patient_id || null
    const physician_id = req.account_holder.user.physician_id || null

    try {
        const {transaction_type} = req.params
        if (!transaction_type || !['credit', 'debit'].includes(transaction_type)){
            return res.status(400).json({msg: "Transaction type should be one of ['debit', 'credit']"}) }

        const user_transaction = await prisma.transaction.findMany({
            where: { patient_id, physician_id , transaction_type },

            orderBy: { created_at: 'desc' },
            
        })
        
        return res.status(200).json({ msg:'Transactions', transactions:user_transaction })
        
    } catch (err:any) {
        console.log('Error occured while fectching filtered users transaction ',err)
        return res.status(500).json({msgor: 'Error occured while fectching filtered users transaction. ',err})
    }
}

export const paginated_filter_user_transaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{

    const user = req.account_holder.user
    const patient_id = req.account_holder.user.patient_id || null
    const physician_id = req.account_holder.user.physician_id || null

    try {
        const {transaction_type, page_number} = req.params

        if (!transaction_type || !['credit', 'debit'].includes(transaction_type)){
            return res.status(400).json({msg: "Transaction type should be one of ['debit', 'credit']"}) }

        const [number_of_transactions,  user_transaction] = await Promise.all([

            prisma.transaction.count({ 
                where: {patient_id, physician_id, transaction_type}
            }),

            prisma.transaction.findMany({

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,
                    
                where: { patient_id, physician_id , transaction_type },

                orderBy: { created_at: 'desc' },
            
            })
        ]) 
        
        const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions/15)
            
        return res.status(200).json({ msg:'Transactions', data: {total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: user_transaction} })
        
    } catch (err:any) {
        console.log('Error occured while fectching filtered users transaction ',err)
        return res.status(500).json({msgor: 'Error occured while fectching filtered users transaction. ',err})
    }
}