const express = require('express');
const validate = require('../middileware/validate');
const router = require('express').Router();

const User = require('../models/user');
const Tribe = require('../models/tribe');
const Post = require('../models/posts');
const Comment = require('../models/comments');

const auth = require('../middileware/auth');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { successResponse, failedResponse } = require('../utils');
const { createCommentValidation, replyCommentValidation } = require('../validation/comments');
const { default: mongoose } = require('mongoose');
const { STANDARD_PAGE_LIMIT } = require('../constant');

router.post('/postcomment', createCommentValidation, validate, auth, async (req, res) => {
    try {
        const { comment_text, post_id, } = req.body;
        const comment = await Comment.create({
            comment_text: comment_text,
            post_id: post_id,
            created_by: req.user
        })
        if (!comment) {
            failedResponse(res, 400, 'Not able to create a comment');
            return;
        }
        successResponse(res, 200, comment)
        return;
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

router.post('/replytocomment', replyCommentValidation, validate, auth, async (req, res) => {
    try {
        const { comment_text, comment_id } = req.body;
        const commentExist = await Comment.findOne({ _id: comment_id });
        if (!commentExist) {
            failedResponse(res, 400, 'Comment does not exist');
            return;
        }
        const saveComment = await Comment.create({
            comment_text: comment_text,
            created_by: req.user
        })

        await Comment.updateOne({ _id: saveComment._id }, { parent_comment_ids: comment_id })

        successResponse(res, 200, saveComment)
    } catch (error) {
        failedResponse(res, 400, error);
    }
})

function buildTree(commentList) {
    const commentMap = new Map();

    // Step 1: Create a map with all comments by ID
    commentList.forEach(comment => {
        comment.reply ?
            commentMap.set(comment.reply._id, {
                ...comment.reply,
                replies: [] // Initialize the replies array
            }) : null;
    });

    const rootComments = [];

    // Step 2: Link replies to their respective parents
    commentList.forEach(comment => {
        if (comment.reply) {
            const currentComment = commentMap.get(comment.reply._id);

            if (comment.reply.depth > 0) {
                // If it's a reply, find its parent and add it to the parent's replies array
                const parentComment = commentMap.get(comment.reply.parent_comment_ids);
                if (parentComment) {
                    parentComment.replies.push({
                        ...currentComment,
                        reply_creator: comment.reply_creator,
                    });
                }
            } else {
                // If it's a root comment, add it to the rootComments array
                rootComments.push({
                    ...currentComment,
                    reply_creator: comment.reply_creator,
                });
            }
        }
    });

    return rootComments;
}


router.get('/comments/:postId', auth, async (req, res) => {
    const { postId } = req.params;

    try {
        // Step 1: Fetch all comments and replies for the specified post
        const comments = await Comment.aggregate([
            { $match: { post_id: new mongoose.Types.ObjectId(postId) } },

            // Lookup for creator details of parent comments
            {
                $lookup: {
                    from: "users",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "creator",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                profile_avtar:1
                            },
                        },
                    ],
                },
            },

            // Unwind creator array
            {
                $unwind: {
                    path: "$creator",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Step 2: Use $graphLookup to recursively find replies to each comment
            {
                $graphLookup: {
                    from: 'comments', // The collection to search in
                    startWith: '$_id', // Start with the current comment
                    connectFromField: '_id', // Field for parent comment
                    connectToField: 'parent_comment_ids', // Field in replies that references the parent
                    as: 'replies', // Name the result field as "replies"
                    maxDepth: 20, // Optional: set the depth limit
                    depthField: 'depth' // Add a depth field to track how deep the reply is
                }
            },

            {
                $unwind: {
                    path: "$replies",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Lookup for creator details of replies (nested)
            {
                $lookup: {
                    from: "users",
                    localField: "replies.created_by",
                    foreignField: "_id",
                    as: "replies_creator",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                            },
                        },
                    ],
                },
            },

            // Unwind creator array for replies
            {
                $unwind: {
                    path: "$replies_creator",
                    preserveNullAndEmptyArrays: true,
                },
            },



            // Step 3: Sort by creation date
            { $sort: { created_at: 1 } },

            {
                $sort: { 'replies.depth': -1 },
            },

            {
                $group: {
                    _id: "$_id",
                    comment_text: { $first: "$comment_text" },
                    total_comment_vote: { $first: "$total_comment_vote" },
                    post_id: { $first: "$post_id" },
                    created_by: { $first: "$created_by" },
                    created_at: { $first: "$created_at" },
                    updated_at: { $first: "$updated_at" },
                    creator: { $first: "$creator" },
                    replies: { $push: { reply: "$replies", reply_creator: "$replies_creator" } },
                },
            },

        ]);

        const commentsCopy = JSON.parse(JSON.stringify(comments));

        commentsCopy.map(comment => {
            const newreplies = buildTree(comment.replies)
            comment.replies = newreplies;
        })

        // Step 3: Return the modified result
        successResponse(res, 200, commentsCopy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

router.get('/searchcomment', async (req, res) => {
    try {
        const { page = 1, limit = STANDARD_PAGE_LIMIT } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const query = req.query.q;

        const comments = await Comment.find({
            comment_text: { $regex: query, $options: 'i' }
        }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)

        const commentsWithPosts = await Promise.all(
            comments.map(async (comment) => {
                // check if comment i parent comment
                if (comment.post_id) {
                    return comment;
                }

                let current = comment

                // find the current parent_id and assign it 
                while (current && !current.post_id) {
                    current = await Comment.findById(current.parent_comment_ids)
                }

                // assign the post_id to comment
                if (current && current.post_id) {
                    comment.post_id = current.post_id
                }
                return comment;
            })
        )

        const populatedCommentedUser = await Comment.populate(commentsWithPosts, {
            path: 'created_by',
            select: 'username profile_avtar id'
        })

        const populatedPosts = await Comment.populate(populatedCommentedUser, {
            path: 'post_id',
            select: 'total_vote content_title posted_tribe_id id created_at'
        })

        const finalPopulate = await Comment.populate(populatedPosts, {
            path: 'post_id.posted_tribe_id',
            select: 'tribeName tribeProfileImage id'
        })

        return successResponse(res, 200, finalPopulate);
    } catch (error) {
        return failedResponse(res, 400, error);
    }
});


router.get('/allusercomment', auth, async (req, res) => {
    try {
        const { page = 1, limit = STANDARD_PAGE_LIMIT } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);

        const comments = await Comment.find({
            created_by: req.user
        }).skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ created_at: -1 })

        const commentsWithPosts = await Promise.all(
            comments.map(async (comment) => {
                // check if comment i parent comment
                if (comment.post_id) {
                    return comment;
                }

                let current = comment

                // find the current parent_id and assign it 
                while (current && !current.post_id) {
                    current = await Comment.findById(current.parent_comment_ids)
                }

                // assign the post_id to comment
                if (current && current.post_id) {
                    comment.post_id = current.post_id
                }
                return comment;
            })
        );

        const populatedComments = await Comment.populate(commentsWithPosts, [
            { path: 'post_id', select: 'content_title posted_tribe_id' },
            { path: 'parent_comment_ids', select: 'created_by' },
        ]);

        const finalPopulate = await Comment.populate(populatedComments, [
            {
                path: 'parent_comment_ids.created_by',
                select: 'username'
            },
            { path: 'post_id.posted_tribe_id', select: 'tribeName tribeProfileImage' },
        ])

        return successResponse(res, 200, finalPopulate)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
})


module.exports = router;

