import fetch from 'node-fetch';

const apiKey = 'AIzaSyBu6tucqgrWFH8UX6a34EMU7yBA2z3SAhk';
const testLocalGemini = async () => {
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemini-1.5-flash',
                messages: [{ role: 'user', content: 'Say hello in Hindi' }],
                temperature: 0.3,
                max_tokens: 10
            })
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
};

testLocalGemini();
