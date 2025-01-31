const JWT_SECRET = 'JWT_SECRET'

const ROLES = {
    Admin: 'ADMIN',
    Member: 'MEMBER'
};

const CONTENT_TYPE = {
    Video: 'VIDEO',
    Image: 'IMAGE',
    Text: "TEXT",
    Link: "LINK"
}

const POST_STATUS = {
    APPROVE: 'APPROVE',
    REMOVED: 'REMOVED',
    EDITED: 'EDITED',
    NEED_REVIEW: 'NEED_REVIEW',
    UNMODERATED: 'UNMODERATED',
    REPORTED: 'REPORTED'
}

const RESTRICTION_TYPE = {
    Banned: 'Banned',
    Muted: 'Muted'
}

const TRIBE_MEMBER_PERMISSION = {
    Everything: 'Everything',
    Posts_And_Comments: 'Posts_And_Comments',
    Wiki: 'Wiki',
    Flair: 'Flair',
    Config: 'Config',
    Chat_Config: 'Chat_Config',
    Chat_Operator: 'Chat_Operator',
}

const FILTER_ACTION = {
    Removed: 'Removed',
    Review: 'Review'
}

const TRIBE_COMMENT_FILTER = {
    Best: 'Best',
    Old: 'Old',
    Top: 'Top',
    Controversial: 'Controversial',
    New: 'New',
    None: 'None'
}

const TRIBE_TYPE = {
    Public: 'Public', //Anybody can view it and contibute
    Private: 'Private', //Only approved user can view it and contibute
    Restricted: 'Restricted', //anyone can view but only approved user can contribute
}

const STANDARD_PAGE_LIMIT = 5

module.exports = { JWT_SECRET, ROLES, CONTENT_TYPE, STANDARD_PAGE_LIMIT, POST_STATUS, RESTRICTION_TYPE, TRIBE_MEMBER_PERMISSION, FILTER_ACTION, TRIBE_COMMENT_FILTER, TRIBE_TYPE }