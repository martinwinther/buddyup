import { supabase } from './supabase';

export function typingChannel(
  matchId: string,
  onTyping: (userId: string, isTyping: boolean) => void
) {
  const ch = supabase.channel(`typing:${matchId}`, {
    config: { broadcast: { self: true } },
  });

  ch.on('broadcast', { event: 'typing' }, (payload: any) => {
    const { userId, isTyping } = payload?.payload ?? {};
    if (userId != null && typeof isTyping === 'boolean') {
      onTyping(userId, isTyping);
    }
  });

  ch.subscribe();

  return {
    sendTyping(userId: string, isTyping: boolean) {
      ch.send({ type: 'broadcast', event: 'typing', payload: { userId, isTyping } });
    },
    unsubscribe() {
      supabase.removeChannel(ch);
    },
  };
}

