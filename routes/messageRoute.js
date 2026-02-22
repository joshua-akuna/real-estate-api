const express = require('express');
const {
  sendMessage,
  getInbox,
  getSentMessages,
} = require('../controllers/messageController');
const { sendMessageValidator } = require('../middleware/validators');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', sendMessageValidator, authenticate, sendMessage);
router.get('/inbox', authenticate, getInbox);
router.get('/sent', authenticate, getSentMessages);

module.exports = router;
