import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// GET all saved AI calls
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('ai_call_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        // If table doesn't exist yet, return empty
        res.json({ success: true, data: [] });
    }
});

// POST - Save a new AI call
router.post('/', async (req: Request, res: Response) => {
    try {
        const { caller_name, session_id, duration, transcript, message_count, status } = req.body;

        const { data, error } = await supabase
            .from('ai_call_history')
            .insert({
                caller_name: caller_name || 'Unknown Caller',
                session_id,
                duration: duration || 0,
                transcript: transcript || [],
                message_count: message_count || 0,
                status: status || 'completed',
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE - Remove a call record
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { error } = await supabase
            .from('ai_call_history')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
