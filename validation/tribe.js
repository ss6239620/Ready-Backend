const { body } = require('express-validator');

// Registration validation rules
const createTribeValidation = [
    body('tribename')
        .notEmpty().withMessage('Tribe name is required')
        .isLength({ min: 3 }).withMessage('Tribe name must be at least 3 characters long'),
    body('tribedescription')
        .notEmpty().withMessage('Tribe description is required')
        .isLength({ min: 10 }).withMessage('Tribe description must be at least 10 characters long'),
    body('tribebannerimage')
        .custom((value, { req }) => req.files && req.files['tribebannerimage'] ? true : false)
        .withMessage('Tribe banner image is required'),
    body('tribeprofileimage')
        .custom((value, { req }) => req.files && req.files['tribeprofileimage'] ? true : false)
        .withMessage('Tribe profile image is required'),
];

const joinedTribe=[
    body('tribeid')
        .notEmpty().withMessage('Tribe id is required')
]
const leaveTribe=[
    body('tribeid')
        .notEmpty().withMessage('Tribe id is required')
]


module.exports = { createTribeValidation,joinedTribe,leaveTribe }