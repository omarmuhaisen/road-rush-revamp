import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f4526a3f3a71441ca7321328f51d06b1',
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
