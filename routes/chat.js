const validate = require('../middileware/validate');
const router = require('express').Router();

const {auth} = require('../middileware/auth');
const { createChatRoomValidation } = require('../validation/chat');
const { createchatroom, chatroomexist, getalluserchatrooms, sendmessage, getallmessage, getchatroomdetails } = require('../controllers/chatControllers');

router.post('/createchatroom', createChatRoomValidation, validate, auth, createchatroom);

router.get('/chatroomexist/:id', auth, chatroomexist)

router.get('/getalluserchatrooms', auth, getalluserchatrooms);

router.post('/sendmessage', auth, sendmessage)

router.get('/getallmessage/:id', auth, getallmessage)

router.get('/getchatroomdetails/:id', auth, getchatroomdetails)

module.exports = router