const validate = require('../middileware/validate');
const router = require('express').Router();

const User = require('../models/user');
const Tribe = require('../models/tribe');
const Post = require('../models/posts');

const {auth} = require('../middileware/auth');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { successResponse, failedResponse, processUploadedFile } = require('../utils');
const { createPostValidation, createPostCommentValidation } = require('../validation/posts');

const dotenv = require('dotenv');
const { createpost, gettribePost, getpost, postvote, homefeed, popularpost, recentpost, trendingtoday, searchpost, alluserpost } = require('../controllers/postController');
dotenv.config();

router.post('/createpost', upload.fields([
    { name: "content", maxCount: 1 }
]), multerErrorHandler, createPostValidation, validate, auth, createpost)

router.get('/gettribePost/:id', auth, gettribePost)

router.get('/getpost/:id', auth, getpost)

router.post('/postvote', createPostCommentValidation, validate, auth, postvote);

router.get('/homefeed', auth, homefeed)

router.get('/popularpost', popularpost)

router.get('/recentpost', auth, recentpost)

router.get('/trendingtoday', trendingtoday)

router.get('/searchpost', searchpost);

router.get('/alluserpost', auth, alluserpost);


module.exports = router;