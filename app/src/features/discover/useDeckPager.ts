import * as React from 'react';
import { SupabaseDiscoverRepository, Candidate } from './SupabaseDiscoverRepository';

type State = {
  items: Candidate[];
  loading: boolean;
  refreshing: boolean;
  ended: boolean;
  error: string | null;
  offset: number;
};

const PAGE = 30;
const PREFETCH_THRESHOLD = 5;

export function useDeckPager(repo = new SupabaseDiscoverRepository()) {
  const inflight = React.useRef(false);
  const [state, setState] = React.useState<State>({
    items: [],
    loading: true,
    refreshing: false,
    ended: false,
    error: null,
    offset: 0,
  });

  const fetchPage = React.useCallback(async (fresh: boolean) => {
    if (inflight.current) return;
    inflight.current = true;

    setState(s => ({
      ...s,
      loading: s.items.length === 0 && !fresh ? true : s.loading,
      refreshing: fresh ? true : s.refreshing,
      error: null,
    }));

    try {
      const nextOffset = fresh ? 0 : state.offset;
      const rows = await repo.page(PAGE, nextOffset);
      setState(s => ({
        ...s,
        items: fresh ? rows : [...s.items, ...rows],
        offset: fresh ? rows.length : s.offset + rows.length,
        ended: rows.length < PAGE,
        loading: false,
        refreshing: false,
        error: null,
      }));
    } catch (e: any) {
      setState(s => ({
        ...s,
        loading: false,
        refreshing: false,
        error: e?.message ?? 'Failed to load',
      }));
    } finally {
      inflight.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, state.offset]);

  const refresh = React.useCallback(async () => {
    setState(s => ({ ...s, ended: false }));
    await fetchPage(true);
  }, [fetchPage]);

  // call on mount
  React.useEffect(() => { fetchPage(true); }, [fetchPage]);

  // Remove the head card; prefetch when low.
  const consumeHead = React.useCallback(() => {
    setState(s => {
      const next = s.items.slice(1);
      const shouldPrefetch = !s.ended && next.length <= PREFETCH_THRESHOLD && !inflight.current;
      if (shouldPrefetch) {
        // fire-and-forget; errors stored in state.error
        fetchPage(false);
      }
      return { ...s, items: next };
    });
  }, [fetchPage]);

  // Retry on demand
  const retry = React.useCallback(() => {
    if (state.items.length === 0) {
      fetchPage(true);
    } else {
      fetchPage(false);
    }
  }, [fetchPage, state.items.length]);

  return {
    items: state.items,
    loading: state.loading,
    refreshing: state.refreshing,
    ended: state.ended && state.items.length === 0,
    error: state.error,
    refresh,
    retry,
    consumeHead,
  };
}
