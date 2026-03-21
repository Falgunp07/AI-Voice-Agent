const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.ELEVENLABS_API_KEY;
const targetId = 'LQ2auZHpAQ9h4azztqMT';

if (!apiKey) {
    console.error('No API Key found in .env.local');
    process.exit(1);
}

const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    method: 'GET',
    headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
    },
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: ${res.statusCode} - ${data}`);
            return;
        }

        const response = JSON.parse(data);
        console.log('--- Voices on your account ---');

        const voices = response.voices;
        let found = false;

        voices.forEach(v => {
            console.log(`- ${v.name} (${v.voice_id}) [${v.category}]`);
            if (v.voice_id === targetId) found = true;
        });

        console.log('\n--------------------------------');
        if (found) {
            console.log(`✅ Voice ID ${targetId} is AVAILABLE in your account!`);
        } else {
            console.log(`❌ Voice ID ${targetId} NOT FOUND in your account.`);
            console.log('👉 ACTION REQUIRED: You must "Add to VoiceLab" on ElevenLabs website first.');
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
