const { body } = require('express-validator');

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

const mutedUserValidation = [
    body('mute_duration').notEmpty().withMessage('Please provide valid banned duration.').isNumeric().withMessage('The duration must be number of days it will be -1 for permanent ban of the user.'),
    body('mute_user_id').notEmpty().withMessage('Please provide valid user id.'),
    body('mod_note').notEmpty().withMessage('Please provide valid mod_note.'),
];

const inviteUserValidation = [
    body('user_id').notEmpty().withMessage('Please provide valid member id.'),
    body('permissions').notEmpty().withMessage('Please provide valid permission.'),
]

const approveUserValidation = [
    body('user_id').notEmpty().withMessage('Please provide valid member id.'),
]

const updateInviteValidation = [
    body('member_id').notEmpty().withMessage('Please provide valid member id.'),
    body('permissions').notEmpty().withMessage('Please provide valid permission.'),
]

const createModLogValidation = [
    body('action').notEmpty().withMessage('Please provide valid action for mod log.'),
    body('content').notEmpty().withMessage('Please provide valid content for mod log.'),
    body('type').notEmpty().withMessage('Please provide valid type for mod log.'),
]

const createSvaedResponseValidation = [
    body('name').notEmpty().withMessage('Please provide valid response name.'),
    body('category').notEmpty().withMessage('Please provide valid response category.'),
    body('message').notEmpty().withMessage('Please provide valid response message.'),
]

const updateSvaedResponseValidation = [
    body('name').notEmpty().withMessage('Please provide valid response name.'),
    body('category').notEmpty().withMessage('Please provide valid response category.'),
    body('message').notEmpty().withMessage('Please provide valid response message.'),
    body('response_id').notEmpty().withMessage('Please provide valid response id.'),
]

module.exports = { createRulesValidation, updateRulesValidation, changeStatusValidation, bannedUserValidation, userBannedValidation, inviteUserValidation, updateInviteValidation, createModLogValidation, createSvaedResponseValidation, updateSvaedResponseValidation, mutedUserValidation, approveUserValidation }