const User = require('../models/user');
const Tribe = require('../models/tribe');
const Post = require('../models/posts');

const { successResponse, failedResponse, processUploadedFile } = require('../utils');
const { default: mongoose } = require('mongoose');


const createpost = async (req, res) => {
    try {
        const { content_title, content_body, content_type, tribe_posted_to, content_link } = req.body;

        let relativePath = processUploadedFile(req.files['content'] ? req.files['content'][0] : null);

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
}

const gettribePost = async (req, res) => {
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
}

const getpost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findOne({ _id: postId })

        if (!post) {
            failedResponse(res, 400, 'Post Dosent Exist');
            return;
        }
        const postObj = post.toObject();
        postObj.isSaved = postObj.post_saved_by.some(id => id.equals(req.user));
        postObj.isHide = postObj.post_hidden_by.some(id => id.equals(req.user));
        postObj.isUpVoted = postObj.up_vote_users.some(id => id.equals(req.user));
        postObj.isDownVoted = postObj.down_vote_users.some(id => id.equals(req.user));

        successResponse(res, 200, postObj)
        return;
    } catch (error) {
        failedResponse(res, 400, error);
    }
}

const postvote = async (req, res) => {
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
}

const homefeed = async (req, res) => {
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
            select: 'tribeName tribeProfileImage id post_saved_by' // Select the fields to return for the tribe
        });

        const userId = new mongoose.Types.ObjectId(req.user);

        const populatedPostsWithFlags = populatedPosts.map(post => {
            const postObj = post.toObject();
            postObj.isSaved = postObj.post_saved_by.some(id => id.equals(userId));
            postObj.isHide = postObj.post_hidden_by.some(id => id.equals(userId));
            postObj.isUpVoted = postObj.up_vote_users.some(id => id.equals(userId));
            postObj.isDownVoted = postObj.down_vote_users.some(id => id.equals(userId));
            return postObj;
        });

        return successResponse(res, 200, populatedPostsWithFlags);
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const popularpost = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const posts = await Post.find().sort({ total_vote: -1, created_at: -1 }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)

        const populatedPosts = await Post.populate(posts, {
            path: 'posted_tribe_id', // The field to populate (posted_tribe_id)
            select: 'tribeName tribeProfileImage id' // Select the fields to return for the tribe
        });

        return successResponse(res, 200, populatedPosts);
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const recentpost = async (req, res) => {
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
}

const trendingtoday = async (req, res) => {
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
}

const searchpost = async (req, res) => {
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
}

const alluserpost = async (req, res) => {
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
}

const savepost = async (req, res) => {
    try {
        const { post_id } = req.body;

        const post = await Post.findOne({ _id: post_id });
        const isSaved = post.post_saved_by.includes(req.user);

        await Post.updateOne(
            { _id: post_id },
            isSaved ? { $pull: { post_saved_by: req.user } } : { $addToSet: { post_saved_by: req.user } }
        )
        successResponse(res, 200, `Post ${isSaved ? "removed" : "saved"} successfully.`)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const hidepost = async (req, res) => {
    try {
        const { post_id } = req.body;

        const post = await Post.findOne({ _id: post_id });
        const isHidden = post.post_hidden_by.includes(req.user);

        await Post.updateOne(
            { _id: post_id },
            isHidden ? { $pull: { post_hidden_by: req.user } } : { $addToSet: { post_hidden_by: req.user } }
        )
        successResponse(res, 200, `Post ${isHidden ? "revealed" : "hidden"} successfully.`)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

module.exports = { createpost, gettribePost, getpost, postvote, homefeed, popularpost, recentpost, trendingtoday, searchpost, alluserpost, savepost, hidepost }