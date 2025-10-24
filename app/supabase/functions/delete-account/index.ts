// supabase/functions/delete-account/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Json = Record<string, unknown>;

Deno.serve(async (req) => {
  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('EXPO_PUBLIC_SUPABASE_URL')!;
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(
        JSON.stringify({
          error:
            'Missing env: SUPABASE_URL|EXPO_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY|EXPO_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY',
        }),
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Who is calling?
    const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
    }
    const uid = userData.user.id;

    // Admin client (bypasses RLS)
    const admin = createClient(supabaseUrl, serviceKey);

    // 1) Delete storage files under profiles/{uid}/
    //    (list and batch remove)
    const bucket = 'profile-photos';
    const prefix = `profiles/${uid}`;
    const listResp = await admin.storage.from(bucket).list(prefix, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
    if (listResp.error) {
      // non-fatal: continue
      console.warn('storage list error', listResp.error.message);
    } else if (listResp.data && listResp.data.length) {
      const paths = listResp.data.map((f) => `${prefix}/${f.name}`);
      const delResp = await admin.storage.from(bucket).remove(paths);
      if (delResp.error) console.warn('storage remove error', delResp.error.message);
    }

    // 2) Delete DB rows that reference the user (order matters to satisfy FKs)
    const tbl = (name: string) => admin.from(name);

    // messages: delete where sender_id = uid or thread participant
    // first delete messages in threads I'm part of
    const { data: myMatches } = await tbl('matches')
      .select('id')
      .or(`user_a.eq.${uid},user_b.eq.${uid}`);
    if (myMatches && myMatches.length) {
      const matchIds = myMatches.map((m: any) => m.id);
      await tbl('messages').delete().in('match_id', matchIds);
    }
    // any stragglers sent by me (safety)
    await tbl('messages').delete().eq('sender_id', uid);

    // reads
    await tbl('thread_reads').delete().eq('user_id', uid);

    // blocks (both directions)
    await tbl('blocks').delete().eq('blocker_id', uid);
    await tbl('blocks').delete().eq('blocked_id', uid);

    // swipes (both sides)
    await tbl('swipes').delete().eq('swiper_id', uid);
    await tbl('swipes').delete().eq('target_id', uid);

    // user_categories
    await tbl('user_categories').delete().eq('user_id', uid);

    // discovery_prefs
    await tbl('discovery_prefs').delete().eq('user_id', uid);

    // reports (both roles)
    await tbl('reports').delete().eq('reporter_id', uid);
    await tbl('reports').delete().eq('reported_id', uid);

    // matches after messages are removed
    await tbl('matches').delete().or(`user_a.eq.${uid},user_b.eq.${uid}`);

    // profile last (FK to auth.users)
    await tbl('profiles').delete().eq('id', uid);

    // 3) Delete auth user
    //    (must be last; if you use CASCADE FKs you could do it earlier)
    const { error: delUserErr } = await admin.auth.admin.deleteUser(uid);
    if (delUserErr) {
      console.error('deleteUser error', delUserErr.message);
      return new Response(JSON.stringify({ error: 'DELETE_USER_FAILED' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'INTERNAL' }), { status: 500 });
  }
});