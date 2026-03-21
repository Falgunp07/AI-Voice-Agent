import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// GET all properties
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single property
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Create property
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, price, location, bedrooms, bathrooms, area, images, amenities } = req.body;

        const { data, error } = await supabase
            .from('properties')
            .insert({
                name,
                description,
                price,
                location,
                bedrooms,
                bathrooms,
                area,
                images: images || [],
                amenities: amenities || [],
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - Update property
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE property
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Property deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
