import React from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessagesRepository, type ChatMessage } from '../../features/messages/MessagesRepository';
import { ReadsRepository } from '../../features/messages/ReadsRepository';
import { ThreadReadsRepository } from '../../features/messages/ThreadReadsRepository';
import { BlocksRepository } from '../../features/safety/BlocksRepository';
import { supabase } from '../../lib/supabase';
import { pe } from '../../ui/platform';

const repo = new MessagesRepository();
const reads = new ReadsRepository();
const readsRepo = new ThreadReadsRepository();
const blocksRepo = new BlocksRepository();

export default function Chat() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { matchId, name } = route.params as { matchId: string; name?: string };
  const [me, setMe] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const scrollRef = React.useRef<FlatList | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user?.id ?? null));
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const list = await repo.list(matchId, 100);
        setMessages(list);
      } catch (error) {
        console.error('[Chat] Failed to load messages:', error);
        // Continue with empty messages for now
      }
    })();
  }, [matchId]);

  // Subscribe to realtime inserts for this match
  React.useEffect(() => {
    if (!matchId) return;
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
          // If the incoming message is from the other user, refresh read state
          readsRepo.markRead(matchId).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const meRef = React.useRef<string | null>(null);
  React.useEffect(() => { meRef.current = me; }, [me]);

  // Auto-mark read on focus
  useFocusEffect(
    React.useCallback(() => {
      if (matchId) readsRepo.markRead(matchId).catch(() => {});
      return () => {}; // no-op on blur
    }, [matchId])
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
        await repo.send(matchId, trimmed);
        await readsRepo.markRead(matchId);
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

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.sender_id === me;
    return (
      <View className={`px-4 my-1 w-full ${mine ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[80%] px-3 py-2 rounded-2xl ${mine ? 'bg-teal-500/90' : 'bg-white/10 border border-white/10'}`}>
          <Text className={`${mine ? 'text-zinc-900' : 'text-zinc-100'}`}>{item.body}</Text>
        </View>
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
              onPress={async () => {
                setMenuOpen(false);
                const otherId = (route.params as any)?.otherId as string | undefined;
                if (!otherId) return;
                await blocksRepo.block(otherId);
                Alert.alert('Blocked', 'You will no longer see each other.');
                nav.goBack();
              }}
              className="px-4 py-3 border-b border-white/10"
            >
              <Text className="text-red-300">Block user</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                const otherId = (route.params as any)?.otherId as string | undefined;
                nav.navigate('ReportUser', { otherId, from: 'chat' });
              }}
              className="px-4 py-3"
            >
              <Text className="text-zinc-100">Report user</Text>
            </Pressable>
            </View>
          </View>
        ) : null}

        <View className="px-4 py-3 border-b border-white/5">
          <Text className="text-center text-zinc-300 text-lg font-medium">{name ?? 'Chat'}</Text>
        </View>
        <FlatList
          ref={scrollRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
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
          editable={!sending}
        />
        <Pressable onPress={send} disabled={sending} className="px-4 py-3 rounded-2xl bg-teal-500/90">
          <Text className="text-zinc-900 font-semibold">Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

