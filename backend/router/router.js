const express = require('express');
const router  = express.Router();

const {
    register, login,
    getTopics, getTopic, createTopic, updateTopic, deleteTopic,
    getMessages, createMessage, deleteMessage,
    voteMessage,
    getProfile, updateProfile,
    getFriends, sendFriendRequest, respondFriendRequest, removeFriend,
    getNotifications, markNotificationsRead,
    getTags,
    getUsers, banUser, unbanUser,
} = require('../controller/controller.js');

/* ── Auth ─────────────────────────────────────────── */
router.post('/register', register);
router.post('/login',    login);

/* ── Topics ───────────────────────────────────────── */
router.get   ('/topics',     getTopics);
router.post  ('/topics',     createTopic);
router.get   ('/topics/:id', getTopic);
router.patch ('/topics/:id', updateTopic);
router.delete('/topics/:id', deleteTopic);

/* ── Messages ─────────────────────────────────────── */
router.get   ('/topics/:id/messages',              getMessages);
router.post  ('/topics/:id/messages',              createMessage);
router.delete('/topics/:topicId/messages/:msgId',  deleteMessage);

/* ── Votes ────────────────────────────────────────── */
router.post('/messages/:msgId/vote', voteMessage);

/* ── Profile ──────────────────────────────────────── */
router.get  ('/profile/:userId', getProfile);
router.patch('/profile/:userId', updateProfile);

/* ── Friends ──────────────────────────────────────── */
router.get   ('/friends/:userId',                  getFriends);
router.post  ('/friends',                          sendFriendRequest);
router.patch ('/friends/:friendshipId',            respondFriendRequest);
router.delete('/friends/:userId/:targetId',        removeFriend);

/* ── Notifications ────────────────────────────────── */
router.get  ('/notifications/:userId',  getNotifications);
router.patch('/notifications/:userId',  markNotificationsRead);

/* ── Tags ─────────────────────────────────────────── */
router.get('/tags', getTags);

/* ── Admin ────────────────────────────────────────── */
router.get   ('/admin/users',       getUsers);
router.patch ('/admin/users/:id/ban',   banUser);
router.patch ('/admin/users/:id/unban', unbanUser);

module.exports = router;
