const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  whatsapp: {
    type: String,
  },
  email: {
    type: String,
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
  },
  queryType: {
    type: String,
    enum: ['rent', 'photos', 'availability', 'amenities', 'general'],
  },
  // Consent & contact preferences
  optInWhatsApp: { type: Boolean, default: false },
  optInVoice: { type: Boolean, default: true },
  consentSource: { type: String },
  consentAt: { type: Date },
  lastContactedAt: { type: Date },
  lastChannel: { type: String, enum: ['voice', 'whatsapp', 'sms', 'email'] },
  // Call/message tracking
  callSid: { type: String },
  callStatus: { type: String },
  messageSid: { type: String },
  messageStatus: { type: String },
  status: {
    type: String,
    enum: ['new', 'contacted', 'interested', 'closed'],
    default: 'new',
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Lead', LeadSchema);
