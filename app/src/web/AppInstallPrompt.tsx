import * as React from 'react';
import { Platform, View, Text, Pressable } from 'react-native';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function AppInstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault?.();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    // @ts-ignore
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    return () => {
      // @ts-ignore
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  if (Platform.OS !== 'web' || !visible || !deferred) return null;

  const install = async () => {
    try {
      await deferred.prompt();
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  return (
    <View className="absolute inset-x-0 bottom-3 px-4">
      <View className="flex-row items-center justify-between bg-white/10 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur-md">
        <Text className="text-zinc-100">Install BuddyUp?</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => { setVisible(false); setDeferred(null); }}
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/15"
            accessibilityLabel="Not now"
          >
            <Text className="text-zinc-300">Not now</Text>
          </Pressable>
          <Pressable
            onPress={install}
            className="px-3 py-2 rounded-xl bg-teal-500/90"
            accessibilityLabel="Install BuddyUp"
          >
            <Text className="text-zinc-900 font-semibold">Install</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

