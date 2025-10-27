// supabase/functions/notify-new-message/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InsertEvent = {
  type: 'INSERT';
  table: string; // 'messages'
  record: {
    id: string;
    match_id: string;
    sender_id: string;
    body: string | null;
    created_at: string;
  };
};

Deno.serve(async (req) => {
  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'BuddyUp <no-reply@buddyup.dev>';
    const appUrl = Deno.env.get('APP_URL') ?? 'https://your-web-app.example';

    if (!supabaseUrl || !serviceKey || !resendKey) {
      return new Response(JSON.stringify({ error: 'Missing env' }), { status: 500 });
    }

    const payload = await req.json() as InsertEvent;
    if (payload?.table !== 'messages' || payload?.type !== 'INSERT') {
      return new Response(JSON.stringify({ ok: true, skipped: 'not an INSERT' }), { status: 200 });
    }

    const { match_id, sender_id, body } = payload.record;

    const admin = createClient(supabaseUrl, serviceKey);

    // Find recipient from match users
    const { data: match, error: mErr } = await admin
      .from('matches')
      .select('user_a, user_b')
      .eq('id', match_id)
      .maybeSingle();
    if (mErr || !match) throw new Error('MATCH_NOT_FOUND');

    const recipientId = sender_id === match.user_a ? match.user_b : match.user_a;

    // Respect blocks (either direction)
    const { data: blocked } = await admin
      .from('blocks')
      .select('id')
      .or(`blocker_id.eq.${recipientId},blocked_id.eq.${recipientId}`)
      .or(`blocker_id.eq.${sender_id},blocked_id.eq.${sender_id}`)
      .limit(1);
    if (blocked && blocked.length) {
      return new Response(JSON.stringify({ ok: true, skipped: 'blocked' }), { status: 200 });
    }

    // Respect preference
    const { data: prof } = await admin
      .from('profiles')
      .select('display_name, notify_email_messages')
      .eq('id', recipientId)
      .maybeSingle();
    if (!prof?.notify_email_messages) {
      return new Response(JSON.stringify({ ok: true, skipped: 'pref off' }), { status: 200 });
    }

    // Get recipient email (auth.users)
    const { data: recUser } = await admin.auth.admin.getUserById(recipientId);
    const toEmail = recUser?.user?.email;
    if (!toEmail) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no email' }), { status: 200 });
    }

    const preview = (body ?? '').trim().slice(0, 120) || 'New message';

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: 'You’ve got a new BuddyUp message',
        text: `Someone sent you a new message:\n\n"${preview}"\n\nOpen BuddyUp: ${appUrl}`,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: 'resend_failed', detail: t }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'INTERNAL' }), { status: 500 });
  }
});