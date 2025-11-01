export default {
  expo: {
    name: 'BuddyUp',
    slug: 'buddyup',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.buddyup.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.buddyup.app'
    },
    web: {
      favicon: './assets/favicon.png',
      name: 'BuddyUp',
      shortName: 'BuddyUp',
      themeColor: '#0a0a0a',
      backgroundColor: '#0a0a0a',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      startUrl: '/',
      manifest: {
        name: 'BuddyUp',
        short_name: 'BuddyUp',
        description: 'Swipe to find activity buddies near you.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: './assets/icon.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: './assets/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
        ]
      }
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};

