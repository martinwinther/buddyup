import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  userId: string;
  name: string;
  photoUrl?: string | null;
  isSuper?: boolean;
  subtitle?: string;
  onPress: (userId: string) => void;
};

export default function LikeListItem({ userId, name, photoUrl, isSuper, subtitle, onPress }: Props) {
  return (
    <TouchableOpacity 
      onPress={() => onPress(userId)} 
      className="flex-row items-center px-4 py-3 gap-3 border-b border-white/5"
    >
      <Image 
        source={photoUrl ? { uri: photoUrl } : require('../../assets/icon.png')} 
        className="h-12 w-12 rounded-full bg-zinc-800"
        contentFit="cover"
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-zinc-100 font-semibold" numberOfLines={1}>
            {name || 'Someone'}
          </Text>
          {isSuper && <Ionicons name="star" size={14} color="#facc15" />}
        </View>
        <Text className="text-zinc-400 text-xs">
          {isSuper ? 'Super-liked you' : 'Liked you'}
          {subtitle ? ` • ${subtitle}` : ''}
        </Text>
      </View>

      <View className="px-3 py-1 rounded-full bg-zinc-800">
        <Text className="text-zinc-200 text-xs">Say hi</Text>
      </View>
    </TouchableOpacity>
  );
}

