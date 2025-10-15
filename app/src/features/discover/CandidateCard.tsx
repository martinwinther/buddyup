import React from 'react';
import { Image, View, Text } from 'react-native';

type Props = {
  name: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  shared: number;
};

export default function CandidateCard({ name, age, bio, photoUrl, shared }: Props) {
  return (
    <View className="w-full h-[72vh] rounded-3xl overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-white/10">
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} className="w-full h-4/6" resizeMode="cover" />
      ) : (
        <View className="w-full h-4/6 bg-gradient-to-br from-zinc-800 to-zinc-700" />
      )}
      <View className="p-4 space-y-1">
        <Text className="text-zinc-100 text-xl font-semibold">
          {name ?? 'Buddy'}{age ? `, ${age}` : ''}
        </Text>
        {bio ? <Text className="text-zinc-300" numberOfLines={2}>{bio}</Text> : null}
        <Text className="text-teal-300/90 text-xs mt-1">{shared} shared interests</Text>
      </View>
    </View>
  );
}

