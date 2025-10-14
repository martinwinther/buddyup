export type Category = { id: number; slug: string; name: string };
export type SelectedCategory = { categoryId: number; intensity: number; active: boolean };
export interface CategoriesRepository {
  listAll(): Promise<Category[]>;
}

