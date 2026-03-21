// Test Sarvam AI TTS
async function testSarvamTTS() {
    console.log('\n=== TESTING SARVAM AI TTS ===\n');

    // Test 1: TTS endpoint from ai-chat.ts
    console.log('📢 Test 1: Browser TTS (Sarvam AI via /api/ai/tts)...');
    try {
        const res = await fetch('http://localhost:4000/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Sat saheb bhagat ji! Kya aap property dekh rahe hain?' }),
        });

        if (res.ok) {
            const contentType = res.headers.get('content-type');
            const buffer = Buffer.from(await res.arrayBuffer());
            console.log(`   ✅ TTS Success! Content-Type: ${contentType}, Size: ${buffer.length} bytes`);
        } else {
            const errText = await res.text();
            console.log(`   ❌ TTS Failed: ${res.status} - ${errText}`);
        }
    } catch (err) {
        console.log(`   ❌ TTS Error: ${err}`);
    }

    // Test 2: Chat + greeting flow
    console.log('\n📢 Test 2: CALL_STARTED greeting...');
    try {
        const res = await fetch('http://localhost:4000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'CALL_STARTED', sessionId: 'sarvam-test-' + Date.now() }),
        });
        const data = await res.json();
        console.log(`   ✅ Greeting: ${data.reply}`);
    } catch (err) {
        console.log(`   ❌ Chat Error: ${err}`);
    }

    console.log('\n=== DONE ===');
}

testSarvamTTS().catch(console.error);
