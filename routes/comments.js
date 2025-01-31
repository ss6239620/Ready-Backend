const validate = require('../middileware/validate');
const router = require('express').Router();

const {auth} = require('../middileware/auth');
const { createCommentValidation, replyCommentValidation } = require('../validation/comments');
const { postcomment, replytocomment, getcomment, searchcomment, allusercomment } = require('../controllers/commentController');

router.post('/postcomment', createCommentValidation, validate, auth, postcomment)

router.post('/replytocomment', replyCommentValidation, validate, auth, replytocomment)

router.get('/getcomment', auth, getcomment)

router.get('/searchcomment', searchcomment);

router.get('/allusercomment', auth, allusercomment)

module.exports = router;

