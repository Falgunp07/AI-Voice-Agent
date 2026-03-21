import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../utils/supabase';

const router = Router();

let groq: Groq | null = null;
function getGroq(): Groq {
    if (!groq) {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
}

// Store conversation history per session (in-memory for now)
const conversations = new Map<string, Array<{ role: string; content: string }>>();

// Track sessions that already booked an appointment (prevent duplicates)
const bookedSessions = new Set<string>();

// List of known Indian cities + their Hindi (Devanagari) spellings for server-side filtering
// since STT engine returns Devanagari text like "दाहोद"
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

// Detect city from conversation history
function detectCityFromHistory(history: Array<{ role: string, content: string }>): string | null {
    // Scan user messages from newest to oldest for city mentions
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role !== 'user') continue;
        const msg = history[i].content.toLowerCase();
        for (const [key, normalized] of Object.entries(CITY_MAP)) {
            if (msg.includes(key)) return normalized;
        }
    }
    return null;
}

const DEFAULT_SYSTEM_PROMPT = `## IDENTITY
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
2. Jo info user ALREADY bol chuka hai (location, budget, name), DOBARA mat poochho. Conversation history dhyan se padho.
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
2. NAME → Naam sunke politely reply do (dekho CRITICAL RULE 1). Agar user ne location/budget BHI bata diya hai, toh seedhe options batao.
3. LOCATION + BUDGET → Agar user ne location ALREADY bola hai (jaise "Ahmedabad mein dekh raha hu"), toh SKIP location question. Seedha budget poochho.
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


// POST /api/ai/chat — Send a message, get AI response
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message, sessionId, systemPrompt, context } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // ── Special case: call just started → return exact Hindi greeting directly ──
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

        // Detect city from conversation history for server-side filtering
        const detectedCity = detectCityFromHistory(history);
        console.log('[CITY-FILTER] Detected city:', detectedCity || 'none yet');

        // Fetch properties from Supabase — PRE-FILTERED by detected city
        let inventoryContext = "";
        let fetchedProperties: any[] = [];
        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

            let query = supabase
                .from('properties')
                .select('name, price, location, bedrooms, amenities, images');

            // Server-side city filter — only send matching properties to LLM
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
                    let priceStr = "";
                    if (priceVal >= 10000000) priceStr = `₹${(priceVal / 10000000).toFixed(2)} Cr`;
                    else if (priceVal >= 100000) priceStr = `₹${(priceVal / 100000).toFixed(0)} Lakhs`;
                    else priceStr = `₹${priceVal}`;
                    inventoryContext += `\n- ${p.name} | ${p.location} | ${p.bedrooms}BHK | ${priceStr}`;
                });
            } else if (detectedCity) {
                // Fetch fallback properties from Gujarat
                const { data: fallback } = await supabase.from('properties').select('name, price, location, bedrooms, amenities, images').limit(3);
                inventoryContext = `\n${detectedCity.toUpperCase()} mein koi property available NAHI hai. Par GUJARAT mein ye options available hain:\n`;
                if (fallback) {
                    fallback.forEach((p: any) => {
                        const priceVal = Number(p.price);
                        let priceStr = "";
                        if (priceVal >= 10000000) priceStr = `₹${(priceVal / 10000000).toFixed(2)} Cr`;
                        else if (priceVal >= 100000) priceStr = `₹${(priceVal / 100000).toFixed(0)} Lakhs`;
                        else priceStr = `₹${priceVal}`;
                        inventoryContext += `\n- ${p.name} | ${p.location} | ${p.bedrooms}BHK | ${priceStr}`;
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch inventory for context:", err);
        }

        // Build system message with optional context
        let sysPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

        if (inventoryContext) {
            sysPrompt += `\n\n${inventoryContext}`;
        }
        if (context) {
            sysPrompt += `\n\nCONTEXT FOR THIS CALL:`;
            if (context.leadName) sysPrompt += `\nCaller's name: ${context.leadName}`;
            if (context.propertyName) sysPrompt += `\nProperty to discuss: ${context.propertyName}`;
            if (context.propertyLocation) sysPrompt += `\nLocation: ${context.propertyLocation}`;
            if (context.propertyPrice) sysPrompt += `\nPrice range: ${context.propertyPrice}`;
        }

        // Add user message to history
        history.push({ role: 'user', content: message });

        // Keep last 10 messages to avoid token limits
        const trimmedHistory = history.slice(-10);

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

            if (!sarvamRes.ok) {
                const errorText = await sarvamRes.text();
                throw new Error(`Sarvam LLM error: ${sarvamRes.status} - ${errorText}`);
            }

            const sarvamData = await sarvamRes.json();
            reply = sarvamData.choices?.[0]?.message?.content || '';
            if (reply) console.log('[LLM] Using Sarvam-M (native Hindi)');
        } catch (sarvamErr: any) {
            console.warn('[LLM] Sarvam-M failed, falling back to Groq:', sarvamErr.message);
        }

        // Fallback to Groq
        if (!reply) {
            try {
                const client = getGroq();
                const completion = await client.chat.completions.create({
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
            reply = 'Maaf kijiye, thoda issue aa raha hai. Kya aap phir se bol sakte hain?';
        }

        // Strip <think> reasoning tags that Sarvam-M sometimes leaks
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>/g, '').replace(/<\/think>/g, '').trim();
        if (!reply) {
            reply = 'Maaf kijiye, thoda issue aa raha hai. Kya aap phir se bol sakte hain?';
        }

        // Truncate overly long responses — keep first 2 sentences
        const respWords = reply.split(/\s+/);
        if (respWords.length > 50) {
            let cutIdx = reply.length;
            let sc = 0;
            for (let i = 0; i < reply.length; i++) {
                if (reply[i] === '.' || reply[i] === '?' || reply[i] === '!') {
                    sc++;
                    if (sc >= 2) { cutIdx = i + 1; break; }
                }
            }
            reply = reply.substring(0, cutIdx).trim();
        }

        // ── Auto-detect appointment booking ──
        let appointmentBooked = null;
        let cleanReply = reply;
        const bookingMatch = reply.match(/\[BOOKING:(.+?)\]/);
        // Always strip any booking tags (complete or incomplete) from the visible reply
        cleanReply = reply.replace(/\s*\[BOOKING:[^\]]*\]?/g, '').trim();
        if (!cleanReply) cleanReply = 'Done! Aapki booking ho gayi hai.';
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
        } else if (bookingMatch) {
            // Already booked in this session — just strip the tag
            cleanReply = reply.replace(/\s*\[BOOKING:.+?\]/, '').trim();
        }

        // Save assistant reply to history (clean version without tag)
        history.push({ role: 'assistant', content: cleanReply });
        conversations.set(session, history);

        res.json({
            success: true,
            reply: cleanReply,
            appointmentBooked,
            tokensUsed: 0,
            // Only attach images if user explicitly asked for them
            propertyImages: (() => {
                try {
                    // Only trigger images with explicit image-related phrases (not just "show")
                    const msgLower = message.toLowerCase();
                    const imagePhrases = [
                        'show image', 'show photo', 'show picture', 'show pic',
                        'send image', 'send photo', 'send picture', 'send pic',
                        'share image', 'share photo', 'share picture',
                        'see image', 'see photo', 'see picture',
                        'images of', 'photos of', 'pictures of',
                        'property image', 'property photo', 'property picture',
                        'how does it look', 'what does it look like',
                    ];
                    const userAskedForImages = imagePhrases.some(phrase => msgLower.includes(phrase));
                    if (!userAskedForImages) return undefined;

                    const matched: { propertyName: string; images: string[] }[] = [];
                    for (const prop of fetchedProperties) {
                        if (cleanReply.toLowerCase().includes(prop.name.toLowerCase()) && prop.images?.length) {
                            matched.push({
                                propertyName: prop.name,
                                images: prop.images.slice(0, 3),
                            });
                        }
                    }
                    return matched.length > 0 ? matched : undefined;
                } catch { return undefined; }
            })(),
        });
    } catch (error: any) {
        console.error('AI Chat Error FULL DETAILS:', error); // Enhanced logging
        if (error.error?.message) console.error('Groq Error Message:', error.error.message);
        res.status(500).json({ success: false, error: error.message || 'AI Service Failed' });
    }
});

// POST /api/ai/reset — Clear conversation history
router.post('/reset', (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const session = sessionId || 'default';
    conversations.delete(session);
    res.json({ success: true, message: 'Conversation reset' });
});

// POST /api/ai/tts — Convert text to speech using Sarvam AI (Hindi)
router.post('/tts', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'Sarvam API key not configured' });
        }

        const speaker = process.env.SARVAM_SPEAKER || 'rahul';
        const model = process.env.SARVAM_MODEL || 'bulbul:v3';

        console.log(`[TTS] Generating Hindi audio with Sarvam AI (Speaker: ${speaker})`);

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

        // Decode base64 WAV and send to browser
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
