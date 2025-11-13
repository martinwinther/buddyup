// supabase/functions/admin-whoami/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const adminEmails = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } });

  const { data: u } = await userClient.auth.getUser();
  const email = u?.user?.email?.toLowerCase() ?? '';
  const is_admin = !!email && adminEmails.includes(email);

  return new Response(JSON.stringify({ is_admin }), { status: 200 });
});

