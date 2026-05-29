const express = require ('express');
const router = express.Router();
const {register, login, createTopic, getTopics, getTopic, updateTopic, deleteTopic, createMessages, getMessages, deleteMessage, vote, getmessages} = require('../controller/controller.js');

router.post('/register', register);
router.post('/login', login);

router.post('/topics', createTopic);
router.get('/topics', getTopics);
router.get('/topics/:id', getTopic);
router.patch('/topics/:id', updateTopic);
router.delete('/topics/:id', deleteTopic);

router.post('/topics/:id/messages', createMessages);
router.get('/topics/:id/messages', getMessages);
router.delete('/topics/:topicId/messages/:messageId', deleteMessage);

router.post('/topics/:topicId/messages/:messageId/vote', vote);

module.exports = router;