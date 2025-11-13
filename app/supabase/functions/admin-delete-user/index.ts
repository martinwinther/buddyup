// supabase/functions/admin-delete-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function isAdminEmail(email: string | null) {
  const adminEmails = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map(s => s.trim().toLowerCase());
  return !!email && adminEmails.includes(email.toLowerCase());
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } });

  const { data: u } = await userClient.auth.getUser();
  if (!isAdminEmail(u?.user?.email ?? null)) return new Response('Forbidden', { status: 403 });

  const { user_id } = await req.json().catch(() => ({}));
  if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });

  const admin = createClient(supabaseUrl, service);

  // Reuse your cascade pattern from delete-account.ts (storage, rows, then auth)
  // Minimal: delete profile (FK cascade handles children if set),
  // but we do it explicitly to be safe & identical to your existing flow.

  // 1) delete storage files
  const bucket = 'profile-photos';
  const prefix = `profiles/${user_id}`;
  const listResp = await admin.storage.from(bucket).list(prefix, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
  if (!listResp.error && listResp.data?.length) {
    const paths = listResp.data.map(f => `${prefix}/${f.name}`);
    await admin.storage.from(bucket).remove(paths);
  }

  // 2) delete rows (messages, reads, blocks, swipes, user_categories, discovery_prefs, reports, matches, profiles)
  const tbl = (n: string) => admin.from(n);

  const { data: myMatches } = await tbl('matches').select('id').or(`user_a.eq.${user_id},user_b.eq.${user_id}`);
  if (myMatches?.length) {
    const ids = myMatches.map((m: any) => m.id);
    await tbl('messages').delete().in('match_id', ids);
  }

  await tbl('messages').delete().eq('sender_id', user_id);
  await tbl('message_reads').delete().eq('user_id', user_id);
  await tbl('thread_reads').delete().eq('user_id', user_id);
  await tbl('blocks').delete().or(`blocker_id.eq.${user_id},blocked_id.eq.${user_id}`);
  await tbl('swipes').delete().or(`swiper_id.eq.${user_id},target_id.eq.${user_id}`);
  await tbl('user_categories').delete().eq('user_id', user_id);
  await tbl('discovery_prefs').delete().eq('user_id', user_id);
  await tbl('reports').delete().or(`reporter_id.eq.${user_id},reported_id.eq.${user_id}`);
  await tbl('matches').delete().or(`user_a.eq.${user_id},user_b.eq.${user_id}`);
  await tbl('profiles').delete().eq('id', user_id);

  // 3) delete auth user
  const { error: delUserErr } = await admin.auth.admin.deleteUser(user_id);
  if (delUserErr) return new Response(JSON.stringify({ error: delUserErr.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

