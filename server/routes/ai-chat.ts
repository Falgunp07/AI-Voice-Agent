import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../utils/supabase';

const router = Router();

let groqClient: Groq | null = null;
function getGroq(): Groq {
    if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return groqClient;
}

// Store conversation history per session (in-memory)
const conversations = new Map<string, Array<{ role: string; content: string }>>();

// Track sessions that already booked an appointment (prevent duplicates)
const bookedSessions = new Set<string>();

// Known Indian cities + Hindi Devanagari spellings for server-side city detection
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
    'bhopal': 'bhopal', 'भोपाल': 'bhopal',
    'patna': 'patna', 'पटना': 'patna',
    'agra': 'agra', 'आगरा': 'agra',
    'aurangabad': 'aurangabad', 'औरंगाबाद': 'aurangabad',
};

function detectCityFromHistory(history: Array<{ role: string; content: string }>): string | null {
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role !== 'user') continue;
        const msg = history[i].content.toLowerCase();
        for (const [key, normalized] of Object.entries(CITY_MAP)) {
            if (msg.includes(key)) return normalized;
        }
    }
    return null;
}

const DEFAULT_SYSTEM_PROMPT = `CRITICAL FORMAT RULE — READ THIS FIRST:
You are on a PHONE CALL. Output ONLY what you would SPEAK OUT LOUD. Nothing else.
Never write "Okay, the user said...", "I need to...", "The user mentioned...", or any explanation.
Never translate. Never summarize. Never analyze.
Just speak your next sentence directly — short, natural, conversational Hindi.

WRONG: "Okay, the user just said their name is Falgun."
RIGHT: "Falgun ji, aap kis city mein property dekh rahe hain?"

---

IDENTITY: Tum "Arjun" ho — ek experienced property consultant. Phone call pe buyer se baat kar rahe ho. Hindi mein bolo.

LANGUAGE RULES:
- Hindi + common English words like "property", "budget", "BHK", "location", "visit".
- NUMBERS: Hamesha Hindi mein bolo — "pachaas lakh", "ek crore bayaalees lakh", "teen BHK".
- NEVER use English digits like "1.42 Cr" or "123". Always say "ek crore bayaalees lakh" or "ek do teen".
- DO NOT say "Bahut accha" or "Accha" as a filler. Just directly respond with useful info.

STYLE: MAX 2 sentences. MAX 25 words. Natural, warm, human.
Reactions (USE SPARINGLY, not every reply): "Wah!", "Zaroor!", "Bilkul!", "Haan ji!", "Sahi!"

CONVERSATION FLOW:
1. Greeting → "Namaste! Mai Arjun, PropCall se bol raha hu. Kya mai aapka naam jaan sakta hu?"
2. Name given → "[naam] ji, aap kis city mein property dekh rahe hain?"
3. City given → "Aapka budget lagbag kitna hai?"
4. Budget given → Tell matching properties from the list below with price IN HINDI WORDS
5. After properties → "Aapka WhatsApp number de dijiye, details bhej dunga."
6. Number given → Confirm number, then ask "Kab visit karna chahenge?"
7. Visit time given → Confirm and add BOOKING tag
8. USER SAYS VISIT NAHI KARUNGA / NAHI AAUNGA → "Koi baat nahi! Mai aapko WhatsApp pe details bhej deta hu."
9. AFTER CONFIRMING DETAILS WILL BE SENT → "kya apko aur koi jaankari chahiye?"
10. If user says no more questions / "bas" / "nahi" → "Theek hai [naam] ji, aapka bohot dhanyavaad! Details WhatsApp pe aa jayengi. Welcome!"

IMPORTANT — HANDLE REJECTION GRACEFULLY:
- If user says "nahi aaunga", "visit nahi karunga", "nahi", "abhi nahi" → DO NOT keep asking "kab visit karenge". Accept it politely and say you'll send details on WhatsApp.
- If user says "isi number pe bhej do" → The number they are calling from is their number. Say "Theek hai, isi number pe details bhej deta hu."
- NEVER repeat the same question more than once.
- NEVER say "Namaste" at the end of the call. Always close the call with "Welcome" or "Welcome!".
- After saying you'll send details, ALWAYS ask "Aur koi sawaal?" and then close with "Dhanyavaad, Welcome!"

PROPERTY RULES:
- ONLY recommend properties from the AVAILABLE PROPERTIES list.
- Give real name + BHK + price IN HINDI WORDS. Example: "teen BHK, ek crore bayaalees lakh rupaye". NEVER use digits like "1.42 Cr" or "₹80 Lakhs".
- If no properties in that city: "Maaf kijiye, [city] mein abhi koi option nahi hai. Gujarat ke doosre cities mein hai — dekhna chahenge?"

ANTI-HALLUCINATION:
- Jo user ne bola WAHI repeat karo. Khud se city/budget mat assume karo.
- Agar naam sunai nahi diya: "Maaf kijiye, naam clear nahi aaya. Ek baar phir batayenge?"

WHATSAPP NUMBER:
- Always ask for WhatsApp number, not normal number.
- Hindi digits accept karo: ek=1, do=2, teen=3, chaar=4, paanch=5, chheh=6, saat=7, aath=8, nau=9
- Confirm: "Aapka WhatsApp number [say digits in Hindi], sahi hai?"

BOOKING TAG (INTERNAL — user ko mat dikhao):
Jab naam + phone + property + date + time SAHI ho, reply ke END mein add karo:
[BOOKING:customer_name|customer_phone|property_name|date_YYYY-MM-DD|time_HH:MM]

Today: ${new Date().toISOString().split('T')[0]}

DO NOT book without WhatsApp number. DO NOT repeat same question twice. DO NOT use filler words.`;




