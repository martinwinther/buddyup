import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingPersistence, ProfileDraft, SelectedCategory } from './types';

const K = {
  profile: 'onb/profile',
  categories: 'onb/categories',
  completed: 'onb/completed',
};

export class AsyncOnboardingPersistence implements OnboardingPersistence {
  async saveProfile(profile: ProfileDraft) {
    await AsyncStorage.setItem(K.profile, JSON.stringify(profile));
  }
  async saveCategories(categories: SelectedCategory[]) {
    await AsyncStorage.setItem(K.categories, JSON.stringify(categories));
  }
  async loadProfile() {
    const s = await AsyncStorage.getItem(K.profile);
    return s ? (JSON.parse(s) as ProfileDraft) : null;
  }
  async loadCategories() {
    const s = await AsyncStorage.getItem(K.categories);
    return s ? (JSON.parse(s) as SelectedCategory[]) : null;
  }
  async setCompleted(completed: boolean) {
    await AsyncStorage.setItem(K.completed, completed ? '1' : '0');
  }
  async isCompleted() {
    const v = await AsyncStorage.getItem(K.completed);
    return v === '1';
  }
  async clear() {
    await AsyncStorage.multiRemove([K.profile, K.categories, K.completed]);
  }
}

