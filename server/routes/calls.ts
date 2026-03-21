import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// GET all call logs
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('call_logs')
            .select('*, leads(name, phone)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET call logs for specific lead
router.get('/lead/:leadId', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('call_logs')
            .select('*')
            .eq('lead_id', req.params.leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Create call log
router.post('/', async (req: Request, res: Response) => {
    try {
        const { lead_id, duration, status, transcript, recording_url, sentiment } = req.body;

        const { data, error } = await supabase
            .from('call_logs')
            .insert({
                lead_id,
                duration,
                status,
                transcript,
                recording_url,
                sentiment,
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET analytics/stats
router.get('/analytics', async (req: Request, res: Response) => {
    try {
        // Total calls
        const { count: totalCalls } = await supabase
            .from('call_logs')
            .select('*', { count: 'exact', head: true });

        // Successful calls (completed status)
        const { count: successfulCalls } = await supabase
            .from('call_logs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Average duration
        const { data: avgData } = await supabase
            .from('call_logs')
            .select('duration');

        const avgDuration = avgData
            ? avgData.reduce((sum: number, log: any) => sum + (log.duration || 0), 0) / (avgData.length || 1)
            : 0;

        // Sentiment breakdown
        const { data: sentimentData } = await supabase
            .from('call_logs')
            .select('sentiment');

        const sentimentBreakdown = {
            positive: sentimentData?.filter((log: any) => log.sentiment === 'positive').length || 0,
            neutral: sentimentData?.filter((log: any) => log.sentiment === 'neutral').length || 0,
            negative: sentimentData?.filter((log: any) => log.sentiment === 'negative').length || 0,
        };

        res.json({
            success: true,
            data: {
                totalCalls: totalCalls || 0,
                successfulCalls: successfulCalls || 0,
                averageDuration: Math.round(avgDuration),
                conversionRate: totalCalls ? ((successfulCalls || 0) / totalCalls) * 100 : 0,
                sentimentBreakdown,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
