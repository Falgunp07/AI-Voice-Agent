const Property = require('../models/Property');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const llmService = require('../services/llmService');

// Main chatbot logic with Llama 2 AI
exports.processQuery = async (req, res) => {
  try {
    const { query, sessionId } = req.body;

    // Detect intent using Llama 2
    let intent = await llmService.detectIntent(query);
    let botResponse = '';
    let propertyId = null;
    let photos = null;

    // Get relevant context based on intent
    let propertyContext = [];
    if (['property_list', 'rent_query', 'photo_request', 'amenities_query'].includes(intent)) {
      const locations = await Property.distinct('location');
      const extractedLocation = await llmService.extractLocation(query);
      
      if (extractedLocation) {
        propertyContext = await Property.find({ 
          location: new RegExp(extractedLocation, 'i'), 
          availability: true 
        }).limit(5);
      } else {
        propertyContext = await Property.find({ availability: true }).limit(5);
      }
    }

    // Process based on intent
    if (intent === 'property_list') {
      const listResponse = await handlePropertyListQuery(query);
      botResponse = listResponse.response;
      propertyId = listResponse.propertyId;
      photos = listResponse.photos;
    } else if (intent === 'rent_query') {
      const rentResponse = await handleRentQuery(query, propertyContext);
      botResponse = rentResponse.response;
      propertyId = rentResponse.propertyId;
    } else if (intent === 'photo_request') {
      const photoResponse = await handlePhotoRequest(query);
      botResponse = photoResponse.response;
      propertyId = photoResponse.propertyId;
      photos = photoResponse.photos;
    } else if (intent === 'availability_check') {
      const availResponse = await handleAvailabilityQuery(query);
      botResponse = availResponse;
    } else if (intent === 'amenities_query') {
      const amenResponse = await handleAmenitiesQuery(query, propertyContext);
      botResponse = amenResponse;
    } else if (intent === 'location_query') {
      const locResponse = await handleLocationQuery(query);
      botResponse = locResponse;
    } else {
      // Use Llama 2 for general queries
      botResponse = await llmService.generateResponse(query, propertyContext);
    }

    // Save conversation
    try {
      const conversation = new Conversation({
        sessionId,
        userMessage: query,
        botResponse,
        intent,
        property: propertyId,
      });
      await conversation.save();
    } catch (convError) {
      console.error('Error saving conversation:', convError.message);
    }

    res.json({
      response: botResponse,
      intent,
      propertyId,
      photos,
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ message: error.message });
  }
};

// Handle property list queries (show me properties in X location)
const handlePropertyListQuery = async (query) => {
  try {
    // Extract location from query (tries regex + known DB locations)
    const locations = await Property.distinct('location');
    const lowerQuery = query.toLowerCase();
    let location = null;

    // 1) regex after "in", "at", "near"
    const regexLoc = query.match(/(?:in|at|near)\s+([a-zA-Z ]{2,40})/i);
    if (regexLoc && regexLoc[1]) {
      const candidate = regexLoc[1].trim().toLowerCase();
      location = locations.find((loc) => candidate.includes(loc.toLowerCase()) || loc.toLowerCase().includes(candidate));
    }
    // 2) substring match against known locations
    if (!location) {
      location = locations.find((loc) => lowerQuery.includes(loc.toLowerCase())) || null;
    }

    let properties;
    if (location) {
      properties = await Property.find({ location: new RegExp(location, 'i'), availability: true }).limit(3);
    } else {
      // No location found: ask user to specify instead of dumping all
      return { response: "Please specify the city (e.g., 'properties in Bangalore').", propertyId: null, photos: [] };
    }

    if (properties.length === 0) {
      const locationText = location ? ` in ${location.charAt(0).toUpperCase() + location.slice(1)}` : '';
      return { response: `Sorry, I don't have any properties${locationText} right now.`, propertyId: null, photos: [] };
    }

    // Collect all photos from properties
    const photos = [];
    const locationText = location ? ` in ${location.charAt(0).toUpperCase() + location.slice(1)}` : '';
    let response = `I found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}${locationText}:\n\n`;
    
    properties.forEach((prop, index) => {
      response += `${index + 1}. ${prop.title}\n`;
      response += `   📍 ${prop.location}\n`;
      response += `   💰 Rs. ${prop.rent}/month\n`;
      response += `   🛏️ ${prop.bedrooms} BHK | 🚿 ${prop.bathrooms} Bath\n\n`;
      
      if (prop.photos && prop.photos.length > 0) {
        prop.photos.forEach((photo) => {
          photos.push({
            url: photo.url,
            description: photo.description,
            propertyTitle: prop.title,
            location: prop.location
          });
        });
      }
    });

    response += "Would you like more details about any property?";

    return { response, propertyId: properties[0]._id, photos };
  } catch (error) {
    return { response: "Error fetching properties.", propertyId: null, photos: [] };
  }
};

