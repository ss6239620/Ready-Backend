const express = require('express');
const axios = require('axios');
const validate = require('../middileware/validate');
const router = require('express').Router();

const User = require('../models/user');
const Tribe = require('../models/tribe');

const dotenv = require('dotenv');
dotenv.config();

const auth = require('../middileware/auth');
const { createTribeValidation, joinedTribe } = require('../validation/tribe');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { successResponse, failedResponse } = require('../utils');

router.post('/createtribe', upload.fields([
    { name: 'tribebannerimage', maxCount: 1 },  // First file input
    { name: 'tribeprofileimage', maxCount: 1 }   // Second file input
]), multerErrorHandler, createTribeValidation, validate, auth, async (req, res) => {

    try {
        const { tribename, tribedescription, topics } = req.body;
        const tribeExist = await Tribe.findOne({ tribeName: tribename })

        let uploadFilePath1 = null;
        let uploadFilePath2 = null;

        let relativePath1 = null;
        let relativePath2 = null;


        if (req.files && req.files.content) {
            uploadFilePath1 = req.files['tribebannerimage'][0].path;
            uploadFilePath2 = req.files['tribeprofileimage'][0].path;

            // Modify the path based on the environment directly in the file upload part
            if (process.env.NODE_ENV === 'production') {
                const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
                relativePath1 = uploadFilePath1.replace(baseUrl, ''); // Remove Cloudinary base URL in production
                relativePath2 = uploadFilePath2.replace(baseUrl, '');
            } else {
                relativePath1 = uploadFilePath1;
                relativePath2 = uploadFilePath2; 
            }
        }

        if (!tribeExist) {
            const newTribe = await Tribe.create({
                tribeName: tribename,
                tribeDescription: tribedescription,
                topics: topics,
                tribeBannerImage: relativePath1,
                tribeProfileImage:relativePath2,
                created_by: req.user,
                current_moderators: [req.user]
            })
            successResponse(res, 200, newTribe);
            return;
        } else {
            failedResponse(res, 400, "Tribe Already Exist");
        }

    } catch (error) {
        res.status(500).send({ error: error })
    }
})



router.get('/getalltribe', auth, async (req, res) => {
    try {
        const tribe = await Tribe.find().select('tribeName tribeProfileImage id');
        successResponse(res, 200, tribe)
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.get('/getalljoinedtribe', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user });

        if (user.joined_tribes.length === 0) {
            return successResponse(res, 200, []);
        }

        const data = await Promise.all(
            user.joined_tribes.map(async (tribeId) => {
                return await Tribe.findOne({ _id: tribeId }).select('tribeName tribeProfileImage id');
            })
        );

        successResponse(res, 200, data);

    } catch (error) {
        failedResponse(res, 400, error);
    }
});

router.get('/gettribedetails/:id', auth, async (req, res) => {
    try {
        const { id } = req.params
        const tribe = await Tribe.findOne({ _id: id }).select("tribeName tribeDescription tribeBannerImage tribeProfileImage current_moderators")

        successResponse(res, 200, tribe)
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.post('/jointribe', joinedTribe, validate, auth, async (req, res) => {
    try {
        const { tribeid } = req.body
        await User.updateOne({ _id: req.user }, { $addToSet: { joined_tribes: tribeid } })
        successResponse(res, 200, 'User Joined The Tribe')
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.get('/isjoinedtribe/:id', auth, async (req, res) => {
    try {
        const tribeId = req.params.id;
        const tribe = await User.findOne({ _id: req.user, joined_tribes: { $in: [tribeId] } });
        if (!tribe) {
            successResponse(res, 200, false)
            return;
        }
        successResponse(res, 200, true)
        return;
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.post('/leavetribe', joinedTribe, validate, auth, async (req, res) => {
    try {
        const { tribeid } = req.body
        const result = await User.updateOne({ _id: req.user }, { $pull: { joined_tribes: { $in: [tribeid] } } })
        if (result.modifiedCount > 0) {
            successResponse(res, 200, true)
            return;
        }
        successResponse(res, 200, false)
        return;
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

router.get('/recommendedsearch', async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const searchQuery = req.query.q || "";
        if (!searchQuery) {
            return failedResponse(res, 400, "Search query cannot be empty");
        }
        const tribes = await Tribe.find({
            tribeName: { $regex: searchQuery, $options: 'i' }
        }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit).select("tribeName tribeProfileImage tribeDescription")

        return successResponse(res, 200, tribes)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

module.exports = router