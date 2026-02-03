const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  userMessage: {
    type: String,
    required: true,
  },
  botResponse: {
    type: String,
    required: true,
  },
  intent: {
    type: String,
    enum: ['property_list', 'rent_query', 'photo_request', 'availability_check', 'amenities_query', 'location_query', 'lead_capture', 'general'],
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Conversation', ConversationSchema);
