import React, { createContext, useContext, useEffect, useState } from 'react';
import { CategoriesRepository, Category } from './types';

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

interface CategoriesProviderProps {
  repo: CategoriesRepository;
  children: React.ReactNode;
}

export function CategoriesProvider({ repo, children }: CategoriesProviderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await repo.listAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CategoriesContext.Provider value={{ categories, loading, error }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}

