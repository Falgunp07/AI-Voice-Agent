import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Chatbot API calls
export const processQuery = (query, sessionId) => {
  return apiClient.post('/chatbot/query', { query, sessionId });
};

// Properties API calls
export const getAllProperties = () => {
  return apiClient.get('/properties');
};

export const getPropertyById = (id) => {
  return apiClient.get(`/properties/${id}`);
};

export const searchPropertiesByLocation = (location) => {
  return apiClient.get('/properties/search/location', { params: { location } });
};

export const getPropertyPhotos = (propertyId) => {
  return apiClient.get(`/properties/${propertyId}/photos`);
};

// Leads API calls
export const createLead = (leadData) => {
  return apiClient.post('/leads', leadData);
};

export const getAllLeads = () => {
  return apiClient.get('/leads');
};

// WhatsApp API calls
export const sendPhotosViaWhatsApp = (phone, propertyId, leadName) => {
  return apiClient.post('/whatsapp/send-photos', {
    phone,
    propertyId,
    leadName,
  });
};

// Voice API calls
export const initiateVoiceCall = (payload) => {
  // payload: { to: "+91xxxxxxxxxx", city?, propertyId? }
  return apiClient.post('/voice/call', payload);
};
