# AI Voice Agent - Complete Project Documentation & Roadmap

## 📋 Project Overview

**Goal:** Build an intelligent real estate voice agent that:
1. ✅ Interacts with users via web interface (text & voice)
2. 📞 Calls customers from Excel sheet automatically
3. 🎤 Conducts voice conversations with customers
4. 📸 Sends property images via WhatsApp upon request
5. 📍 Sends property locations via WhatsApp upon request
6. 📊 Logs all conversations for analytics

---

## 🎯 Implementation Phases

### **PHASE 1: Web-Based Voice Chatbot** ✅ COMPLETE
**Status:** DONE
- Web interface with text & voice input
- Speech recognition (user speaks → bot responds)
- Text-to-speech output (bot speaks back)
- Property listing from MongoDB
- Photo carousel with navigation
- Conversation logging

**Tech Stack:**
- Frontend: React + Web Speech API
- Backend: Node.js + Express
- LLM: Phi via Ollama
- Database: MongoDB
- Database: MongoDB

---

### **PHASE 2: Excel Integration & Customer Database** ⏳ NEXT
**Status:** TO BE IMPLEMENTED

**Features:**
1. Import customers from Excel file
2. Store customer data in MongoDB
3. Create customer management dashboard
4. Track call status for each customer

**Requirements:**
- Excel parser (xlsx package)
- Customer schema in MongoDB
- Admin dashboard for customer management
- Call queue system

**Files to Create:**
```
backend/
├── models/Customer.js          (NEW)
├── models/CallQueue.js         (NEW)
├── controllers/customerController.js (NEW)
├── controllers/callController.js     (NEW)
├── routes/customers.js         (NEW)
├── routes/calls.js             (NEW)
├── middleware/uploadHandler.js (NEW)
├── services/excelParser.js     (NEW)

frontend/
├── pages/AdminDashboard.js     (NEW)
├── pages/CustomerList.js       (NEW)
├── components/ExcelUpload.js   (NEW)
├── components/CallQueue.js     (NEW)
```

---

### **PHASE 3: WhatsApp Integration** ⏳ NEXT
**Status:** Partially Done (Twilio configured)

**Features:**
1. Send property images via WhatsApp
2. Send property location via WhatsApp
3. Send property details PDF
4. Customer can request images/location during chat
5. Track WhatsApp delivery status

**Improvements Needed:**
- Enhance WhatsApp controller
- Add image compression for WhatsApp
- Create WhatsApp message templates
- Add delivery tracking

**Files to Update:**
```
backend/
├── controllers/whatsappController.js (UPDATE)
├── services/whatsappService.js (NEW)
├── templates/propertyTemplate.js (NEW)
```

---

### **PHASE 4: Outbound Calling System** ⏳ NEXT
**Status:** TO BE IMPLEMENTED (COMPLEX)

**Features:**
1. Automated calls to customers from Excel list
2. Voice conversations via AI
3. Call scheduling (specific times/days)
4. Call recording
5. Call transcription
6. Customer engagement metrics

**Requirements:**
- Twilio Voice API (setup)
- Call state management
- Real-time voice streaming
- Voice recognition during call
- Call analytics

**Tech Stack:**
- Twilio Voice API
- WebRTC for voice streaming
- FFmpeg for audio processing
- Call queue management

**Files to Create:**
```
backend/
├── services/callingService.js (NEW)
├── services/voiceStreamService.js (NEW)
├── controllers/outboundCallController.js (NEW)
├── routes/calls.js (EXISTING - will extend)
├── middleware/callAuth.js (NEW)
├── models/CallLog.js (NEW)
```

---

## 🏗️ System Architecture

### Current Architecture (Phase 1)
```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP/WebSocket
┌────────▼────────┐
│   Backend       │
│   (Express)     │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │          │         │          │
┌───▼──┐  ┌───▼──┐ ┌───▼───┐ ┌───▼──┐
│Phi   │  │Mongo │ │Twilio │ │Files │
│LLM   │  │DB    │ │(SMS)  │ │      │
└──────┘  └──────┘ └───────┘ └──────┘
```

