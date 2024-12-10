const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

let mongo_uri

if (process.env.NODE_ENV === 'development') {
    mongo_uri = process.env.MONGO_DB_DEVLOPMENT_DATABASE
} else {
    mongo_uri = process.env.MONGO_DB_PRODUCTION_DATABASE
}

const connectToMongo = () => {
    mongoose.connect(mongo_uri).then(() => {
        console.log("Database Connected Successfully");
    }).catch((err) => {
        console.log("Database Connection Failed, Error is:", err);
    })
}


module.exports = connectToMongo