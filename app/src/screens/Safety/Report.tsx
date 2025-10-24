import React from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ReportsRepository, ReportReason } from '../../features/safety/ReportsRepository';

const repo = new ReportsRepository();
const reasons: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'fake', label: 'Fake profile' },
  { key: 'other', label: 'Other' },
];

export default function Report() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { targetId, name } = route.params as { targetId: string; name?: string };

  const [reason, setReason] = React.useState<ReportReason>(reasons[0].key);
  const [details, setDetails] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      await repo.submit(targetId, reason, details.trim() || undefined);
      Alert.alert('Thanks', 'Your report has been submitted.');
      nav.navigate('Discover');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not submit report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0a] px-4 pt-8">
      <Text className="text-zinc-200 text-lg mb-2">Report {name ?? 'user'}</Text>
      <Text className="text-zinc-400 mb-4">Select a reason and optionally add details.</Text>

      <View className="gap-2 mb-4">
        {reasons.map(r => (
          <Pressable key={r.key} onPress={() => setReason(r.key)}
            className={`px-3 py-2 rounded-xl border ${reason === r.key ? 'border-teal-400 bg-teal-500/10' : 'border-white/10 bg-white/5'}`}>
            <Text className={reason === r.key ? 'text-teal-200' : 'text-zinc-200'}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-zinc-400 mb-1">Details (optional)</Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder="Add context or links…"
        placeholderTextColor="#9CA3AF"
        multiline
        className="min-h-[120px] px-3 py-3 rounded-xl bg-white/10 text-zinc-100"
      />

      <Pressable disabled={saving} onPress={submit} className="mt-6 px-4 py-3 rounded-2xl bg-teal-500/90">
        <Text className="text-zinc-900 text-center font-semibold">{saving ? 'Submitting…' : 'Submit report'}</Text>
      </Pressable>
    </View>
  );
}

