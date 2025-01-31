const validate = require('../middileware/validate');
const router = require('express').Router();

const { auth, mod } = require('../middileware/auth');
const { createtriberules, updatetriberules, deletetriberule, getalltriberules, getallunmoderatedcontent, getstatusbasedcontent, changecontentstatus, getbanuser, banuser, updateuserban, invitemember, updateinvite, deleteinvite, removeduserban, getalltribemember } = require('../controllers/modController');
const { createRulesValidation, updateRulesValidation, deleteRulesValidation, changeStatusValidation, bannedUserValidation, userBannedValidation, inviteUserValidation, updateInviteValidation, deleteInviteValidation, deleteUserBannedValidation } = require('../validation/moderation');

router.post('/createtriberule', createRulesValidation, validate, auth, mod, createtriberules);

router.post('/updatetriberule', updateRulesValidation, validate, auth, mod, updatetriberules);

router.post('/deletetriberule', deleteRulesValidation, validate, auth, mod, deletetriberule);

router.get('/getalltriberules', auth, mod, getalltriberules);

router.get('/getallunmoderatedcontent', auth, mod, getallunmoderatedcontent);

router.post('/changecontentstatus', changeStatusValidation, validate, auth, mod, changecontentstatus);

router.get('/getstatusbasedcontent', auth, mod, getstatusbasedcontent);

router.post('/banuser', bannedUserValidation, validate, auth, mod, banuser);

router.post('/updateuserban', userBannedValidation, validate, auth, mod, updateuserban);

router.post('/removeduserban', deleteUserBannedValidation, validate, auth, mod, removeduserban);

router.get('/getbanuser', auth, mod, getbanuser);

router.post('/invitemember', inviteUserValidation, validate, auth, mod, invitemember);

router.post('/updateinvite', updateInviteValidation, validate, auth, mod, updateinvite);

router.post('/deleteinvite', deleteInviteValidation, validate, auth, mod, deleteinvite);

router.get('/getalltribemember', auth, mod, getalltribemember);

module.exports = router