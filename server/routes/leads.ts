import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import xlsx from 'xlsx';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all leads
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single lead
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST - Upload Excel and create leads
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Parse Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        // Transform and insert leads
        const leads = jsonData.map((row: any) => ({
            name: row.Name || row.name,
            phone: row.Phone || row.phone || row.Mobile || row.mobile,
            email: row.Email || row.email,
            budget: row.Budget || row.budget,
            location: row.Location || row.location,
            preferences: row.Preferences || row.preferences,
            status: 'new',
            lead_score: null,
        }));

        const { data, error } = await supabase
            .from('leads')
            .insert(leads)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: `Successfully uploaded ${data.length} leads`,
            data,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - Update lead status
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { status, lead_score } = req.body;

        const { data, error } = await supabase
            .from('leads')
            .update({ status, lead_score, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE lead
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
