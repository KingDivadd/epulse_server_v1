import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'


export const signup_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            other_names: Joi.string().trim().allow('').optional(),
            email: Joi.string().trim().email().required(),
            password: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in signup validation function ',err)
        return res.status(422).json({msg: 'Error occured in signup validation funtion ', error: err})
        
    }
}

export const login_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            device_type: Joi.string().trim().valid('web', 'mobile').required(),
            email: Joi.string().trim().email().required(),
            password: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in signup validation function ',err)
        return res.status(422).json({msg: 'Error occured in signup validation funtion ', error: err})
    }
}

export const generate_otp_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            email: Joi.string().trim().email().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in otp validation function ',err)
        return res.status(422).json({msg: 'Error occured in otp validation funtion ', error: err})
        
    }
}

export const verify_otp_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            email: Joi.string().trim().email().required(),
            otp: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in otp validation function ',err)
        return res.status(422).json({msg: 'Error occured in otp validation funtion ', error: err})
        
    }
}

export const reset_password_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            new_password: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in password reset validation function ',err)
        return res.status(422).json({msg: 'Error occured in password reset validation funtion ', error: err})
        
    }
}

export const patient_organization_profile_setup_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            organization_name: Joi.string().trim().required(),
            organization_type: Joi.string().trim().allow('').optional(),
            position_held: Joi.string().trim().required(),
            organization_size: Joi.number().required(),
            company_website_link: Joi.string().trim().allow("").optional(),
            phone_number: Joi.string().trim().required(),
            address: Joi.string().trim().required(),
            country: Joi.string().trim().allow('').optional(),
            country_code: Joi.string().trim().required(),
            cac_document: Joi.string().trim().required(),
            registration_document: Joi.string().trim().required(),
            referral_code: Joi.string().trim().allow('').optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in password reset validation function ',err)
        return res.status(422).json({msg: 'Error occured in password reset validation funtion ', error: err})
        
    }
}

export const patient_profile_setup_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            genotype: Joi.string().trim().allow('').optional(),
            date_of_birth: Joi.number().allow(0).optional(),
            phone_number: Joi.string().trim().allow('').optional(),
            country_code: Joi.string().trim().allow('').optional(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in password reset validation function ',err)
        return res.status(422).json({msg: 'Error occured in password reset validation funtion ', error: err})
        
    }
}

export const physician_profile_setup_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            registered_as: Joi.string().trim().required(),
            specialty: Joi.string().trim().required(),
            
            gender: Joi.string().allow('').trim().valid('male', 'female').required(),
            date_of_birth: Joi.number().allow(0).optional(),
            country_code: Joi.string().trim().required(),
            phone_number: Joi.string().trim().required(),
            
            address: Joi.string().trim().required(),
            state: Joi.string().trim().required(),
            country: Joi.string().trim().required(),
            
            signature: Joi.string().trim().allow('').optional(),

            avatar: Joi.string().trim().allow('').optional(),
            medical_license: Joi.string().trim().allow('').optional(),
            cac_document: Joi.string().trim().allow('').optional(),
            professional_credentials: Joi.string().trim().allow('').optional(),
            verification_of_employment: Joi.string().trim().allow('').optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in password reset validation function ',err)
        return res.status(422).json({msg: 'Error occured in password reset validation funtion ', error: err})
        
    }
}

export const patient_data_edit_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({

            first_name: Joi.string().trim().required(),
            last_name: Joi.string().trim().required(),
            country: Joi.string().trim().allow('').optional(),
            country_code: Joi.string().trim().allow('').optional(),
            phone_number: Joi.string().trim().allow('').optional(),
            gender: Joi.string().trim().allow('').valid('male', 'female').required(),
            date_of_birth: Joi.number().allow(0).optional(),
            blood_group: Joi.string().trim().allow('').optional(),
            genotype: Joi.string().trim().allow('').optional(),
            height: Joi.number().allow(0).optional(),
            weight: Joi.number().allow(0).optional(),
            avatar: Joi.string().trim().allow('').optional()

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in patient data update validation function ',err)
        return res.status(422).json({msg: 'Error occured in patient data update validation funtion ', error: err})
        
    }
}

