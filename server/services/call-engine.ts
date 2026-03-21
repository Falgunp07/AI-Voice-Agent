import { supabase } from '../utils/supabase';
import { generateCallConversation } from './groq-ai';
import { sendWhatsAppMessage } from './whatsapp';

const outcomeToLeadStatus: Record<string, string> = {
    interested: 'interested',
    callback: 'callback',
    not_interested: 'not_interested',
    no_answer: 'new',
};

// Run AI-powered calls for a campaign
export async function runDemoCalls(campaignId: string, campaignLeads: any[]) {
    let calledCount = 0;
    let successCount = 0;

    // Get campaign property info for context
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('*, properties(name, location, price)')
        .eq('id', campaignId)
        .single();

    const property = campaign?.properties as any;

    for (const cl of campaignLeads) {
        // Check if campaign is still active
        const { data: currentCampaign } = await supabase
            .from('campaigns')
            .select('status')
            .eq('id', campaignId)
            .single();

        if (currentCampaign?.status !== 'active') {
            console.log(`Campaign ${campaignId} is no longer active. Stopping.`);
            break;
        }

        const lead = cl.leads as any;
        const leadId = cl.lead_id;

        console.log(`[AI Call] Calling ${lead?.name || 'Unknown'}...`);

        // Simulate ringing delay (1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        // 15% chance of no answer (skip AI generation)
        if (Math.random() < 0.15) {
            await supabase.from('call_logs').insert({
                lead_id: leadId,
                duration: 30,
                status: 'no_answer',
                transcript: `[Call placed to ${lead?.phone || 'unknown'} — No answer after 30 seconds]`,
                sentiment: 'neutral',
            });

            await supabase
                .from('campaign_leads')
                .update({ status: 'no_answer' })
                .eq('campaign_id', campaignId)
                .eq('lead_id', leadId);

            calledCount++;
            await updateCampaignProgress(campaignId, calledCount, successCount);
            console.log(`[AI Call] ${lead?.name}: No answer`);
            continue;
        }

        // Generate AI-powered conversation using Groq
        const result = await generateCallConversation(
            lead?.name || 'Sir/Madam',
            lead?.phone || '',
            property?.name,
            property?.location,
            property?.price ? `₹${Number(property.price).toLocaleString('en-IN')}` : undefined
        );

        // Log the call
        await supabase.from('call_logs').insert({
            lead_id: leadId,
            duration: result.duration,
            status: 'completed',
            transcript: result.transcript,
            sentiment: result.sentiment,
        });

        // Update lead status
        const newLeadStatus = outcomeToLeadStatus[result.outcome] || 'contacted';
        await supabase
            .from('leads')
            .update({
                status: newLeadStatus,
                lead_score: result.sentiment === 'positive' ? 'hot' : result.sentiment === 'negative' ? 'cold' : 'warm',
                updated_at: new Date().toISOString(),
            })
            .eq('id', leadId);

        // Update campaign-lead status
        await supabase
            .from('campaign_leads')
            .update({ status: 'completed' })
            .eq('campaign_id', campaignId)
            .eq('lead_id', leadId);

        // ---------------------------------------------------------
        // AUTOMATION: Send WhatsApp message if interested/callback
        // ---------------------------------------------------------
        if (result.outcome === 'interested' || result.outcome === 'callback') {
            console.log(`[Automation] Triggering WhatsApp for ${lead.name}`);

            let message = '';
            if (result.outcome === 'interested') {
                message = `Hi ${lead.name.split(' ')[0]}, great speaking with you! Here are the details for *${property.name}* in ${property.location}.\n\nPrice: ₹${Number(property.price).toLocaleString('en-IN')}\n\nLet me know if you'd like to visit this weekend. - Arjun, PropCall`;
            } else {
                message = `Hi ${lead.name.split(' ')[0]}, as discussed, I'll call you back later regarding *${property.name}*. Feel free to reply here if you have questions! - Arjun, PropCall`;
            }

            await sendWhatsAppMessage(leadId, message, 'template');
        }

        calledCount++;
        successCount++;
        await updateCampaignProgress(campaignId, calledCount, successCount);

        console.log(`[AI Call] ${lead?.name}: ${result.outcome} | ${result.sentiment} | ${result.duration}s`);

        // Small delay between calls (1-2s)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }

    // Mark campaign as completed
    await supabase
        .from('campaigns')
        .update({
            status: 'completed',
            called_leads: calledCount,
            successful_calls: successCount,
            updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

    console.log(`✅ Campaign ${campaignId} completed: ${calledCount} calls, ${successCount} successful`);
}

async function updateCampaignProgress(campaignId: string, calledCount: number, successCount: number) {
    await supabase
        .from('campaigns')
        .update({
            called_leads: calledCount,
            successful_calls: successCount,
            updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
}
