import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useSessionGate() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(!!data?.session);
      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (!mounted) return;
        setHasSession(!!session);
      });
      
      return () => {
        if (mounted) {
          sub.subscription.unsubscribe();
        }
      };
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, hasSession };
}

