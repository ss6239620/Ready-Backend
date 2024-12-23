const express = require('express');
const validate = require('../middileware/validate');
const router = require('express').Router();

const User = require('../models/user');
const Tribe = require('../models/tribe');
const Comment = require('../models/comments');
const Message = require('../models/messages');
const ChatRoom = require('../models/chatRooms');

const auth = require('../middileware/auth');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { successResponse, failedResponse } = require('../utils');
const { createChatRoomValidation } = require('../validation/chat');
const { default: mongoose } = require('mongoose');
const { STANDARD_PAGE_LIMIT } = require('../constant');


router.post('/createchatroom', createChatRoomValidation, validate, auth, async (req, res) => {
    try {
        const { user_id, message } = req.body

        const user = await User.findById(user_id);

        const chat = await ChatRoom.create(
            {
                is_group_chat_room: false,
                chat_room_name: user.username,
                chat_room_picture: user.profile_avtar,
                created_by: req.user,
                chat_room_members: [req.user, user_id],
            }
        );

        const newMessage = await Message.create(
            {
                chat_room_id: chat._id,
                sender: req.user,
                read_by: [req.user],
                message: message
            }
        )

        chat.latest_message = newMessage._id;
        await chat.save();

        return successResponse(res, 200, chat._id)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
});


router.get('/chatroomexist/:id', auth, async (req, res) => {
    try {
        const user_id = req.params.id;

        const chatRoomExist = await ChatRoom.findOne({
            is_group_chat_room: false,
            $and: [
                { chat_room_members: { $elemMatch: { $eq: req.user } } },
                { chat_room_members: { $elemMatch: { $eq: user_id } } },
            ]
        }).select('id');

        return successResponse(res, 200, chatRoomExist)

    } catch (error) {
        return failedResponse(res, 400, error);
    }
})



router.get('/getalluserchatrooms', auth, async (req, res) => {
    try {
        const chatRooms = await ChatRoom.aggregate([
            {
                $match: {
                    chat_room_members: new mongoose.Types.ObjectId(req.user) // Ensure req.user._id is the correct type
                }
            },
            {
                $lookup: {
                    from: 'messages', // Collection name for `latest_message`
                    localField: 'latest_message',
                    foreignField: '_id',
                    as: 'latest_message'
                }
            },
            {
                $unwind: {
                    path: '$latest_message',
                    preserveNullAndEmptyArrays: true // Handles cases with no latest_message
                }
            },
            {
                $sort: {
                    'latest_message.created_at': -1 // Sort by `created_at` in descending order
                }
            }
        ]);

        return successResponse(res, 200, chatRooms);

    } catch (error) {
        return failedResponse(res, 400, error);
    }
});

router.post('/sendmessage', auth, async (req, res) => {
    try {
        const { message, room_id } = req.body;

        let newMessage = await Message.create({
            chat_room_id: room_id,
            message: message,
            sender: req.user
        });
        await ChatRoom.findByIdAndUpdate(room_id, { latest_message: newMessage._id });

        newMessage = await newMessage.populate('sender', 'username profile_avtar');
        newMessage = await newMessage.populate('chat_room_id');
        newMessage = await User.populate(newMessage, {
            path: 'chat_room_id.chat_room_members',
            select: 'username profile_avtar'
        })
        newMessage = await User.populate(newMessage, {
            path: 'chat_room_id.latest_message'
        })

        successResponse(res, 200, newMessage)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

router.get('/getallmessage/:id', auth, async (req, res) => {
    try {
        const room_id = req.params.id;

        const messages = await Message.find({
            chat_room_id: room_id
        }).sort({ created_at: -1 }).populate('sender', 'username profile_avtar')

        successResponse(res, 200, messages)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})

router.get('/getchatroomdetails/:id',auth,async(req,res)=>{
    try {
        const room_id=req.params.id;
        const chatRoom=await ChatRoom.findById(room_id);
        successResponse(res,200,chatRoom)
    } catch (error) {
        return failedResponse(res, 400, error);
    }
})




module.exports = router