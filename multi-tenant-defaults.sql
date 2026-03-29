-- Next Step: Ensure new rows automatically belong to the merchant who creates them!
-- Run this in your Supabase SQL Editor:

ALTER TABLE properties ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE leads ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE campaigns ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE call_logs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE campaign_leads ALTER COLUMN user_id SET DEFAULT auth.uid();