### Future Architecture (Phase 4)
```
┌──────────────────┐
│  Web Dashboard   │
│  (React)         │
└────────┬─────────┘
         │
┌────────▼──────────┐
│   Backend API     │
│   (Express)       │
└────────┬──────────┘
         │
    ┌────┴──────┬──────────┬──────────┬────────┐
    │            │          │          │        │
┌───▼──┐  ┌──────▼──┐ ┌────▼───┐ ┌──▼───┐ ┌──▼──┐
│Phi   │  │MongoDB  │ │Twilio  │ │Redis │ │S3   │
│LLM   │  │Customer │ │Voice   │ │Queue │ │Files│
│      │  │CallLog  │ │        │ │      │ │    │
└──────┘  └─────────┘ └────────┘ └──────┘ └─────┘
         │
    ┌────▼─────────┐
    │ Customer     │
    │ Receives     │
    │ Auto Calls   │
    └──────────────┘
```

---

## 📊 Database Schema Updates

### Phase 2: Customer Model
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  email: String,
  address: String,
  interestedProperties: [ObjectId],
  callStatus: String, // 'pending', 'called', 'interested', 'not_interested'
  callCount: Number,
  lastCallDate: Date,
  notes: String,
  whatsappNumber: String,
  createdAt: Date
}
```

### Phase 2: CallQueue Model
```javascript
{
  _id: ObjectId,
  customerId: ObjectId,
  propertyId: ObjectId,
  status: String, // 'pending', 'calling', 'completed', 'failed'
  scheduledTime: Date,
  actualCallTime: Date,
  duration: Number,
  transcription: String,
  outcome: String, // 'interested', 'not_interested', 'callback', 'no_answer'
  createdAt: Date
}
```

### Phase 4: CallLog Model
```javascript
{
  _id: ObjectId,
  customerId: ObjectId,
  callId: String, // Twilio call ID
  direction: String, // 'inbound', 'outbound'
  duration: Number,
  recordingUrl: String,
  transcription: String,
  sentiment: String, // 'positive', 'neutral', 'negative'
  properties_discussed: [ObjectId],
  nextAction: String,
  createdAt: Date
}
```

---

## 🔄 Workflow Diagrams

### Phase 1: Web Chat Workflow (CURRENT)
```
User → Voice Input → Phi LLM → MongoDB Query → Response → Text-to-Speech → User
   ↓                                                          ↓
   └─────────── Save Conversation ──────────────────────────┘
```

### Phase 2: Customer Import Workflow
```
Excel File → Backend Parser → Validate Data → MongoDB Insert → Dashboard View
```

### Phase 3: WhatsApp Workflow
```
User Asks → Agent Detects Request → Prepare Media/Location → 
Twilio API → WhatsApp Send → Delivery Confirmation
```

### Phase 4: Outbound Calling Workflow
```
Customer Queue → Twilio Voice Call → Voice Streaming → 
Phi LLM Processing → Real-time Response → Voice Output → 
Call Recording → Transcription → Analytics
```

---

## 📦 Technology Stack (Full Project)

| Layer | Current | Phase 2 | Phase 3 | Phase 4 |
|-------|---------|---------|---------|---------|
| **Frontend** | React | React + Dashboard | Same | Same |
| **Backend** | Express.js | Express + Workers | Same + Twilio | + WebRTC |
| **LLM** | Phi (Ollama) | Same | Same | Same |
| **Database** | MongoDB | + Redis | Same | Same |
| **Voice** | Web Speech API | Same | Same | Twilio API |
| **Storage** | Local | Local | S3 | S3 |
| **Queue** | Memory | Redis | Redis | Kafka |

---

## 🚀 Implementation Steps

### PHASE 2: Excel & Customer Management
1. Install xlsx package
2. Create Customer model
3. Create CallQueue model
4. Build Excel parser service
5. Create customer upload endpoint
6. Build customer dashboard
7. Implement call queue logic
8. Test with sample Excel file

### PHASE 3: WhatsApp Enhancement
1. Setup Twilio WhatsApp sandbox
2. Create WhatsApp service layer
3. Add image sending capability
4. Add location sending capability
5. Create message templates
6. Add delivery tracking
7. Test with real phone number

### PHASE 4: Outbound Calling (MOST COMPLEX)
1. Setup Twilio Voice credentials
2. Create call initiation endpoint
3. Implement WebRTC for voice streaming
4. Setup call state machine
5. Integrate voice streaming with Phi
6. Add call recording
7. Setup transcription service
8. Create analytics dashboard
9. Test with sample customers

---

## 💻 Setup Instructions per Phase

### Current (Phase 1): Already Complete ✅
```powershell
# Terminal 1: Ollama
C:\Users\falgu\AppData\Local\Programs\Ollama\ollama.exe serve

# Terminal 2: Backend
cd backend && npm run start

# Terminal 3: Frontend
cd frontend && npm start
```

---

### Phase 2 Setup (Next)
```powershell
# Install Excel parser
cd backend
npm install xlsx

