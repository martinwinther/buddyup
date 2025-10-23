import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { DiscoveryPrefs, DiscoveryPrefsRepository } from '../../features/discover/DiscoveryPrefsRepository';

export default function DiscoverySettings() {
  const nav = useNavigation<any>();
  const repo = React.useMemo(() => new DiscoveryPrefsRepository(), []);

  const [prefs, setPrefs] = React.useState<DiscoveryPrefs | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    repo.load().then(setPrefs).catch(() => setPrefs({
      age_min: 18, age_max: 60, max_km: 50, only_shared_categories: false
    }));
  }, []);

  if (!prefs) {
    return <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
      <Text className="text-zinc-400">Loading…</Text>
    </View>;
  }

  const commit = async () => {
    setSaving(true);
    try {
      await repo.save(prefs);
      // tell Discover screen to refresh
      nav.navigate('Discover', { refresh: Date.now() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0a] px-4 pt-10">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-100 text-lg">Discovery preferences</Text>
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="close" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      {/* Age min */}
      <Text className="text-zinc-300">Minimum age: {prefs.age_min}</Text>
      <Slider
        value={prefs.age_min}
        minimumValue={18}
        maximumValue={Math.max(18, prefs.age_max)}
        step={1}
        onValueChange={(v) => setPrefs({ ...prefs, age_min: Math.min(prefs.age_max, Math.round(v)) })}
      />
      {/* Age max */}
      <Text className="text-zinc-300 mt-4">Maximum age: {prefs.age_max}</Text>
      <Slider
        value={prefs.age_max}
        minimumValue={Math.max(18, prefs.age_min)}
        maximumValue={80}
        step={1}
        onValueChange={(v) => setPrefs({ ...prefs, age_max: Math.max(prefs.age_min, Math.round(v)) })}
      />

      {/* Distance */}
      <Text className="text-zinc-300 mt-6">Max distance: {prefs.max_km ?? '∞'} km</Text>
      <Slider
        value={(prefs.max_km ?? 200)}
        minimumValue={5}
        maximumValue={200}
        step={1}
        onSlidingComplete={(v) => setPrefs({ ...prefs, max_km: Math.round(v) })}
        onValueChange={(v) => setPrefs({ ...prefs, max_km: Math.round(v) })}
      />

      {/* Only shared categories */}
      <Pressable
        onPress={() => setPrefs({ ...prefs, only_shared_categories: !prefs.only_shared_categories })}
        className="mt-6 flex-row items-center gap-2"
      >
        <View className={`w-10 h-6 rounded-full ${prefs.only_shared_categories ? 'bg-teal-500/80' : 'bg-white/10'}`}>
          <View 
            className="w-5 h-5 mt-0.5 rounded-full bg-white" 
            style={{ 
              transform: [{ translateX: prefs.only_shared_categories ? 22 : 2 }] 
            }} 
          />
        </View>
        <Text className="text-zinc-300">Only show profiles sharing at least one of my interests</Text>
      </Pressable>

      <Pressable onPress={commit} disabled={saving} className="mt-8 px-4 py-3 rounded-2xl bg-teal-500/90">
        <Text className="text-zinc-900 text-center font-semibold">{saving ? 'Saving…' : 'Save & refresh'}</Text>
      </Pressable>
    </View>
  );
}
