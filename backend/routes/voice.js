const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

// Initiate outbound call
router.post('/call', voiceController.initiateCall);

// TwiML handler to speak dynamic content
router.get('/twiml', voiceController.twimlHandler);
// Voice status webhook (Twilio will POST here)
router.post('/webhook', voiceController.webhook);

module.exports = router;
