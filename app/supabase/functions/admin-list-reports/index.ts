// supabase/functions/admin-list-reports/index.ts

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

  const admin = createClient(supabaseUrl, service);

  const { limit = 50, offset = 0 } = (await req.json().catch(() => ({}))) as any;

  const { data: rows, error } = await admin
    .from('reports')
    .select('id, reason, details, created_at, reporter_id, reported_id')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // join minimal info
  const ids = Array.from(new Set([
    ...(rows?.map(r => r.reporter_id) ?? []),
    ...(rows?.map(r => r.reported_id) ?? []),
  ]));

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, photo_url')
    .in('id', ids);

  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  const emailById = new Map((users?.users ?? []).map(u => [u.id, u.email ?? null]));
  const profById = new Map((profiles ?? []).map(p => [p.id, p]));

  const items = (rows ?? []).map(r => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    created_at: r.created_at,
    reporter: {
      id: r.reporter_id,
      email: emailById.get(r.reporter_id) ?? null,
      display_name: profById.get(r.reporter_id)?.display_name ?? null,
    },
    reported: {
      id: r.reported_id,
      display_name: profById.get(r.reported_id)?.display_name ?? null,
      photo_url: profById.get(r.reported_id)?.photo_url ?? null,
    },
  }));

  const { count } = await admin
    .from('reports')
    .select('*', { count: 'exact', head: true });

  return new Response(JSON.stringify({ items, total: count ?? items.length }), { status: 200 });
});

