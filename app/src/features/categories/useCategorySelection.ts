import { useState, useCallback } from 'react';
import { SelectedCategory } from './types';

interface UseCategorySelectionReturn {
  selected: SelectedCategory[];
  toggle: (categoryId: number) => void;
  setIntensity: (categoryId: number, intensity: 1 | 2 | 3 | 4 | 5) => void;
  setActive: (categoryId: number, active: boolean) => void;
  maxReached: boolean;
  isSelected: (categoryId: number) => boolean;
}

const MAX_SELECTIONS = 3;

export function useCategorySelection(): UseCategorySelectionReturn {
  const [selected, setSelected] = useState<SelectedCategory[]>([]);

  const isSelected = useCallback(
    (categoryId: number) => {
      return selected.some((s) => s.categoryId === categoryId);
    },
    [selected]
  );

  const toggle = useCallback(
    (categoryId: number) => {
      setSelected((prev) => {
        const exists = prev.find((s) => s.categoryId === categoryId);
        
        if (exists) {
          return prev.filter((s) => s.categoryId !== categoryId);
        }
        
        if (prev.length >= MAX_SELECTIONS) {
          return prev;
        }
        
        return [...prev, { categoryId, intensity: 3, active: true }];
      });
    },
    []
  );

  const setIntensity = useCallback(
    (categoryId: number, intensity: 1 | 2 | 3 | 4 | 5) => {
      setSelected((prev) =>
        prev.map((s) =>
          s.categoryId === categoryId ? { ...s, intensity } : s
        )
      );
    },
    []
  );

  const setActive = useCallback((categoryId: number, active: boolean) => {
    setSelected((prev) =>
      prev.map((s) =>
        s.categoryId === categoryId ? { ...s, active } : s
      )
    );
  }, []);

  const maxReached = selected.length >= MAX_SELECTIONS;

  return {
    selected,
    toggle,
    setIntensity,
    setActive,
    maxReached,
    isSelected,
  };
}

