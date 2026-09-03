import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'id.simbaapp.app',
  appName: 'SIMBA',
  webDir: 'mobile-shell',
  server: {
    url: 'https://simbaapp.my.id',
    androidScheme: 'https',
  },
  android: {
    appendUserAgent: 'SIMBAAPK',
  },
}

export default config