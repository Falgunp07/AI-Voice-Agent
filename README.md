# AI-Based Real Estate Voice Assistant - MERN Stack

A web-based real estate assistant that enables users to interact with property information through text and voice-based communication.

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── propertyController.js
│   │   ├── chatbotController.js
│   │   ├── leadController.js
│   │   └── whatsappController.js
│   ├── models/
│   │   ├── Property.js
│   │   ├── Lead.js
│   │   └── Conversation.js
│   ├── routes/
│   │   ├── properties.js
│   │   ├── chatbot.js
│   │   ├── leads.js
│   │   └── whatsapp.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ChatInterface.js
    │   │   ├── PropertyListing.js
    │   │   └── PhotoRequest.js
    │   ├── pages/
    │   │   └── Home.js
    │   ├── styles/
    │   │   ├── ChatInterface.css
    │   │   ├── PropertyListing.css
    │   │   ├── PhotoRequest.css
    │   │   └── Home.css
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── voiceHandler.js
    │   ├── App.js
    │   ├── index.js
    │   ├── index.css
    │   └── App.css
    └── package.json
```

## Features

### Core Features
- ✅ Text and voice-based interaction
- ✅ Voice input using browser Speech Recognition API
- ✅ Voice output using browser Text-to-Speech API
- ✅ Property query handling (rent, location, amenities)
- ✅ Lead capture and storage
- ✅ Admin dashboard functionality
- ✅ WhatsApp integration for photo delivery

### Key Components

#### Backend (Node.js + Express)
1. **Property Management** - CRUD operations for properties
2. **Chatbot Logic** - Intent detection and response generation
3. **Lead Management** - Capture and store customer leads
4. **WhatsApp Integration** - Send photos via WhatsApp
5. **Conversation Logging** - Track all interactions

#### Frontend (React)
1. **Chat Interface** - Real-time text and voice chat
2. **Property Listing** - Browse available properties
3. **Voice Control** - Microphone and speaker functionality
4. **Photo Request Modal** - Ask for WhatsApp number and send photos
5. **Responsive Design** - Mobile and desktop support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
npm install
```

2. Create `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/real-estate-voice-agent
PORT=5000
NODE_ENV=development
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

3. Start backend:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
npm install
```

2. Start frontend:
```bash
npm start
```

The app will open at `http://localhost:3000`

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `GET /api/properties/search/location?location=city` - Search by location
- `POST /api/properties` - Create property (Admin)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Chatbot
- `POST /api/chatbot/query` - Process user query
  ```json
  {
    "query": "What is the rent in Mumbai?",
    "sessionId": "unique_session_id"
  }
  ```

### Leads
- `POST /api/leads` - Create lead
- `GET /api/leads` - Get all leads
- `PUT /api/leads/:id/status` - Update lead status

### WhatsApp
- `POST /api/whatsapp/send-photos` - Send photos via WhatsApp
  ```json
  {
    "phone": "9876543210",
    "propertyId": "property_id",
    "leadName": "Customer Name"
  }
  ```

## How to Use

1. **Start the Application**
   - Backend: `npm run dev` (in backend folder)
   - Frontend: `npm start` (in frontend folder)

2. **Chat with Voice Agent**
   - Type queries or click the microphone button
   - Say things like:
     - "What's the rent in Mumbai?"
     - "Send me photos"
     - "What properties are available?"
     - "Tell me about amenities"

3. **Request Photos**
   - Ask for photos of a property
   - Provide your WhatsApp number
   - Photos will be sent to your WhatsApp

4. **Admin Dashboard** (To be implemented)
   - Add/edit/delete properties
   - View all leads
   - Track conversations

## Technology Stack

### Frontend
- React.js
- HTML5 Speech Recognition API
- Web Speech API (Text-to-Speech)
- CSS3 with Flexbox/Grid
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose ODM

### External Services (Future)
- Twilio WhatsApp API
- AWS S3 for image storage

## Future Enhancements

1. **Advanced AI**
   - Integration with local LLMs
   - Natural language understanding
   - Context-aware conversations

2. **Additional Features**
   - Admin dashboard with analytics
   - Real-time lead notifications
   - Email integration
   - SMS notifications
   - Property recommendations

3. **Performance**
   - Message queues (Redis)
   - Caching mechanisms
   - Offline speech processing
   - Audio streaming

4. **Deployment**
   - Docker containerization
   - CI/CD pipeline
   - Production deployment guides

## Known Limitations (Phase 1)

- Voice recognition limited to English
- Photos sent via WhatsApp require manual implementation
- No local LLM integration
- Single-threaded voice processing
- No user authentication (to be added)

## Development Tips

1. **Testing the Backend**
   - Use Postman to test API endpoints
   - Check MongoDB collections in MongoDB Compass

2. **Testing Voice Features**
   - Works best on Chrome, Firefox, and Safari
   - Edge support limited
   - Mobile browsers may have limited voice API support

3. **Debugging**
   - Check browser console for frontend errors
   - Check server logs for backend errors
   - Enable verbose logging in .env

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under ISC License.

## Support

For issues or questions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Contact development team

## Acknowledgments

- MERN Stack Documentation
- Web Speech API Resources
- MongoDB Documentation
- React.js Community

---

**Project Status**: Under Development (Phase 1)
**Last Updated**: January 2026
