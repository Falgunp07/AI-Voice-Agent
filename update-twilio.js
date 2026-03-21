require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

async function updateTwilioWebhook() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const serverUrl = process.env.SERVER_PUBLIC_URL;

    if (!accountSid || !authToken || !phoneNumber) {
        console.error('❌ Twilio credentials not found in .env.local');
        process.exit(1);
    }

    if (!serverUrl || serverUrl.includes('localhost') || (!serverUrl.includes('ngrok') && !serverUrl.includes('loca.lt'))) {
        console.error('❌ Invalid SERVER_PUBLIC_URL in .env.local. Please update it with your new public URL.');
        process.exit(1);
    }

    try {
        const client = twilio(accountSid, authToken);

        console.log(`🔍 Searching for Twilio number: ${phoneNumber}`);
        const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });

        if (numbers.length === 0) {
            console.error(`❌ Phone number ${phoneNumber} not found in your Twilio account.`);
            process.exit(1);
        }

        const sid = numbers[0].sid;
        const voiceUrl = `${serverUrl}/api/twilio/voice`;

        console.log(`📡 Updating Webhook for ${phoneNumber}...`);
        console.log(`➡️  New Voice URL: ${voiceUrl}`);

        await client.incomingPhoneNumbers(sid).update({
            voiceUrl: voiceUrl,
            voiceMethod: 'POST'
        });

        console.log('✅ Successfully updated Twilio Webhook!');
        console.log('🎉 Real-time calls should now work perfectly.');
    } catch (error) {
        console.error('❌ Failed to update Twilio Webhook:', error.message);
    }
}

updateTwilioWebhook();
