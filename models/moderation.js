const mongoose = require('mongoose');
const { RESTRICTION_TYPE, TRIBE_MEMBER_PERMISSION, FILTER_ACTION, TRIBE_COMMENT_FILTER, TRIBE_TYPE, SAVED_RESPONSE } = require('../constant');

//util schema start

const filterOptionsSchema = new mongoose.Schema({
    moderate_filter: {
        type: Boolean,
        default: true
    },
    high_filter: {
        type: Boolean,
        default: false
    },
}, { _id: false });  // No need to create an _id for this sub-schema

//util schema end

const tribeRuleSchema = new mongoose.Schema({
    tribeRuleTitle: {
        type: String,
        required: true,
        maxLength: 100
    },
    tribeRuleDescription: {
        type: String,
        required: true,
        maxLength: 500
    },
    tribeRuleReportReason: {
        type: String,
        maxLength: 100
    },
    tribe_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
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
});

const tribeBannedUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    tribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
        required: true
    },
    //null will be stored to indicate permanent ban
    ban_duration: {
        type: Date,
    },
    mute_duration: {
        type: Date,
    },
    ban_reason: {
        type: String,
    },
    mod_note: {
        type: String,
    },
    msg_to_user: {
        type: String,
    },
    banned_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    restriction_type: {
        type: String,
        default: RESTRICTION_TYPE.Banned,
        enum: [RESTRICTION_TYPE.Banned, RESTRICTION_TYPE.Muted]
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
});

const tribeMemberSchema = new mongoose.Schema({
    tribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    is_moderator: {
        type: Boolean,
        default: false
    },
    is_approved_user: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: false
    },
    permissions: [{
        type: String,
        default: TRIBE_MEMBER_PERMISSION.Everything,
        enum: Object.values(TRIBE_MEMBER_PERMISSION)
    }],
    invited_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    invite_expired: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) //10 days to expire
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: Date.now()
    },
});

const tribeSafetyFilterSchema = new mongoose.Schema({
    crowd_control_filter: {
        filter_post: filterOptionsSchema,
        filter_comment: filterOptionsSchema
    },
    reputation_filter: {
        filter_post: filterOptionsSchema,
    },
    tribe_ban_filter: {
        type: Boolean,
        default: true
    },
    harassment_filter: {
        filter_comment: filterOptionsSchema,
        action: {
            type: String,
            default: FILTER_ACTION.Removed,
            enum: Object.values(FILTER_ACTION)
        },
        allowed_words: [{
            type: String
        }]
    },
    mature_content: {
        sexual_content: {
            filter_post: {
                type: Boolean,
                default: false
            },
        },
        graphic_content: {
            filter_post: {
                type: Boolean,
                default: false
            },
            filter_comment: {
                type: Boolean,
                default: false
            },
        },
    },
    tribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
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
});

const tribeSettingSchema = new mongoose.Schema({
    welcome_message: {
        active: {
            type: Boolean,
            default: false
        },
        message: {
            type: String
        }
    },
    tribe_thread: {
        sort: {
            type: String,
            default: TRIBE_COMMENT_FILTER.None,
            enum: Object.values(TRIBE_COMMENT_FILTER)
        },
        hide_comment_score_after: {
            type: Number,
            default: 100
        }
    },
    tribe_type: {
        type: String,
        default: TRIBE_TYPE.Public,
        enum: Object.values(TRIBE_TYPE)
    },
    mature_content: {
        allow: {
            type: Boolean,
            default: false
        },
        reason: {
            type: String,
        }
    },
    allow_recommending_tribe: {
        type: Boolean,
        default: false
    },
    milestone: {
        type: Boolean,
        default: false
    },
    //post db start here
    post_guideline: {
        type: String
    },
    post_title_restriction: {
        min_length: {
            type: Number,
            default: 0
        },
        max_length: {
            type: Number,
            default: 500
        },
        require_word: {
            type: String
        },
        banned_word: {
            type: String
        }
    },
    post_body_restriction: {
        allow: {
            type: Boolean,
            default: true
        },
        body_require: {
            type: Boolean,
            default: true
        },
        require_word: {
            type: String
        },
        banned_word: {
            type: String
        }
    },
    regex: {
        post_regex: [{
            type: String
        }],
        body_regex: [{
            type: String
        }],
    },
    post_link_restriction: {
        allow_repost_after: {
            type: Date,
        }
    },
    post_comment_media: {
        images: {
            type: Boolean,
            default: true
        },
        gifs: {
            type: Boolean,
            default: true
        },
        emojis: {
            type: Boolean,
            default: true
        },
    },
    hold_contain_before_reviewed: {
        posts: {
            type: Boolean,
            default: true
        },
        comments: {
            type: Boolean,
            default: true
        },
        other_medias: {
            type: Boolean,
            default: true
        },
    },
    archeive_old_post: {
        type: Boolean,
        default: true
    },
    //post db end here

    //Look and Feel of tribe start here
    tribe_appearance: {
        key_color: {             //for colors for buttons
            type: String
        },
        base_color: {             //for background of tribe
            type: String
        },
        pinned_post_color: {
            type: String
        }
    },
    post_flair: [{
        text: {
            type: String,
            required: true
        },
        bg_color: {
            type: String
        },
        text_color: {
            type: String,
            default: 'Dark',
            enum: ['Dark', 'Light']
        }
    }],

    user_flair: [{
        text: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true
        }
    }],
    //Look and Feel of tribe end here

    tribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
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
});

const tribeModLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    tribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
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
});

const tribeSavedResponseSchema = new mongoose.Schema({
    response_name: {
        type: String,
        required: true
    },
    response_category: {
        type: String,
        default: SAVED_RESPONSE.General,
        enum: Object.values(SAVED_RESPONSE),
        required: true
    },
    response_rule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'triberules',
    },
    response_message: {
        type: String,
        required: true
    },
    tribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tribes',
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

const TribeRules = mongoose.model('triberules', tribeRuleSchema);
const TribeBannedUser = mongoose.model('tribebannedusers', tribeBannedUserSchema);
const TribeMember = mongoose.model('tribemember', tribeMemberSchema);
const TribeSafetyFilter = mongoose.model('tribesafetyfilter', tribeSafetyFilterSchema);
const TribeSetting = mongoose.model('tribesettings', tribeSettingSchema);
const TribeModLogs = mongoose.model('tribemodlogs', tribeModLogSchema);
const TribeSavedResponse = mongoose.model('tribesavedresponse', tribeSavedResponseSchema);

module.exports = { TribeRules, TribeBannedUser, TribeMember, TribeSafetyFilter, TribeSetting, TribeModLogs, TribeSavedResponse }