// POST /api/ai/chat — Main chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message, sessionId, systemPrompt, context } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // Special case: call just started → return exact Hindi greeting
        if (message === 'CALL_STARTED') {
            const greeting = 'Hello! Mai PropCall se baat kar raha hu. Aapka naam kya hai?';
            const sess = sessionId || 'default';
            if (!conversations.has(sess)) conversations.set(sess, []);
            conversations.get(sess)!.push({ role: 'assistant', content: greeting });
            return res.json({ success: true, reply: greeting, appointmentBooked: null });
        }

        const session = sessionId || 'default';

        // Get or create conversation history
        if (!conversations.has(session)) {
            conversations.set(session, []);
        }
        const history = conversations.get(session)!;

        // Add user message to history FIRST, then detect city (so first mention is caught)
        history.push({ role: 'user', content: message });
        const detectedCity = detectCityFromHistory(history);
        console.log('[CITY-FILTER] Detected city:', detectedCity || 'none yet');

        // Fetch properties from Supabase — pre-filtered by detected city
        let inventoryContext = '';
        let fetchedProperties: any[] = [];
        try {
            const { createClient } = require('@supabase/supabase-js');
            const db = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            let query = db.from('properties').select('name, price, location, bedrooms, amenities, images');

            if (detectedCity) {
                query = query.ilike('location', `%${detectedCity}%`);
            }
            query = query.limit(10);

            const { data: properties } = await query;

            if (properties && properties.length > 0) {
                fetchedProperties = properties;
                inventoryContext = detectedCity
                    ? `\nAVAILABLE PROPERTIES in ${detectedCity.toUpperCase()} (SIRF yahi batao):`
                    : `\nAVAILABLE PROPERTIES:`;
                properties.forEach((p: any) => {
                    const priceVal = Number(p.price);
                    let priceStr = '';
                    if (priceVal >= 10000000) priceStr = `₹${(priceVal / 10000000).toFixed(2)} Cr`;
                    else if (priceVal >= 100000) priceStr = `₹${(priceVal / 100000).toFixed(0)} Lakhs`;
                    else priceStr = `₹${priceVal}`;
                    inventoryContext += `\n- ${p.name} | ${p.location} | ${p.bedrooms}BHK | ${priceStr}`;
                });
            } else if (detectedCity) {
                // No properties in that city — fetch fallback from Gujarat
                const { data: fallback } = await db
                    .from('properties')
                    .select('name, price, location, bedrooms')
                    .limit(3);
                inventoryContext = `\n${detectedCity.toUpperCase()} mein koi property available NAHI hai. Par GUJARAT mein ye options hain:\n`;
                if (fallback) {
                    fallback.forEach((p: any) => {
                        const priceVal = Number(p.price);
                        let priceStr = priceVal >= 10000000
                            ? `₹${(priceVal / 10000000).toFixed(2)} Cr`
                            : `₹${(priceVal / 100000).toFixed(0)} Lakhs`;
                        inventoryContext += `\n- ${p.name} | ${p.location} | ${p.bedrooms}BHK | ${priceStr}`;
                    });
                }
            }
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        }

        // Build system prompt
        let sysPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
        if (inventoryContext) sysPrompt += `\n\n${inventoryContext}`;
        if (context) {
            sysPrompt += `\n\nCONTEXT FOR THIS CALL:`;
            if (context.leadName) sysPrompt += `\nCaller's name: ${context.leadName}`;
            if (context.propertyName) sysPrompt += `\nProperty to discuss: ${context.propertyName}`;
            if (context.propertyLocation) sysPrompt += `\nLocation: ${context.propertyLocation}`;
            if (context.propertyPrice) sysPrompt += `\nPrice range: ${context.propertyPrice}`;
        }

        // Keep last 10 messages to stay within token limits
        const trimmedHistory = history.slice(-10);
        const messagesPayload = [
            { role: 'system' as const, content: sysPrompt },
            ...trimmedHistory.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
        ];

        // Sarvam-M requires the first message after system to be 'user'
        if (messagesPayload.length > 1 && messagesPayload[1].role !== 'user') {
            messagesPayload.splice(1, 0, { role: 'user', content: 'Hello' });
        }

        // ── Call Groq (fast, instruction-following LLM for Hindi responses) ──
        // Note: Sarvam-M is a reasoning model that always outputs its thinking in English.
        // We use Groq for text generation and Sarvam TTS for voice synthesis.
        let reply = '';
        try {
            const groq = getGroq();
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',  // 70B follows complex prompts better than 8B
                messages: messagesPayload,
                temperature: 0.3,
                max_tokens: 80,
            });
            reply = completion.choices[0]?.message?.content || '';
            console.log('[LLM] Groq reply:', reply.substring(0, 80));
        } catch (groqErr: any) {
            console.error('[LLM] Groq error:', groqErr.message);
            return res.status(502).json({ success: false, error: 'AI service temporarily unavailable. Please try again.' });
        }

        if (!reply) {
            reply = 'Maaf kijiye, kuch problem aa rahi hai. Thodi der baad try karein.';
        }

        // Safety filter: strip any reasoning that leaked through
        const reasoningPatterns = [
            /^okay[,\s]+/i,
            /^the user (said|asked|mentioned|wants|is|has)\b/i,
            /^i (need|should|will|must) (to |now |check |find |look )?/i,
            /^let me /i,
            /^so the user\b/i,
            /^since (the user|they)\b/i,
            /^based on\b/i,
            /^according to\b/i,
            /^note that\b/i,
            /^looking at\b/i,
            /^checking\b/i,
        ];
        const isLeak = reasoningPatterns.some(p => p.test(reply));
        if (isLeak) {
            console.warn('[FILTER] Reasoning leak caught:', reply.substring(0, 60));
            const lines = reply.split('\n').filter(l => l.trim());
            reply = lines.find(l => !reasoningPatterns.some(p => p.test(l.trim()))) || '';
            if (!reply) reply = 'Maaf kijiye, ek baar phir bol sakte hain?';
        }

        // Truncate overly long responses — keep first 2 sentences max
        const words = reply.split(/\s+/);
        if (words.length > 50) {
            let cutIdx = reply.length;
            let sentenceCount = 0;
            for (let i = 0; i < reply.length; i++) {
                if (reply[i] === '.' || reply[i] === '?' || reply[i] === '!') {
                    sentenceCount++;
                    if (sentenceCount >= 2) { cutIdx = i + 1; break; }
                }
            }
            reply = reply.substring(0, cutIdx).trim();
        }

        // ── Auto-detect appointment booking ──
        let appointmentBooked = null;
        const bookingMatch = reply.match(/\[BOOKING:([^\]]+)\]/);
        // Strip ONLY complete [BOOKING:...] tags, not partial ones
        let cleanReply = reply.replace(/\s*\[BOOKING:[^\]]+\]/g, '').trim();
        if (!cleanReply) cleanReply = 'Accha ji, thodi der mein batata hu.';


        if (bookingMatch && !bookedSessions.has(session)) {
            const parts = bookingMatch[1].split('|');
            if (parts.length >= 5) {
                const [customer_name, customer_phone, property_name, appointment_date, appointment_time] = parts.map(s => s.trim());
                try {
                    const { data: apptData } = await supabase
                        .from('appointments')
                        .insert({
                            customer_name,
                            customer_phone: customer_phone || null,
                            customer_email: null,
                            property_name,
                            appointment_date,
                            appointment_time,
                            notes: 'Auto-booked during voice call',
                            status: 'scheduled',
                            source: 'ai_call',
                        })
                        .select()
                        .single();
                    if (apptData) {
                        appointmentBooked = apptData;
                        bookedSessions.add(session);
                        console.log('✅ Auto-booked appointment:', customer_name, property_name, appointment_date, appointment_time);
                    }
                } catch (err) {
                    console.error('Failed to auto-book appointment:', err);
                }
            }
        }

        // Save assistant reply to history
        history.push({ role: 'assistant', content: cleanReply });
        conversations.set(session, history);

        // Determine if property images should be included
        const msgLower = message.toLowerCase();
        const imagePhrases = [
            'show image', 'show photo', 'show picture', 'send image', 'send photo',
            'share image', 'see image', 'images of', 'photos of', 'property image',
        ];
        const userAskedForImages = imagePhrases.some(phrase => msgLower.includes(phrase));
        let propertyImages;
        if (userAskedForImages && fetchedProperties.length > 0) {
            const matched: { propertyName: string; images: string[] }[] = [];
            for (const prop of fetchedProperties) {
                if (cleanReply.toLowerCase().includes(prop.name.toLowerCase()) && prop.images?.length) {
                    matched.push({ propertyName: prop.name, images: prop.images.slice(0, 3) });
                }
            }
            if (matched.length > 0) propertyImages = matched;
        }

        res.json({ success: true, reply: cleanReply, appointmentBooked, propertyImages });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ success: false, error: error.message || 'AI Service Failed' });
    }
});