// Handle photo requests
const handlePhotoRequest = async (query) => {
  try {
    const locations = await Property.distinct('location');
    const lowerQuery = query.toLowerCase();
    let location = null;

    const regexLoc = query.match(/(?:in|of|from)\s+([a-zA-Z ]{2,40})/i);
    if (regexLoc && regexLoc[1]) {
      const candidate = regexLoc[1].trim().toLowerCase();
      location = locations.find((loc) => candidate.includes(loc.toLowerCase()) || loc.toLowerCase().includes(candidate));
    }
    if (!location) {
      location = locations.find((loc) => lowerQuery.includes(loc.toLowerCase())) || null;
    }

    let properties;
    if (location) {
      properties = await Property.find({ location: new RegExp(location, 'i'), availability: true });
    } else {
      return { response: "Please tell me the city for the photos (e.g., 'photos in Bangalore').", propertyId: null, photos: [] };
    }

    if (properties.length === 0) {
      return { response: `Sorry, I don't have any properties with photos in ${location}.`, propertyId: null, photos: [] };
    }

    // Collect all photos from properties
    const photos = [];
    let response = `Here are property photos in ${location} (top ${Math.min(properties.length, 5)}):\n\n`;
    
    properties.slice(0, 5).forEach((prop, index) => {
      response += `${index + 1}. ${prop.title} (${prop.location})\n`;
      if (prop.photos && prop.photos.length > 0) {
        prop.photos.forEach((photo) => {
          photos.push({
            url: photo.url,
            description: photo.description,
            propertyTitle: prop.title,
            location: prop.location
          });
        });
      }
    });

    response += "\nWould you like more details about any property?";

    return { response, propertyId: properties[0]._id, photos };
  } catch (error) {
    return { response: "Error fetching property photos.", propertyId: null, photos: [] };
  }
};

// Handle rent queries with AI-enhanced response
const handleRentQuery = async (query, propertyContext = []) => {
  try {
    const locations = await Property.distinct('location');
    const extractedLocation = await llmService.extractLocation(query);
    let location = null;

    if (extractedLocation) {
      location = locations.find((loc) => 
        loc.toLowerCase().includes(extractedLocation.toLowerCase()) || 
        extractedLocation.toLowerCase().includes(loc.toLowerCase())
      );
    }

    let properties = [];
    if (location) {
      properties = await Property.find({ location: new RegExp(location, 'i'), availability: true });
    } else {
      properties = propertyContext.length > 0 ? propertyContext : await Property.find({ availability: true }).limit(10);
    }

    if (properties.length === 0) {
      return { 
        response: "Sorry, I don't have properties with that criteria right now. Would you like to ask about available locations?", 
        propertyId: null 
      };
    }

    // Use Llama 2 to generate engaging rent response
    const response = await llmService.generateResponse(query, properties.slice(0, 5));

    return { response, propertyId: properties[0]._id };
  } catch (error) {
    console.error('Error in handleRentQuery:', error);
    return { response: "Error fetching property information.", propertyId: null };
  }
};

