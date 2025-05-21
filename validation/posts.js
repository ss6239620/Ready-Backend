const { body } = require('express-validator');

// Registration validation rules
const createPostValidation = [
    body('content_title')
        .notEmpty().withMessage('Post Body is required')
        .isLength({ min: 3 }).withMessage('Post Body must be at least 3 characters long')
];

// Registration validation rules
const createPostCommentValidation = [
    body('post_id')
        .notEmpty().withMessage('Post id is required'),
    body('vote')
        .isBoolean().withMessage('Must be Number'),

];

const savedPostValidation = [
    body('post_id')
        .notEmpty().withMessage('Post id is required'),
];


module.exports = { createPostValidation, createPostCommentValidation, savedPostValidation }