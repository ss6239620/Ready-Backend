const { body } = require('express-validator');

// Registration validation rules
const createCommentValidation = [
    body('comment_text')
        .notEmpty().withMessage('Comment Text is required')
        .isLength({ min: 3 }).withMessage('Comment must be at least 3 characters long'),

    body('post_id')
        .notEmpty().withMessage('Post id is required'),
];

const replyCommentValidation = [
    body('comment_text')
        .notEmpty().withMessage('Comment Text is required')
        .isLength({ min: 3 }).withMessage('Comment must be at least 3 characters long'),

    body('comment_id')
        .notEmpty().withMessage('Comment id is required'),
];


module.exports = { createCommentValidation,replyCommentValidation }