const { body, validationResult } = require('express-validator');

const createRulesValidation = [
    body('rule_title').isLength({ max: 100 }).withMessage('Please provide proper rule title'),
    body('rule_desc').isLength({ max: 500 }).withMessage('Please provide proper rule description'),
    body('rule_reason').isLength({ max: 100 }).withMessage('Please provide proper rule reason')
];

const updateRulesValidation = [
    body('rule_title').isLength({ max: 100 }).withMessage('Please provide proper rule title'),
    body('rule_desc').isLength({ max: 500 }).withMessage('Please provide proper rule description'),
    body('rule_reason').isLength({ max: 100 }).withMessage('Please provide proper rule reason')
];

const deleteRulesValidation = [
    body('rule_id').isLength({ max: 100 }).withMessage('Please provide proper rule id'),
    body('tribe_id').isLength({ max: 500 }).withMessage('Please provide proper tribe id'),
];

const changeStatusValidation = [
    body('status').notEmpty().withMessage('Please provide content status.'),
];

const bannedUserValidation = [
    body('ban_duration').notEmpty().withMessage('Please provide valid banned duration.').isNumeric().withMessage('The duration must be number of days it will be -1 for permanent ban of the user.'),
    body('ban_reason').notEmpty().withMessage('Please provide valid banned reason.'),
    body('ban_user_id').notEmpty().withMessage('Please provide valid user id.'),
    body('mod_note').notEmpty().withMessage('Please provide valid mod_note.'),
    body('msg_to_user').notEmpty().withMessage('Please provide valid message to user.')
];

const userBannedValidation = [
    body('ban_duration').notEmpty().withMessage('Please provide valid banned duration.').isNumeric().withMessage('The duration must be number of days it will be -1 for permanent ban of the user.'),
    body('ban_reason').notEmpty().withMessage('Please provide valid banned reason.'),
    body('ban_id').notEmpty().withMessage('Please provide valid banned id.'),
    body('mod_note').notEmpty().withMessage('Please provide valid mod_note.'),
    body('msg_to_user').notEmpty().withMessage('Please provide valid message to user.'),
];

const deleteUserBannedValidation=[
    body('ban_id').notEmpty().withMessage('Please provide valid Ban id.'),
]

const inviteUserValidation=[
    body('user_id').notEmpty().withMessage('Please provide valid member id.'),
    body('permissions').notEmpty().withMessage('Please provide valid permission.'),
]

const updateInviteValidation=[
    body('member_id').notEmpty().withMessage('Please provide valid member id.'),
    body('permissions').notEmpty().withMessage('Please provide valid permission.'),
]

const deleteInviteValidation=[
    body('member_id').notEmpty().withMessage('Please provide valid member id.'),
]

module.exports = { createRulesValidation, updateRulesValidation, deleteRulesValidation, changeStatusValidation, bannedUserValidation,userBannedValidation,inviteUserValidation,updateInviteValidation,deleteInviteValidation,deleteUserBannedValidation }