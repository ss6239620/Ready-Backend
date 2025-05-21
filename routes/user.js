const { signupValidation, loginValidation } = require('../validation/user');
const validate = require('../middileware/validate');
const router = require('express').Router();
const { auth } = require('../middileware/auth');
const { upload, multerErrorHandler } = require('../middileware/fileUpload');
const { login, logout, signup, oauthRegister, jointribe, userSerach, getuserinfo, } = require('../controllers/userController');


router.post('/signup', upload.fields([
    { name: 'profile_avtar', maxCount: 1 }
]), multerErrorHandler, signupValidation, validate, signup)

router.post('/login', loginValidation, validate, login)

router.post('/logout', logout);

router.get('/oauthRegister', oauthRegister);

router.post('/jointribe', auth, jointribe)

router.get('/usersearch', userSerach)

router.get('/getuserinfo/:id', getuserinfo)

module.exports = router
    