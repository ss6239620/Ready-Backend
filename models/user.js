const mongoose = require('mongoose');
const { ROLES } = require('../constant');

const userScheme = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    identity: {
        type: String,
    },
    interests: {
        type: [String],  // Array of strings
        default: [],
    },
    profile_avtar: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
    joined_tribes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',  // The model being referenced
    }],
    role: {
        type: String,
        default: ROLES.Member,
        enum: [ROLES.Admin, ROLES.Member]
    },
    cookieExpire: { type: Date }, 
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
})

module.exports = mongoose.model('users', userScheme)