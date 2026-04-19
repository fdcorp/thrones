import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thronesgame.app',
  appName: 'Thrones',
  webDir: 'dist',
  server: {
    url: 'https://thronesonline.com',
    cleartext: false,
  },
};

export default config;