// POST /api/ai/reset — Clear conversation history for a session
router.post('/reset', (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const session = sessionId || 'default';
    conversations.delete(session);
    res.json({ success: true, message: 'Conversation reset' });
});
// ── Text preprocessing for natural Hindi TTS ──
function preprocessForTTS(text: string): string {
    let t = text;

    // Remove markdown, brackets, special chars
    t = t.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[|\]/g, '');

    // Convert ₹X.YZ Cr → spoken Hindi
    t = t.replace(/₹?\s*(\d+)\.(\d+)\s*Cr/gi, (_, intPart, decPart) => {
        const crore = numberToHindi(parseInt(intPart));
        const lakh = numberToHindi(parseInt(decPart) * (decPart.length === 1 ? 10 : 1));
        return `${crore} crore ${lakh} lakh rupaye`;
    });
    t = t.replace(/₹?\s*(\d+)\s*Cr/gi, (_, num) => `${numberToHindi(parseInt(num))} crore rupaye`);

    // Convert ₹X Lakhs → spoken Hindi
    t = t.replace(/₹?\s*(\d+)\s*Lakhs?/gi, (_, num) => `${numberToHindi(parseInt(num))} lakh rupaye`);

    // Convert XBHK → "X BHK"
    t = t.replace(/(\d+)\s*BHK/gi, (_, num) => `${numberToHindi(parseInt(num))} BHK`);

    // Convert standalone ₹ + number
    t = t.replace(/₹\s*(\d+)/g, (_, num) => `${numberToHindi(parseInt(num))} rupaye`);

    // Clean up extra spaces
    t = t.replace(/\s{2,}/g, ' ').trim();

    return t;
}

