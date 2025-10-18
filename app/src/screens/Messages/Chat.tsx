import React from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessagesRepository, type ChatMessage } from '../../features/messages/MessagesRepository';
import { ReadsRepository } from '../../features/messages/ReadsRepository';
import { BlocksRepository } from '../../features/safety/BlocksRepository';
import { supabase } from '../../lib/supabase';

const repo = new MessagesRepository();
const reads = new ReadsRepository();
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

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user?.id ?? null));
  }, []);

  React.useEffect(() => {
    let unSub = () => {};
    (async () => {
      const list = await repo.list(matchId, 100);
      setMessages(list);
      unSub = repo.subscribe(matchId, (msg) => {
        setMessages(prev => [...prev, msg]);
        if (msg.sender_id !== meRef.current) reads.markRead(matchId);
      });
    })();
    return () => unSub();
  }, [matchId]);

  const meRef = React.useRef<string | null>(null);
  React.useEffect(() => { meRef.current = me; }, [me]);

  useFocusEffect(
    React.useCallback(() => {
      reads.markRead(matchId);
      return () => {};
    }, [matchId])
  );

  React.useEffect(() => {
    if (messages.length) reads.markRead(matchId);
  }, [messages.length, matchId]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
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
      setSending(true);
      setInput('');
      await repo.send(matchId, trimmed);
      await reads.markRead(matchId);
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
        <View className="absolute right-4 top-8 z-10">
          <Pressable onPress={() => setMenuOpen(v => !v)} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
            <Ionicons name="ellipsis-horizontal" size={18} color="#E5E7EB" />
          </Pressable>
        </View>

        {menuOpen ? (
          <View className="absolute right-4 top-16 z-10 rounded-xl border border-white/10 bg-[#0b0b0b]">
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
                nav.navigate('Report', { targetId: otherId, name });
              }}
              className="px-4 py-3"
            >
              <Text className="text-zinc-100">Report user</Text>
            </Pressable>
          </View>
        ) : null}

        <Text className="text-center text-zinc-300 mb-2">{name ?? 'Chat'}</Text>
        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
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

