const validate = require('../middileware/validate');
const router = require('express').Router();

const User = require('../models/user');
const Tribe = require('../models/tribe');

const {auth} = require('../middileware/auth');
const { createTribeValidation, joinedTribe } = require('../validation/tribe');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { successResponse, failedResponse, processUploadedFile } = require('../utils');
const { createtribe, getalltribe, getalljoinedtribe, gettribedetails, jointribe, isjoinedTribe, isuserCreatedTribe, leavetribefunc, recommendedsearch } = require('../controllers/tribeController');

router.post('/createtribe', upload.fields([
    { name: 'tribebannerimage', maxCount: 1 },  // First file input
    { name: 'tribeprofileimage', maxCount: 1 }   // Second file input
]), multerErrorHandler, createTribeValidation, validate, auth, createtribe)

router.get('/getalltribe', auth, getalltribe)

router.get('/getalljoinedtribe', auth, getalljoinedtribe);

router.get('/gettribedetails/:id', auth, gettribedetails)

router.post('/jointribe', joinedTribe, validate, auth, jointribe)

router.get('/isjoinedtribe/:id', auth, isjoinedTribe)

router.get('/isUserCreatedTribe/:id', auth, isuserCreatedTribe)

router.post('/leavetribe', joinedTribe, validate, auth, leavetribefunc)

router.get('/recommendedsearch', recommendedsearch)

module.exports = router