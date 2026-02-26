-- =============================================================
-- GROUNDED: Personal Wellness & Recovery Tracker
-- All tables use grounded_ prefix to separate from signaldesk
-- =============================================================

-- Daily check-ins (one per user per date)
CREATE TABLE IF NOT EXISTS grounded_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  areas JSONB NOT NULL DEFAULT '{}'::jsonb,
  journal TEXT DEFAULT '',
  tomorrow_schedule JSONB DEFAULT '{}'::jsonb,
  offline_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_grounded_checkins_user_date ON grounded_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_grounded_checkins_offline ON grounded_checkins(offline_id) WHERE offline_id IS NOT NULL;

-- Journal entries
CREATE TABLE IF NOT EXISTS grounded_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('thought', 'task', 'event')),
  content TEXT NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grounded_journal_user_date ON grounded_journal_entries(user_id, created_at DESC);

-- Reminders
CREATE TABLE IF NOT EXISTS grounded_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TIME DEFAULT '09:00',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'weekly', 'custom')),
  days JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT TRUE,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grounded_reminders_user ON grounded_reminders(user_id);

-- Activity bank
CREATE TABLE IF NOT EXISTS grounded_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grounded_activities_user_area ON grounded_activities(user_id, area_id);

-- Vision board
CREATE TABLE IF NOT EXISTS grounded_vision_board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grounded_vision_board_user ON grounded_vision_board(user_id, position_order);

-- Google Calendar tokens
CREATE TABLE IF NOT EXISTS grounded_google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User settings
CREATE TABLE IF NOT EXISTS grounded_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT '',
  timezone TEXT DEFAULT 'America/New_York',
  google_calendar_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================================
-- RLS: All tables user-scoped
-- =============================================================
ALTER TABLE grounded_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounded_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounded_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounded_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounded_vision_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounded_google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE grounded_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grounded_checkins_user" ON grounded_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grounded_journal_entries_user" ON grounded_journal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grounded_reminders_user" ON grounded_reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grounded_activities_user" ON grounded_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grounded_vision_board_user" ON grounded_vision_board FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grounded_google_tokens_user" ON grounded_google_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grounded_user_settings_user" ON grounded_user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role bypass for edge functions
CREATE POLICY "grounded_google_tokens_service" ON grounded_google_tokens FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "grounded_user_settings_service" ON grounded_user_settings FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- Updated-at triggers (reuse existing function)
-- =============================================================
CREATE TRIGGER grounded_checkins_updated_at BEFORE UPDATE ON grounded_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER grounded_reminders_updated_at BEFORE UPDATE ON grounded_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER grounded_google_tokens_updated_at BEFORE UPDATE ON grounded_google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER grounded_user_settings_updated_at BEFORE UPDATE ON grounded_user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- Storage bucket for vision board images
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('grounded-images', 'grounded-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Users can upload/read/delete in their own folder
CREATE POLICY "grounded_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'grounded-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "grounded_images_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'grounded-images'
  );

CREATE POLICY "grounded_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'grounded-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
