const express = require('express');
const axios = require('axios');
const { signupValidation, loginValidation } = require('../validation/user');
const validate = require('../middileware/validate');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { JWT_SECRET } = require('../constant');
const { oauth2Client } = require('../middileware/oauth');
const { createSendToken, failedResponse, successResponse } = require('../utils');
const auth = require('../middileware/auth');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');

router.post('/signup', upload.fields([
    { name: 'profile_avtar', maxCount: 1 }
]), multerErrorHandler, signupValidation, validate, async (req, res) => {
    try {
        const userExist = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] })
        if (!userExist) {
            const salt = await bcrypt.genSalt(10);
            const hashPassWord = await bcrypt.hash(req.body.password, salt)
            const newUser = await User.create({
                username: req.body.username,
                email: req.body.email,
                identity: req.body.identity,
                interests: req.body.interests,
                profile_avtar: req.files['profile_avtar'][0].path,
                password: hashPassWord,
                cookieExpire: new Date(Date.now() + 24 * 60 * 60 * 1000)
            })
            createSendToken(newUser, 201, res);

        } else {
            res.status(500).send({ error: "Username or Email Already Exist" })
            return
        }
    } catch (error) {
        res.status(500).send({ error: error })
    }
})

router.post('/login', loginValidation, validate, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            res.status(400).send({ error: "Please Login using Proper Credential" })
            return
        } else {
            const passwordCompare = await bcrypt.compare(password, user.password)
            if (!passwordCompare) {
                res.status(400).send({ error: "Please Login using Proper Credential" })
                return
            }
            const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
            await User.findByIdAndUpdate(user._id, { cookieExpire: expirationDate });
            createSendToken(user, 201, res);
        }
    } catch (error) {
        res.status(500).send({ error: error })
    }
})

router.post('/logout', (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'Strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});



router.get('/oauthRegister', async (req, res) => {
    const code = req.query.code; // Use req.query to access query parameters
    console.log("USER CREDENTIAL -> ", code);

    try {
        // Exchange the authorization code for an access token
        const googleRes = await oauth2Client.getToken(code);

        // Set the credentials for the OAuth client
        oauth2Client.setCredentials(googleRes.tokens);

        // Fetch user information from Google using the access token
        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
        );

        // Check if the user already exists in your database
        let user = await User.findOne({ email: userRes.data.email });

        if (!user) {
            // If user does not exist, create a new user record
            user = await User.create({
                username: userRes.data.name,
                email: userRes.data.email
            });
        }

        createSendToken(user, 201, res);

    } catch (error) {
        console.error("OAuth registration error: ", error);
        res.status(500).json({ message: "Something went wrong during the registration process" });
    }
});

router.get('/test', auth, async (req, res) => {
    res.status(200).send("Server is active")
})

router.post('/jointribe', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user });
        await user.updateOne({ $push: { joined_tribes: req.body.tribeid } });

        successResponse(res, 200, user)
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.get('/usersearch', async (req, res) => {
    try {
        const searchQuery = req.query.q || "";
        if (!searchQuery) {
            return failedResponse(res, 400, "Search query cannot be empty");
        }
        const users = await User.find({
            username: { $regex: searchQuery, $options: 'i' }
        }).limit(5).select("username profile_avtar")

        return successResponse(res, 200, users)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

module.exports = router
