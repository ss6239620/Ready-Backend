const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

exports.oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
);