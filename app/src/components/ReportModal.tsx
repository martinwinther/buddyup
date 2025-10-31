import * as React from 'react';
import { Modal, View, Text, Pressable, TextInput, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ReportReason, reportUser, blockUser } from '../features/safety/SafetyRepository';

type Props = {
  visible: boolean;
  onClose: () => void;
  reportedId: string | null;
  defaultBlock?: boolean;
  onSubmitted?: (action: { reported: boolean; blocked: boolean }) => void;
};

const reasons: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harassment' },
  { key: 'spam', label: 'Spam / scam' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'fake', label: 'Fake / impersonation' },
  { key: 'other', label: 'Other' },
];

export default function ReportModal({ visible, onClose, reportedId, defaultBlock = true, onSubmitted }: Props) {
  const [selected, setSelected] = React.useState<ReportReason>('harassment');
  const [details, setDetails] = React.useState('');
  const [alsoBlock, setAlsoBlock] = React.useState(defaultBlock);
  const [busy, setBusy] = React.useState(false);

  const canSubmit = !!reportedId && !!selected && !busy;

  React.useEffect(() => {
    if (!visible) {
      setSelected('harassment');
      setDetails('');
      setAlsoBlock(defaultBlock);
      setBusy(false);
    }
  }, [visible, defaultBlock]);

  const submit = async () => {
    if (!reportedId) return;
    setBusy(true);
    try {
      await reportUser({ reportedId, reason: selected, details: details.trim() || undefined });
      let blocked = false;
      if (alsoBlock) {
        await blockUser(reportedId);
        blocked = true;
      }
      onSubmitted?.({ reported: true, blocked });
      onClose();
    } catch (e: any) {
      console.warn('report failed', e?.message ?? e);
      onSubmitted?.({ reported: false, blocked: false });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close report"
      />
      <View className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-[#111111] border-t border-white/10 p-4 gap-3"
            style={{ paddingBottom: 16 + (Platform.OS === 'ios' ? 12 : 0) }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-zinc-100 text-base font-semibold">Report user</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text className="text-zinc-400 text-sm">Tell us what's going on.</Text>

        <View className="flex-row flex-wrap gap-2">
          {reasons.map(r => {
            const active = selected === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setSelected(r.key)}
                className={`px-3 py-2 rounded-xl border ${
                  active ? 'bg-white/15 border-white/20' : 'bg-white/5 border-white/10'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={r.label}
              >
                <Text className={`text-sm ${active ? 'text-zinc-100' : 'text-zinc-300'}`}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="bg-white/5 border border-white/10 rounded-xl p-3">
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add details (optional)"
            placeholderTextColor="#6B7280"
            multiline
            className="text-zinc-100 min-h-[70px]"
          />
        </View>

        <Pressable
          onPress={() => setAlsoBlock(v => !v)}
          className="flex-row items-center gap-2"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: alsoBlock }}
        >
          <View className={`w-5 h-5 rounded-md border ${alsoBlock ? 'bg-teal-500/80 border-teal-500/60' : 'bg-white/5 border-white/20'}`} />
          <Text className="text-zinc-200">Also block this user</Text>
        </Pressable>

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className={`mt-1 items-center py-3 rounded-xl ${
            canSubmit ? 'bg-teal-500/90' : 'bg-white/10'
          }`}
          accessibilityRole="button"
          accessibilityLabel="Submit report"
        >
          <Text className={`font-semibold ${canSubmit ? 'text-zinc-900' : 'text-zinc-500'}`}>
            {busy ? 'Submitting…' : 'Submit'}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

