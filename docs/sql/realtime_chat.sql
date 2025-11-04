-- Enable realtime on messages + thread_reads if not already in publication

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
      and tablename = 'thread_reads'
  ) then
    execute 'alter publication supabase_realtime add table public.thread_reads';
  end if;
end $$;

-- Helpful indexes

create index if not exists messages_match_created_idx
  on public.messages(match_id, created_at desc);

create index if not exists thread_reads_user_match_idx
  on public.thread_reads(user_id, match_id);

