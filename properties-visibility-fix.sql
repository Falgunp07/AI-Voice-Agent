-- Run this in your Supabase SQL Editor to make Properties 100% hidden for new merchants!
DROP POLICY IF EXISTS "Users can only see their own properties" ON properties;
CREATE POLICY "Users can only see their own properties" ON properties FOR SELECT USING (auth.uid() = user_id);
