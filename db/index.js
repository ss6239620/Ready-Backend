const mongoose = require('mongoose');

const connectToMongo = () => {
    mongoose.connect("mongodb://0.0.0.0:27017/Ready").then(() => {
        console.log("Database Connected Successfully");
    }).catch((err) => {
        console.log("Database Connection Failed, Error is:", err);
    })
}


module.exports = connectToMongo