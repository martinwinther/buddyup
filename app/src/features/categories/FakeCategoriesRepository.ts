import { CategoriesRepository, Category } from './types';

export class FakeCategoriesRepository implements CategoriesRepository {
  private readonly categories: Category[] = [
    { id: 1, slug: 'gym', name: 'Gym & Fitness' },
    { id: 2, slug: 'cooking', name: 'Cooking' },
    { id: 3, slug: 'spiritual', name: 'Spiritual' },
    { id: 4, slug: 'outdoors', name: 'Outdoors' },
    { id: 5, slug: 'gaming', name: 'Gaming' },
    { id: 6, slug: 'parenting', name: 'Parenting' },
    { id: 7, slug: 'language', name: 'Language Learning' },
    { id: 8, slug: 'music', name: 'Music' },
    { id: 9, slug: 'arts', name: 'Arts & Crafts' },
    { id: 10, slug: 'reading', name: 'Reading' },
    { id: 11, slug: 'travel', name: 'Travel' },
    { id: 12, slug: 'tech', name: 'Technology' },
  ];

  async listAll(): Promise<Category[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.categories]), 300);
    });
  }
}

