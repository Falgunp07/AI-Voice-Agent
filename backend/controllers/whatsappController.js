const Lead = require('../models/Lead');
const Property = require('../models/Property');

// Send property photos via WhatsApp
exports.sendPhotosViaWhatsApp = async (req, res) => {
  try {
    const { phone, propertyId, leadName } = req.body;

    // Validate phone format
    if (!phone || !phone.match(/^\d{10}$/)) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
    }

    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Create lead record
    const lead = new Lead({
      name: leadName || 'User',
      phone: phone,
      whatsapp: phone,
      property: propertyId,
      queryType: 'photos',
      status: 'new',
    });
    await lead.save();

    // Try real WhatsApp send via Twilio if configured, else simulate
    const message = `Hello ${lead.name}! Here are the photos for ${property.title} (${property.location}). Rent: Rs. ${property.rent}/month.`;

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
      const twilio = require('twilio');
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const mediaUrls = (property.photos || []).map(p => p.url).slice(0, 5); // WhatsApp supports multiple media
      try {
        const resp = await client.messages.create({
          from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:+91${phone}`,
          body: message,
          mediaUrl: mediaUrls,
        });
        return res.json({ success: true, mode: 'twilio', sid: resp.sid, leadId: lead._id, phone });
      } catch (twilioErr) {
        console.error('Twilio WhatsApp send error:', twilioErr.message);
        // Fallthrough to simulated response
      }
    }

    // Simulated response when Twilio not configured
    res.json({
      success: true,
      mode: 'simulated',
      message: 'Simulated WhatsApp send (configure Twilio env to send for real)',
      preview: { text: message, media: (property.photos || []).map(p => p.url) },
      leadId: lead._id,
      phone,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Receive WhatsApp webhook
exports.receiveWhatsAppMessage = async (req, res) => {
  try {
    const { From, Body, SmsStatus, MessageSid } = req.body;
    // Normalize phone
    const phone = (From || '').replace(/[^\d]/g, '').slice(-10);
    const Lead = require('../models/Lead');
    if (phone) {
      const lead = await Lead.findOne({ whatsapp: phone });
      if (lead) {
        lead.messageSid = MessageSid || lead.messageSid;
        lead.messageStatus = SmsStatus || lead.messageStatus;
        lead.lastContactedAt = new Date();
        lead.lastChannel = 'whatsapp';
        await lead.save();
      }
    }
    console.log(`WhatsApp inbound from ${From}: ${Body}`);
    res.json({ status: 'Message received' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a WhatsApp summary with text + up to 5 photos for a city
exports.sendCitySummary = async (req, res) => {
  try {
    const { phone, city } = req.body;
    if (!phone || !phone.match(/^\d{10}$/)) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
    }
    const Property = require('../models/Property');
    const props = await Property.find({ location: new RegExp(city, 'i'), availability: true }).limit(3);
    if (props.length === 0) {
      return res.json({ success: true, message: `No available properties found in ${city}` });
    }

    const summary = props.map(p => `${p.title} - Rs. ${p.rent}/month`).join('\n');
    const text = `Properties in ${city}:\n${summary}`;
    const mediaUrls = [];
    props.forEach(p => (p.photos || []).slice(0, 1).forEach(ph => mediaUrls.push(ph.url)));

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
      const twilio = require('twilio');
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      try {
        const resp = await client.messages.create({
          from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:+91${phone}`,
          body: text,
          mediaUrl: mediaUrls.slice(0, 5),
        });
        return res.json({ success: true, mode: 'twilio', sid: resp.sid });
      } catch (err) {
        console.error('Twilio WhatsApp summary error:', err.message);
      }
    }

    res.json({ success: true, mode: 'simulated', preview: { text, media: mediaUrls.slice(0, 5) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
