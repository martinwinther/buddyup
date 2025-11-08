import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ProfilePhotosRepository } from '../features/profile/ProfilePhotosRepository';
import { supabase } from '../lib/supabase';

type Item = { id: string; url: string };

type Props = {
  maxPhotos?: number;
  className?: string;
};

export default function PhotoGridManager({ maxPhotos = 6, className }: Props) {
  const repo = React.useMemo(() => new ProfilePhotosRepository(), []);
  const [items, setItems] = React.useState<Item[]>([]);
  const [busy, setBusy] = React.useState(false);

  const userIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    let mounted = true;

    const loadPhotos = async () => {
      const { data: s } = await supabase.auth.getSession();
      userIdRef.current = s?.session?.user?.id ?? null;
      if (!mounted) return;
      
      if (userIdRef.current) {
        const list = await repo.listByUser(userIdRef.current);
        if (mounted) {
          setItems(list.map(p => ({ id: p.id, url: p.url })));
        }
      } else {
        // No session - clear any photos
        if (mounted) {
          setItems([]);
        }
      }
    };

    loadPhotos();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      userIdRef.current = session?.user?.id ?? null;
      
      if (!session) {
        // Session lost - clear photos immediately
        setItems([]);
      } else if (session?.user?.id) {
        // New session - reload photos
        loadPhotos();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [repo]);

  const addPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to upload.');
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (pick.canceled || !pick.assets?.length) return;

    setBusy(true);
    try {
      const asset = pick.assets[0];
      const added = await repo.addFromUri(asset.uri, items.length === 0);
      setItems(prev => [...prev, { id: added.id, url: added.url }]);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (id: string) => {
    setBusy(true);
    try {
      await repo.remove(id);
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      Alert.alert('Remove failed', e.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (id: string) => {
    setBusy(true);
    try {
      await repo.setPrimary(id);
      setItems(prev => {
        const chosen = prev.find(p => p.id === id)!;
        return [chosen, ...prev.filter(p => p.id !== id)];
      });
    } catch (e: any) {
      Alert.alert('Update failed', e.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className={className}>
      <Text className="text-zinc-300 mb-2">Photos</Text>

      <View className="flex-row flex-wrap gap-3">
        {items.map((p, idx) => (
          <View key={p.id} className="w-[30%] aspect-square rounded-xl overflow-hidden bg-white/5 relative">
            <Image source={{ uri: p.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            <View className="absolute bottom-1 left-1 right-1 flex-row justify-between">
              <Pressable
                disabled={busy}
                onPress={() => removePhoto(p.id)}
                className="px-2 py-1 rounded-lg bg-black/50"
              >
                <Text className="text-red-300 text-xs">Remove</Text>
              </Pressable>
              {idx === 0 ? (
                <View className="px-2 py-1 rounded-lg bg-black/50">
                  <Text className="text-zinc-200 text-xs">Primary</Text>
                </View>
              ) : (
                <Pressable
                  disabled={busy}
                  onPress={() => setPrimary(p.id)}
                  className="px-2 py-1 rounded-lg bg-black/50"
                >
                  <Text className="text-teal-300 text-xs">Primary</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {items.length < maxPhotos ? (
          <Pressable
            disabled={busy}
            onPress={addPhoto}
            className="w-[30%] aspect-square rounded-xl border border-white/10 items-center justify-center bg-white/5"
          >
            <Text className="text-zinc-400">{busy ? 'Please wait…' : '+ Add'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

