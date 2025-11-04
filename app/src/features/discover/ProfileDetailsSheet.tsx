import * as React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ProfileSummary = {
  id: string;
  display_name: string | null;
  age?: number | null;
  bio?: string | null;
  photo_url?: string | null;
  distanceKm?: number | null;
  lastActiveLabel?: string | null;
  categories?: { id: number; name: string }[];
  sharedCount?: number | null;
};

type Props = {
  data: ProfileSummary;
  expanded: boolean;
  onToggle: () => void;
  onOpenChat?: () => void;
};

export default function ProfileDetailsSheet({ data, expanded, onToggle, onOpenChat }: Props) {
  const { display_name, age, distanceKm, lastActiveLabel, bio, categories = [], sharedCount } = data;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-3 bottom-3"
      style={{ borderRadius: 24 }}
    >
      {/* Collapsed bar (always visible) */}
      {!expanded && (
        <Pressable
          onPress={onToggle}
          className="rounded-3xl bg-black/45 border border-white/15 backdrop-blur-md p-3"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-lg font-semibold" numberOfLines={1}>
                {display_name ?? 'Unknown'}{age ? `, ${age}` : ''}
              </Text>
              <View className="flex-row items-center gap-3 mt-1">
                {typeof distanceKm === 'number' && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location-outline" size={14} color="#a1a1aa" />
                    <Text className="text-zinc-300 text-xs">
                      {distanceKm < 1 ? '<1 km' : `~${Math.round(distanceKm)} km`}
                    </Text>
                  </View>
                )}
                {lastActiveLabel && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={14} color="#a1a1aa" />
                    <Text className="text-zinc-300 text-xs">{lastActiveLabel}</Text>
                  </View>
                )}
                {typeof sharedCount === 'number' && sharedCount > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="sparkles-outline" size={14} color="#a1a1aa" />
                    <Text className="text-zinc-300 text-xs">
                      {sharedCount} shared
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/15">
              <Ionicons name="chevron-up" size={18} color="white" />
            </View>
          </View>
        </Pressable>
      )}

      {/* Expanded sheet */}
      {expanded && (
        <View className="rounded-3xl bg-black/60 border border-white/15 backdrop-blur-lg p-3 max-h-[70vh]">
          <Pressable onPress={onToggle} className="self-center mb-2">
            <View className="w-10 h-1 rounded-full bg-white/25" />
          </Pressable>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-xl font-semibold" numberOfLines={1}>
              {display_name ?? 'Unknown'}{age ? `, ${age}` : ''}
            </Text>
            {onOpenChat && (
              <Pressable
                onPress={onOpenChat}
                className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30"
              >
                <Text className="text-emerald-300 text-xs">Message</Text>
              </Pressable>
            )}
          </View>
          <View className="flex-row items-center gap-3 mb-3">
            {typeof distanceKm === 'number' && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={14} color="#a1a1aa" />
                <Text className="text-zinc-300 text-xs">
                  {distanceKm < 1 ? '<1 km' : `~${Math.round(distanceKm)} km`}
                </Text>
              </View>
            )}
            {lastActiveLabel && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={14} color="#a1a1aa" />
                <Text className="text-zinc-300 text-xs">{lastActiveLabel}</Text>
              </View>
            )}
            {typeof sharedCount === 'number' && sharedCount > 0 && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="sparkles-outline" size={14} color="#a1a1aa" />
                <Text className="text-zinc-300 text-xs">
                  {sharedCount} shared
                </Text>
              </View>
            )}
          </View>
          <ScrollView
            className="max-h-[58vh]"
            contentContainerStyle={{ paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {bio ? (
              <View className="mb-3">
                <Text className="text-zinc-200 leading-5">{bio}</Text>
              </View>
            ) : null}
            {categories.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {categories.map((c) => (
                  <View
                    key={c.id}
                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15"
                  >
                    <Text className="text-zinc-100 text-xs">{c.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

