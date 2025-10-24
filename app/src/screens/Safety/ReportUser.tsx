import React from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ReportsRepository, ReportReason } from '../../features/safety/ReportsRepository';

type RouteParams = { otherId: string; from?: 'profile' | 'chat' };

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harassment or hate' },
  { key: 'spam',       label: 'Spam or scams' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'fake',       label: 'Fake or imposter' },
  { key: 'other',      label: 'Other' },
];

export default function ReportUser() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const otherId: string = route.params?.otherId;

  const repo = React.useMemo(() => new ReportsRepository(), []);
  const [reason, setReason] = React.useState<ReportReason>('harassment');
  const [details, setDetails] = React.useState('');
  const [alsoBlock, setAlsoBlock] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!otherId) return;
    setSubmitting(true);
    try {
      await repo.submit(otherId, reason, details);
      if (alsoBlock) {
        await repo.block(otherId);
      }
      Alert.alert('Thank you', 'Your report has been submitted.');
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#0a0a0a]" contentContainerStyle={{ padding: 16, paddingTop: 40 }}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-100 text-lg">Report user</Text>
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="chevron-down" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      <Text className="text-zinc-300 mb-2">Reason</Text>
      <View className="gap-2">
        {REASONS.map(r => (
          <Pressable
            key={r.key}
            onPress={() => setReason(r.key)}
            className={`px-3 py-3 rounded-xl border ${reason === r.key ? 'bg-white/15 border-white/20' : 'bg-white/5 border-white/10'}`}
          >
            <Text className="text-zinc-100">{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-zinc-300 mt-4 mb-2">Details (optional)</Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        multiline
        placeholder="Add any helpful context…"
        placeholderTextColor="#9CA3AF"
        className="min-h-[120px] px-3 py-3 rounded-xl bg-white/10 text-zinc-100"
      />

      <Pressable
        onPress={() => setAlsoBlock(!alsoBlock)}
        className="mt-6 flex-row items-center gap-2"
      >
        <View className={`w-10 h-6 rounded-full ${alsoBlock ? 'bg-teal-500/80' : 'bg-white/10'}`}>
          <View className={`w-5 h-5 mt-0.5 rounded-full bg-white translate-x-${alsoBlock ? '[22px]' : '[2px]'}`} />
        </View>
        <Text className="text-zinc-300">Also block this user</Text>
      </Pressable>

      <Pressable onPress={submit} disabled={submitting} className="mt-8 px-4 py-3 rounded-2xl bg-red-500/90">
        <Text className="text-zinc-900 text-center font-semibold">{submitting ? 'Submitting…' : 'Submit report'}</Text>
      </Pressable>
    </ScrollView>
  );
}
