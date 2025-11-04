-- Ensure messages & message_reads are in the realtime publication

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_reads'
  ) then
    execute 'alter publication supabase_realtime add table public.message_reads';
  end if;
end $$;

-- Helpful indexes

create index if not exists messages_match_created_idx
  on public.messages(match_id, created_at desc);

create index if not exists message_reads_user_match_idx
  on public.message_reads(user_id, match_id);

