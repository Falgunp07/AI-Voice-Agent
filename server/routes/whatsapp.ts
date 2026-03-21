import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { sendWhatsAppMessage } from '../services/whatsapp';

const router = Router();

// GET /:leadId/history - Fetch chat history for a lead
router.get('/:leadId/history', async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ success: true, messages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /send - Send a manual message
router.post('/send', async (req: Request, res: Response) => {
    try {
        const { leadId, content, type } = req.body;
        if (!leadId || !content) {
            return res.status(400).json({ success: false, error: 'Lead ID and content are required' });
        }

        const message = await sendWhatsAppMessage(leadId, content, type || 'text');
        res.json({ success: true, message });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
