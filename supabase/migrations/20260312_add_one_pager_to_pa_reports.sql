-- Add one_pager_data column to public_affairs_reports
ALTER TABLE public_affairs_reports ADD COLUMN IF NOT EXISTS one_pager_data JSONB;
