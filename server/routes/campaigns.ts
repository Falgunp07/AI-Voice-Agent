import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// GET all campaigns
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*, properties(name, location)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single campaign
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*, properties(name, location)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Create campaign
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, property_id, lead_ids } = req.body;

        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                name,
                property_id,
                status: 'draft',
                total_leads: lead_ids?.length || 0,
                called_leads: 0,
                successful_calls: 0,
            })
            .select()
            .single();

        if (error) throw error;

        // Store campaign-lead associations
        if (lead_ids && lead_ids.length > 0 && data) {
            const associations = lead_ids.map((lead_id: string) => ({
                campaign_id: data.id,
                lead_id,
                status: 'pending',
            }));

            await supabase.from('campaign_leads').insert(associations);
        }

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - Update campaign status
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase
            .from('campaigns')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Start campaign (trigger call engine)
router.post('/:id/start', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;

        // Update status to active
        await supabase
            .from('campaigns')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', campaignId);

        // Get campaign leads
        const { data: campaignLeads } = await supabase
            .from('campaign_leads')
            .select('lead_id, leads(name, phone)')
            .eq('campaign_id', campaignId)
            .eq('status', 'pending');

        if (!campaignLeads || campaignLeads.length === 0) {
            return res.json({ success: true, message: 'No pending leads to call' });
        }

        // Import and run demo call engine
        const { runDemoCalls } = await import('../services/call-engine');
        runDemoCalls(campaignId as string, campaignLeads);

        res.json({
            success: true,
            message: `Campaign started! Calling ${campaignLeads.length} leads (demo mode)`,
            totalLeads: campaignLeads.length,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Pause campaign
router.post('/:id/pause', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('campaigns')
            .update({ status: 'paused', updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE campaign
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        // Delete campaign leads first
        await supabase.from('campaign_leads').delete().eq('campaign_id', campaignId);
        // Delete campaign
        const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);

        if (error) throw error;
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
