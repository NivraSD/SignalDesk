-- Three Grounded tables had "allow everything" policies for every role, so the public anon key
-- could read and write every user's profile, embeddings and API keys. Server functions use the
-- service role, which bypasses RLS, so these policies were never needed.
drop policy if exists "Service role can manage profiles" on grounded_user_profile;
drop policy if exists "Service role can manage embeddings" on grounded_embeddings;
drop policy if exists grounded_api_keys_all on grounded_api_keys;

-- People can correct what Grounded has learned about them ("About you").
drop policy if exists "Users can update own profile" on grounded_user_profile;
create policy "Users can update own profile" on grounded_user_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
