import WebSocket from 'ws';
import Groq from 'groq-sdk';
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

// ─── Groq Client ───
let groqClient: Groq | null = null;
function getGroq(): Groq {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

function getSystemPrompt(): string {
    return `## IDENTITY
Tum ek experienced property consultant ho. Phone call pe buyer se baat kar rahe ho. Tum AI NAHI ho — tum ek insaan ho.

## LANGUAGE
- Hindi mein bolo. Common English words okay: "property", "budget", "BHK", "location", "visit", "sir".

## RESPONSE STYLE — NATURAL CONVERSATION
- Jaise ek REAL INSAAN phone pe baat karta hai, waise bolo.
- Natural reactions do: "Accha!", "Wah!", "Zaroor!", "Bilkul!", "Haan ji!"
- MAX 2-3 sentences, MAX 40 words. Phone call hai, lecture nahi.
- KABHI empty response mat do.

## SMART PROPERTY RECOMMENDATION
Tumhe SIRF woh properties dikhaayi gayi hain jo user ki city se match karti hain.
- Agar AVAILABLE PROPERTIES list EMPTY hai → "Maaf kijiye, [City] mein abhi hamare paas koi option nahi hai. Par Gujarat ke dusre shehron mein jaise [fallback city] mein kuch acche options hain. Kya aap unhe dekhna chahenge?"
- 1 property → "Accha! [City] mein ek option hai — [name], [X]BHK, [price]."
- 2 properties → "[City] mein do options hain. Pehli hai [name1], [X]BHK, [price1]. Dusri hai [name2], [Y]BHK, [price2]."
- 3+ properties → "[City] mein kaafi options hain! Sabse acchi hai [name], [X]BHK, [price]. Bataaun?"
- SIRF list mein di gayi properties recommend karo. Apne se koi property INVENT mat karo.
⚠️ TEMPLATE LABELS RULE: Bracket wale words jaise [City] ya [name] bilkul mat bolo! Unki jagah actual city aur property ka naam bolo.
⚠️ ENGLISH WORDS RULE: "consider karenge" mat bolo. "Kya aap kisi aur city mein dekhna chahenge?" aise Hindi bolo.

## ANTI-HALLUCINATION & LISTENING (CRITICAL)
- 🚨 KABHI BHI ASSUME MAT KARO! Agar user ne sirf "haan" ya "mein" bola, toh khud se city ya budget mat socho! Poochho: "Maaf kijiye, samajh nahi aaya. Aap kaunsi city aur budget mein dekh rahe hain?"
- Agar aawaz kat jaye ya naam ajeeb lage (jaise "Diksha" ki jagah "Diwali" sunai de), toh GHALAT naam mat bolo! Poochho: "Maaf kijiye, naam theek se samajh nahi aaya. Ek baar wapas batayenge?"
- STRICT BUDGET: Agar user "30 k" bole toh "3 crore" assume mat karo. Dhyan se suno. Jo suna wahi bolo.

## FORCED REASONING (THINK LABELS)
- Model ko hamesha response dene se pehle <think> tags ke andar situation ko analyze karna hai. Example: <think>User ne budget nahi bataya, mujhe budget puchna chahiye.</think> Aapka budget kya hai?

## CRITICAL RULES
1. NAME GREETING: Jab user pahli baar apna naam bataye, usko aise address karo: "Accha [naam] ji! Kya aap Gujarat mein koi property dekh rahe hain?". "Suprabhat", "Sat Sri Akaal", "Sat saheb", "Good morning" ya koi aur greeting KABHI mat bolo.
2. Jo info user ALREADY bol chuka hai (location, budget, name), DOBARA mat poochho.
3. REPEAT mat karo.
4. DUSRI city ki property KABHI mat batao — system already filter kar ke dega.
5. BOOKING tag response mein user ko DIKHAO mat. Woh internal hai.
6. ⚠️ WhatsApp ka NAAM KABHI mat lo! Tum sirf phone pe baat kar rahe ho. "WhatsApp par bhej dunga" ya kuch bhi WhatsApp wala BILKUL mat bolo.
7. ⚠️ VAGUE PROPERTY CLAIMS BANNED: "Bahut saare options hain" ya "kuchh options bata sakta hun" KABHI mat bolo BINA actual property name, BHK, aur price bataye! Agar property list mein hai toh NAAM + BHK + PRICE batao. Agar list EMPTY hai toh bolo "Maaf kijiye, is budget mein koi option nahi hai."

## PHONE NUMBER — HINDI DIGITS ACCEPT KARO
- Agar user Hindi mein bole: ek=1, do=2, teen=3, chaar=4, paanch=5, chheh=6, saat=7, aath=8, nau=9, zero/shunya=0
- "double" ka matlab hai us digit ko DO BAAR likhna. Jaise: "7 6 double 0" = 7600, "double 3" = 33, "triple 5" = 555.
- "ek do teen chaar paanch" = 12345 — YEH VALID HAI, ACCEPT KARO.
- Number samajhne ke baad confirm karo: "Aapka number 7-6-0-0-9-6-2-6-3-3, sahi hai?"
- GALAT: "Maaf kijiye, number samajh nahi aaya" — yeh mat bolo agar hindi digits hain.

## CONVERSATION FLOW — FLEXIBLE (RIGID NAHI)
1. GREETING → Hardcoded (system se aayega)
2. NAME → Naam sunke politely reply do. Agar user ne location/budget bi de diya toh seedha options par jao. 
3. LOCATION + BUDGET → Agar user ne location ALREADY bola hai, toh SKIP location question. Seedha budget poochho.
4. PROPERTY → List mein se matching properties batao.
5. PHONE → "Aapka number de do, details bhej dunga."
6. VISIT → "Kab visit karenge?"
7. CONFIRM → "Done! [date] ko [time] baje milte hain, [naam] ji!"

⚠️ BOOKING: Phone number bina KABHI booking mat karo.

## FEW-SHOT EXAMPLES (Perfect Interactions)
User: "Mera naam Diwali hai."
Assistant: "<think>User said Diwali, but context implies a name. This is likely an ASR error for 'Diksha' or 'Deepali'. I must ask for clarification instead of calling them Diwali.</think> Maaf kijiye, aawaz thodi cut ho rahi thi. Aapka naam wapas batayenge?"

User: "Haan main Ahmedabad mein dekh raha hu."
Assistant: "<think>User gave location (Ahmedabad) but did NOT give a budget. I must ask for the budget next.</think> Accha ji! Ahmedabad mein humare paas options hain. Aapka budget lagbag kitna hai?"

User: "Bees lakh."
Assistant: "<think>User budget is 20 Lakhs in Ahmedabad. I must check the provided properties list and recommend EXACTLY what is there, or say none available if empty.</think> Ahmedabad mein is budget mein ek option hai — Swastik Heights, 2BHK, 20 Lakh. Bataaun?"

## PRICE FORMAT
- "Do crore pacchees lakh" bolo, digits mat bolo.

## BOOKING TAG (INTERNAL — user ko mat dikhao)
Jab naam + phone + property + date+time SAB ho, response ke END mein add karo:
[BOOKING:customer_name|customer_phone|property_name|date_YYYY-MM-DD|time_HH:MM]
Aaj: ${new Date().toISOString().split('T')[0]}.`;
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

    let reply = '';

    // Try Sarvam-M first (native Hindi LLM)
    try {
        const sarvamApiKey = process.env.SARVAM_API_KEY;
        if (!sarvamApiKey) throw new Error('No Sarvam API key');

        const sarvamRes = await fetch('https://api.sarvam.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'api-subscription-key': sarvamApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sarvam-m',
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 100,
            }),
        });

        if (!sarvamRes.ok) throw new Error(`Sarvam LLM error: ${sarvamRes.status}`);

        const sarvamData = await sarvamRes.json();
        reply = sarvamData.choices?.[0]?.message?.content || '';
        if (reply) {
            console.log('[LLM] Using Sarvam-M (native Hindi)');
        }
    } catch (sarvamErr: any) {
        console.warn('[LLM] Sarvam-M failed, falling back to Groq:', sarvamErr.message);
    }

    // Fallback to Groq if Sarvam failed
    if (!reply) {
        try {
            const groq = getGroq();
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 100,
            });
            reply = completion.choices[0]?.message?.content || '';
            console.log('[LLM] Using Groq/Llama (fallback)');
        } catch (groqErr: any) {
            console.error('[LLM] Groq also failed:', groqErr.message);
        }
    }

    if (!reply) {
        reply = 'Maaf kijiye, thoda network issue aa raha hai. Kya aap phir se bol sakte hain?';
    }

    // Strip <think> reasoning tags that Sarvam-M sometimes leaks
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>/g, '').replace(/<\/think>/g, '').trim();
    if (!reply) {
        reply = 'Maaf kijiye, thoda network issue aa raha hai. Kya aap phir se bol sakte hain?';
    }

    // Truncate overly long responses — keep first 2 complete sentences
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
                                }
                                session.isProcessing = false;
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
                    }
                    session.isProcessing = false;
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
