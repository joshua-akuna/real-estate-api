const express = require('express');
const {
  sendMessage,
  getInbox,
  getSentMessages,
  getMessageThread,
  markAsRead,
} = require('../controllers/messageController');
const { sendMessageValidator } = require('../middleware/validators');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', sendMessageValidator, authenticate, sendMessage);
router.get('/inbox', authenticate, getInbox);
router.get('/sent', authenticate, getSentMessages);
router.get('/thread/:user_id', authenticate, getMessageThread);
router.patch('/:id/read', authenticate, markAsRead);

module.exports = router;
