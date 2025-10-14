import React from 'react';
import { View } from 'react-native';
import { Category } from '../features/categories/types';
import { CategoryPill } from './CategoryPill';

interface CategoryGridProps {
  categories: Category[];
  selectedIds: number[];
  onToggle: (categoryId: number) => void;
  maxReached: boolean;
}

export function CategoryGrid({
  categories,
  selectedIds,
  onToggle,
  maxReached,
}: CategoryGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id);
        const isDisabled = !isSelected && maxReached;
        
        return (
          <CategoryPill
            key={category.id}
            name={category.name}
            isSelected={isSelected}
            onPress={() => onToggle(category.id)}
            disabled={isDisabled}
          />
        );
      })}
    </View>
  );
}

