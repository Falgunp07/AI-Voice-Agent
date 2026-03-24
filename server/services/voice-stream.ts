import WebSocket from 'ws';
import { supabase } from '../utils/supabase';

// ─── Types ───
interface StreamSession {
    callSid: string;
    callerNumber: string;
    leadName: string;
    leadId: string;
    direction: string;
    streamSid: string;
    transcript: Array<{ role: string; content: string; time: string }>;
    conversationHistory: Array<{ role: string; content: string }>;
    appointmentBooked: boolean;
    callStartTime: number;
    deepgramWs: WebSocket | null;
    currentSpeech: string;
    silenceTimer: NodeJS.Timeout | null;
    isProcessing: boolean;
    isSpeaking: boolean;
    greetingSent: boolean;
}


function getSystemPrompt(): string {
    return `CRITICAL FORMAT RULE — READ THIS FIRST:
You are on a PHONE CALL. Output ONLY what you would SPEAK OUT LOUD. Nothing else.
Never write "Okay, the user said...", "I need to...", "The user mentioned...", or any explanation.
Never translate. Never summarize. Never analyze.
Just speak your next sentence directly — short, natural, conversational Hindi.

WRONG: "Okay, the user just said their name is Falgun."
RIGHT: "Accha Falgun ji! Aap kis city mein property dekh rahe hain?"

---

IDENTITY: Tum "Arjun" ho — ek experienced property consultant. Phone call pe buyer se baat kar rahe ho. Hindi mein bolo.

LANGUAGE: Hindi + common English words like "property", "budget", "BHK", "location", "visit".

STYLE: MAX 2 sentences. MAX 30 words. Natural, warm, human. Like a real person on the phone.
Reactions: "Accha!", "Wah!", "Zaroor!", "Bilkul!", "Haan ji!"

CONVERSATION FLOW:
1. Name → "Accha [naam] ji! Aap kis city mein property dekh rahe hain?"
2. City given → "Aapka budget lagbag kitna hai?"
3. Budget given → Tell matching properties from the list below
4. After properties → "Aapka number de do, details bhej dunga."
5. Number given → "Kab visit karenge?"
6. Visit time given → Confirm and add BOOKING tag

PROPERTY RULES:
- ONLY recommend properties from the AVAILABLE PROPERTIES list.
- Give real name + BHK + price. NEVER say "bahut saare options hain" without specifics.
- If no properties in that city: "Maaf kijiye, [city] mein abhi koi option nahi hai. Gujarat ke doosre cities mein hai — dekhna chahenge?"

ANTI-HALLUCINATION:
- Jo user ne bola WAHI repeat karo. Khud se city/budget mat assume karo.
- Agar naam sunai nahi diya: "Maaf kijiye, naam clear nahi aaya. Ek baar batayenge?"

PHONE NUMBER:
- Hindi digits accept karo: ek=1, do=2, teen=3, chaar=4, paanch=5, chheh=6, saat=7, aath=8, nau=9
- "double" means repeat: "double 3" = 33. Confirm: "Aapka number [digits], sahi hai?"

BOOKING TAG (INTERNAL — user ko mat dikhao):
Jab naam + phone + property + date + time SAHI ho, reply ke END mein add karo:
[BOOKING:customer_name|customer_phone|property_name|date_YYYY-MM-DD|time_HH:MM]

Today: ${new Date().toISOString().split('T')[0]}

DO NOT: mention WhatsApp. DO NOT book without phone number. DO NOT repeat info user already gave.`;
}



