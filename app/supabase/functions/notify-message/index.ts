// supabase/functions/notify-message/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RequestPayload = {
  matchId: string;
  recipientId: string;
  preview: string;
  threadUrl?: string;
};

Deno.serve(async (req) => {
  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? '';

    if (!supabaseUrl || !anonKey || !serviceKey || !resendKey) {
      return new Response(
        JSON.stringify({ error: 'Missing env' }),
        { status: 500 }
      );
    }

    // Authenticate caller
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
    }
    const callerId = userData.user.id;

    // Parse request body
    const body = await req.json() as RequestPayload;
    const { matchId, recipientId, preview, threadUrl } = body;

    if (!matchId || !recipientId || !preview) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Anti-abuse check: caller must have sent at least one message in this match within last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recentMessages } = await admin
      .from('messages')
      .select('id')
      .eq('match_id', matchId)
      .eq('sender_id', callerId)
      .gte('created_at', thirtySecondsAgo)
      .limit(1);

    if (!recentMessages || recentMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recent message from caller' }),
        { status: 403 }
      );
    }

    // Verify recipientId is the other participant in this match
    const { data: match, error: matchErr } = await admin
      .from('matches')
      .select('user_a, user_b')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404 }
      );
    }

    const expectedRecipient = callerId === match.user_a ? match.user_b : match.user_a;
    if (recipientId !== expectedRecipient) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient' }),
        { status: 403 }
      );
    }

    // Check if either party has blocked the other
    const { data: blocks } = await admin
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${callerId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${callerId})`)
      .limit(1);

    if (blocks && blocks.length > 0) {
      return new Response(
        JSON.stringify({ ok: true, skipped: 'blocked' }),
        { status: 200 }
      );
    }

    // Check recipient's email notification preference
    const { data: recipientProfile } = await admin
      .from('profiles')
      .select('display_name, notify_email_messages')
      .eq('id', recipientId)
      .maybeSingle();

    if (!recipientProfile?.notify_email_messages) {
      return new Response(
        JSON.stringify({ ok: true, skipped: 'notifications disabled' }),
        { status: 200 }
      );
    }

    // Get recipient's email from auth.users
    const { data: recipientUser } = await admin.auth.admin.getUserById(recipientId);
    const recipientEmail = recipientUser?.user?.email;

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ ok: true, skipped: 'no email' }),
        { status: 200 }
      );
    }

    // Get sender's display name
    const { data: senderProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', callerId)
      .maybeSingle();

    const senderName = senderProfile?.display_name || 'Someone';

    // Build the link
    const link = threadUrl || `${appBaseUrl}/chat?u=${callerId}`;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'notifications@buddyup.dev',
        to: recipientEmail,
        subject: `New message on BuddyUp from ${senderName}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New message from ${senderName}</h2>
            <p style="color: #4b5563; margin: 16px 0;">"${preview}"</p>
            <a href="${link}" style="display: inline-block; background-color: #14b8a6; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">
              View message
            </a>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
              You can disable email notifications in your profile settings.
            </p>
          </div>
        `,
        text: `New message from ${senderName}\n\n"${preview}"\n\nView message: ${link}\n\nYou can disable email notifications in your profile settings.`,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('notify-message error:', e);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500 }
    );
  }
});

