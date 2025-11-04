-- Drop old RPC functions that use thread_reads
DROP FUNCTION IF EXISTS public.mark_thread_read(uuid);
DROP FUNCTION IF EXISTS public.get_unread_counts();

-- Create new get_unread_counts that uses message_reads table
CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS TABLE(match_id uuid, other_user_id uuid, unread integer, last_read_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  with my_matches as (
    select 
      m.id as match_id,
      case 
        when m.user_a = auth.uid() then m.user_b
        when m.user_b = auth.uid() then m.user_a
      end as other_user_id
    from public.matches m
    where m.user_a = auth.uid() or m.user_b = auth.uid()
  ),
  my_reads as (
    select match_id, last_read_at
    from public.message_reads
    where user_id = auth.uid()
  )
  select
    mm.match_id,
    mm.other_user_id,
    count(*)::int as unread,
    coalesce(r.last_read_at, to_timestamp(0)) as last_read_at
  from my_matches mm
  left join my_reads r on r.match_id = mm.match_id
  left join public.messages msg on msg.match_id = mm.match_id
  where msg.sender_id <> auth.uid()
    and msg.created_at > coalesce(r.last_read_at, to_timestamp(0))
  group by mm.match_id, mm.other_user_id, r.last_read_at;
$function$;

-- Note: mark_thread_read is no longer needed as an RPC
-- The client now directly upserts to message_reads via readState.ts

