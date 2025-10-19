-- Fix RLS policies for opportunities and alerts tables
-- Run this in Supabase SQL Editor to fix access issues

-- First, drop existing policies
DROP POLICY IF EXISTS "Enable all access for opportunities" ON opportunities;
DROP POLICY IF EXISTS "Enable all access for alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Allow public read access to opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow service role to insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow service role to update opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow public read access to alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Allow service role to insert alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Allow service role to update alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Enable all for opportunities" ON opportunities;
DROP POLICY IF EXISTS "Enable all for alerts" ON monitoring_alerts;

-- Disable RLS temporarily to ensure access works
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts DISABLE ROW LEVEL SECURITY;

-- Verify data exists
SELECT 'RLS disabled. Current data:' as status;
SELECT COUNT(*) as opportunity_count FROM opportunities;
SELECT COUNT(*) as alert_count FROM monitoring_alerts;

-- Show sample opportunities
SELECT id, title, score, urgency, category FROM opportunities ORDER BY score DESC LIMIT 5;