// ─── Sarvam AI TTS (Hindi) → mulaw audio for Twilio ───
async function textToSpeechMulaw(text: string): Promise<Buffer> {
    const apiKey = process.env.SARVAM_API_KEY;
    const speaker = process.env.SARVAM_SPEAKER || 'rahul';
    const model = process.env.SARVAM_MODEL || 'bulbul:v3';

    if (!apiKey) throw new Error('Sarvam API key not found');

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'api-subscription-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: 'hi-IN',
            speaker: speaker,
            model: model,
            pace: 1.0,
            sample_rate: 8000,
            enable_preprocessing: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam TTS error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const base64Audio = data.audios?.[0];
    if (!base64Audio) throw new Error('No audio returned from Sarvam AI');

    // Sarvam returns WAV — parse header to get actual sample rate
    const wavBuffer = Buffer.from(base64Audio, 'base64');
    const srcSampleRate = wavBuffer.readUInt32LE(24);  // actual sample rate from WAV header
    const bitsPerSample = wavBuffer.readUInt16LE(34);
    const pcmData = wavBuffer.slice(44); // Skip 44-byte WAV header

    console.log(`[TTS] Sarvam WAV: ${srcSampleRate}Hz, ${bitsPerSample}-bit, ${pcmData.length} bytes PCM`);

    // Downsample to 8000 Hz for Twilio (if needed)
    const targetRate = 8000;
    let pcm8k: Buffer;

    if (srcSampleRate === targetRate) {
        pcm8k = pcmData;
    } else {
        // Linear interpolation downsampling
        const ratio = srcSampleRate / targetRate;
        const srcSamples = pcmData.length / 2; // 16-bit = 2 bytes per sample
        const dstSamples = Math.floor(srcSamples / ratio);
        pcm8k = Buffer.alloc(dstSamples * 2);

        for (let i = 0; i < dstSamples; i++) {
            const srcPos = i * ratio;
            const srcIdx = Math.floor(srcPos);
            const frac = srcPos - srcIdx;

            const s0 = srcIdx * 2 < pcmData.length - 1 ? pcmData.readInt16LE(srcIdx * 2) : 0;
            const s1 = (srcIdx + 1) * 2 < pcmData.length - 1 ? pcmData.readInt16LE((srcIdx + 1) * 2) : s0;

            // Linear interpolation between samples
            const sample = Math.round(s0 + frac * (s1 - s0));
            pcm8k.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
        }
        console.log(`[TTS] Downsampled: ${srcSampleRate}Hz → ${targetRate}Hz (${dstSamples} samples)`);
    }

    const mulawBuffer = pcmToMulaw(pcm8k);
    return mulawBuffer;
}

// ─── PCM 16-bit → G.711 μ-law conversion (ITU-T standard) ───
function pcmToMulaw(pcmBuffer: Buffer): Buffer {
    const mulawBuffer = Buffer.alloc(pcmBuffer.length / 2);
    for (let i = 0; i < pcmBuffer.length; i += 2) {
        const sample = pcmBuffer.readInt16LE(i);
        mulawBuffer[i / 2] = linearToMulaw(sample);
    }
    return mulawBuffer;
}

// ITU-T G.711 standard μ-law encoding
const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;
const MULAW_EXP_TABLE = [0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7];

function linearToMulaw(sample: number): number {
    let sign = (sample >> 8) & 0x80;
    if (sign !== 0) sample = -sample;
    if (sample > MULAW_CLIP) sample = MULAW_CLIP;
    sample = sample + MULAW_BIAS;
    const exponent = MULAW_EXP_TABLE[(sample >> 7) & 0xFF];
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    return ~(sign | (exponent << 4) | mantissa) & 0xFF;
}

