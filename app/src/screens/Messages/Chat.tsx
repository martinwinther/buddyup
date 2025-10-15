import React from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MessagesRepository, type ChatMessage } from '../../features/messages/MessagesRepository';
import { supabase } from '../../lib/supabase';

const repo = new MessagesRepository();

export default function Chat() {
  const route = useRoute<any>();
  const { matchId, name } = route.params as { matchId: string; name?: string };
  const [me, setMe] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);

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
      });
    })();
    return () => unSub();
  }, [matchId]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      setInput('');
      await repo.send(matchId, trimmed);
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

