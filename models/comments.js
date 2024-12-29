const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    comment_text: {
        type: String
    },
    total_comment_vote: {
        type: Number,
        default: 0
    },
    parent_comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comments',
    },
    child_comment_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comments'
    }],
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts',
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

module.exports = mongoose.model('comments', commentSchema)
