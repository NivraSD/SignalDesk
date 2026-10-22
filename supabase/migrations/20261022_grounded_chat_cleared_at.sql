-- "Clear chat" hides older messages from the Chat screen only. Messages stay stored and the
-- companion still uses the full history.
alter table grounded_user_settings add column if not exists chat_cleared_at timestamptz;
