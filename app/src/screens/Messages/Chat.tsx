import React from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessagesRepository, type ChatMessage, getOtherLastRead, useChatNotify } from '../../features/messages';
import { markThreadRead } from '../../lib/chat';
import { BlocksRepository } from '../../features/safety/BlocksRepository';
import { blockUser } from '../../features/safety/SafetyRepository';
import ReportModal from '../../components/ReportModal';
import { supabase } from '../../lib/supabase';
import { pe } from '../../ui/platform';

const repo = new MessagesRepository();
const blocksRepo = new BlocksRepository();

async function findMatchId(otherId: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const me = userData.user?.id;
  if (!me) return null;

  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .or(`and(user_a.eq.${me},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${me})`)
    .maybeSingle();

  return matches?.id ?? null;
}

export default function Chat() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { setActiveMatch } = useChatNotify();
  const { matchId: providedMatchId, otherId, name } = route.params as { matchId?: string; otherId: string; name?: string };
  const [me, setMe] = React.useState<string | null>(null);
  const [matchId, setMatchId] = React.useState<string | null>(providedMatchId ?? null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [otherLastRead, setOtherLastRead] = React.useState<string | null>(null);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const scrollRef = React.useRef<FlatList | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user?.id ?? null));
  }, []);

  // Find matchId if not provided (for backward compatibility with match-based navigation)
  React.useEffect(() => {
    if (providedMatchId || !otherId) return;
    findMatchId(otherId).then(setMatchId);
  }, [providedMatchId, otherId]);

  // Check if user is blocked on mount
  React.useEffect(() => {
    if (!otherId) return;
    blocksRepo.isBlockedPair(otherId).then(blocked => setIsBlocked(blocked));
  }, [otherId]);

  React.useEffect(() => {
    if (!matchId) return;
    (async () => {
      try {
        const list = await repo.list(matchId, 100);
        setMessages(list);
        // Load other user's last read time
        const lastRead = await getOtherLastRead(matchId);
        setOtherLastRead(lastRead);
      } catch (error) {
        console.error('[Chat] Failed to load messages:', error);
        // Continue with empty messages for now
      }
    })();
  }, [matchId]);

  // Subscribe to realtime inserts for this match
  React.useEffect(() => {
    if (!matchId || !otherId) return;
    const channel = supabase
      .channel(`messages:match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as any;
          // Append if not already in list
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, row].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            // scroll to bottom after tick
            setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 0);
            return next;
          });
          // If the incoming message is from the other user, mark thread as read
          if (otherId) {
            markThreadRead(otherId).catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, otherId]);

  // Mark active thread and auto-mark read on focus
  useFocusEffect(
    React.useCallback(() => {
      if (matchId) {
        setActiveMatch(matchId);
      }
      if (otherId) {
        markThreadRead(otherId).catch(() => {});
      }
      if (matchId) {
        // Also refresh the other user's last read status
        getOtherLastRead(matchId).then(setOtherLastRead).catch(() => {});
      }
      return () => setActiveMatch(null);
    }, [otherId, matchId, setActiveMatch])
  );


  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    try {
      setSending(true);
      setInput('');
      
      // For demo mode, we'll try to send but expect it to fail gracefully
      // The database might not have the proper tables set up yet
      
      // Guard: check if either side blocked the other
      const otherId = (route.params as any)?.otherId as string | undefined;
      if (otherId) {
        const blocked = await blocksRepo.isBlockedPair(otherId);
        if (blocked) {
          Alert.alert('Blocked', 'Messaging is disabled between you and this user.');
          return;
        }
      }
      
      try {
        if (!matchId) {
          Alert.alert('Error', 'Chat session not found.');
          return;
        }
        await repo.send(matchId, trimmed);
        if (otherId) await markThreadRead(otherId);
      } catch (dbError) {
        console.error('[Chat] Database operation failed:', dbError);
        Alert.alert('Demo Mode', 'Chat functionality is in demo mode. Full messaging will be available once the database is set up.');
        return;
      }
    } catch (error) {
      console.error('[Chat] Send error:', error);
      Alert.alert('Error', 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const mine = item.sender_id === me;
    
    // Check if this is the last message I sent
    const isMyLastMessage = mine && index === messages.length - 1;
    const showSeen = isMyLastMessage && 
      otherLastRead && 
      new Date(otherLastRead).getTime() >= new Date(item.created_at).getTime();
    
    return (
      <View className={`px-4 my-1 w-full ${mine ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[80%] px-3 py-2 rounded-2xl ${mine ? 'bg-teal-500/90' : 'bg-white/10 border border-white/10'}`}>
          <Text className={`${mine ? 'text-zinc-900' : 'text-zinc-100'}`}>{item.body}</Text>
        </View>
        {showSeen && (
          <Text className="text-[11px] text-zinc-500 mt-0.5">Seen</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} className="flex-1 bg-[#0a0a0a]">
      <View className="flex-1 pt-6">
        <View className="absolute right-4 top-8 z-10" {...pe('box-none')}>
          <View {...pe('auto')}>
            <Pressable 
              onPress={() => setMenuOpen(v => !v)} 
              hitSlop={8}
              android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#E5E7EB" />
            </Pressable>
          </View>
        </View>

        {menuOpen ? (
          <View className="absolute right-4 top-16 z-10 rounded-xl border border-white/10 bg-[#0b0b0b]" {...pe('box-none')}>
            <View {...pe('auto')}>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
              className="px-4 py-3 border-b border-white/10"
            >
              <Text className="text-zinc-100">Report user</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                setMenuOpen(false);
                if (!otherId) return;
                try {
                  await blockUser(otherId);
                  setIsBlocked(true);
                  Alert.alert('Blocked', 'You will no longer see each other.');
                  nav.goBack();
                } catch (e: any) {
                  Alert.alert('Error', 'Failed to block user');
                }
              }}
              className="px-4 py-3"
            >
              <Text className="text-red-300">Block user</Text>
            </Pressable>
            </View>
          </View>
        ) : null}

        <View className="px-4 py-3 border-b border-white/5">
          <Text className="text-center text-zinc-300 text-lg font-medium">{name ?? 'Chat'}</Text>
        </View>

        {isBlocked && (
          <View className="mx-4 mt-3 px-4 py-3 rounded-xl bg-zinc-800/50 border border-white/10">
            <Text className="text-zinc-300 text-sm text-center">You blocked this user</Text>
          </View>
        )}

        <FlatList
          ref={scrollRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item, index }) => renderItem({ item, index })}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 8 }}
          onContentSizeChange={() => {}}
        />
      </View>
      <View className="flex-row items-center gap-2 px-3 pb-6">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message…"
          placeholderTextColor="#9CA3AF"
          className="flex-1 px-3 py-3 rounded-2xl bg-white/10 text-zinc-100"
          editable={!sending && !isBlocked}
        />
        <Pressable 
          onPress={send} 
          disabled={sending || isBlocked} 
          className={`px-4 py-3 rounded-2xl ${isBlocked ? 'bg-white/10' : 'bg-teal-500/90'}`}
        >
          <Text className={`font-semibold ${isBlocked ? 'text-zinc-500' : 'text-zinc-900'}`}>Send</Text>
        </Pressable>
      </View>

      <ReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedId={otherId ?? null}
        defaultBlock={true}
        onSubmitted={({ reported, blocked }) => {
          if (blocked) {
            setIsBlocked(true);
            Alert.alert('Blocked', 'You will no longer see each other.');
            nav.goBack();
          } else if (reported) {
            Alert.alert('Reported', 'Thank you for your report.');
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

