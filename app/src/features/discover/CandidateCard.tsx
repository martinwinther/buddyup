import React from 'react';
import { Image } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  name: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  shared: number;
};

export default function CandidateCard({ name, age, bio, photoUrl, shared }: Props) {
  return (
    <View className="flex-1 rounded-3xl overflow-hidden bg-zinc-900/60 border border-white/10">
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.img}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
      )}

      <View className="absolute bottom-0 left-0 right-0 p-4">
        <View className="rounded-2xl p-3 bg-black/45 border border-white/10">
          <Text className="text-zinc-100 text-lg font-semibold">
            {name ?? 'Buddy'}{age ? `, ${age}` : ''}
          </Text>
          {bio ? <Text className="text-zinc-300 mt-0.5" numberOfLines={2}>{bio}</Text> : null}
          <Text className="text-teal-300/90 text-xs mt-2">{shared} shared interests</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
  },
});

