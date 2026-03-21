-- Campaign-Lead association table (run in Supabase SQL Editor)
-- This links leads to campaigns

CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'no_answer')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead ON campaign_leads(lead_id);
