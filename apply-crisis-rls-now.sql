-- APPLY THIS IN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql

-- Enable RLS and create policies for crisis_events
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can create crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can update crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can delete crisis events" ON crisis_events;

CREATE POLICY "Users can view crisis events" ON crisis_events FOR SELECT USING (true);
CREATE POLICY "Users can create crisis events" ON crisis_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update crisis events" ON crisis_events FOR UPDATE USING (true);
CREATE POLICY "Users can delete crisis events" ON crisis_events FOR DELETE USING (true);

-- Enable RLS and create policies for crisis_communications
ALTER TABLE crisis_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can create crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can update crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can delete crisis communications" ON crisis_communications;

CREATE POLICY "Users can view crisis communications" ON crisis_communications FOR SELECT USING (true);
CREATE POLICY "Users can create crisis communications" ON crisis_communications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update crisis communications" ON crisis_communications FOR UPDATE USING (true);
CREATE POLICY "Users can delete crisis communications" ON crisis_communications FOR DELETE USING (true);
