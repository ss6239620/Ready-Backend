const { body, validationResult } = require('express-validator');

// Registration validation rules
const createChatRoomValidation = [
    body('user_id').notEmpty().withMessage('Please enter user id'),
    body('message').notEmpty().withMessage('Please enter message'),
];

module.exports={createChatRoomValidation}