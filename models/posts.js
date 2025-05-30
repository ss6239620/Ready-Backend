const mongoose = require('mongoose');
const { CONTENT_TYPE, POST_STATUS } = require('../constant');

const postSchema = new mongoose.Schema({
    content_title: {
        type: String
    },
    total_vote: {
        type: Number,
        default: 0
    },
    total_comments: {
        type: Number,
        default: 0
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
        enum: [CONTENT_TYPE.Link, CONTENT_TYPE.Video, CONTENT_TYPE.Text, CONTENT_TYPE.Image]
    },
    posted_tribe_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
        required: true
    },
    status: {
        type: String,
        default: POST_STATUS.UNMODERATED,
        enum: [POST_STATUS.REMOVED, POST_STATUS.APPROVED, POST_STATUS.EDITED, POST_STATUS.NEED_REVIEW, POST_STATUS.REPORTED, POST_STATUS.UNMODERATED,POST_STATUS.SPAMMED]
    },
    post_saved_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    post_hidden_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    post_locked: {
        type: Boolean,
        default: false
    },
    added_to_highlight: {
        type: Boolean,
        default: false
    },
    is_nsfw: {
        type: Boolean,
        default: false
    },
    post_removed_reason: {
        type: String
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
