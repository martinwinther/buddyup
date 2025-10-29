import * as React from 'react';
import { AppState } from 'react-native';
import { supabase } from '../../lib/supabase';

const INTERVAL_MS = 60_000;

async function touch() {
  try {
    await supabase.rpc('touch_last_active');
  } catch {}
}

export function usePresenceHeartbeat() {
  React.useEffect(() => {
    let active = true;
    let timer: any;

    const kick = async () => {
      if (!active) return;
      await touch();
      timer = setTimeout(kick, INTERVAL_MS);
    };

    // initial
    kick();

    // foreground → touch immediately
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void touch();
    });

    // web tab visibility (no-op native)
    if (typeof document !== 'undefined') {
      const onVis = () => { if (document.visibilityState === 'visible') void touch(); };
      document.addEventListener('visibilitychange', onVis);
      return () => {
        active = false;
        clearTimeout(timer);
        sub.remove();
        document.removeEventListener('visibilitychange', onVis);
      };
    }

    return () => {
      active = false;
      clearTimeout(timer);
      sub.remove();
    };
  }, []);
}

