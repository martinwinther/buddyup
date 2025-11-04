import React from 'react';
import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { cardShadow } from '../../ui/platform';
import { isOnline, formatRelativeTime } from '../../lib/time';
import ProfileDetailsSheet, { type ProfileSummary } from './ProfileDetailsSheet';

type Props = {
  name: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  shared: number;
  distanceKm?: number | null;
  lastActive?: string | null;
  categories?: { id: number; name: string }[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenChat?: () => void;
};

export default function CandidateCard({ 
  name, 
  age, 
  bio, 
  photoUrl, 
  shared, 
  distanceKm, 
  lastActive,
  categories,
  expanded,
  onToggleExpanded,
  onOpenChat
}: Props) {
  const online = isOnline(lastActive);
  const lastActiveLabel = online ? 'Online' : lastActive ? `Active ${formatRelativeTime(lastActive)} ago` : null;

  const summary: ProfileSummary = {
    id: '',
    display_name: name,
    age,
    bio,
    photo_url: photoUrl,
    distanceKm,
    lastActiveLabel,
    categories,
    sharedCount: shared,
  };

  return (
    <View className="flex-1 rounded-3xl overflow-hidden bg-zinc-900/60 border border-white/10" style={cardShadow()}>
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

      <ProfileDetailsSheet
        data={summary}
        expanded={expanded}
        onToggle={onToggleExpanded}
        onOpenChat={onOpenChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
  },
});

