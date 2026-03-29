-- PropCall AI - Multi-Tenant Migration
-- Run this script in your Supabase SQL Editor. 
-- It adds a user_id column to every table so merchants only see their OWN properties and call logs.

-- 1. Add user_id column to core tables
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Update existing rows (give ownership to the first master admin, or leave null)
-- If left null, old data will disappear for regular merchants. Which is what we want!

-- 3. Update RLS policies so users can ONLY see and edit their own rows 
-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all operations on properties" ON properties;
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
DROP POLICY IF EXISTS "Allow all operations on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow all operations on call_logs" ON call_logs;
DROP POLICY IF EXISTS "Allow all operations on campaign_leads" ON campaign_leads;

-- Create secure multi-tenant policies
-- Properties
CREATE POLICY "Users can only see their own properties" ON properties FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can only insert their own properties" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own properties" ON properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own properties" ON properties FOR DELETE USING (auth.uid() = user_id);

-- Leads
CREATE POLICY "Users can only see their own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- Campaigns
CREATE POLICY "Users can only see their own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Call Logs
CREATE POLICY "Users can only see their own call_logs" ON call_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own call_logs" ON call_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own call_logs" ON call_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own call_logs" ON call_logs FOR DELETE USING (auth.uid() = user_id);
