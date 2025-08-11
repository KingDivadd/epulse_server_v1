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
        let user_account;
        const decrypted_data:any = await handle_decrypt(encrypted_data);

        console.log('encrypted data ', encrypted_data, '\ndecrypted data ', decrypted_data)
        const parsed_decrypted_data:any = JSON.parse(decrypted_data)
        console.log('parsed data ', parsed_decrypted_data);
        

        // first get user
        let patient_id = parsed_decrypted_data?.patient_id ;
        let physician_id = parsed_decrypted_data?.physician_id ;

        const [patient_account, physician_account] = await Promise.all([
            
            prisma.account.findFirst({where: { patient_id }}),
            prisma.account.findFirst({where: {physician_id }})

        ])

        user_account = patient_account || physician_account

        if (!user_account) {
            if (patient_id) {
                user_account = await prisma.account.create({
                    data:{
                        available_balance: 0,
                        patient_id,
                        created_at: converted_datetime(),
                        updated_at: converted_datetime(),
                    }
                })
            }else{
                user_account = await prisma.account.create({
                    data:{
                        available_balance: 0,
                        physician_id,
                        created_at: converted_datetime(),
                        updated_at: converted_datetime(),
                    }
                })
            }
        }
        
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
                narration: "Wallet top-up via bank transfer",
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
        return res.status(500).json({msg: 'Error during transaction initialization. ', error: error });
    }
}

export const decrypt_withdrawal_data = async(req: CustomRequest, res: Response, next: NextFunction) => {

    const { encrypted_data } = req.body;

    try {

        let user_account;

        const decrypted_data:any = await handle_decrypt(encrypted_data);

        const parsed_decrypted_data:any = JSON.parse(decrypted_data)

        let patient_id = parsed_decrypted_data?.patient_id ;
        let physician_id = parsed_decrypted_data?.physician_id ;

        const [patient_account, physician_account] = await Promise.all([
            
            prisma.account.findFirst({where: {patient_id: patient_id }}),

            prisma.account.findFirst({where: {physician_id:physician_id }})

        ])

        console.log(parsed_decrypted_data, '\n', physician_id, '\npatient account ', patient_account, '\nPysician account : ', physician_account)

        user_account = patient_account || physician_account

        if (!user_account) {
            if (patient_id) {
                user_account = await prisma.account.create({
                    data:{
                        available_balance: 0,
                        patient_id,
                        created_at: converted_datetime(),
                        updated_at: converted_datetime(),
                    }
                })
            }else{
                user_account = await prisma.account.create({
                    data:{
                        available_balance: 0,
                        physician_id,
                        created_at: converted_datetime(),
                        updated_at: converted_datetime(),
                    }
                })
            }
        }

                
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
                narration: "Funds withdrawal via transfer",
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

// patient wallet information
// patient wallet information

// 1. total wallet balance 2. total amount credit 3. total amount debited 4. paginated transaction history 

export const user_wallet_information = async(req: CustomRequest, res: Response, next: NextFunction)=>{

    const physician_id = req.account_holder.user.physician_id || null 

    const patient_id = req.account_holder.user.patient_id || null 

    try {

        const {page_number, items_per_page} = req.params

        const items_in_page:number = Number(items_per_page) || 5

        const  [wallet_balance, credit_transaction, debit_transaction, number_of_transaction, user_transaction] = await Promise.all([

            prisma.account.findFirst({
                where: {patient_id, physician_id},
                select:{
                    available_balance:true
                }
            }),

            prisma.transaction.findMany({
                where:{patient_id,physician_id, transaction_type: 'credit'},
                select:{
                    amount: true, transaction_type:true,
                }
            }),

            prisma.transaction.findMany({
                where:{patient_id,physician_id, transaction_type: 'debit'},
                select:{
                    amount: true, transaction_type:true,
                }
            }),

            prisma.transaction.count({ 
                where: {patient_id, physician_id}
            }),

            prisma.transaction.findMany({ 
                where: { patient_id, physician_id  },

                skip: (Math.abs(Number(page_number)) - 1) * items_in_page,
                
                take: items_in_page,
                
                orderBy: { created_at: 'desc' },

            })
        ]) 

        const total_amount_credited:number = credit_transaction.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

        const total_amount_debited:number = debit_transaction.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

        const number_of_pages = (number_of_transaction <= items_in_page) ? 1 : Math.ceil(number_of_transaction/items_in_page)

        return res.status(200).json({ 
            msg:'Wallet Information', 
            data: {
                wallet_balance: wallet_balance?.available_balance, total_amount_credited, total_amount_debited,
                total_number_of_transactions: number_of_transaction, total_number_of_pages: number_of_pages, transactions: user_transaction
            } 
        })
            
    } catch (err:any) {
        console.log('Error getting user\'s transactions.',err)
        return res.status(500).json({msgor: 'Error getting user\'s transactions ',err})
    }
}




// --------------------------------------

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