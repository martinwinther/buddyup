import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import GlassCard from '../components/GlassCard';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="px-6 py-4 border-b border-white/10">
        <Text className="text-3xl font-semibold text-zinc-100">
          Discover
        </Text>
      </View>
      
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <GlassCard
          title="Alex, 28"
          subtitle="Looking for gym buddies and hiking partners in SF"
          imageUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80"
          categories={['Gym', 'Hiking', 'Cooking']}
          className="mb-4"
        />

        <GlassCard
          title="Marcus, 32"
          subtitle="Into spirituality, meditation, and outdoor adventures"
          imageUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
          categories={['Spirituality', 'Meditation', 'Basketball']}
          className="mb-4"
        />

        <GlassCard
          title="David, 26"
          subtitle="Passionate about cooking and trying new restaurants"
          imageUrl="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80"
          categories={['Cooking', 'Food', 'Music']}
          className="mb-4"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

