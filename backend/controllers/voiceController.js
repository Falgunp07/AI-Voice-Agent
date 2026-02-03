const twilio = require('twilio');
const Property = require('../models/Property');

// Safely get Twilio client if env vars are present
function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return null;
}

// Initiate an outbound call to the customer
exports.initiateCall = async (req, res) => {
  try {
    const { to, city, propertyId } = req.body;
    if (!to) return res.status(400).json({ message: 'Destination phone number required' });

    // Build TwiML URL with query describing what to read
    const baseUrl = process.env.PUBLIC_BASE_URL || process.env.NGROK_URL || '';
    const queryParams = new URLSearchParams();
    if (city) queryParams.set('city', city);
    if (propertyId) queryParams.set('propertyId', propertyId);
    const twimlUrl = `${baseUrl}/api/voice/twiml?${queryParams.toString()}`;

    const client = getTwilioClient();
    const from = process.env.TWILIO_CALLER_ID; // Verified outgoing caller ID or Twilio number

    if (client && from && baseUrl) {
      const call = await client.calls.create({
        from,
        to,
        url: twimlUrl,
        machineDetection: 'Enable',
      });
      return res.json({ success: true, mode: 'twilio', callSid: call.sid });
    }

    // Fallback simulation when Twilio not configured
    return res.json({ success: true, mode: 'simulated', message: 'Twilio not configured. Simulating call.', twimlPreview: twimlUrl });
  } catch (error) {
    console.error('initiateCall error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Dynamic TwiML that speaks property summary/details
exports.twimlHandler = async (req, res) => {
  try {
    const { city, propertyId } = req.query;

    let speech = 'Hello! Here is the latest property information.';

    if (propertyId) {
      const prop = await Property.findById(propertyId);
      if (prop) {
        speech = `Hello! ${prop.title} in ${prop.location}. Rent is rupees ${prop.rent} per month, with ${prop.bedrooms} bedrooms and ${prop.bathrooms} bathrooms.`;
      }
    } else if (city) {
      const props = await Property.find({ location: new RegExp(city, 'i'), availability: true }).limit(3);
      if (props.length > 0) {
        speech = `We currently have ${props.length} properties available in ${city}. Top option: ${props[0].title} for rupees ${props[0].rent} per month. Would you like us to WhatsApp photos after this call?`;
      } else {
        speech = `Currently we do not have properties available in ${city}.`;
      }
    }

    const response = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say language="en-IN" voice="Polly.Aditi">${speech}</Say>\n</Response>`;
    res.set('Content-Type', 'text/xml');
    res.send(response);
  } catch (error) {
    console.error('twimlHandler error:', error);
    res.status(500).send('<Response><Say>Sorry, an error occurred.</Say></Response>');
  }
};

// Voice webhook to track call events and update lead status
exports.webhook = async (req, res) => {
  try {
    const { CallSid, CallStatus, To } = req.body;
    // Try to find a lead by phone 'To' number (strip prefixes)
    const phone = (To || '').replace(/[^\d]/g, '').slice(-10);
    if (phone) {
      const Lead = require('../models/Lead');
      const lead = await Lead.findOne({ phone });
      if (lead) {
        lead.callSid = CallSid || lead.callSid;
        lead.callStatus = CallStatus || lead.callStatus;
        lead.lastContactedAt = new Date();
        lead.lastChannel = 'voice';
        await lead.save();
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('voice webhook error:', error);
    res.status(500).json({ message: error.message });
  }
};
