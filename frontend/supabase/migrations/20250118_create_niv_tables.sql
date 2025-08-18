-- Create niv_conversations table for storing chat messages
CREATE TABLE IF NOT EXISTS public.niv_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mcps_used TEXT[] DEFAULT '{}',
  artifact_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create niv_artifacts table for storing generated content
CREATE TABLE IF NOT EXISTS public.niv_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  mcp_sources TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_niv_conversations_session ON public.niv_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_niv_conversations_created ON public.niv_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_niv_artifacts_session ON public.niv_artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_niv_artifacts_created ON public.niv_artifacts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.niv_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niv_artifacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on your auth setup)
CREATE POLICY "Enable all for authenticated users" ON public.niv_conversations
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.niv_artifacts
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_niv_conversations_updated_at BEFORE UPDATE ON public.niv_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_niv_artifacts_updated_at BEFORE UPDATE ON public.niv_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.niv_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.niv_artifacts;