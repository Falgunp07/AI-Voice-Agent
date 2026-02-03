const axios = require('axios');

const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'phi';

// System prompt for real estate assistant - SHORT & FAST
const SYSTEM_PROMPT = `You are a real estate assistant. Answer briefly and helpfully.`;

/**
 * Generate response using Llama 2
 * @param {string} userQuery - User's input query
 * @param {Array} propertyContext - Optional array of property data for context
 * @returns {Promise<string>} - LLM generated response
 */
exports.generateResponse = async (userQuery, propertyContext = []) => {
  try {
    // Build context from properties if available
    let contextStr = '';
    if (propertyContext.length > 0) {
      contextStr = 'Available properties:\n';
      propertyContext.forEach((prop) => {
        contextStr += `- ${prop.title} (${prop.location}): ₹${prop.rent}/month, ${prop.bedrooms} BHK\n`;
      });
      contextStr += '\n';
    }

    const prompt = `${SYSTEM_PROMPT}\n\n${contextStr}User: ${userQuery}\nAssistant:`;

    console.log('Calling Ollama API at:', OLLAMA_API);
    console.log('Using model:', MODEL);

    const response = await axios.post(OLLAMA_API, {
      model: MODEL,
      prompt: prompt,
      stream: false,
      temperature: 0.3,
      top_k: 20,
      top_p: 0.9,
    }, { timeout: 30000 });

    return response.data.response.trim();
  } catch (error) {
    console.error('Phi Error:', error.message);
    console.error('Endpoint:', OLLAMA_API);
    throw new Error('Failed to generate response from LLM');
  }
};

/**
 * Detect intent using Llama 2 (replaces rule-based detection)
 * @param {string} query - User query
 * @returns {Promise<string>} - Detected intent
 */
exports.detectIntent = async (query) => {
  try {
    const intentPrompt = `Classify the user's intent into ONE of these categories:
- property_list: asking for properties in a location
- rent_query: asking about rent/pricing
- photo_request: asking to see photos
- availability_check: checking if property is available
- amenities_query: asking about facilities/amenities
- location_query: asking about location details
- general: other questions

User query: "${query}"
Intent:`;

    const response = await axios.post(OLLAMA_API, {
      model: MODEL,
      prompt: intentPrompt,
      stream: false,
      temperature: 0.3,
    });

    const intent = response.data.response.trim().toLowerCase();
    
    // Map response to valid intents
    if (intent.includes('property_list')) return 'property_list';
    if (intent.includes('rent')) return 'rent_query';
    if (intent.includes('photo')) return 'photo_request';
    if (intent.includes('available')) return 'availability_check';
    if (intent.includes('amenities') || intent.includes('facilities')) return 'amenities_query';
    if (intent.includes('location')) return 'location_query';
    return 'general';
  } catch (error) {
    console.error('Intent Detection Error:', error.message);
    return 'general'; // fallback to general intent
  }
};

/**
 * Extract location from query using Llama 2
 * @param {string} query - User query
 * @returns {Promise<string|null>} - Extracted location
 */
exports.extractLocation = async (query) => {
  try {
    const prompt = `Extract the city/location name from this query. Return ONLY the location name, nothing else.
If no location is mentioned, return "NONE".

Query: "${query}"
Location:`;

    const response = await axios.post(OLLAMA_API, {
      model: MODEL,
      prompt: prompt,
      stream: false,
      temperature: 0.1,
    });

    const location = response.data.response.trim();
    return location === 'NONE' ? null : location;
  } catch (error) {
    console.error('Location Extraction Error:', error.message);
    return null;
  }
};

/**
 * Generate property recommendation description using Llama 2
 * @param {object} property - Property object
 * @returns {Promise<string>} - Generated description
 */
exports.generatePropertyDescription = async (property) => {
  try {
    const prompt = `Generate a brief, engaging property description for a real estate listing based on this data:
Title: ${property.title}
Type: ${property.bedrooms}BHK
Rent: ₹${property.rent}/month
Location: ${property.location}
Amenities: ${property.amenities.join(', ')}
Available: ${property.availability ? 'Yes' : 'No'}

Keep it under 50 words and make it compelling.`;

    const response = await axios.post(OLLAMA_API, {
      model: MODEL,
      prompt: prompt,
      stream: false,
      temperature: 0.7,
    });

    return response.data.response.trim();
  } catch (error) {
    console.error('Description Generation Error:', error.message);
    return property.description; // fallback to original
  }
};
