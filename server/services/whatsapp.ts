import { supabase } from '../utils/supabase';

// Mock sending a WhatsApp message
export async function sendWhatsAppMessage(leadId: string, content: string, type: 'text' | 'image' | 'template' = 'text') {
    // 1. Save outbound message to DB
    const { data: message, error } = await supabase
        .from('messages')
        .insert({
            lead_id: leadId,
            direction: 'outbound',
            content,
            type,
            status: 'sent',
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending WhatsApp message:', error);
        return null;
    }

    console.log(`[WhatsApp Mock] Message sent to lead ${leadId}: ${content}`);

    // 2. Simulate delivery status updates (Demo Mode)
    setTimeout(async () => {
        await supabase
            .from('messages')
            .update({ status: 'delivered' })
            .eq('id', message.id);
    }, 2000); // Delivered after 2s

    setTimeout(async () => {
        await supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('id', message.id);
    }, 5000 + Math.random() * 5000); // Read after 5-10s

    // 3. 30% chance of auto-reply from lead
    if (Math.random() < 0.3) {
        scheduleMockReply(leadId);
    }

    return message;
}

// Simulate a reply from the lead
async function scheduleMockReply(leadId: string) {
    const replies = [
        "Thanks, I'll check it out.",
        "Can you send more photos?",
        "What is the price?",
        "Is this negotiable?",
        "I'm interested, when can I visit?",
        "Okay regarding call.",
        "Please send location.",
    ];
    const replyContent = replies[Math.floor(Math.random() * replies.length)];

    const delay = 10000 + Math.random() * 20000; // 10-30s delay

    setTimeout(async () => {
        console.log(`[WhatsApp Mock] Reply received from lead ${leadId}: ${replyContent}`);
        await supabase.from('messages').insert({
            lead_id: leadId,
            direction: 'inbound',
            content: replyContent,
            status: 'read', // Inbound messages are implicitly read by system
            type: 'text',
        });
    }, delay);
}
