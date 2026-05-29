const express = require ('express');
const router = express.Router();
const {register, login, createTopic, getTopics} = require('../controller/controller.js');

router.post('/register', register);
router.post('/login', login);

router.post('/topics', createTopic);
router.get('/topics', getTopics);

module.exports = router;