export const physician_data_edit_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            avatar: Joi.string().trim().allow('').optional(),
            first_name: Joi.string().trim().allow('').optional(),
            last_name: Joi.string().trim().allow('').optional(),
            country_code: Joi.string().trim().allow('').optional(),
            phone_number: Joi.string().trim().allow('').optional(),

            date_of_birth: Joi.number().allow(0).optional(),
            gender: Joi.string().allow('').trim().valid("male", "female").optional(),
            country: Joi.string().trim().allow('').optional(),
            state: Joi.string().trim().allow('').optional(),
            address: Joi.string().trim().allow('').optional(),
            languages_spoken: Joi.array().items(Joi.string()).optional(),
            bio: Joi.string().trim().allow('').optional(),

            registered_as: Joi.string().trim().allow('').optional(),
            specialty: Joi.string().trim().allow('').optional(),
            medical_license: Joi.string().trim().allow('').optional(),

            signature: Joi.string().trim().allow('').optional(),
            professional_credentials: Joi.string().trim().allow('').optional(),
            verification_of_employment: Joi.string().trim().allow('').optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in physician data update validation function ',err)
        return res.status(422).json({msg: 'Error occured in physician data update validation funtion ', error: err})
        
    }
}

export const filter_physician_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            specialty: Joi.string().trim().allow('').optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in filter physician validation function ',err)
        return res.status(422).json({msg: 'Error occured in filter physician validation funtion ', error: err})
        
    }
}

export const book_appointment_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            physician_id: Joi.string().trim().required(), 
            mode_of_consult: Joi.string().valid('virtual', 'physical').required(),
            appointment_type: Joi.when('mode_of_consult', {
                is: 'virtual',
                then: Joi.string().valid('chat', 'video_call').required(),
                otherwise: Joi.forbidden()
            }),
            complain: Joi.string().trim().required(),
            time: Joi.number().required(),

            url: Joi.string().trim().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in appointment booking validation function ',err)
        return res.status(422).json({msg: 'Error occured in appointment booking validation funtion ', error: err})
        
    }
}

export const accept_appointment_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            appointment_id: Joi.string().trim().required(),
            status: Joi.string().trim().valid('accepted').required(), 

            url: Joi.string().trim().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in during appointment accepting validation function ',err)
        return res.status(422).json({msg: 'Error occured in during appointment accepting validation funtion ', error: err})
        
    }
}

export const cancel_appointment_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            appointment_id: Joi.string().trim().required(),
            status: Joi.string().trim().valid('cancelled').required(), 

            url: Joi.string().trim().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in during appointment cancelling validation function ',err)
        return res.status(422).json({msg: 'Error occured in during appointment cancelling validation funtion ', error: err})
        
    }
}

export const complete_appointment_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            appointment_id: Joi.string().trim().required(),
            status: Joi.string().trim().valid('completed').required(), 

            url: Joi.string().trim().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in during appointment completion validation function ',err)
        return res.status(422).json({msg: 'Error occured in during appointment completion validation funtion ', error: err})
        
    }
}

export const create_case_note_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            appointment_id: Joi.string().trim().required(),
            patient_id: Joi.string().trim().required(),

            assessment_or_diagnosis: Joi.string().trim().allow(''),
            current_medication: Joi.string().trim().allow(''),
            examination_findings: Joi.string().trim().allow(''),
            family_history: Joi.string().trim().allow(''),
            history_of_presenting_complains: Joi.string().trim().allow(''),
            past_medical_history: Joi.string().trim().allow(''),
            past_medication: Joi.string().trim().allow(''),
            plan: Joi.string().trim().allow(''),
            presenting_complaint: Joi.string().trim().allow(''),
            review_of_system: Joi.string().trim().allow(''),
            social_history: Joi.string().trim().allow(''),

            test: Joi.string().trim().allow(''),

            // For doctor's report
            patient_history: Joi.string().trim().allow(''),
            assessment: Joi.string().trim().allow(''),
            treatment_plan: Joi.string().trim().allow(''),

            laboratory_tests: Joi.array().items(Joi.object({
                test_name: Joi.string().trim().allow(''),
                details: Joi.string().trim().allow('')
            })).default([]),

            prescriptions: Joi.array().items(Joi.object({
                medication: Joi.string().trim().allow(''),
                dosage: Joi.string().trim().allow(''),
                frequency: Joi.string().trim().allow('')
            })).default([]),

            note: Joi.string().trim().allow(''),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in during case note data validation ',err)
        return res.status(422).json({msg: 'Error occured in during case note data validation', error: err})
        
    }
}

