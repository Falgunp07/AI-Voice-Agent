const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Send photos via WhatsApp
router.post('/send-photos', whatsappController.sendPhotosViaWhatsApp);
// Send a city summary with media
router.post('/send-summary', whatsappController.sendCitySummary);

// Receive WhatsApp webhook
router.post('/webhook', whatsappController.receiveWhatsAppMessage);

module.exports = router;
