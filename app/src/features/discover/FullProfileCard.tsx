import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow } from '../../ui/platform';
import { isOnline, formatRelativeTime } from '../../lib/time';
import type { ProfilePhoto, CandidateCategory } from './SupabaseDiscoverRepository';

const { width } = Dimensions.get('window');
const CARD_MAX_WIDTH = 560;

type Props = {
  name: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  distanceKm?: number | null;
  lastActive?: string | null;
  sharedCount: number;
  photos?: ProfilePhoto[];
  categories?: CandidateCategory[];
  width?: number;
  height?: number;
};

export default function FullProfileCard({
  name,
  age,
  bio,
  photoUrl,
  distanceKm,
  lastActive,
  sharedCount,
  photos = [],
  categories = [],
  width,
  height,
}: Props) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const online = isOnline(lastActive);
  const lastActiveLabel = online ? 'Online' : lastActive ? `Active ${formatRelativeTime(lastActive)} ago` : null;

  // Use profile_photos if available, otherwise fall back to photo_url
  const displayPhotos = photos.length > 0 ? photos : (photoUrl ? [{ id: 'fallback', url: photoUrl, sort_order: 0 }] : []);
  const hasMultiplePhotos = displayPhotos.length > 1;

  const goToPrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const goToNextPhoto = () => {
    if (currentPhotoIndex < displayPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  return (
    <View 
      className="rounded-3xl overflow-hidden bg-zinc-900/60 border border-white/10" 
      style={[{ width: width || '100%', height: height || '100%' }, cardShadow()]}
    >
      {/* Photo carousel or single photo */}
      {displayPhotos.length > 0 ? (
        <View className="flex-1">
          <Image
            source={{ uri: displayPhotos[currentPhotoIndex].url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={0}
          />
          
          {/* Tap zones for photo navigation (only if multiple photos) */}
          {hasMultiplePhotos && (
            <>
              {/* Left tap zone */}
              <Pressable
                onPress={goToPrevPhoto}
                className="absolute left-0 top-0 bottom-0"
                style={{ width: '33%' }}
                disabled={currentPhotoIndex === 0}
              />
              {/* Right tap zone */}
              <Pressable
                onPress={goToNextPhoto}
                className="absolute right-0 top-0 bottom-0"
                style={{ width: '33%' }}
                disabled={currentPhotoIndex === displayPhotos.length - 1}
              />
              
              {/* Pagination dots */}
              <View className="absolute top-3 left-0 right-0 flex-row justify-center gap-1.5" pointerEvents="none">
                {displayPhotos.map((_, idx) => (
                  <View
                    key={idx}
                    className={`h-1.5 rounded-full ${
                      idx === currentPhotoIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      ) : (
        <View className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
      )}

      {/* Bottom gradient for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
        locations={[0.35, 0.7, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 }}
        pointerEvents="none"
      />

      {/* Always-visible info overlay */}
      <View
        className="absolute left-0 right-0 bottom-0 px-5 pb-5"
        pointerEvents="box-none"
      >
        {/* Name line */}
        <Text className="text-white text-xl font-semibold">
          {name ?? 'Unknown'}{age ? `, ${age}` : ''}
        </Text>

        {/* Meta row: distance, last active, shared */}
        <View className="mt-1 flex-row items-center gap-2.5 flex-wrap">
          {typeof distanceKm === 'number' && (
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={13} color="#cbd5e1" />
              <Text className="text-zinc-300 text-xs ml-0.5">
                {distanceKm < 1 ? '<1 km' : `~${distanceKm.toFixed(1)} km`}
              </Text>
            </View>
          )}
          {!!lastActiveLabel && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={13} color="#cbd5e1" />
              <Text className="text-zinc-300 text-xs ml-0.5">{lastActiveLabel}</Text>
            </View>
          )}
          {sharedCount > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="sparkles-outline" size={13} color="#cbd5e1" />
              <Text className="text-zinc-300 text-xs ml-0.5">{sharedCount} shared</Text>
            </View>
          )}
        </View>

        {/* Bio (2 line clamp for better fit) */}
        {bio ? (
          <Text
            numberOfLines={2}
            className="mt-1.5 text-zinc-200 text-sm leading-5"
          >
            {bio}
          </Text>
        ) : null}

        {/* Category pills (first 6) */}
        {categories.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {categories.slice(0, 6).map((c) => (
              <View
                key={c.id}
                className={`px-2.5 py-1 rounded-full ${
                  c.shared
                    ? 'bg-emerald-600/20 border border-emerald-500/50'
                    : 'bg-zinc-800/70 border border-zinc-700/60'
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`${
                    c.shared ? 'text-emerald-300' : 'text-zinc-200'
                  } text-xs`}
                >
                  {c.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

