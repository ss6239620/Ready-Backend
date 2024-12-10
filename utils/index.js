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
        // sameSite: "none",
        secure: process.env.NODE_ENV === 'development' ? false : true,
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

function failedResponse(res, statusCode, err) {
    console.log(err);
    res.status(statusCode).json({
        error: err
    });
}

module.exports = { signToken, createSendToken, successResponse, failedResponse }