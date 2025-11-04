import * as React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { subscribeToMatchMessages } from './realtime';
import { markThreadRead } from './readState';

type Unsub = () => void;

type ThreadMeta = {
  match_id: string;
  other_user_id: string;
  other_name: string | null;
  other_photo: string | null;
};

type Ctx = {
  unreadTotal: number;
  setActiveMatch: (id: string | null) => void;
};

const ChatNotifyContext = React.createContext<Ctx>({ 
  unreadTotal: 0, 
  setActiveMatch: () => {} 
});

export const useChatNotify = () => React.useContext(ChatNotifyContext);

type ToastData = {
  match_id: string;
  from_id: string;
  title: string;
  body: string;
  photo_url?: string | null;
};

function Toast({ 
  data, 
  onPress, 
  onClose 
}: { 
  data: ToastData; 
  onPress: () => void; 
  onClose: () => void;
}) {
  return (
    <View className="absolute bottom-4 inset-x-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-3">
      <Pressable onPress={onPress} className="flex-row items-center gap-3">
        {data.photo_url ? (
          <Image 
            source={{ uri: data.photo_url }} 
            style={{ width: 36, height: 36, borderRadius: 999 }} 
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-white/10 border border-white/15" />
        )}
        <View className="flex-1">
          <Text className="text-zinc-100 font-semibold" numberOfLines={1}>
            {data.title}
          </Text>
          <Text className="text-zinc-300" numberOfLines={2}>
            {data.body}
          </Text>
        </View>
        <Pressable 
          onPress={onClose} 
          hitSlop={10} 
          className="px-2 py-1 rounded-lg bg-white/10 border border-white/15"
        >
          <Text className="text-zinc-300">Close</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

export function ChatNotifyProvider({ 
  children, 
  navigation 
}: { 
  children: React.ReactNode; 
  navigation?: any;
}) {
  const [unreadTotal, setUnreadTotal] = React.useState(0);
  const [activeMatch, setActiveMatch] = React.useState<string | null>(null);
  const [threads, setThreads] = React.useState<ThreadMeta[]>([]);
  const [toast, setToast] = React.useState<ToastData | null>(null);
  const subs = React.useRef<Unsub[]>([]);
  const uidRef = React.useRef<string | null>(null);

  async function loadThreads(uid: string) {
    const { data: matches } = await supabase
      .from('matches')
      .select('id, user_a, user_b')
      .or(`user_a.eq.${uid},user_b.eq.${uid}`);

    const list = (matches ?? []).map((m) => {
      const other = m.user_a === uid ? m.user_b : m.user_a;
      return { 
        match_id: m.id as string, 
        other_user_id: other as string 
      };
    });

    if (!list.length) { 
      setThreads([]); 
      return; 
    }

    const otherIds = list.map(l => l.other_user_id);
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, display_name, photo_url')
      .in('id', otherIds);

    const profMap = new Map((profs ?? []).map(p => [p.id, p]));

    const withMeta: ThreadMeta[] = list.map(l => {
      const p = profMap.get(l.other_user_id);
      return {
        ...l,
        other_name: p?.display_name ?? null,
        other_photo: p?.photo_url ?? null,
      };
    });

    setThreads(withMeta);
  }

  async function computeUnread(uid: string, matchIds: string[]) {
    if (!matchIds.length) { 
      setUnreadTotal(0); 
      return; 
    }

    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('match_id, created_at')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false });

    const latestByMatch = new Map<string, string>();
    (lastMsgs ?? []).forEach(m => {
      if (!latestByMatch.has(m.match_id)) {
        latestByMatch.set(m.match_id, m.created_at);
      }
    });

    const { data: reads } = await supabase
      .from('message_reads')
      .select('match_id, last_read_at')
      .eq('user_id', uid)
      .in('match_id', matchIds);

    const readMap = new Map<string, string>();
    (reads ?? []).forEach(r => readMap.set(r.match_id, r.last_read_at));

    let total = 0;
    for (const [mid, last] of latestByMatch.entries()) {
      const readAt = readMap.get(mid);
      if (!readAt || new Date(last) > new Date(readAt)) {
        total += 1;
      }
    }

    setUnreadTotal(total);
  }

  function resubscribe(uid: string, metas: ThreadMeta[]) {
    subs.current.forEach(u => u());
    subs.current = [];

    metas.forEach(meta => {
      const off = subscribeToMatchMessages(meta.match_id, (row) => {
        if (row.sender_id === uid) return;

        if (activeMatch !== meta.match_id) {
          setToast({
            match_id: meta.match_id,
            from_id: row.sender_id,
            title: meta.other_name ?? 'New message',
            body: row.body ?? '',
            photo_url: meta.other_photo ?? null
          });
          setUnreadTotal((n) => n + 1);
        } else {
          markThreadRead(uid, meta.match_id);
        }
      });
      subs.current.push(off);
    });
  }

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      uidRef.current = uid;
      if (!uid) { 
        setThreads([]); 
        setUnreadTotal(0); 
        return; 
      }
      await loadThreads(uid);
    })();

    const authSub = supabase.auth.onAuthStateChange((_event, session) => {
      uidRef.current = session?.user?.id ?? null;
      if (!uidRef.current) {
        setThreads([]); 
        setUnreadTotal(0);
        subs.current.forEach(u => u()); 
        subs.current = [];
      } else {
        loadThreads(uidRef.current);
      }
    });

    return () => { 
      mounted = false; 
      authSub.data.subscription.unsubscribe(); 
      subs.current.forEach(u => u()); 
    };
  }, []);

  React.useEffect(() => {
    const uid = uidRef.current;
    if (!uid) return;

    const ids = threads.map(t => t.match_id);
    resubscribe(uid, threads);
    computeUnread(uid, ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(threads.map(t => t.match_id)), activeMatch]);

  const ctx: Ctx = React.useMemo(() => ({
    unreadTotal,
    setActiveMatch: (id) => {
      setActiveMatch(id);
      const uid = uidRef.current;
      if (uid && id) {
        markThreadRead(uid, id);
      }
    }
  }), [unreadTotal]);

  return (
    <ChatNotifyContext.Provider value={ctx}>
      <View className="flex-1">
        {children}
        {toast ? (
          <Toast
            data={toast}
            onPress={() => {
              setToast(null);
              if (navigation && toast?.match_id) {
                ctx.setActiveMatch(toast.match_id);
                navigation.navigate('Chat', { matchId: toast.match_id });
              }
            }}
            onClose={() => setToast(null)}
          />
        ) : null}
      </View>
    </ChatNotifyContext.Provider>
  );
}

