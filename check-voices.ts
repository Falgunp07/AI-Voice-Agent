import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function listVoices() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error('No API Key found');
        return;
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            method: 'GET',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch voices:', await response.text());
            return;
        }

        const data: any = await response.json();
        console.log('--- Available Voices ---');
        data.voices.forEach((v: any) => {
            console.log(`Name: ${v.name} | ID: ${v.voice_id} | Category: ${v.category}`);
        });

        const targetId = 'LQ2auZHpAQ9h4azztqMT';
        const found = data.voices.find((v: any) => v.voice_id === targetId);

        console.log('\n--- Check for Target Voice ---');
        if (found) {
            console.log(`✅ Voice found! Name: ${found.name}`);
        } else {
            console.log(`❌ Voice ID ${targetId} NOT found in your library.`);
            console.log('👉 Please go to ElevenLabs website -> Voice Library -> Click "Add to VoiceLab" for this voice.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listVoices();
