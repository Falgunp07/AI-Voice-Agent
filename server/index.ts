import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import leadsRouter from './routes/leads';
import callsRouter from './routes/calls';
import propertiesRouter from './routes/properties';
import campaignsRouter from './routes/campaigns';
import aiChatRouter from './routes/ai-chat';
import whatsappRouter from './routes/whatsapp';
import aiCallsRouter from './routes/ai-calls';
import appointmentsRouter from './routes/appointments';
import twilioVoiceRouter from './routes/twilio-voice';
import { handleVoiceStream } from './services/voice-stream';

dotenv.config({ path: '.env.local' });

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'PropCall AI API is running' });
});

app.use('/api/leads', leadsRouter);
app.use('/api/calls', callsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/ai', aiChatRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/ai-calls', aiCallsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/twilio', twilioVoiceRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Create HTTP server (needed for WebSocket upgrade)
const server = http.createServer(app);

// WebSocket server for Twilio voice streams
const wss = new WebSocketServer({ server, path: '/voice-stream' });

wss.on('connection', (ws: WebSocket, req) => {
    console.log('🔗 New voice stream connection from:', req.url);
    handleVoiceStream(ws);
});

wss.on('error', (err) => {
    console.error('WebSocket Server error:', err);
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📞 Twilio Voice: http://localhost:${PORT}/api/twilio/voice`);
    console.log(`🔌 Voice Stream WS: ws://localhost:${PORT}/voice-stream`);
});

export default app;