// ─── AI Chat via Sarvam-M (Hindi native) with Groq fallback ───
async function getAIResponse(session: StreamSession, userText: string): Promise<string> {
    session.conversationHistory.push({ role: 'user', content: userText });

    // Fetch inventory for context
    // Detect city from conversation for server-side filtering
    const CITY_MAP: Record<string, string> = {
        'mumbai': 'mumbai', 'मुंबई': 'mumbai',
        'delhi': 'delhi', 'दिल्ली': 'delhi',
        'bangalore': 'bangalore', 'bengaluru': 'bangalore', 'बैंगलोर': 'bangalore', 'बेंगलुरु': 'bangalore',
        'hyderabad': 'hyderabad', 'हैदराबाद': 'hyderabad',
        'chennai': 'chennai', 'चेन्नई': 'chennai',
        'pune': 'pune', 'पुणे': 'pune',
        'ahmedabad': 'ahmedabad', 'अहमदाबाद': 'ahmedabad',
        'kolkata': 'kolkata', 'कोलकाता': 'kolkata',
        'jaipur': 'jaipur', 'जयपुर': 'jaipur',
        'lucknow': 'lucknow', 'लखनऊ': 'lucknow',
        'chandigarh': 'chandigarh', 'चंडीगढ़': 'chandigarh',
        'indore': 'indore', 'इंदौर': 'indore',
        'nagpur': 'nagpur', 'नागपुर': 'nagpur',
        'rajkot': 'rajkot', 'राजकोट': 'rajkot',
        'surat': 'surat', 'सूरत': 'surat',
        'vadodara': 'vadodara', 'बड़ौदा': 'vadodara', 'वड़ोदरा': 'vadodara',
        'dahod': 'dahod', 'दाहोद': 'dahod',
        'gandhinagar': 'gandhinagar', 'गांधीनगर': 'gandhinagar',
        'noida': 'noida', 'नोएडा': 'noida',
        'gurgaon': 'gurgaon', 'gurugram': 'gurgaon', 'गुड़गांव': 'gurgaon', 'गुरुग्राम': 'gurgaon',
        'thane': 'thane', 'ठाणे': 'thane',
        'navi mumbai': 'navi mumbai', 'नवी मुंबई': 'navi mumbai',
        'faridabad': 'faridabad', 'फरीदाबाद': 'faridabad',
        'ghaziabad': 'ghaziabad', 'गाज़ियाबाद': 'ghaziabad',
        'kochi': 'kochi', 'कोच्चि': 'kochi',
        'bhopal': 'bhopal', 'भोपाल': 'bhopal',
        'patna': 'patna', 'पटना': 'patna',
        'coimbatore': 'coimbatore', 'कोयंबटूर': 'coimbatore',
        'visakhapatnam': 'visakhapatnam', 'विशाखापत्तनम': 'visakhapatnam',
        'agra': 'agra', 'आगरा': 'agra',
        'varanasi': 'varanasi', 'वाराणसी': 'varanasi',
        'mysore': 'mysore', 'मैसूर': 'mysore',
        'mangalore': 'mangalore', 'मंगलौर': 'mangalore',
        'trivandrum': 'trivandrum', 'त्रिवेंद्रम': 'trivandrum',
        'aurangabad': 'aurangabad', 'औरंगाबाद': 'aurangabad'
    };

    let detectedCity: string | null = null;
    for (let i = session.conversationHistory.length - 1; i >= 0; i--) {
        if (session.conversationHistory[i].role !== 'user') continue;
        const msg = session.conversationHistory[i].content.toLowerCase();
        for (const [key, normalized] of Object.entries(CITY_MAP)) {
            if (msg.includes(key)) { detectedCity = normalized; break; }
        }
        if (detectedCity) break;
    }

    let inventoryContext = '';
    try {
        let query = supabase
            .from('properties')
            .select('name, price, location, bedrooms, amenities');

        // Server-side city filter — only send matching properties to LLM
        if (detectedCity) {
            query = query.ilike('location', `%${detectedCity}%`);
        }
        query = query.limit(10);

        const { data: properties } = await query;
        if (properties && properties.length > 0) {
            inventoryContext = detectedCity
                ? `\n\nAVAILABLE PROPERTIES in ${detectedCity.toUpperCase()} (SIRF yahi batao):`
                : '\n\nAVAILABLE PROPERTIES:';
            properties.forEach((p: any) => {
                const priceVal = Number(p.price);
                let priceStr = '';
                if (priceVal >= 10000000) priceStr = `₹${(priceVal / 10000000).toFixed(2)} Cr`;
                else if (priceVal >= 100000) priceStr = `₹${(priceVal / 100000).toFixed(0)} Lakhs`;
                else priceStr = `₹${priceVal}`;
                inventoryContext += `\n- ${p.name} | ${p.location} | ${p.bedrooms}BHK | ${priceStr}`;
            });
        } else if (detectedCity) {
            // Fetch fallback properties from Gujarat
            const { data: fallback } = await supabase.from('properties').select('name, price, location, bedrooms, amenities').limit(3);
            inventoryContext = `\n\n${detectedCity.toUpperCase()} mein koi property available NAHI hai. Par GUJARAT mein ye options available hain:\n`;
            if (fallback) {
                fallback.forEach((p: any) => {
                    const priceVal = Number(p.price);
                    let priceStr = '';
                    if (priceVal >= 10000000) priceStr = `₹${(priceVal / 10000000).toFixed(2)} Cr`;
                    else if (priceVal >= 100000) priceStr = `₹${(priceVal / 100000).toFixed(0)} Lakhs`;
                    else priceStr = `₹${priceVal}`;
                    inventoryContext += `\n- ${p.name} | ${p.location} | ${p.bedrooms}BHK | ${priceStr}`;
                });
            }
        }
    } catch { /* ignore */ }

    let sysPrompt = getSystemPrompt() + inventoryContext;

    // Add caller context
    if (session.leadName) {
        sysPrompt += `\n\nCaller ka naam: ${session.leadName}`;
    }

    const trimmedHistory = session.conversationHistory.slice(-10);
    const messagesPayload = [
        { role: 'system' as const, content: sysPrompt },
        ...trimmedHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
    ];

    // Ensure the first message after system is 'user' for Sarvam-M compatibility
    if (messagesPayload.length > 1 && messagesPayload[1].role !== 'user') {
        messagesPayload.splice(1, 0, { role: 'user', content: 'Hello' });
    }

    // ── Call Sarvam-M (native Hindi LLM) ──
    const sarvamApiKey = process.env.SARVAM_API_KEY;
    let reply = '';
    if (!sarvamApiKey) {
        console.error('[LLM] SARVAM_API_KEY missing!');
        reply = 'Maaf kijiye, AI service configure nahi hai. Baad mein call karein.';
    } else {
        try {
            const sarvamRes = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'api-subscription-key': sarvamApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'sarvam-m',
                    messages: messagesPayload,
                    temperature: 0.4,
                    max_tokens: 120,
                }),
            });

            if (!sarvamRes.ok) {
                const errText = await sarvamRes.text();
                console.error(`[LLM] Sarvam-M error ${sarvamRes.status}:`, errText);
                reply = 'Maaf kijiye, ek technical problem aa gayi. Thodi der baad call karein.';
            } else {
                const sarvamData = await sarvamRes.json();
                reply = sarvamData.choices?.[0]?.message?.content || '';
                console.log('[LLM] Sarvam-M reply:', reply.substring(0, 80));
            }
        } catch (err: any) {
            console.error('[LLM] Sarvam-M exception:', err.message);
            reply = 'Maaf kijiye, network issue aa raha hai. Thodi der baad try karein.';
        }
    }

    if (!reply) {
        reply = 'Maaf kijiye, kuch problem aa rahi hai. Ek minute mein wapas try karte hain.';
    }

    // Strip <think> tags (Sarvam-M sometimes emits these)
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>/g, '').replace(/<\/think>/g, '').trim();
    const words = reply.split(/\s+/);
    if (words.length > 50) {
        // Find the end of the 2nd sentence
        let cutPoint = reply.length;
        let sentenceCount = 0;
        for (let i = 0; i < reply.length; i++) {
            if (reply[i] === '.' || reply[i] === '?' || reply[i] === '!' || reply[i] === '\u0964') {
                sentenceCount++;
                if (sentenceCount >= 2) {
                    cutPoint = i + 1;
                    break;
                }
            }
        }
        reply = reply.substring(0, cutPoint).trim();
    }



    // Detect and handle booking
    const bookingMatch = reply.match(/\[BOOKING:(.+?)\]/);
    reply = reply.replace(/\s*\[BOOKING:[^\]]*\]?/g, '').trim();
    if (!reply) reply = 'Done! Aapki booking ho gayi hai.';

    if (bookingMatch && !session.appointmentBooked) {
        const parts = bookingMatch[1].split('|');
        if (parts.length >= 5) {
            const [customer_name, customer_phone, property_name, appointment_date, appointment_time] = parts.map(s => s.trim());
            try {
                await supabase.from('appointments').insert({
                    customer_name,
                    customer_phone: customer_phone || null,
                    property_name,
                    appointment_date,
                    appointment_time,
                    notes: `Auto-booked via ${session.direction} call`,
                    status: 'scheduled',
                    source: 'ai_call',
                });
                session.appointmentBooked = true;
                console.log('✅ Auto-booked from real call:', customer_name, property_name);
            } catch (err) {
                console.error('Appointment booking failed:', err);
            }
        }
    } else if (bookingMatch) {
        reply = reply.replace(/\s*\[BOOKING:.+?\]/, '').trim();
    }

    session.conversationHistory.push({ role: 'assistant', content: reply });
    session.transcript.push(
        { role: 'user', content: userText, time: new Date().toISOString() },
        { role: 'assistant', content: reply, time: new Date().toISOString() }
    );

    return reply;
}

