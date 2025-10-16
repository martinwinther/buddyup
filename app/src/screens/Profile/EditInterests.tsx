import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { InterestsRepository, type Category } from '../../features/profile/InterestsRepository';
import Slider from '@react-native-community/slider';

const repo = new InterestsRepository();

type Choice = { id: number; intensity: number; active: boolean };

export default function EditInterests() {
  const [loading, setLoading] = React.useState(true);
  const [all, setAll] = React.useState<Category[]>([]);
  const [picked, setPicked] = React.useState<Map<number, Choice>>(new Map());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [cats, mine] = await Promise.all([repo.loadAll(), repo.loadMine()]);
        setAll(cats);
        const map = new Map<number, Choice>();
        for (const m of mine) map.set(m.category_id, { id: m.category_id, intensity: m.intensity, active: m.active });
        setPicked(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: number) => {
    setPicked(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, { id, intensity: 3, active: true });
      return next;
    });
  };

  const setIntensity = (id: number, value: number) => {
    setPicked(prev => {
      const next = new Map(prev);
      const c = next.get(id);
      if (c) next.set(id, { ...c, intensity: Math.round(value) });
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      const userCategories = Array.from(picked.values()).map(choice => ({
        category_id: choice.id,
        intensity: choice.intensity,
        active: choice.active,
      }));
      await repo.saveMine(userCategories);
      alert('Saved interests');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <ActivityIndicator />
        <Text className="text-zinc-400 mt-2">Loading interests…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a] pt-8">
      <Text className="text-zinc-300 text-center mb-4">Edit Interests</Text>
      <View className="gap-2 px-4">
        {all.map(cat => {
          const selected = picked.has(cat.id);
          const choice = picked.get(cat.id);
          return (
            <View key={cat.id} className="rounded-xl border border-white/10 p-3 mb-2 bg-white/5">
              <Pressable onPress={() => toggle(cat.id)} className="flex-row items-center justify-between">
                <Text className="text-zinc-100 text-base">{cat.name}</Text>
                <Text className={`text-sm ${selected ? 'text-teal-300' : 'text-zinc-500'}`}>
                  {selected ? 'Selected' : 'Tap to select'}
                </Text>
              </Pressable>
              {selected ? (
                <View className="mt-3">
                  <Text className="text-zinc-400 text-xs mb-1">Intensity: {choice?.intensity ?? 3}</Text>
                  <Slider
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={choice?.intensity ?? 3}
                    onValueChange={(v) => setIntensity(cat.id, Array.isArray(v) ? v[0] : v)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Pressable disabled={saving} onPress={save} className="m-4 mt-6 px-4 py-3 rounded-2xl bg-teal-500/90">
        <Text className="text-zinc-900 text-center font-semibold">{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

