require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/properties', require('./routes/properties'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/voice', require('./routes/voice'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