// ─── Send TTS audio to Twilio stream ───
async function speakToCall(ws: WebSocket, session: StreamSession, text: string) {
    if (session.isSpeaking) return;
    session.isSpeaking = true;

    try {
        console.log(`🗣️ Arjun: "${text.substring(0, 80)}..."`);

        // Use Sarvam AI Hindi TTS → mulaw audio
        const audioBuffer = await textToSpeechMulaw(text);

        // Send audio in chunks with pacing (Twilio expects base64 mulaw in 'media' messages)
        const chunkSize = 640; // 80ms of 8kHz mulaw
        for (let i = 0; i < audioBuffer.length; i += chunkSize) {
            if (ws.readyState !== WebSocket.OPEN) break;

            const chunk = audioBuffer.slice(i, Math.min(i + chunkSize, audioBuffer.length));
            const mediaMessage = {
                event: 'media',
                streamSid: session.streamSid,
                media: {
                    payload: chunk.toString('base64'),
                },
            };
            ws.send(JSON.stringify(mediaMessage));

            // Pace the chunks — wait ~20ms between sends to prevent buffer overflow
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        // Send mark to know when audio finishes playing
        const markMessage = {
            event: 'mark',
            streamSid: session.streamSid,
            mark: { name: 'speech_done' },
        };
        ws.send(JSON.stringify(markMessage));

    } catch (err) {
        console.error('TTS/Send error:', err);
    } finally {
        session.isSpeaking = false;
    }
}

// ─── Save call on disconnect ───
async function saveCallRecord(session: StreamSession) {
    const duration = Math.round((Date.now() - session.callStartTime) / 1000);

    try {
        await supabase.from('ai_call_history').insert({
            caller_name: session.leadName || session.callerNumber || 'Unknown',
            session_id: session.callSid,
            duration,
            transcript: session.transcript,
            message_count: session.transcript.length,
            status: 'completed',
        });
        console.log(`💾 Call saved: ${session.callSid} (${duration}s, ${session.transcript.length} messages)`);
    } catch (err) {
        console.error('Failed to save call record:', err);
    }
}

// ─── Main WebSocket handler ───
export function handleVoiceStream(ws: WebSocket) {
    const session: StreamSession = {
        callSid: '',
        callerNumber: '',
        leadName: '',
        leadId: '',
        direction: 'inbound',
        streamSid: '',
        transcript: [],
        conversationHistory: [],
        appointmentBooked: false,
        callStartTime: Date.now(),
        deepgramWs: null,
        currentSpeech: '',
        silenceTimer: null,
        isProcessing: false,
        isSpeaking: false,
        greetingSent: false,
    };

    console.log('🔌 Voice stream WebSocket connected');

    ws.on('message', async (data: WebSocket.Data) => {
        try {
            const msg = JSON.parse(data.toString());

            switch (msg.event) {
                case 'connected':
                    console.log('✅ Twilio stream connected');
                    break;

                case 'start':
                    // Extract session parameters from Twilio
                    session.streamSid = msg.start.streamSid;
                    session.callSid = msg.start.callSid;

                    const params = msg.start.customParameters || {};
                    session.callerNumber = params.callerNumber || '';
                    session.direction = params.direction || 'inbound';
                    session.leadName = params.leadName || '';
                    session.leadId = params.leadId || '';

                    console.log(`📞 Stream started: ${session.direction} call ${session.callSid}`);
                    console.log(`   From: ${session.callerNumber}, Lead: ${session.leadName || 'unknown'}`);

                    // Connect to Deepgram for real-time STT (Hindi)
                    connectDeepgram(ws, session);

                    // Send AI greeting after a short delay (in Hindi)
                    setTimeout(async () => {
                        if (!session.greetingSent) {
                            session.greetingSent = true;
                            const greeting = session.leadName
                                ? `Accha ${session.leadName} Bhagat ji! Kya aap Gujarat mein koi property dekh rahe hain?`
                                : 'Hello! Mai PropCall se baat kar raha hu. Aapka naam kya hai?';

                            session.transcript.push({ role: 'assistant', content: greeting, time: new Date().toISOString() });
                            session.conversationHistory.push({ role: 'assistant', content: greeting });
                            await speakToCall(ws, session, greeting);
                        }
                    }, 1500);
                    break;

                case 'media':
                    // Forward audio to Deepgram for transcription
                    if (session.deepgramWs && session.deepgramWs.readyState === WebSocket.OPEN) {
                        const audioData = Buffer.from(msg.media.payload, 'base64');
                        session.deepgramWs.send(audioData);
                    }
                    break;

                case 'mark':
                    // Audio playback finished
                    if (msg.mark?.name === 'speech_done') {
                        session.isSpeaking = false;
                    }
                    break;

                case 'stop':
                    console.log('📴 Stream stopped');
                    await saveCallRecord(session);
                    cleanup(session);
                    break;
            }
        } catch (err) {
            console.error('Stream message error:', err);
        }
    });

    ws.on('close', async () => {
        console.log('🔌 Voice stream WebSocket closed');
        await saveCallRecord(session);
        cleanup(session);
    });

    ws.on('error', (err) => {
        console.error('Voice stream WebSocket error:', err);
        cleanup(session);
    });
}

// ─── Connect to Deepgram real-time STT (Hindi) ───
function connectDeepgram(twilioWs: WebSocket, session: StreamSession) {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
        console.error('❌ Deepgram API key not found');
        return;
    }

    const deepgramUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
        encoding: 'mulaw',
        sample_rate: '8000',
        channels: '1',
        model: 'nova-2',
        language: 'hi',          // Hindi STT
        smart_format: 'true',
        interim_results: 'true',
        endpointing: '300',
        utterance_end_ms: '1500',
    }).toString();

    const dgWs = new WebSocket(deepgramUrl, {
        headers: { Authorization: `Token ${apiKey}` },
    });

    session.deepgramWs = dgWs;

    dgWs.on('open', () => {
        console.log('🎤 Deepgram STT connected (Hindi)');
    });

    dgWs.on('message', async (data: WebSocket.Data) => {
        try {
            const result = JSON.parse(data.toString());

            if (result.type === 'Results') {
                const transcript = result.channel?.alternatives?.[0]?.transcript;
                const isFinal = result.is_final;

                if (transcript && transcript.trim()) {
                    if (isFinal) {
                        // Accumulate final transcripts
                        session.currentSpeech += ' ' + transcript.trim();

                        // Reset silence timer — wait for more speech or process
                        if (session.silenceTimer) clearTimeout(session.silenceTimer);
                        session.silenceTimer = setTimeout(async () => {
                            const fullText = session.currentSpeech.trim();
                            session.currentSpeech = '';

                            if (fullText && !session.isProcessing && !session.isSpeaking) {
                                session.isProcessing = true;
                                console.log(`👤 Caller: "${fullText}"`);

                                try {
                                    const reply = await getAIResponse(session, fullText);
                                    await speakToCall(twilioWs, session, reply);
                                } catch (err) {
                                    console.error('AI response error:', err);
                                } finally {
                                    // Always reset — prevents AI from freezing permanently
                                    session.isProcessing = false;
                                }
                            }
                        }, 1200); // Wait 1.2s of silence before processing
                    }
                }
            }

            // Handle utterance end (longer pause)
            if (result.type === 'UtteranceEnd') {
                if (session.currentSpeech.trim() && !session.isProcessing && !session.isSpeaking) {
                    if (session.silenceTimer) clearTimeout(session.silenceTimer);

                    const fullText = session.currentSpeech.trim();
                    session.currentSpeech = '';

                    session.isProcessing = true;
                    console.log(`👤 Caller (utterance end): "${fullText}"`);

                    try {
                        const reply = await getAIResponse(session, fullText);
                        await speakToCall(twilioWs, session, reply);
                    } catch (err) {
                        console.error('AI response error:', err);
                    } finally {
                        session.isProcessing = false;
                    }
                }
            }
        } catch (err) {
            console.error('Deepgram message error:', err);
        }
    });

    dgWs.on('close', () => {
        console.log('🎤 Deepgram STT disconnected');
    });

    dgWs.on('error', (err) => {
        console.error('Deepgram WebSocket error:', err);
    });
}

// ─── Cleanup ───
function cleanup(session: StreamSession) {
    if (session.silenceTimer) clearTimeout(session.silenceTimer);
    if (session.deepgramWs) {
        try { session.deepgramWs.close(); } catch { /* ignore */ }
        session.deepgramWs = null;
    }
}
