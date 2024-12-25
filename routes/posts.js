const express = require('express');
const validate = require('../middileware/validate');
const router = require('express').Router();

const User = require('../models/user');
const Tribe = require('../models/tribe');
const Post = require('../models/posts');

const auth = require('../middileware/auth');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { successResponse, failedResponse } = require('../utils');
const { createPostValidation, createPostCommentValidation } = require('../validation/posts');
const user = require('../models/user');

const dotenv = require('dotenv');
dotenv.config();

router.post('/createpost', upload.fields([
    { name: "content", maxCount: 1 }
]), multerErrorHandler, createPostValidation, validate, auth, async (req, res) => {
    try {
        const { content_title, content_body, content_type, tribe_posted_to, content_link } = req.body;

        let uploadFilePath = null;
        let relativePath = null;

        if (req.files && req.files.content) {
            uploadFilePath = req.files['content'][0].path;

            // Modify the path based on the environment directly in the file upload part
            if (process.env.NODE_ENV === 'production') {
                const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
                relativePath = uploadFilePath.replace(baseUrl, ''); // Remove Cloudinary base URL in production
            } else {
                relativePath = uploadFilePath; // Use local file path in development
            }
        }

        const savePost = await Post.create({
            content_title: content_title,
            content_body: content_body,
            posted_tribe_id: tribe_posted_to,
            created_by: req.user,
            content_type: content_type,
            content_path: relativePath,
            content_link: content_link
        })
        successResponse(res, 200, savePost)

    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.get('/gettribePost/:id', auth, async (req, res) => {
    try {
        const tribeId = req.params.id
        const tribeExist = await Tribe.findOne({ _id: tribeId })
        if (!tribeExist) {
            failedResponse(res, 400, "Tribe Does Not Exist");
            return;
        }
        const allPost = await Post.find({ posted_tribe_id: tribeId })
        successResponse(res, 200, allPost)
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.get('/getpost/:id', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findOne({ _id: postId })
        if (!post) {
            failedResponse(res, 400, 'Post Dosent Exist');
            return;
        }
        successResponse(res, 200, post)
        return;
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.post('/postvote', createPostCommentValidation, validate, auth, async (req, res) => {
    try {
        const { post_id, vote } = req.body; // vote can be 1 (upvote) or 0 (downvote)

        // Check if the post exists and the user has already voted
        const post = await Post.findById(post_id);

        if (!post) {
            return failedResponse(res, 400, 'Post not found');
        }

        const hasUpVoted = post.up_vote_users.includes(req.user);
        const hasDownVoted = post.down_vote_users.includes(req.user);

        if (vote === 1) {  // Upvote case
            if (hasUpVoted) {
                // If user already upvoted, remove the upvote
                await Post.updateOne(
                    { _id: post_id },
                    {
                        $pull: { up_vote_users: req.user },
                        $inc: { total_vote: -1 }
                    }
                );
                return successResponse(res, 200, 'Upvote Removed');
            } else if (hasDownVoted) {
                // If user has downvoted, remove the downvote and add the upvote
                await Post.updateOne(
                    { _id: post_id },
                    {
                        $pull: { down_vote_users: req.user },
                        $addToSet: { up_vote_users: req.user },
                        $inc: { total_vote: 2 } // total_vote +1 for upvote and -1 for removing downvote
                    }
                );
                return successResponse(res, 200, 'Vote Changed to Upvote');
            } else {
                // If user hasn't voted yet, add the upvote
                await Post.updateOne(
                    { _id: post_id },
                    {
                        $addToSet: { up_vote_users: req.user },
                        $inc: { total_vote: 1 }
                    }
                );
                return successResponse(res, 200, 'Upvoted Successfully');
            }
        } else if (vote === 0) {  // Downvote case
            if (hasDownVoted) {
                // If user already downvoted, remove the downvote
                await Post.updateOne(
                    { _id: post_id },
                    {
                        $pull: { down_vote_users: req.user },
                        $inc: { total_vote: 1 }
                    }
                );
                return successResponse(res, 200, 'Downvote Removed');
            } else if (hasUpVoted) {
                // If user has upvoted, remove the upvote and add the downvote
                await Post.updateOne(
                    { _id: post_id },
                    {
                        $pull: { up_vote_users: req.user },
                        $addToSet: { down_vote_users: req.user },
                        $inc: { total_vote: -2 } // total_vote -1 for downvote and -1 for removing upvote
                    }
                );
                return successResponse(res, 200, 'Vote Changed to Downvote');
            } else {
                // If user hasn't voted yet, add the downvote
                await Post.updateOne(
                    { _id: post_id },
                    {
                        $addToSet: { down_vote_users: req.user },
                        $inc: { total_vote: -1 }
                    }
                );
                return successResponse(res, 200, 'Downvoted Successfully');
            }
        } else {
            return failedResponse(res, 400, 'Invalid vote value');
        }
    } catch (error) {
        return failedResponse(res, 400, error.message);
    }
});


router.get('/homefeed', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const user = await User.findById(req.user)
        if (!user) {
            return failedResponse(res, 400, 'User Is not member of any tribe');
        }
        const joinedTribe = user.joined_tribes.map((tribe) => tribe._id)

        const posts = await Post.find({
            posted_tribe_id: { $in: joinedTribe }
        })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })

        // Populate the tribe information for each post (fill the posted_tribe_id with the tribe data)
        const populatedPosts = await Post.populate(posts, {
            path: 'posted_tribe_id', // The field to populate (posted_tribe_id)
            select: 'tribeName tribeProfileImage id' // Select the fields to return for the tribe
        });

        return successResponse(res, 200, populatedPosts)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

router.get('/recentpost', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user)
        if (!user) {
            return failedResponse(res, 400, 'User Is not member of any tribe');
        }
        const joinedTribe = user.joined_tribes.map((tribe) => tribe._id)

        const posts = await Post.find({
            posted_tribe_id: { $in: joinedTribe },
            content_type: { $ne: "VIDEO" }
        })
            .limit(5)
            .sort({ created_at: -1 })

        // Populate the tribe information for each post (fill the posted_tribe_id with the tribe data)
        const populatedPosts = await Post.populate(posts, {
            path: 'posted_tribe_id', // The field to populate (posted_tribe_id)
            select: 'tribeName tribeProfileImage id' // Select the fields to return for the tribe
        });

        return successResponse(res, 200, populatedPosts)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

router.get('/trendingtoday', auth, async (req, res) => {
    try {
        const posts = await Post.find({
            content_type: { $nin: ["VIDEO", "TEXT"] }
        })
            .sort({ total_vote: -1 })
            .limit(15)

        // Populate the tribe information for each post (fill the posted_tribe_id with the tribe data)
        const populatedPosts = await Post.populate(posts, {
            path: 'posted_tribe_id', // The field to populate (posted_tribe_id)
            select: 'tribeName tribeProfileImage id' // Select the fields to return for the tribe
        });

        return successResponse(res, 200, populatedPosts)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

router.get('/searchpost', async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const query = req.query.q;

        const posts = await Post.find({
            content_title: { $regex: query, $options: 'i' }
        }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)

        const populatedPosts = await Post.populate(posts, {
            path: 'posted_tribe_id',
            select: 'tribeName tribeProfileImage id'
        })
        return successResponse(res, 200, populatedPosts);
    } catch (error) {
        return failedResponse(res, 400, error);
    }
});


router.get('/alluserpost', auth, async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const posts = await Post.find({
            created_by: req.user
        }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })

        const populatedPosts = await Post.populate(posts, {
            path: 'posted_tribe_id',
            select: 'tribeName tribeProfileImage id'
        });

        return successResponse(res, 200, populatedPosts);
    } catch (error) {
        return failedResponse(res, 400, error);
    }
});


module.exports = router;