const express = require('express');
const {
  sendMessage,
  getInbox,
  getSentMessages,
  getMessageThread,
} = require('../controllers/messageController');
const { sendMessageValidator } = require('../middleware/validators');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', sendMessageValidator, authenticate, sendMessage);
router.get('/inbox', authenticate, getInbox);
router.get('/sent', authenticate, getSentMessages);
router.get('/thread/:user_id', authenticate, getMessageThread);

module.exports = router;
