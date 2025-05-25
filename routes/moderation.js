const validate = require('../middileware/validate');
const router = require('express').Router();

const { auth, mod } = require('../middileware/auth');
const { createtriberules, updatetriberules, deletetriberule, getalltriberules, getqueuecontent, getstatusbasedcontent, changecontentstatus, getbanuser, banuser, updateuserban, invitemember, updateinvite, deleteinvite, removeduserban, getalltribemember, createmodlog, gettribemodlogs, updatetribesettings, updatetribesafetyfilters, createsavedresponse, updatesavedresponse, deletesavedresponse ,searchbanusers} = require('../controllers/modController');
const { createRulesValidation, updateRulesValidation, changeStatusValidation, bannedUserValidation, userBannedValidation, inviteUserValidation, updateInviteValidation,  createModLogValidation, createSvaedResponseValidation, updateSvaedResponseValidation } = require('../validation/moderation');

router.post('/createtriberule', createRulesValidation, validate, auth, mod, createtriberules);

router.patch('/updatetriberule', updateRulesValidation, validate, auth, mod, updatetriberules);

router.delete('/deletetriberule',  auth, mod, deletetriberule);

router.get('/getalltriberules', auth, mod, getalltriberules);

router.get('/getqueuecontent', auth, mod, getqueuecontent);

router.patch('/changecontentstatus', changeStatusValidation, validate, auth, mod, changecontentstatus);

router.get('/getstatusbasedcontent', auth, mod, getstatusbasedcontent);

router.post('/banuser', bannedUserValidation, validate, auth, mod, banuser);

router.patch('/updateuserban', userBannedValidation, validate, auth, mod, updateuserban);

router.delete('/removeduserban',  auth, mod, removeduserban);

router.get('/getbanuser', auth, mod, getbanuser);

router.get('/searchbanusers', auth, mod, searchbanusers);

router.post('/invitemember', inviteUserValidation, validate, auth, mod, invitemember);

router.patch('/updateinvite', updateInviteValidation, validate, auth, mod, updateinvite);

router.delete('/deleteinvite',  auth, mod, deleteinvite);

router.get('/getalltribemember', auth, mod, getalltribemember); gettribemodlogs

router.post('/createmodlog', createModLogValidation, validate, auth, mod, createmodlog);

router.get('/gettribemodlogs', auth, mod, gettribemodlogs);

router.patch('/updatetribesettings', auth, mod, updatetribesettings);

router.patch('/updatetribesafetyfilters', auth, mod, updatetribesafetyfilters);

router.post('/createsavedresponse', createSvaedResponseValidation, validate, auth, mod, createsavedresponse);

router.patch('/updatesavedresponse',updateSvaedResponseValidation,validate, auth, mod, updatesavedresponse);

router.delete('/deletesavedresponse',  auth, mod, deletesavedresponse);

module.exports = router