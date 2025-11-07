import React from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessagesRepository, type ChatMessage, getOtherLastRead, useChatNotify } from '../../features/messages';
import { markThreadRead, upsertMessageRead, listenOtherRead } from '../../lib/chat';
import { typingChannel } from '../../lib/realtime';
import { BlocksRepository } from '../../features/safety/BlocksRepository';
import { blockUser } from '../../features/safety/SafetyRepository';
import ReportModal from '../../components/ReportModal';
import { supabase, getAppBaseUrl } from '../../lib/supabase';
import { pe } from '../../ui/platform';
import { notifyNewMessage } from '../../lib/notifications';
import { mapSupabaseError } from '../../lib/errors';
import { msgPerMinute, msgShortBurst, msToS } from '../../lib/rateLimit';

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
  const [otherTyping, setOtherTyping] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [lastMyMsg, setLastMyMsg] = React.useState<{ text: string; at: number } | null>(null);
  const [cooldownSec, setCooldownSec] = React.useState(0);
  const [inlineWarning, setInlineWarning] = React.useState<string | null>(null);
  const scrollRef = React.useRef<FlatList | null>(null);
  const typingSenderRef = React.useRef<((userId: string, isTyping: boolean) => void) | null>(null);
  const typingTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const cooldownTimer = React.useRef<NodeJS.Timeout | null>(null);

  const startCooldown = React.useCallback((ms: number) => {
    if (!ms) return;
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }
    let remaining = Math.ceil(ms / 1000);
    setCooldownSec(remaining);
    cooldownTimer.current = setInterval(() => {
      remaining -= 1;
      setCooldownSec((prev) => {
        const next = Math.max(0, remaining);
        return next;
      });
      if (remaining <= 0 && cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    }, 1000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    };
  }, []);

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
        upsertMessageRead(matchId).catch(() => {});
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

  // Update message_reads whenever messages change while screen is focused
  React.useEffect(() => {
    if (matchId && messages.length > 0) {
      upsertMessageRead(matchId).catch(() => {});
    }
  }, [messages.length, matchId]);

  React.useEffect(() => {
    if (!me || messages.length === 0) return;
    const myMessages = messages.filter((m) => m.sender_id === me);
    if (myMessages.length === 0) return;
    const latest = myMessages[myMessages.length - 1];
    const latestAt = new Date(latest.created_at).getTime();
    setLastMyMsg((prev) => {
      if (prev && prev.at >= latestAt) return prev;
      return { text: latest.body, at: latestAt };
    });
  }, [messages, me]);

  // Subscribe to other user's read state changes
  React.useEffect(() => {
    if (!matchId || !otherId) return;
    return listenOtherRead(matchId, otherId, (iso) => setOtherLastRead(iso));
  }, [matchId, otherId]);

  // Typing channel subscription
  React.useEffect(() => {
    if (!matchId || !otherId) return;
    const { sendTyping, unsubscribe } = typingChannel(matchId, (uid, isTyping) => {
      if (uid === otherId) {
        setOtherTyping(isTyping);
      }
    });
    typingSenderRef.current = sendTyping;
    return unsubscribe;
  }, [matchId, otherId]);


  const send = async () => {
    if (cooldownSec > 0) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed.length > 600) {
      setInlineWarning('Message too long (max 600 characters).');
      return;
    }

    const now = Date.now();
    if (lastMyMsg && now - lastMyMsg.at < 120_000 && lastMyMsg.text === trimmed) {
      setInlineWarning('You just sent this message. Try rephrasing.');
      return;
    }

    if (isBlocked) {
      Alert.alert('Blocked', 'Messaging is disabled between you and this user.');
      return;
    }

    const burst = msgShortBurst.take();
    const minute = msgPerMinute.take();
    if (!burst.ok || !minute.ok) {
      const waitMs = Math.max(burst.remainingMs ?? 0, minute.remainingMs ?? 0);
      if (waitMs > 0) {
        startCooldown(waitMs);
      }
      const waitSeconds = Math.max(msToS(burst.remainingMs), msToS(minute.remainingMs));
      setInlineWarning(waitSeconds > 0 ? `You're sending too fast. Please wait ${waitSeconds}s.` : "You're sending too fast. Please wait a moment.");
      return;
    }

    const otherIdParam = (route.params as any)?.otherId as string | undefined;
    const currentMatchId = matchId;

    try {
      setSending(true);
      setInlineWarning(null);

      if (!currentMatchId) {
        setInlineWarning('Chat session not found.');
        return;
      }

      if (otherIdParam) {
        const blocked = await blocksRepo.isBlockedPair(otherIdParam);
        if (blocked) {
          Alert.alert('Blocked', 'Messaging is disabled between you and this user.');
          return;
        }
      }

      await repo.send(currentMatchId, trimmed);
      setInput('');
      setLastMyMsg({ text: trimmed, at: now });
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
        cooldownTimer.current = null;
      }
      setCooldownSec(0);

      if (otherIdParam) await markThreadRead(otherIdParam);

      if (otherIdParam && currentMatchId) {
        const preview = trimmed.slice(0, 120);
        const baseUrl = getAppBaseUrl();
        const threadUrl = baseUrl ? `${baseUrl}/chat?u=${otherIdParam}` : undefined;

        notifyNewMessage({
          matchId: currentMatchId,
          recipientId: otherIdParam,
          preview,
          threadUrl,
        }).catch((err) => {
          console.warn('[Chat] Email notification failed:', err);
        });
      }
    } catch (error: any) {
      console.error('[Chat] Send error:', error);
      const friendly = mapSupabaseError(error?.message);
      setInlineWarning(friendly);
    } finally {
      setSending(false);
    }
  };

  const onChangeText = (text: string) => {
    setInlineWarning(null);
    setInput(text);
    if (!me) return;
    
    // Send typing=true immediately
    typingSenderRef.current?.(me, true);
    
    // Clear existing timeout and set new one to send typing=false
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      typingSenderRef.current?.(me, false);
    }, 1200);
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const mine = item.sender_id === me;
    
    // Find last outgoing message from me
    const myMessages = messages.filter(m => m.sender_id === me);
    const myLastMessage = myMessages.length > 0 ? myMessages[myMessages.length - 1] : null;
    const isMyLastMessage = mine && myLastMessage?.id === item.id;
    
    const showSeen = isMyLastMessage && 
      otherLastRead && 
      new Date(otherLastRead).getTime() >= new Date(item.created_at).getTime();
    
    return (
      <View className={`px-4 my-1 w-full ${mine ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[80%] px-3 py-2 rounded-2xl ${mine ? 'bg-teal-500/90' : 'bg-white/10 border border-white/10'}`}>
          <Text className={`${mine ? 'text-zinc-900' : 'text-zinc-100'}`}>{item.body}</Text>
        </View>
        {showSeen && (
          <Text className="text-[10px] text-zinc-400 mt-1">Seen</Text>
        )}
      </View>
    );
  };

  const sendDisabled = sending || isBlocked || cooldownSec > 0;

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
      
      {otherTyping && (
        <View className="px-4 pb-1">
          <Text className="text-zinc-400 text-xs">Typing…</Text>
        </View>
      )}
      
      <View className="px-3 pb-6">
        {inlineWarning ? (
          <Text className="text-amber-300 text-xs mb-1">{inlineWarning}</Text>
        ) : null}
        {cooldownSec > 0 ? (
          <Text className="text-zinc-400 text-xs mb-1">Slow mode: {cooldownSec}s</Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-2">
          <TextInput
            value={input}
            onChangeText={onChangeText}
            placeholder="Message…"
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-3 py-3 rounded-2xl bg-white/10 text-zinc-100"
            editable={!sending && !isBlocked}
          />
          <Pressable
            onPress={send}
            disabled={sendDisabled}
            className={`px-4 py-3 rounded-2xl ${sendDisabled ? 'bg-white/10' : 'bg-teal-500/90'}`}
          >
            <Text className={`font-semibold ${sendDisabled ? 'text-zinc-500' : 'text-zinc-900'}`}>Send</Text>
          </Pressable>
        </View>
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

