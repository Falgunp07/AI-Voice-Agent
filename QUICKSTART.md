# Quick Start Guide

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup MongoDB

- **Option A - Local MongoDB:**
  - Install MongoDB from https://www.mongodb.com/try/download/community
  - Start MongoDB service
  - MongoDB will run on `mongodb://localhost:27017`

- **Option B - MongoDB Atlas (Cloud):**
  - Create account at https://www.mongodb.com/cloud/atlas
  - Create a cluster
  - Get connection string
  - Update `MONGODB_URI` in `.env`

### 3. Configure Environment Variables

Create/Update `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/real-estate-voice-agent
PORT=5000
NODE_ENV=development
```

### 4. Seed Sample Data (Optional)

Connect to MongoDB and run `sampleData.js` to populate sample properties.

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend will run on http://localhost:3000

## Testing the Application

### Test Voice Features
1. Click the microphone button
2. Say: "What is the rent in Mumbai?"
3. Agent responds with property details and speaks back

### Test Photo Request
1. Say or type: "Send me photos"
2. Enter your WhatsApp number
3. Photos will be queued to send via WhatsApp

### Test Property Search
- Say: "Show properties in Bangalore"
- Type: "What properties are available?"
- Say: "Tell me amenities"

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill process (Windows)
taskkill /PID <pid> /F
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify MongoDB is accessible

### Voice API Not Working
- Use Chrome, Firefox, or Safari
- Ensure microphone permissions are granted
- Check browser console for errors

### CORS Errors
- Verify backend is running on port 5000
- Check `frontend/src/utils/api.js` proxy setting

## API Testing with Postman

### Create Property
```
POST http://localhost:5000/api/properties
Body:
{
  "title": "Test Property",
  "rent": 20000,
  "location": "TestCity",
  "bedrooms": 2,
  "bathrooms": 1,
  "amenities": ["WiFi", "AC"]
}
```

### Test Chatbot
```
POST http://localhost:5000/api/chatbot/query
Body:
{
  "query": "What is the rent in Mumbai?",
  "sessionId": "test-session-123"
}
```

### Create Lead
```
POST http://localhost:5000/api/leads
Body:
{
  "name": "John Doe",
  "phone": "9876543210",
  "whatsapp": "9876543210",
  "email": "john@example.com",
  "queryType": "photos"
}
```

## Project Features Summary

✅ **Implemented**
- Text chat interface
- Voice input/output
- Property listing
- Chatbot logic
- Lead capture
- WhatsApp integration framework

🔄 **In Development**
- Admin dashboard
- Advanced NLP

📋 **Future**
- Local LLM integration
- Real-time notifications
- Advanced analytics

## Need Help?

Check the [README.md](../README.md) for detailed documentation and architecture overview.
