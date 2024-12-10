const mongoose = require('mongoose');
const { CONTENT_TYPE } = require('../constant');

const postSchema = new mongoose.Schema({
    content_title: {
        type: String
    },
    total_vote:{
        type:Number,
        default:0
    },
    up_vote_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',  // The model being referenced
    }],
    down_vote_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',  // The model being referenced
    }],
    content_path: {
        type: String
    },
    content_body: {
        type: String
    },
    content_link: {
        typr: String
    },
    content_type: {
        type: String,
        default: CONTENT_TYPE.Text,
        enum: [CONTENT_TYPE.Link, CONTENT_TYPE.Video, CONTENT_TYPE.Text,CONTENT_TYPE.Image]
    },
    posted_tribe_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
})

module.exports = mongoose.model('posts', postSchema)
