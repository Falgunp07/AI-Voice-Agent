import { Router, Request, Response } from 'express';
import twilio from 'twilio';

const router = Router();

const VoiceResponse = twilio.twiml.VoiceResponse;

// Get server URL for webhooks (needs to be public — use ngrok/localtunnel in dev)
function getServerUrl(): string {
    // Render automatically provides RENDER_EXTERNAL_URL — use it if SERVER_PUBLIC_URL not set
    return process.env.SERVER_PUBLIC_URL
        || process.env.RENDER_EXTERNAL_URL
        || `http://localhost:${process.env.PORT || 4000}`;
}

function getWssHost(): string {
    const url = getServerUrl();
    // Convert https://xxx.loca.lt → xxx.loca.lt
    return url.replace(/^https?:\/\//, '');
}

// POST /api/twilio/voice — Incoming call webhook
// Twilio hits this when someone calls your number
router.post('/voice', (req: Request, res: Response) => {
    console.log('📞 Incoming call from:', req.body.From);

    const twiml = new VoiceResponse();

    // Connect the call audio to our WebSocket for real-time processing
    const connect = twiml.connect();
    const stream = connect.stream({
        url: `wss://${getWssHost()}/voice-stream`,
    });

    // Pass caller info to the WebSocket
    stream.parameter({ name: 'callerNumber', value: req.body.From || 'unknown' });
    stream.parameter({ name: 'callSid', value: req.body.CallSid || '' });
    stream.parameter({ name: 'direction', value: 'inbound' });

    res.type('text/xml');
    res.send(twiml.toString());
});

// POST /api/twilio/outbound — Make an outbound call
router.post('/outbound', async (req: Request, res: Response) => {
    try {
        const { phoneNumber, leadName, leadId } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            return res.status(500).json({ success: false, error: 'Twilio credentials not configured' });
        }

        const client = twilio(accountSid, authToken);
        const serverUrl = getServerUrl();

        // Create the outbound call
        const call = await client.calls.create({
            to: phoneNumber,
            from: fromNumber,
            url: `${serverUrl}/api/twilio/outbound-connect?leadName=${encodeURIComponent(leadName || '')}&leadId=${encodeURIComponent(leadId || '')}`,
            statusCallback: `${serverUrl}/api/twilio/status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST',
        });

        console.log('📤 Outbound call initiated:', call.sid, '→', phoneNumber);

        res.json({
            success: true,
            callSid: call.sid,
            to: phoneNumber,
            status: call.status,
        });
    } catch (error: any) {
        console.error('Outbound call error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/twilio/outbound-connect — TwiML for outbound calls (connects to stream)
router.post('/outbound-connect', (req: Request, res: Response) => {
    const leadName = req.query.leadName as string || '';
    const leadId = req.query.leadId as string || '';

    console.log('📤 Outbound call connected, streaming to WebSocket...');

    const twiml = new VoiceResponse();

    const connect = twiml.connect();
    const stream = connect.stream({
        url: `wss://${getWssHost()}/voice-stream`,
    });

    stream.parameter({ name: 'callerNumber', value: req.body.To || 'unknown' });
    stream.parameter({ name: 'callSid', value: req.body.CallSid || '' });
    stream.parameter({ name: 'leadName', value: leadName });
    stream.parameter({ name: 'leadId', value: leadId });
    stream.parameter({ name: 'direction', value: 'outbound' });

    res.type('text/xml');
    res.send(twiml.toString());
});

// POST /api/twilio/status — Call status callback
router.post('/status', (req: Request, res: Response) => {
    const { CallSid, CallStatus, CallDuration } = req.body;
    console.log(`📊 Call ${CallSid}: ${CallStatus} (${CallDuration || 0}s)`);
    res.sendStatus(200);
});

export default router;
