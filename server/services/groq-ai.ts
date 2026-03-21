import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroq(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY not found in environment');
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

// System prompt for real estate AI voice agent
const SYSTEM_PROMPT = `You are an AI voice agent for PropCall, a premium real estate company in India. You are calling potential leads to discuss property options.

INSTRUCTIONS:
- Be professional, friendly, and concise
- Speak naturally like a real human sales agent
- Use the lead's name and the property details provided
- Your goal is to generate interest and schedule a site visit
- Handle objections politely and professionally
- If the lead is busy, offer to call back later
- If they're not interested, thank them gracefully
- Keep responses short (1-3 sentences at a time)
- Speak in English but can mix Hindi phrases naturally (e.g., "ji", "bilkul", "zaroor")

FORMAT YOUR RESPONSE AS A CONVERSATION TRANSCRIPT:
- Use "AI:" prefix for agent lines
- Use "Lead:" prefix for lead responses
- Make it realistic - include pauses, filler words, natural conversation
- The conversation should be 4-8 exchanges long
- End with a clear outcome`;

export interface ConversationResult {
    transcript: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    outcome: 'interested' | 'callback' | 'not_interested' | 'no_answer';
    duration: number;
}

// Generate an AI-powered conversation transcript
export async function generateCallConversation(
    leadName: string,
    leadPhone: string,
    propertyName?: string,
    propertyLocation?: string,
    propertyPrice?: string
): Promise<ConversationResult> {
    const groq = getGroq();

    const propertyInfo = propertyName
        ? `Property: ${propertyName} in ${propertyLocation || 'a prime location'}, priced at ${propertyPrice || 'competitive rates'}`
        : 'General real estate inquiry';

    // Randomly decide the call outcome for variety
    const rand = Math.random();
    let desiredOutcome: string;
    if (rand < 0.35) desiredOutcome = 'The lead is INTERESTED and wants to schedule a site visit';
    else if (rand < 0.55) desiredOutcome = 'The lead is BUSY and asks for a callback later';
    else if (rand < 0.75) desiredOutcome = 'The lead is NOT INTERESTED politely declines';
    else desiredOutcome = 'The lead is SOMEWHAT INTERESTED but has concerns about price or location';

    try {
        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Generate a realistic phone call transcript between the AI agent and a lead.

Lead Name: ${leadName}
Lead Phone: ${leadPhone}
${propertyInfo}

Scenario: ${desiredOutcome}

Generate ONLY the transcript in this format:
AI: [greeting]
Lead: [response]
AI: [next line]
Lead: [next line]
...

Make it sound natural and realistic. 4-8 exchanges.`,
                },
            ],
            temperature: 0.9,
            max_tokens: 500,
        });

        const transcript = completion.choices[0]?.message?.content || '';

        // Determine sentiment and outcome from the transcript
        let sentiment: ConversationResult['sentiment'] = 'neutral';
        let outcome: ConversationResult['outcome'] = 'not_interested';

        const lower = transcript.toLowerCase();
        if (lower.includes('visit') || lower.includes('interested') || lower.includes('schedule') || lower.includes('show me')) {
            sentiment = 'positive';
            outcome = 'interested';
        } else if (lower.includes('callback') || lower.includes('call back') || lower.includes('later') || lower.includes('busy')) {
            sentiment = 'neutral';
            outcome = 'callback';
        } else if (lower.includes('not interested') || lower.includes('no thank') || lower.includes('don\'t need')) {
            sentiment = 'negative';
            outcome = 'not_interested';
        } else {
            sentiment = 'neutral';
            outcome = rand < 0.5 ? 'interested' : 'callback';
        }

        // Estimate duration based on transcript length
        const lineCount = transcript.split('\n').filter(l => l.trim()).length;
        const duration = lineCount * 8 + Math.floor(Math.random() * 20); // ~8 seconds per exchange

        return { transcript, sentiment, outcome, duration };
    } catch (error) {
        console.error('Groq API error:', error);
        // Fallback to basic transcript if API fails
        return {
            transcript: `AI: Hello! Am I speaking with ${leadName}?\nLead: Yes, who is this?\nAI: Hi ${leadName}, I'm calling from PropCall regarding premium property options. Do you have a moment?\nLead: Not right now, maybe later.\nAI: No problem! I'll schedule a callback. Thank you, ${leadName}!`,
            sentiment: 'neutral',
            outcome: 'callback',
            duration: 25,
        };
    }
}

// Analyze sentiment of a transcript using Groq
export async function analyzeTranscript(transcript: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    leadScore: 'hot' | 'warm' | 'cold';
    summary: string;
}> {
    const groq = getGroq();

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: 'You are a sales call analyzer. Respond in JSON only.',
                },
                {
                    role: 'user',
                    content: `Analyze this sales call transcript and respond with JSON:
{"sentiment": "positive|neutral|negative", "leadScore": "hot|warm|cold", "summary": "one-line summary"}

Transcript:
${transcript}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 100,
        });

        const text = completion.choices[0]?.message?.content || '{}';
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(cleaned);

        return {
            sentiment: result.sentiment || 'neutral',
            leadScore: result.leadScore || 'warm',
            summary: result.summary || 'Call completed',
        };
    } catch {
        return { sentiment: 'neutral', leadScore: 'warm', summary: 'Call completed' };
    }
}
