-- Run this in Supabase SQL Editor to create the required tables

-- AI Call History table (for saving playground call transcripts)
CREATE TABLE IF NOT EXISTS ai_call_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_name text NOT NULL DEFAULT 'Unknown',
    session_id text,
    duration integer DEFAULT 0,
    transcript jsonb DEFAULT '[]'::jsonb,
    message_count integer DEFAULT 0,
    status text DEFAULT 'completed',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow all operations (admin-only table)
ALTER TABLE ai_call_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ai_call_history" ON ai_call_history
    FOR ALL USING (true) WITH CHECK (true);

-- Appointments table (for site visit bookings)
CREATE TABLE IF NOT EXISTS appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name text NOT NULL,
    customer_phone text,
    customer_email text,
    property_name text NOT NULL,
    appointment_date date NOT NULL,
    appointment_time time NOT NULL,
    notes text,
    status text DEFAULT 'scheduled',
    source text DEFAULT 'manual',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow all operations (admin-only table)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on appointments" ON appointments
    FOR ALL USING (true) WITH CHECK (true);
