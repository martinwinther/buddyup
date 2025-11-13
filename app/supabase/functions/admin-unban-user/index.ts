// supabase/functions/admin-unban-user/index.ts

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

  const { error } = await admin.from('profiles').update({ banned: false }).eq('id', user_id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

