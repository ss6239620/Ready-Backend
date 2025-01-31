const User = require('../models/user');
const Tribe = require('../models/tribe');
const { TribeRules, TribeBannedUser, TribeMember } = require('../models/moderation');
const Post = require('../models/posts');
const { successResponse, failedResponse, processUploadedFile, getBanEndDate } = require('../utils');
const { POST_STATUS, RESTRICTION_TYPE } = require('../constant');

const createtriberules = async (req, res) => {
    try {
        const { rule_title, rule_desc, rule_reason } = req.body;
        const rules = await TribeRules.create({
            tribe_id: req.tribe_id,
            tribeRuleTitle: rule_title,
            tribeRuleDescription: rule_desc,
            tribeRuleReportReason: rule_reason,
            created_by: req.user
        })

        if (!rules) {
            return failedResponse(res, 400, 'Rules Cannot be created')
        }

        return successResponse(res, 200, 'Rules Created')

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const updatetriberules = async (req, res) => {
    try {
        const { rule_title, rule_desc, rule_reason, rule_id } = req.body;

        const tribeRuleExist = await TribeRules.findById(rule_id)
        if (!tribeRuleExist) {
            return failedResponse(res, 400, 'Tribe rule not found.')
        }

        if (!rule_title) {
            rule_title = tribeRuleExist.tribeRuleTitle;
        }

        await TribeRules.updateOne({ _id: rule_id }, { tribeRuleTitle: rule_title || tribeRuleExist.tribeRuleTitle, tribeRuleDescription: rule_desc || tribeRuleExist.tribeRuleDescription, tribeRuleReportReason: rule_reason || tribeRuleExist.tribeRuleReportReason, updated_at: Date.now() })

        return successResponse(res, 200, 'Tribe rule updated.')

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const deletetriberule = async (req, res) => {
    try {
        const { rule_id } = req.body;
        const rule = await TribeRules.deleteOne({ _id: rule_id })
        if (rule.deletedCount === 0) {
            return failedResponse(res, 400, 'Tribe rule not able to removed.');
        }

        return successResponse(res, 200, 'Tribe rule deleted.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getalltriberules = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const rules = await TribeRules.find({ tribe_id: req.tribe_id })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .select('tribeRuleTitle tribeRuleDescription tribeRuleReportReason updated_at ');

        return successResponse(res, 200, rules)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getallunmoderatedcontent = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const allunmoderatedposts = await Post.find({
            posted_tribe_id: req.tribe_id,
            status: POST_STATUS.UNMODERATED
        })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)

        return successResponse(res, 200, allunmoderatedposts)


    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const changecontentstatus = async (req, res) => {
    try {
        const { content_status, post_id } = req.body;
        await Post.updateOne({ _id: post_id }, { status: content_status });

        return successResponse(res, 200, 'Post status updated.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getstatusbasedcontent = async (req, res) => {
    try {
        const { page = 1, limit = 5, status } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const posts = await Post.find({
            posted_tribe_id: req.tribe_id,
            status: status
        })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)

        return successResponse(res, 200, posts)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const banuser = async (req, res) => {
    try {
        const { ban_reason, ban_user_id, mod_note, msg_to_user, restriction_type } = req.body;
        const alreadyBanned = await TribeBannedUser.findOne({
            user: ban_user_id,
            $or: [
                { ban_duration: null },  // User is permanently banned
                { ban_duration: { $gt: new Date() } } // Existing ban is longer
            ]
        });
        if (alreadyBanned) {
            return failedResponse(res, 400, 'User is already banned.');
        }
        const ban_duration = getBanEndDate(req.body.ban_duration);
        const banned_user = await TribeBannedUser.create({
            ban_reason: ban_reason,
            ban_duration: ban_duration,
            tribe: req.tribe_id,
            banned_by: req.user,
            user: ban_user_id,
            mod_note,
            msg_to_user,
            restriction_type: restriction_type || RESTRICTION_TYPE.Banned
        })
        if (!banned_user) {
            return failedResponse(res, 400, 'User connot be able to banned');
        }
        return successResponse(res, 200, 'User banned')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const updateuserban = async (req, res) => {
    try {
        const { ban_reason, ban_id, mod_note, msg_to_user, restriction_type } = req.body;

        const bannedExpired = await TribeBannedUser.findOne({
            _id: ban_id,
            ban_duration: { $lt: new Date() }
        });
        if (bannedExpired) {
            return failedResponse(res, 400, 'User is no longer banned');
        }

        const ban_duration = getBanEndDate(req.body.ban_duration);
        const updateBan = await TribeBannedUser.updateOne(
            { _id: ban_id },
            {
                ban_duration, ban_reason, updated_at: Date.now(), msg_to_user, mod_note, restriction_type: restriction_type || RESTRICTION_TYPE.Banned
            },
            { new: true, runValidators: true }
        )
        if (!updateBan) {
            return failedResponse(res, 400, 'Ban connot be banned');
        }
        return successResponse(res, 200, 'Ban updated');
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const removeduserban = async (req, res) => {
    try {
        const { ban_id } = req.body;
        const member = await TribeBannedUser.deleteOne({ _id: ban_id });
        if (member.deletedCount === 0) {
            return failedResponse(res, 400, 'Not able to remove user ban');
        }
        return successResponse(res, 200, 'Tribe member ban removed.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getbanuser = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const users = await TribeBannedUser.find({
            tribe: req.tribe_id
        })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })
            .populate('user', 'username profile_avtar')

        return successResponse(res, 200, users)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const invitemember = async (req, res) => {
    try {
        const { user_id, permissions } = req.body;
        const memberExist = await TribeMember.findOne({
            member: user_id,
            invite_expired: { $gt: new Date() }
        });
        if (memberExist) {
            return failedResponse(res, 400, 'Invite Already sent');
        }
        const user = await TribeMember.create({
            permissions: permissions,
            invited_by: req.user,
            is_moderator: true,
            member: user_id,
            tribe: req.tribe_id
        })
        if (!user) {
            return failedResponse(res, 400, 'Member cannot be invited');
        }
        return successResponse(res, 200, 'Invite sent to user')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const updateinvite = async (req, res) => {
    try {
        const { member_id, permissions } = req.body;

        const inviteExist = await TribeMember.findOne({
            _id: member_id,
            active: true,
            invite_expired: { $gt: new Date() }
        });
        if (inviteExist) {
            return failedResponse(res, 400, 'Invite has expired or have not accepted the invite');
        }

        const member = await TribeMember.updateOne(
            { _id: member_id },
            { $set: { permissions: permissions, updated_at: Date.now() } },
            { new: true, runValidators: true }
        )
        if (!member) {
            return failedResponse(res, 400, 'Invite has expired or have not accepted the invite');
        }
        return successResponse(res, 200, 'Tribe member updated.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const deleteinvite = async (req, res) => {
    try {
        const { member_id } = req.body;
        const member = await TribeMember.deleteOne({ _id: member_id }, { new: true });
        if (member.deletedCount === 0) {
            return failedResponse(res, 400, 'Not able to remove user.');
        }
        return successResponse(res, 200, 'Tribe member removed.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getalltribemember = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const users = await TribeMember.find({
            tribe: req.tribe_id
        })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })
            .populate('member', 'username profile_avtar');

        return successResponse(res, 200, users)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

module.exports = { createtriberules, updatetriberules, deletetriberule, getalltriberules, getallunmoderatedcontent, changecontentstatus, getstatusbasedcontent, banuser, getbanuser, updateuserban, removeduserban, invitemember, updateinvite, deleteinvite,getalltribemember }