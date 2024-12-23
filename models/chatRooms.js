const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    chat_room_name: {
        type: String,
        required: true
    },
    is_group_chat_room: {
        type: Boolean,
        required: false
    },
    chat_room_members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    group_admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    latest_message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'messages'
    },
    chat_room_picture: {
        type: String
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
});

module.exports = mongoose.model('chatrooms', ChatSchema);