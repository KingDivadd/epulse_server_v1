import express from 'express'


import {completed_appointment, incomming_appointment, ongoing_appointment} from '../controllers/onotify'

import {all_notifications, delete_notification, filter_notification} from '../controllers/notification_controller'

import {decrypt_deposit_data, decrypt_withdrawal_data, 
        encrypt_deposit_data, filter_user_account_transaction, 
        paginated_account_transaction, 
        paginated_filter_user_transaction, 
        patient_account, 
        physician_account, 
        user_account_transaction, 
        user_wallet_information} from '../controllers/user_account_controller'

import {all_case_note, create_case_note, edit_case_note} from '../controllers/case_note_controller'

import {clear_chat, get_appointment_chats, } from '../controllers/chat_controller'

import {save_subscription, push_notification, save_apn_token} from '../controllers/push_notification'

import {accept_appointment, add_user_rating, all_appointments, 
        all_patient_appointments, 
        all_user_rating, 
        appointment_available_for_consultation, 
        appointment_tracker_all_appointment, 
        book_appointment, cancel_appointment, complete_appointment, 
        consultation, 
        del_consultation_data, 
        delete_appointment, filter_appointment,
        selected_user_rating,
        user_ratings} from '../controllers/appointment'

import {all_general_doctors, all_physicians, all_physicians_2, filter_physicians, patient_dashboard, physician_dashboard, verify_physician_id} from '../controllers/users_controller'

import {patient_signup, physician_signup, 
        user_login, physician_login, 
        generate_user_otp, verify_physician_otp, 
        verify_user_otp, reset_patient_password, 
        reset_physician_password, patient_signup_profile_setup,
        physician_signup_profile_setup, logged_in_patient, fetch_user_data_from_key,
        logged_in_physician, edit_patient_data, edit_physician_data,
        admin_verify_physician, } from '../controllers/authentication'

import {test_basic_connection, test_db_connection} from '../controllers/test_connection'

import {accept_appointment_validation, add_rating_validation, book_ambulance_appointment_validation, book_appointment_validation, 
        cancel_appointment_validation, complete_appointment_validation, 
        create_case_note_validation, encrypted_data_validation, end_meeting_session_validation, 
        filter_notification_validation, filter_physician_validation, 
        generate_otp_validation, login_validation, patient_account_deposit_validation, 
        patient_data_edit_validation, patient_organization_profile_setup_validation, 
        patient_profile_setup_validation, physician_data_edit_validation, 
        physician_profile_setup_validation, register_ambulance_validation, remove_participant_validation, 
        reset_password_validation, save_apn_token_validation, save_subscription_validation, 
        signup_validation, update_case_note_validation, verify_otp_validation} from '../validations/index'

import {email_exist, is_registered_user, is_registered_physician, verify_auth_id, verify_otp_status} from '../helpers/auth_helper'

import {create_meeting, de_activate_meeting, end_meeting_session, fetch_active_participant, fetch_participant, generate_token, get_session_details, list_meeting, list_meeting_session, list_selected_meeting, remove_participant, validate_meeting } from '../controllers/video_chat_controller'
import { accept_ambulance_appointment, all_ambulance, all_ambulance_appointment, all_paginated_ambulance, book_ambulance_appointment, filter_ambulance_appointment, register_ambulance, update_ambulance_data } from '../controllers/ambulance'


const router = express.Router()



// Patient

router.route('/patient-signup').post(signup_validation, email_exist, patient_signup )

router.route('/signup-update-patient-data').patch(patient_profile_setup_validation, verify_auth_id, patient_signup_profile_setup)

router.route('/edit-patient-data').patch(patient_data_edit_validation, verify_auth_id, edit_patient_data)

router.route('/patient-dashboard/:page_num/:limit/:page_num_1/:limit_1').get(verify_auth_id, patient_dashboard )


// Physician

router.route('/physician-signup').post(signup_validation, email_exist, physician_signup )

router.route('/all-physicians/:page_number/:limit').get(verify_auth_id, all_physicians_2)

router.route('/edit-physician-data').patch(physician_data_edit_validation, verify_auth_id, edit_physician_data)

router.route('/physician-dashboard/:page_num/:limit').get(verify_auth_id, physician_dashboard )

router.route('/verify-physician-id/:id').get(verify_auth_id, verify_physician_id )

// General

router.route('/user-login').post(login_validation, user_login )

