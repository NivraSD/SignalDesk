-- Fix RLS Policies for Prediction Tables
-- Run this in Supabase SQL Editor

-- Drop incorrect policies
DROP POLICY IF EXISTS "org_profiles_policy" ON stakeholder_profiles;
DROP POLICY IF EXISTS "org_predictions_policy" ON stakeholder_predictions;
DROP POLICY IF EXISTS "public_patterns_read_policy" ON stakeholder_patterns;
DROP POLICY IF EXISTS "org_patterns_write_policy" ON stakeholder_patterns;
DROP POLICY IF EXISTS "org_action_history_policy" ON stakeholder_action_history;
DROP POLICY IF EXISTS "org_metrics_policy" ON prediction_metrics;

-- Create correct policies using id = auth.uid() instead of user_id = auth.uid()

-- Stakeholder Profiles: User can access their organization's profiles
CREATE POLICY "org_profiles_policy" ON stakeholder_profiles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Stakeholder Predictions: User can access their organization's predictions
CREATE POLICY "org_predictions_policy" ON stakeholder_predictions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Stakeholder Patterns: Everyone can read, authenticated users can write
CREATE POLICY "public_patterns_read_policy" ON stakeholder_patterns
  FOR SELECT USING (true);

CREATE POLICY "org_patterns_write_policy" ON stakeholder_patterns
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Action History: User can access their organization's history
CREATE POLICY "org_action_history_policy" ON stakeholder_action_history
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Prediction Metrics: User can access their organization's metrics
CREATE POLICY "org_metrics_policy" ON prediction_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

SELECT 'RLS policies fixed!' as status;