# Create new files (will be provided)
# Update .env with:
EXCEL_UPLOAD_PATH=./uploads/customers
MAX_FILE_SIZE=5242880

# Run migrations if needed
npm run db:migrate
```

---

### Phase 3 Setup
```powershell
# Update Twilio credentials in .env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Install image processing
npm install sharp

# Update WhatsApp routes
# Test with Twilio sandbox
```

---

### Phase 4 Setup (MOST COMPLEX)
```powershell
# Install voice dependencies
npm install twilio-video twilio-client dotenv

# Setup Redis for call queue
redis-server

# Install audio processing
npm install fluent-ffmpeg

# Update environment with voice credentials
TWILIO_API_KEY=your_key
TWILIO_API_SECRET=your_secret

# Setup call webhook endpoints
# Test with Twilio sandbox
```

---

## ⚠️ Important Considerations

### Phase 2
- Excel validation for phone numbers
- Duplicate customer handling
- Data privacy (GDPR compliance)
- Backup before import

### Phase 3
- WhatsApp requires verified Business Account
- Message approval workflow
- Rate limiting for API calls
- Cost per message (~0.01-0.02 USD)

### Phase 4 (CRITICAL)
- **Cost:** ~0.01-0.03 USD per minute of call
- **Latency:** Voice needs sub-100ms response time
- **Legal:** Recording consent required
- **Compliance:** Must follow telemarketing laws
- **Scalability:** Need load balancing for multiple calls
- **Testing:** Always test with sandbox first

---

## 📈 Estimated Costs (Monthly)

| Service | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---------|---------|---------|---------|---------|
| MongoDB | $0-10 | $10-50 | $10-50 | $50-200 |
| Twilio SMS | $0 | $0 | $10-50 | $10-50 |
| Twilio Voice | $0 | $0 | $0 | $50-500 |
| S3 Storage | $0 | $0 | $1-5 | $5-20 |
| Redis | $0 | $0 | $0 | $10-20 |
| Total | <$10 | <$50 | <$100 | <$800 |

---

## 🎓 Learning Resources Needed

### Phase 2
- Xlsx package documentation
- MongoDB bulk operations
- Queue systems basics

### Phase 3
- Twilio WhatsApp API
- Image optimization
- Webhook handling

### Phase 4 (ADVANCED)
- WebRTC fundamentals
- Audio stream processing
- Real-time communication
- SIP protocol basics
- Telephony concepts

---

## ✅ Quality Checklist per Phase

### Phase 1: COMPLETE
- [x] Web interface responsive
- [x] Voice input/output working
- [x] LLM responses accurate
- [x] Database logging working
- [x] Photo carousel functional

### Phase 2: Before Launch
- [ ] Excel import tested with 100+ customers
- [ ] Customer dashboard fully functional
- [ ] Call queue system tested
- [ ] Error handling for invalid data
- [ ] Bulk operations optimized
- [ ] Data backup system in place

### Phase 3: Before Launch
- [ ] WhatsApp Business account verified
- [ ] Image compression working
- [ ] Location sending tested
- [ ] Delivery tracking accurate
- [ ] Rate limiting implemented
- [ ] Cost tracking dashboard

### Phase 4: Before Launch
- [ ] Call connection stable
- [ ] Voice latency < 100ms
- [ ] Transcription accuracy > 90%
- [ ] Call recording working
- [ ] Scaling tested (10+ concurrent calls)
- [ ] Legal compliance verified
- [ ] Fallback systems in place

---

## 🔧 Next Immediate Actions

**To proceed with Phase 2, I need you to:**

1. Prepare an **Excel file** with customer data (columns: name, phone, email, address, interested_properties)
2. Confirm Twilio account is fully setup with WhatsApp sandbox
3. Decide on calling provider (Twilio recommended)
4. Set budget for Phase 4 execution

**Once confirmed, I will:**
1. Create all Phase 2 files (models, controllers, routes)
2. Build customer import system
3. Create admin dashboard
4. Test end-to-end

---

## 📞 Support & Questions

- LLM Latency Issues → Use smaller model (Phi is already optimal)
- Database Performance → Add indexes, use MongoDB Atlas
- WhatsApp Costs → Use templates for bulk messaging
- Voice Call Issues → Test with Twilio sandbox first
- Concurrent Call Limits → Implement queue with Redis

---

**Version:** 1.0
**Last Updated:** February 3, 2026
**Status:** Ready for Phase 2 Implementation

