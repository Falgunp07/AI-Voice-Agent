const sessionId = 'hindi-flow-test-' + Date.now();

async function post(message) {
    const res = await fetch('http://localhost:4000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
    });
    const data = await res.json();
    return data.reply;
}

async function main() {
    console.log('\n=== HINDI FLOW TEST ===\n');

    const step1 = await post('hello');
    console.log('👤 User: hello');
    console.log('🤖 Agent:', step1);
    console.log('');

    const step2 = await post('mera naam dhruv hai');
    console.log('👤 User: mera naam dhruv hai');
    console.log('🤖 Agent:', step2);
    console.log('');

    const step3 = await post('haan property dekhni hai');
    console.log('👤 User: haan property dekhni hai');
    console.log('🤖 Agent:', step3);
    console.log('');

    const step4 = await post('Mumbai mein chahiye');
    console.log('👤 User: Mumbai mein chahiye');
    console.log('🤖 Agent:', step4);
    console.log('');
}

main().catch(console.error);