function numberToHindi(n: number): string {
    const hindiNumbers: Record<number, string> = {
        0: 'zero', 1: 'ek', 2: 'do', 3: 'teen', 4: 'chaar', 5: 'paanch',
        6: 'chheh', 7: 'saat', 8: 'aath', 9: 'nau', 10: 'das',
        11: 'gyaarah', 12: 'baarah', 13: 'terah', 14: 'chaudah', 15: 'pandrah',
        16: 'solah', 17: 'satrah', 18: 'athaarah', 19: 'unees', 20: 'bees',
        21: 'ikkees', 22: 'baees', 23: 'teis', 24: 'chaubees', 25: 'pachchees',
        30: 'tees', 35: 'paintees', 40: 'chaalees', 42: 'bayaalees',
        45: 'paintaalees', 50: 'pachaas', 55: 'pachpan', 60: 'saath',
        65: 'painsath', 70: 'sattar', 75: 'pachhattar', 80: 'assi',
        85: 'pachaasi', 90: 'nabbe', 95: 'pachaanve', 100: 'sau',
    };
    if (hindiNumbers[n]) return hindiNumbers[n];
    if (n < 100) {
        const tens = Math.floor(n / 10) * 10;
        const ones = n % 10;
        return `${hindiNumbers[tens] || tens} ${hindiNumbers[ones] || ones}`;
    }
    return String(n);
}