router.route('/generate-user-otp').post(generate_otp_validation, is_registered_user, generate_user_otp)

router.route('/verify-user-otp').patch(verify_otp_validation, verify_otp_status, verify_user_otp)

router.route('/reset-user-password').patch(reset_password_validation, verify_auth_id, reset_patient_password)

router.route('/user-information').get(verify_auth_id, fetch_user_data_from_key)

router.route('/user-wallet-information/:page_number/:items_per_page').get(verify_auth_id, user_wallet_information)



// --------------------------------------------------


router.route('/signup-update-organiation-patient-data').patch(patient_organization_profile_setup_validation, verify_auth_id, patient_signup_profile_setup)

router.route('/logged-in-patient').post(verify_auth_id, logged_in_patient)






// Physician


router.route('/physician-login').post(login_validation, physician_login )

router.route('/generate-physician-otp').post(generate_otp_validation, is_registered_physician, generate_user_otp)

router.route('/verify-physician-otp').patch(verify_otp_validation, verify_otp_status, verify_physician_otp)

router.route('/physician-consultation-verification').patch(encrypted_data_validation, admin_verify_physician)

router.route('/reset-physician-password').patch(reset_password_validation, verify_auth_id, reset_physician_password)

router.route('/signup-update-physician-data').patch(physician_profile_setup_validation, verify_auth_id, physician_signup_profile_setup, generate_user_otp)

router.route('/logged-in-physician').post(verify_auth_id, logged_in_physician)

router.route('/all-physicians/:page_number').get(verify_auth_id, all_physicians)

router.route('/filter-physician/:page_number').post(filter_physician_validation, verify_auth_id, filter_physicians)

router.route('/general-doctors/:page_number').get(verify_auth_id, all_general_doctors)

router.route('/')


// Patient and Physician Account and Transaction

router.route('/encrypt-data').post(encrypt_deposit_data)

router.route('/decrypt-deposit-transaction-data').post(patient_account_deposit_validation, decrypt_deposit_data)

router.route('/decrypt-withdrawal-transaction-data').post(patient_account_deposit_validation, decrypt_withdrawal_data)

router.route('/patient-account').get(verify_auth_id, patient_account)

router.route('/physician-account').get(verify_auth_id, physician_account)

// Patient transaction

router.route('/patient-transaction').get(verify_auth_id, user_account_transaction)

router.route('/paginated-patient-transaction/:page_number').get(verify_auth_id, paginated_account_transaction)

router.route('/patient-transaction/:transaction_type').get(verify_auth_id, filter_user_account_transaction)

router.route('/paginated-filter-patient-transaction/:transaction_type/:page_number').get(verify_auth_id, paginated_filter_user_transaction)

// physician transaction

router.route('/physician-transaction').get(verify_auth_id, user_account_transaction )

router.route('/paginated-physician-transaction/:page_number').get(verify_auth_id, paginated_account_transaction )

router.route('/physician-transaction/:transaction_type').get(verify_auth_id, filter_user_account_transaction)

router.route('/paginated-filter-physician-transaction/:transaction_type/:page_number').get(verify_auth_id, paginated_filter_user_transaction)


// Appointment

router.route('/appointment-available-for-consultation').get(verify_auth_id, appointment_available_for_consultation)

router.route('/create-appointment').post(verify_auth_id, book_appointment_validation, book_appointment, push_notification )

router.route('/accept-appointment').patch(verify_auth_id, accept_appointment_validation, accept_appointment, push_notification)

router.route('/cancel-appointment').patch(verify_auth_id, cancel_appointment_validation, cancel_appointment, push_notification)

router.route('/complete-appointment').patch(verify_auth_id, complete_appointment_validation, complete_appointment, push_notification)

router.route('/filter-appointment/:status/:page_number').get(verify_auth_id, filter_appointment)

router.route('/get-appointment/:page_number/:limit').get(verify_auth_id, all_appointments)

router.route('/delete-appointment/:appointment_id').delete(verify_auth_id, delete_appointment, clear_chat)

router.route('/all-appointments').get(appointment_tracker_all_appointment)

router.route('/all-patient-appointments').get(verify_auth_id, all_patient_appointments)


// Onotify

router.route('/incoming-appointment').get(verify_auth_id, incomming_appointment)

router.route('/ongoing-appointment').get(verify_auth_id, ongoing_appointment)