// Handle availability queries
const handleAvailabilityQuery = async (query) => {
  try {
    const locations = await Property.distinct('location');
    const lowerQuery = query.toLowerCase();
    let location = locations.find((loc) => lowerQuery.includes(loc.toLowerCase())) || null;

    if (location) {
      const count = await Property.countDocuments({ location: new RegExp(location, 'i'), availability: true });
      return `We have ${count} ${count === 1 ? 'property' : 'properties'} available in ${location}.`;
    }

    const properties = await Property.find({ availability: true });
    return `We have ${properties.length} properties available right now.`;
  } catch (error) {
    return "Error checking availability.";
  }
};

// Handle amenities queries with AI enhancement
const handleAmenitiesQuery = async (query, propertyContext = []) => {
  try {
    let properties = propertyContext.length > 0 ? propertyContext : await Property.find();
    
    if (properties.length === 0) {
      return "No properties found.";
    }

    const allAmenities = new Set();
    properties.forEach((prop) => {
      prop.amenities.forEach((amenity) => allAmenities.add(amenity));
    });

    const amenitiesList = Array.from(allAmenities).join(', ');
    const aiPrompt = `User asked: "${query}"\n\nAvailable amenities in our properties: ${amenitiesList}\n\nGenerate a helpful response about these amenities.`;
    
    const response = await llmService.generateResponse(aiPrompt, []);
    return response;
  } catch (error) {
    console.error('Error in handleAmenitiesQuery:', error);
    return "Error fetching amenities.";
  }
};

// Location queries
const handleLocationQuery = async (query) => {
  try {
    const locations = await Property.distinct('location');
    const propertyCounts = await Promise.all(
      locations.map(async (loc) => {
        const count = await Property.countDocuments({ location: loc, availability: true });
        return { location: loc, count };
      })
    );

    const locationText = propertyCounts
      .map(({ location, count }) => `${location} (${count} ${count === 1 ? 'property' : 'properties'})`)
      .join(', ');

    const aiPrompt = `User asked: "${query}"\n\nWe have properties in: ${locationText}\n\nProvide a helpful response.`;
    const response = await llmService.generateResponse(aiPrompt, []);
    return response;
  } catch (error) {
    console.error('Error in handleLocationQuery:', error);
    return "Error fetching location information.";
  }
};

// Detect user intent
const detectIntent = (query) => {
  const lowerQuery = query.toLowerCase();
  const cities = ['mumbai', 'bangalore', 'bengaluru', 'delhi', 'pune', 'hyderabad', 'chennai', 'gurgaon', 'noida', 'ahmedabad', 'kolkata'];
  const hasCity = cities.some(city => lowerQuery.includes(city));

  // Check for location-specific property queries first
  if (hasCity && (lowerQuery.includes('property') || lowerQuery.includes('properties') || 
      lowerQuery.includes('available') || lowerQuery.includes('show') || 
      lowerQuery.includes('tell me') || lowerQuery.includes('how many'))) {
    return 'property_list';
  } else if (lowerQuery.includes('location') || lowerQuery.includes('where') || lowerQuery.includes('which place') || 
      lowerQuery.includes('which city') || lowerQuery.includes('which area')) {
    return 'location_query';
  } else if (lowerQuery.includes('rent') || lowerQuery.includes('cost') || lowerQuery.includes('price')) {
    return 'rent_query';
  } else if (lowerQuery.includes('photo') || lowerQuery.includes('picture') || lowerQuery.includes('image') || 
             lowerQuery.includes('pics') || lowerQuery.includes('show me') || lowerQuery.includes('send me')) {
    return 'photo_request';
  } else if (lowerQuery.includes('available') || lowerQuery.includes('availability')) {
    return 'availability_check';
  } else if (lowerQuery.includes('amenities') || lowerQuery.includes('facilities')) {
    return 'amenities_query';
  } else {
    return 'general';
  }
};
