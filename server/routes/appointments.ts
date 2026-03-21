import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// GET all appointments
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.json({ success: true, data: [] });
    }
});

// POST - Create appointment
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            property_name,
            appointment_date,
            appointment_time,
            notes,
            status,
            source,
        } = req.body;

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                customer_name,
                customer_phone: customer_phone || null,
                customer_email: customer_email || null,
                property_name,
                appointment_date,
                appointment_time,
                notes: notes || null,
                status: status || 'scheduled',
                source: source || 'manual',
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - Update appointment status
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const updates = req.body;

        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE - Remove appointment
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
