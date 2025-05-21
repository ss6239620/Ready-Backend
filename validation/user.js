const { body, validationResult } = require('express-validator');

// Registration validation rules
const signupValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('username').notEmpty().withMessage('Please enter a valid username'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Login validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password cannot be empty')
];

module.exports = { signupValidation, loginValidation }