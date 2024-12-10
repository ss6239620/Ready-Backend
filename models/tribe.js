const mongoose = require('mongoose');

const tribeSchema = new mongoose.Schema({
    tribeName: {
        type: String,
        required: true
    },
    tribeDescription: {
        type: String,
        required: true
    },
    tribeBannerImage: {
        type: String,
        required: true,
    },
    tribeProfileImage: {
        type: String,
        required: true,
    },
    topics: {
        type: [String],  // Array of strings
        default: [],
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    current_moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',  // The model being referenced
    }],
    past_moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',  // The model being referenced
    }],
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
})

module.exports = mongoose.model('tribes', tribeSchema)
