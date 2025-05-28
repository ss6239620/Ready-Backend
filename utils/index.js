const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../constant');
const dotenv = require('dotenv');
dotenv.config();

const signToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: "24h",
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    const cookieOptions = {
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        httpOnly: true,
        path: '/',
        sameSite: "None",
        secure: true,
    };

    user.password = undefined;

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        message: 'success',
        token,
        data: {
            user,
        },
    });
};


function successResponse(res, statusCode, data) {
    res.status(statusCode).json({
        message: 'success',
        data: data
    });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function failedResponse(res, statusCode, err) {
    res.status(statusCode).json({
        error: err
    });
}


/**
 * Utility function to process file uploads and return the correct file path.
 * It checks if the environment is production or development and adjusts the file path accordingly.
 * 
 * @param {Object} file - The uploaded file object.
 * @returns {String} - The file path (either local or Cloudinary).
 */
function processUploadedFile(file) {
    if (!file) return null;

    let filePath = file.path;

    if (process.env.NODE_ENV === 'production') {
        const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
        filePath = filePath.replace(baseUrl, '');  // Remove Cloudinary base URL for relative path
    }

    return filePath;
}

function getBanEndDate(durationInDays) {
    if (durationInDays === -1) {
        return null; // Permanent ban
    }

    const banEndDate = new Date();
    banEndDate.setDate(banEndDate.getDate() + durationInDays);
    return banEndDate;
}


module.exports = { signToken, createSendToken, successResponse, failedResponse, processUploadedFile, getBanEndDate ,sleep}