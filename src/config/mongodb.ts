import { mongo_uri } from "../helpers/constants"
import dotenv from 'dotenv';
const mongoose = require('mongoose')

const connect_to_mongo_db = async() => {
    try {
        await mongoose.connect(mongo_uri, {})
        console.log(`MongoDB connected successfully`.yellow.bold)
    } catch (err) {
        console.log(err)
    }
}

export default connect_to_mongo_db