router.route('/completed-appointment').get(verify_auth_id, completed_appointment)

router.route('/add-rating').post(verify_auth_id, add_rating_validation, add_user_rating)

router.route('/patient-ratings').get(verify_auth_id, user_ratings)

router.route('/physician-ratings').get(verify_auth_id, user_ratings)

router.route('/selected-patient-rating/:user_id').get(verify_auth_id, selected_user_rating)

router.route('/selected-physician-rating/:user_id').get(verify_auth_id, selected_user_rating)

router.route('/all-user-rating').get(verify_auth_id, all_user_rating)

// Chat

router.route('/get-chats/:patient_id/:physician_id').get(verify_auth_id, get_appointment_chats)

router.route('/clear-chat/:appointment_id').delete(clear_chat)


// Case Note

router.route('/all-case-note/:patient_id').get(verify_auth_id, all_case_note)

router.route('/add-case-note').post(verify_auth_id, create_case_note_validation, create_case_note)

router.route('/update-case-note/:case_note_id').patch(verify_auth_id, update_case_note_validation, edit_case_note)


// Push Notification 

router.route('/save-apn-token').post(verify_auth_id, save_apn_token_validation, save_apn_token)

router.route('/save-subscription').post(verify_auth_id, save_subscription_validation,  save_subscription)


// Video SDK routes 

// router.route('/webhook').post(verifySignature, send_webhook )

// router.route('/webhook/participant-joined').post(verifySignature, userJoinedWebHook)

// router.route('/webhook/participant-left').post(verifySignature, userLeftWebHook)

// router.route('/webhook/session-started').post(verifySignature, sessionStartedWebHook)

// router.route('/webhook/session-ended').post(verifySignature, sessionEndedWebHook)


router.route('/generate-token').post(verify_auth_id, generate_token )

router.route('/create-meeting').post(verify_auth_id, create_meeting)

router.route('/validate-meeting/:meetingId').get( verify_auth_id, validate_meeting)

router.route('/list-meeting/:page_number').get(verify_auth_id, list_meeting )

router.route('/get-meeting-details/:roomId').get(verify_auth_id, list_selected_meeting )

router.route('/deactivate-meeting/:roomId').post(verify_auth_id, de_activate_meeting )

router.route('/list-meeting-sessions/:roomId/:page_number').get(verify_auth_id, list_meeting_session )

router.route('/get-session-details/:sessionId').get(verify_auth_id, get_session_details )

router.route('/fetch-participants/:sessionId').get(verify_auth_id, fetch_participant )

router.route('/fetch-active-participants/:sessionId').get(verify_auth_id, fetch_active_participant )

router.route('/end-meeting-session').post(verify_auth_id, end_meeting_session_validation, end_meeting_session )

router.route('/remove-participant').post(verify_auth_id, remove_participant_validation, remove_participant )

// Notification 

router.route('/all-notifications').get(verify_auth_id, all_notifications)

router.route('/filter-notifications').post(verify_auth_id, filter_notification_validation, filter_notification)

router.route('/delete-notification/:notification_id').delete(verify_auth_id, delete_notification)

// Ambulance

router.route('/register-ambulance').post(verify_auth_id, register_ambulance_validation, register_ambulance)

router.route('/update-ambulance-data/:ambulance_id').patch(verify_auth_id, register_ambulance_validation, update_ambulance_data)

router.route('/all-ambulance').get(verify_auth_id, all_ambulance)

router.route('/all-paginated-ambulance/:page_number').get(verify_auth_id, all_paginated_ambulance)

router.route('/book-ambulance-appointment').post(verify_auth_id, book_ambulance_appointment_validation, book_ambulance_appointment, push_notification)

router.route('/accept-ambulance-appoitnment/:appointment_id').patch(verify_auth_id, accept_ambulance_appointment, push_notification )

router.route('/all-ambulance-appointment/:page_number').get(verify_auth_id, all_ambulance_appointment)

router.route('/filter-ambulance-appointment/:status/:page_number').get(verify_auth_id, filter_ambulance_appointment)

// testing server and db connection

router.route('/allow-pass-change').patch()

router.route('/test-basic-connection').get(test_basic_connection)

router.route('/test-db-connection').get(test_db_connection)

router.route('/test-consultation-data-update').get(verify_auth_id, consultation)

router.route('/del-consultation-data').get(verify_auth_id, del_consultation_data)


export default router