const User = require('../models/user');
const Tribe = require('../models/tribe');
const Post = require('../models/posts');
const Comment = require('../models/comments');

const { successResponse, failedResponse } = require('../utils');
const { STANDARD_PAGE_LIMIT } = require('../constant');

const postcomment = async (req, res) => {
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
}

const replytocomment = async (req, res) => {
    try {
        const { comment_text, comment_id } = req.body;
        const commentExist = await Comment.findOne({ _id: comment_id });
        if (!commentExist) {
            failedResponse(res, 400, 'Comment does not exist');
            return;
        }
        const saveComment = await Comment.create({
            comment_text: comment_text,
            created_by: req.user,
            parent_comment_id: comment_id
        })

        await Comment.updateOne({ _id: comment_id }, { $addToSet: { child_comment_ids: saveComment._id } })

        successResponse(res, 200, saveComment)
    } catch (error) {
        failedResponse(res, 400, error);
    }
}

const getcomment = async (req, res) => {
    try {
        const { page = 1, limit = STANDARD_PAGE_LIMIT, maxDepth = 3 } = req.query;
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const post_id = req.query.id;

        const rootComments = await Comment.find({ post_id: post_id, parent_comment_id: null })
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .populate('created_by', 'username profile_avtar')
            .sort({ created_at: -1 })
            .exec();

        // For each root comment, get its children (and grandchildren, etc.) up to maxDepth
        for (let rootComment of rootComments) {
            rootComment.child_comment_ids = await getCommentsRecursive(rootComment._id, 1, maxDepth);
        }

        return successResponse(res, 200, rootComments);

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

const searchcomment = async (req, res) => {
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
                    current = await Comment.findById(current.parent_comment_id)
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
}

const allusercomment = async (req, res) => {
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
                    current = await Comment.findById(current.parent_comment_id)
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
            { path: 'parent_comment_id', select: 'created_by' },
        ]);

        const finalPopulate = await Comment.populate(populatedComments, [
            {
                path: 'parent_comment_id.created_by',
                select: 'username'
            },
            { path: 'post_id.posted_tribe_id', select: 'tribeName tribeProfileImage' },
        ])

        return successResponse(res, 200, finalPopulate)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
}

module.exports = { postcomment, replytocomment, getcomment, searchcomment,allusercomment }


//utils function

const getCommentsRecursive = async (parentId, depth = 1, maxDepth = 3) => {
    if (depth > maxDepth) return 0;

    // Get child comments for the given parent comment ID
    const children = await Comment.find({ parent_comment_id: parentId })
        .populate('created_by', 'username profile_avtar') // populate user data (example)
        .exec();

    // Recursively fetch children for each child comment (up to maxDepth)
    for (let child of children) {
        child.child_comment_ids = await getCommentsRecursive(child._id, depth + 1, maxDepth);
    }

    return children;
};