const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    message: {
        type: String
    },
    chat_room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chatrooms',
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    read_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    reply_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'messages'
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

module.exports = mongoose.model('messages', MessageSchema)
