const express = require('express');
const { sendMessage } = require('../controllers/messageController');
const { sendMessageValidator } = require('../middleware/validators');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', sendMessageValidator, authenticate, sendMessage);

module.exports = router;