// POST /api/ai/tts — Convert text to Hindi speech
// Primary: ElevenLabs (natural multilingual voice)
// Fallback: Sarvam AI (Hindi-specific, kept as backup)
router.post('/tts', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

        // ── Try ElevenLabs first (natural, human-like Hindi) ──
        const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
        const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || 'nPczCjzI2devNBz1zQrb';
        const elevenLabsModel = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';  // Turbo = low latency

        if (elevenLabsKey) {
            try {
                console.log(`[TTS] Trying ElevenLabs (Voice: ${elevenLabsVoiceId})`);

                // Preprocess for Hindi number pronunciation
                const elTtsText = preprocessForTTS(text);
                console.log(`[TTS] ElevenLabs preprocessed: "${elTtsText.substring(0, 60)}..."`);

                const elResponse = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
                    {
                        method: 'POST',
                        headers: {
                            'xi-api-key': elevenLabsKey,
                            'Content-Type': 'application/json',
                            'Accept': 'audio/mpeg',
                        },
                        body: JSON.stringify({
                            text: elTtsText,
                            model_id: elevenLabsModel,
                            voice_settings: {
                                stability: 0.5,
                                similarity_boost: 0.8,
                                style: 0.3,
                                use_speaker_boost: true,
                            },
                        }),
                    }
                );

                if (elResponse.ok) {
                    const arrayBuffer = await elResponse.arrayBuffer();
                    const audioBuffer = Buffer.from(arrayBuffer);
                    console.log(`[TTS] ElevenLabs success: ${audioBuffer.length} bytes`);

                    res.set({
                        'Content-Type': 'audio/mpeg',
                        'Content-Length': audioBuffer.length.toString(),
                    });
                    return res.send(audioBuffer);
                } else {
                    const errText = await elResponse.text();
                    console.warn('[TTS] ElevenLabs failed, falling back to Sarvam:', elResponse.status, errText);
                }
            } catch (elErr: any) {
                console.warn('[TTS] ElevenLabs error, falling back to Sarvam:', elErr.message);
            }
        }

        // ── Fallback: Sarvam AI (Hindi-specific TTS) ──
        const sarvamKey = process.env.SARVAM_API_KEY;
        if (!sarvamKey) {
            return res.status(400).json({ success: false, error: 'No TTS service configured' });
        }

        const speaker = process.env.SARVAM_SPEAKER || 'rahul';
        const model = process.env.SARVAM_MODEL || 'bulbul:v3';

        console.log(`[TTS] Using Sarvam fallback (Speaker: ${speaker})`);

        // Preprocess text for Sarvam (it needs help with English/numbers)
        const ttsText = preprocessForTTS(text);
        console.log(`[TTS] Preprocessed: "${ttsText.substring(0, 80)}..."`);

        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'api-subscription-key': sarvamKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: [ttsText],
                target_language_code: 'hi-IN',
                speaker,
                model,
                pace: 1.0,
                sample_rate: 24000,
                enable_preprocessing: true,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Sarvam TTS error:', errText);
            return res.status(500).json({ success: false, error: 'TTS generation failed' });
        }

        const data = await response.json();
        const base64Audio = data.audios?.[0];
        if (!base64Audio) {
            return res.status(500).json({ success: false, error: 'No audio returned from Sarvam AI' });
        }

        const audioBuffer = Buffer.from(base64Audio, 'base64');
        res.set({
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.length.toString(),
        });
        res.send(audioBuffer);

    } catch (error: any) {
        console.error('TTS Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
