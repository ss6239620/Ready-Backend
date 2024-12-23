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

const STANDARD_PAGE_LIMIT = 5

module.exports = { JWT_SECRET, ROLES, CONTENT_TYPE, STANDARD_PAGE_LIMIT }