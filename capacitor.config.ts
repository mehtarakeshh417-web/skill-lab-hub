import type { CapacitorConfig } from "@capacitor/cli";

// The web app is a server-rendered TanStack Start application, so the Android
// shell loads the same live deployment. This guarantees the APK uses the exact
// same backend, database, authentication and user data as the website.
const config: CapacitorConfig = {
  appId: "online.avartanskilllab.app",
  appName: "Avartan Skill Lab",
  webDir: "android-shell",
  server: {
    url: "https://avartanskillshub.lovable.app",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "avartanskillshub.lovable.app",
      "www.avartanskilllab.online",
      "avartanskilllab.online",
      "*.supabase.co",
      "accounts.google.com",
      "*.google.com",
    ],
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0b0f1a",
      showSpinner: false,
    },
  },
};

export default config;
