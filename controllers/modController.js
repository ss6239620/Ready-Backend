const User = require('../models/user');
const Tribe = require('../models/tribe');
const { TribeRules, TribeBannedUser, TribeMember, TribeModLogs, TribeSetting, TribeSafetyFilter, TribeSavedResponse } = require('../models/moderation');
const Post = require('../models/posts');
const { successResponse, failedResponse, processUploadedFile, getBanEndDate, sleep } = require('../utils');
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
        const { rule_id } = req.query;
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

const getqueuecontent = async (req, res) => {
    try {
        const { page = 1, limit = 5, post_status } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const allunmoderatedposts = await Post.find({
            posted_tribe_id: req.tribe_id,
            status: post_status
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

        const ban_duration = getBanEndDate(req.body.ban_duration);

        const alreadyBanned = await TribeBannedUser.findOne({
            tribe: req.tribe_id,
            user: ban_user_id,
            restriction_type: RESTRICTION_TYPE.Banned,
            $or: [
                { ban_duration: null },  // User is permanently banned
                { ban_duration: { $gt: new Date() } } // Existing ban is longer
            ]
        });

        if (alreadyBanned) {
            const updateBan = await TribeBannedUser.updateOne({ _id: alreadyBanned._id }, {
                ban_reason: ban_reason,
                ban_duration: ban_duration,
                banned_by: req.user,
                mod_note,
                msg_to_user,
                restriction_type: restriction_type || RESTRICTION_TYPE.Banned
            })
            if (!updateBan) {
                return failedResponse(res, 400, 'User connot be able to banned');
            }
        } else {
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
        const { ban_id } = req.query;
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

        const filter = {
            tribe: req.tribe_id,
            restriction_type: RESTRICTION_TYPE.Banned,
            $or: [
                { ban_duration: { $gt: new Date() } },   // Temporary ban still active
                { ban_duration: null }                   // Permanent ban
            ]
        }

        const [totalCount, users] = await Promise.all([
            TribeBannedUser.countDocuments(filter),
            TribeBannedUser.find(filter)
                .skip((pageNumber - 1) * pageLimit)
                .limit(pageLimit)
                .sort({ created_at: -1 })
                .populate('user', 'username profile_avtar')
        ])

        const bannedUser = {
            data: users,
            totalCount: totalCount
        }

        return successResponse(res, 200, bannedUser)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const searchbanusers = async (req, res) => {
    try {
        const searchQuery = req.query.q || "";

        const restrict_type = req.query.restriction_type === "Banned";

        const user = await User.findOne({
            username: { $regex: searchQuery, $options: 'i' }
        });

        if (!user) {
            return successResponse(res, 200, { data: [], totalCount: 0 });
        }
        const bannedUser = await TribeBannedUser.findOne({
            tribe: req.tribe_id,
            user: user._id,
            restriction_type: restrict_type ? RESTRICTION_TYPE.Banned : RESTRICTION_TYPE.Muted,
            $or: [
                { ban_duration: { $gt: new Date() } },   // Temporary ban still active
                { ban_duration: null },                   // Permanent ban
            ]
        })
            .populate('user', 'username profile_avtar')


        return successResponse(res, 200, bannedUser)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const muteuser = async (req, res) => {
    try {
        const { mute_user_id, mod_note } = req.body;
        const muted_duration = getBanEndDate(req.body.mute_duration);

        const alreadyMuted = await TribeBannedUser.findOne({
            tribe: req.tribe_id,
            restriction_type: RESTRICTION_TYPE.Muted,
            user: mute_user_id,
            mute_duration: { $gt: new Date() }
        })
        if (alreadyMuted) {
            const updateMutedUser = await TribeBannedUser.updateOne({ _id: alreadyMuted._id }, {
                mute_duration: muted_duration,
                mod_note: mod_note,
                updated_at: new Date()
            });
            if (!updateMutedUser) {
                return failedResponse(res, 400, 'User connot be able to muted');
            }
        } else {
            const mute_user = await TribeBannedUser.create({
                user: mute_user_id,
                tribe: req.tribe_id,
                mute_duration: muted_duration,
                mod_note: mod_note,
                banned_by: req.user,
                restriction_type: RESTRICTION_TYPE.Muted,
            })
            if (!mute_user) {
                return failedResponse(res, 400, 'User connot be able to muted');
            }
        }
        return successResponse(res, 200, 'User Muted');
    } catch (error) {
        return failedResponse(res, 400, error)
    }
}

const getmuteduser = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const filter = {
            tribe: req.tribe_id,
            restriction_type: RESTRICTION_TYPE.Muted,
            $or: [
                { ban_duration: { $gt: new Date() } },   // Temporary ban still active
                { ban_duration: null }                   // Permanent ban
            ]
        }

        const [totalCount, users] = await Promise.all([
            TribeBannedUser.countDocuments(filter),
            TribeBannedUser.find(filter)
                .skip((pageNumber - 1) * pageLimit)
                .limit(pageLimit)
                .sort({ created_at: -1 })
                .populate('user', 'username profile_avtar')
        ])

        const bannedUser = {
            data: users,
            totalCount: totalCount
        }

        return successResponse(res, 200, bannedUser)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const invitemember = async (req, res) => {
    try {
        const { user_id, permissions } = req.body;

        const isBannedOrMuted = await TribeBannedUser.findOne({
            tribe: req.tribe_id,
            user: user_id,
            $or: [
                { ban_duration: { $gt: new Date() } },   // Temporary ban still active
                { mute_duration: { $gt: new Date() } },   // Temporary mute still active
                { ban_duration: null },                   // Permanent ban
            ]
        })

        if (isBannedOrMuted) {
            return failedResponse(res, 400, `Invited user is ${isBannedOrMuted.restriction_type === "Banned" ? "banned" : "muted"} from the tribe.`);
        }

        const memberExist = await TribeMember.findOne({
            member: user_id,
            is_moderator: true,
            invite_expired: { $gt: new Date() }
        });
        if (memberExist) {
            await TribeMember.updateOne({ _id: memberExist._id }, { invite_expired: new Date() })
            return successResponse(res, 200, 'Invite Already sent');
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
        return successResponse(res, 200, 'Invite sent')
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
        const { member_id } = req.query;
        const member = await TribeMember.deleteOne({ _id: member_id }, { new: true });
        if (member.deletedCount === 0) {
            return failedResponse(res, 400, 'Not able to remove user.');
        }
        return successResponse(res, 200, 'Tribe member removed.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getalltribemoderators = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const users = await TribeMember.find({
            tribe: req.tribe_id, is_moderator: true, is_invite_accepted: true
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

const approveuser = async (req, res) => {
    try {
        const { user_id } = req.body;

        const isBannedOrMuted = await TribeBannedUser.findOne({
            tribe: req.tribe_id,
            user: user_id,
            $or: [
                { ban_duration: { $gt: new Date() } },   // Temporary ban still active
                { mute_duration: { $gt: new Date() } },   // Temporary mute still active
                { ban_duration: null },                   // Permanent ban
            ]
        })

        if (isBannedOrMuted) {
            return failedResponse(res, 400, `Invited user is ${isBannedOrMuted.restriction_type === "Banned" ? "banned" : "muted"} from the tribe.`);
        }

        const memberExist = await TribeMember.findOne({
            member: user_id,
            invite_expired: { $gt: new Date() }
        });
        if (memberExist) {
            return successResponse(res, 200, 'Member is already approved user');
        }
        const user = await TribeMember.create({
            approved_by: req.user,
            member: user_id,
            is_approved_user: true,
            tribe: req.tribe_id
        })
        if (!user) {
            return failedResponse(res, 400, 'Member cannot be made as a approved user');
        }
        return successResponse(res, 200, 'Member has been approved');
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const getallapprovemembers = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const users = await TribeMember.find({
            tribe: req.tribe_id, is_approved_user: true,
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

const getalltribeinvite = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const users = await TribeMember.find({
            tribe: req.tribe_id, is_moderator: true, invite_expired: { $gt: new Date() }
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

const createmodlog = async (req, res) => {
    try {
        const { action, content, type } = req.body;
        const log = await TribeModLogs.create({
            action, content, type, tribe: req.tribe_id, created_by: req.user
        })
        if (!log) {
            return failedResponse(res, 400, 'Log cannot be created');
        }
        return successResponse(res, 200, 'Log created')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const gettribemodlogs = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const users = await TribeModLogs.find({
            tribe: req.tribe_id
        })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })
            .populate('created_by', 'username profile_avtar');

        return successResponse(res, 200, users)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const updatetribesettings = async (req, res) => {
    try {
        const updateData = req.body;
        const updateSettings = await TribeSetting.findOneAndUpdate(
            { tribe: req.tribe_id },
            { $set: updateData },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        if (!updateSettings) {
            return failedResponse(res, 400, "Not able to update tribe settings");
        }
        return successResponse(res, 200, 'Tribe settings updated')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const updatetribesafetyfilters = async (req, res) => {
    try {
        const updateData = req.body;
        const updateSafatey = await TribeSafetyFilter.findOneAndUpdate(
            { tribe: req.tribe_id },
            { $set: updateData },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );
        if (!updateSafatey) {
            return failedResponse(res, 400, "Not able to update tribe safety filter");
        }
        return successResponse(res, 200, 'Tribe safety filter updated')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const createsavedresponse = async (req, res) => {
    try {
        const { name, message, category, rule } = req.body;
        const response = await TribeSavedResponse.create({
            response_category: category,
            response_message: message,
            response_name: name,
            response_rule: rule,
            tribe: req.tribe_id
        })
        if (!response) {
            return failedResponse(res, 400, "Not able to save reponse.");
        }
        return successResponse(res, 200, 'Saved tribe saved response.')
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const updatesavedresponse = async (req, res) => {
    try {
        const { name, rule, category, message, response_id } = req.body;
        // Perform the update
        const updatedResponse = await TribeSavedResponse.findOneAndUpdate(
            { _id: response_id },
            {
                response_name: name,
                response_category: category,
                response_message: message,
                response_rule: rule
            },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedResponse) {
            return failedResponse(res, 404, 'Saved response not found.');
        }

        successResponse(res, 200, 'Updated saved response.');
    } catch (error) {
        return failedResponse(res, 500, 'Internal server error.');
    }
};

const deletesavedresponse = async (req, res) => {
    try {
        const { response_id } = req.query;
        const res_delete = await TribeSavedResponse.findByIdAndDelete(response_id);
        if (!res_delete) {
            return failedResponse(res, 404, 'Saved response not deleted.');
        }
        successResponse(res, 200, 'Deleted saved response.');
    } catch (error) {
        return failedResponse(res, 500, 'Internal server error.');
    }
}

const getallunmoderatedposts = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const unModeratedposts = await Post.find({
            is_moderated: false,
            posted_tribe_id:req.tribe_id
        }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })
            .select("content_title created_by total_vote total_comments content_path content_body content_link content_type posted_tribe_id status post_locked is_post_spam added_to_highlight created_at")
            .populate('created_by', 'username profile_avtar')

        return successResponse(res, 200, unModeratedposts);
    } catch (error) {
        return failedResponse(res, 500, 'Internal server error.');
    }
}

module.exports = { createtriberules, updatetriberules, deletetriberule, getalltriberules, getqueuecontent, changecontentstatus, getstatusbasedcontent, banuser, getbanuser, searchbanusers, updateuserban, removeduserban, invitemember, updateinvite, deleteinvite, getalltribemoderators, createmodlog, gettribemodlogs, updatetribesettings, updatetribesafetyfilters, createsavedresponse, updatesavedresponse, deletesavedresponse, muteuser, getmuteduser, approveuser, getallapprovemembers, getalltribeinvite, getallunmoderatedposts }