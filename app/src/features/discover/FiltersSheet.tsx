import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { InterestsRepository, type Category } from '../profile/InterestsRepository';
import { DiscoveryPrefs, DiscoveryPrefsRepository } from './DiscoveryPrefsRepository';

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (prefs: DiscoveryPrefs) => void;
  initial: DiscoveryPrefs;
};

const interestsRepo = new InterestsRepository();
const prefsRepo = new DiscoveryPrefsRepository();

export default function FiltersSheet({ visible, onClose, onApply, initial }: Props) {
  const [allCats, setAllCats] = React.useState<Category[]>([]);
  const [ageMin, setAgeMin] = React.useState(initial.age_min);
  const [ageMax, setAgeMax] = React.useState(initial.age_max);
  const [maxKm, setMaxKm] = React.useState<number | null>(initial.max_km);
  const [onlyShared, setOnlyShared] = React.useState<boolean>(initial.only_shared_categories);

  React.useEffect(() => {
    setAgeMin(initial.age_min);
    setAgeMax(initial.age_max);
    setMaxKm(initial.max_km);
    setOnlyShared(initial.only_shared_categories);
  }, [initial]);

  React.useEffect(() => {
    (async () => {
      const cats = await interestsRepo.loadAll();
      setAllCats(cats);
    })();
  }, []);


  const apply = async () => {
    const prefs: DiscoveryPrefs = {
      age_min: Math.min(ageMin, ageMax),
      age_max: Math.max(ageMin, ageMax),
      max_km: maxKm,
      only_shared_categories: onlyShared,
    };
    onApply(prefs);
    onClose();
    try { await prefsRepo.save(prefs); } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 max-h-[85%]">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
            <Text className="text-zinc-200 text-base">Filters</Text>
            <Pressable onPress={onClose} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
              <Ionicons name="close" size={18} color="#E5E7EB" />
            </Pressable>
          </View>

          <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Age range */}
            <View className="mb-4">
              <Text className="text-zinc-400 mb-1">Age range</Text>
              <Text className="text-zinc-100 mb-1">{ageMin} – {ageMax}</Text>
              <Text className="text-zinc-500 text-xs mb-2">Drag both sliders</Text>
              <Slider minimumValue={18} maximumValue={80} step={1} value={ageMin} onValueChange={v => setAgeMin(Array.isArray(v) ? v[0] : v)} />
              <Slider minimumValue={18} maximumValue={80} step={1} value={ageMax} onValueChange={v => setAgeMax(Array.isArray(v) ? v[0] : v)} />
            </View>

            {/* Distance */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-zinc-400">Max distance</Text>
                <Pressable onPress={() => setMaxKm(null)}>
                  <Text className="text-teal-300 text-xs">No limit</Text>
                </Pressable>
              </View>
              <Text className="text-zinc-100 mb-1">{maxKm == null ? 'No limit' : `${maxKm} km`}</Text>
              <Slider minimumValue={1} maximumValue={200} step={1} value={maxKm ?? 50} onValueChange={v => setMaxKm(Array.isArray(v) ? v[0] : v)} />
            </View>

            {/* Only shared categories */}
            <View className="mb-2">
              <Text className="text-zinc-400 mb-2">Filter preferences</Text>
              <Pressable
                onPress={() => setOnlyShared(!onlyShared)}
                className="flex-row items-center gap-3 py-3"
              >
                <View className={`w-10 h-6 rounded-full ${onlyShared ? 'bg-teal-500/80' : 'bg-white/10'}`}>
                  <View 
                    className="w-5 h-5 mt-0.5 rounded-full bg-white" 
                    style={{ 
                      transform: [{ translateX: onlyShared ? 22 : 2 }] 
                    }} 
                  />
                </View>
                <Text className="text-zinc-200">Only show profiles sharing at least one of my interests</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View className="px-4 pb-6">
            <Pressable onPress={apply} className="px-4 py-3 rounded-2xl bg-teal-500/90">
              <Text className="text-zinc-900 text-center font-semibold">Apply filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

