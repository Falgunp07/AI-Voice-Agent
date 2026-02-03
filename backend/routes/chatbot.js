const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Process user query
router.post('/query', chatbotController.processQuery);

module.exports = router;
