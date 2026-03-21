const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = 'LQ2auZHpAQ9h4azztqMT'; // Parveen Rana
const text = 'Hello, this is a test of the Parveen Rana voice.';

console.log(`Testing TTS with Voice ID: ${voiceId}`);
console.log(`API Key present: ${!!apiKey}`);

const requestData = JSON.stringify({
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
    }
});

const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(requestData)
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', (d) => errorData += d);
        res.on('end', () => {
            console.error('❌ Error response from ElevenLabs:');
            console.error(errorData);
        });
        return;
    }

    const fileStream = fs.createWriteStream('test-output.mp3');
    res.pipe(fileStream);

    fileStream.on('finish', () => {
        console.log('✅ Success! Audio saved to test-output.mp3');
        console.log('The voice ID is working correctly with the API.');
    });
});

req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
});

req.write(requestData);
req.end();