export const update_case_note_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            assessment_or_diagnosis: Joi.string().trim().allow(''),
            current_medication: Joi.string().trim().allow(''),
            examination_findings: Joi.string().trim().allow(''),
            family_history: Joi.string().trim().allow(''),
            history_of_presenting_complains: Joi.string().trim().allow(''),
            past_medical_history: Joi.string().trim().allow(''),
            past_medication: Joi.string().trim().allow(''),
            plan: Joi.string().trim().allow(''),
            presenting_complaint: Joi.string().trim().allow(''),
            review_of_system: Joi.string().trim().allow(''),
            social_history: Joi.string().trim().allow(''),

            test: Joi.string().trim().allow(''),

            // For doctor's report
            patient_history: Joi.string().trim().allow(''),
            assessment: Joi.string().trim().allow(''),
            treatment_plan: Joi.string().trim().allow(''),

            laboratory_tests: Joi.array().items(Joi.object({
                test_name: Joi.string().trim().allow(''),
                details: Joi.string().trim().allow('')
            })).default([]),

            prescriptions: Joi.array().items(Joi.object({
                medication: Joi.string().trim().allow(''),
                dosage: Joi.string().trim().allow(''),
                frequency: Joi.string().trim().allow('')
            })).default([]),

            note: Joi.string().trim().allow(''),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured while updating case note data validation ',err)
        return res.status(422).json({msg: 'Error occured while updating case note data validation ', error: err})
        
    }
}

export const encrypted_data_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            encrypted_data: Joi.string().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured while validating encrypted data ',err)
        return res.status(422).json({msg: 'Error occured while validating encrypted data ', error: err})
        
    }
}

export const physician_consultation_validation = async (data:any)=>{
    try {
        const schema = Joi.object({
            physician_id: Joi.string().trim().required(),
            is_verified_by_admin: Joi.boolean().required()
        })

        const { error: validation_error } = schema.validate(data)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return {statusCode:400, err: error_message }
        }
        return {statusCode: 200, msg: 'Verified successfully'}
    } catch (err:any) {
        console.log('Error occured while validating physician consultation verification data ',err)
        return { statusCode: 422, err: 'Error occured while validating physician consultation verification data ', error: err}
        
    }
}

export const add_rating_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            number_of_stars: Joi.number().max(5).min(0).required(),
            appointment_id: Joi.string().trim().allow('').optional(),
            improvable_service: Joi.string().trim().allow('').optional(),
            other_service: Joi.string().trim().allow('').optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured while validating rating validation data  ',err)
        return res.status(422).json({msg: 'Error occured while validating rating validation data  ', error: err})
        
    }
}

export const patient_account_deposit_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            encrypted_data: Joi.string().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured while validating deposit encryption data ',err)
        return res.status(422).json({msg: 'Error occured while validating deposit encryption data ', error: err})
        
    }
}

export const save_apn_token_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            apn_token: Joi.string().trim().allow('').optional(),
            voip_token: Joi.string().trim().allow('').optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }

        return next()

    } catch (err:any) {
        console.log('Error occured while validating apple device token ',err)
        return res.status(422).json({msg: 'Error occured while validating apple device token ', error: err})
    }
}

