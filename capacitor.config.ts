import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abd.turbodash',
  appName: 'road-rush-revamp',
  webDir: 'dist',
  server: {
    url: 'https://f4526a3f-3a71-441c-a732-1328f51d06b1.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-8464065147087356~1130729395',
    },
  },
};

export default config;
