-- Create public_affairs_reports table
CREATE TABLE IF NOT EXISTS public_affairs_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  trigger_event JSONB NOT NULL DEFAULT '{}',
  urgency TEXT NOT NULL DEFAULT 'standard' CHECK (urgency IN ('flash', 'standard', 'deep_dive')),
  report_format TEXT NOT NULL DEFAULT 'full_report' CHECK (report_format IN ('brief', 'full_report', 'deck', 'brief_and_deck')),
  status TEXT NOT NULL DEFAULT 'research_pending',
  research_data JSONB,
  blueprint_data JSONB,
  presentation_url TEXT,
  presentation_metadata JSONB,
  vault_folder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for org lookups
CREATE INDEX IF NOT EXISTS idx_public_affairs_reports_org_id ON public_affairs_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_public_affairs_reports_status ON public_affairs_reports(status);

-- RLS: open access via service_role key (matches project pattern)
ALTER TABLE public_affairs_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_affairs_reports_select" ON public_affairs_reports FOR SELECT USING (true);
CREATE POLICY "public_affairs_reports_insert" ON public_affairs_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "public_affairs_reports_update" ON public_affairs_reports FOR UPDATE USING (true);
CREATE POLICY "public_affairs_reports_delete" ON public_affairs_reports FOR DELETE USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public_affairs_reports;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_public_affairs_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_affairs_reports_timestamp
  BEFORE UPDATE ON public_affairs_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_public_affairs_reports_updated_at();