export const register_ambulance_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            available_ambulance: Joi.number().required(),
            hours_of_operation: Joi.string().trim().required(),
            licencing_information: Joi.string().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }

        return next()

    } catch (err:any) {
        console.log('Error occured while register ambulance data',err)
        return res.status(422).json({msg: 'Error occured while register ambulance data', error: err})
    }
}

export const book_ambulance_appointment_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            ambulance_id: Joi.string().trim().required(),
            nature_of_emmergency: Joi.string().trim().required(),
            emergency_severity: Joi.string().trim().required(),
            other_attention_needed: Joi.string().trim().allow('').optional(),
            urgent_need: Joi.string().trim().required(),
            current_location: Joi.string().trim().required(),
            time: Joi.number().optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }

        return next()

    } catch (err:any) {
        console.log('Error occured while validating book ambulance appointment data',err)
        return res.status(422).json({msg: 'Error occured while validating book ambulance appointment data', error: err})
    }
}

export const save_subscription_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            subscription: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }

        return next()

    } catch (err:any) {
        console.log('Error occured while validating save subscription ',err)
        return res.status(422).json({msg: 'Error occured while validating save subscription ', error: err})
    }
}

export const end_meeting_session_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            roomId: Joi.string().trim().required(),
            sessionId: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in end meeting session validation',err)
        return res.status(422).json({msg: 'Error occured in end meeting session validation', error: err})
        
    }
}

export const remove_participant_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            participantId: Joi.string().trim().required(),
            roomId: Joi.string().trim().required(),
            sessionId: Joi.string().trim().required()
        })
        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err) {
        console.log(err)
        return res.status(422).json({msg: 'Error durring participant removal fields validation.' })
    }
}

export const filter_notification_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            status: Joi.string().trim().valid('pending', 'completed', 'cancelled', 'accepted', 'in_progress').required(), 
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(422).json({msg: error_message });
        }
        return next()
    } catch (err:any) {
        console.log('Error occured in filter notification validation function  ',err)
        return res.status(422).json({msg: 'Error in filter notification validation function ', error: err})   
    }
}

export const chat_validation = async ( data:any) => {
    try {
        const schema = Joi.object({
            idempotency_key: Joi.string().trim().required(),
            appointment_id: Joi.string().trim().required(),
            physician_id: Joi.string().trim().required(),
            patient_id: Joi.string().trim().required(),
            is_physician: Joi.boolean().required(),
            is_patient: Joi.boolean().required(),
            text: Joi.string().allow('').optional(),
            token: Joi.string().required(),
            media: Joi.array()
        })
        
        const value = await schema.validateAsync({...data});

        return ({ status: true, data: value, message: 'validated succesfully', statusCode: 401,  });
        } catch (error:any) {
            console.log(error)
            return ({ status: false, statusCode: 422, message: error.details[0].message, error: error.details[0].message, });
    }
}

export const notification_validation = async ( data:any) => {
    try {
        const schema = Joi.object({
            notification_id: Joi.string().required(),
            is_read: Joi.boolean().required(),

        })
        
        const value = await schema.validateAsync({...data});

        return ({ status: true, data: value, message: 'validated succesfully', statusCode: 401,  });
        } catch (error:any) {
            console.log(error)
            return ({ status: false, statusCode: 422, message: error.details[0].message, error: error.details[0].message, });
    }
}

export const video_validation = async (data:any) => {
    try {
        const schema = Joi.object({
            appointment_id: Joi.string().trim().required(),
            meeting_id: Joi.string().trim().required(),
            caller_id: Joi.string().trim().required(),
            receiver_id: Joi.string().trim().required(),
            token: Joi.string().trim().required(),
        })
        const { error: validation_error } = schema.validate(data)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return ({ statusCode: 422, error: error_message, message: error_message });
        }
        return ({statusCode: 200, messge: 'Validated successfully', caller_id: data.caller_id, receiver_id: data.receiver_id, meeting_id: data.meeting_id })
        
    } catch (error: any) {
        console.log(error);
        return {
            status: false,
            statusCode: 422,
            message: error.details ? error.details[0].message : error.message,
            error: error.details ? error.details[0].message : error.message,
        };
    }
};