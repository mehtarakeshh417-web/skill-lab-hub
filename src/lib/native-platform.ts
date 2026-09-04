/**
 * Detects the native shell the app is running inside (Capacitor) and tags the
 * <html> element so platform-specific CSS layers can apply.
 *
 * In a normal browser nothing is added, so the website is untouched.
 */
export function applyNativePlatformClass() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const cap = (window as unknown as {
    Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean };
  }).Capacitor;

  const platform = cap?.getPlatform?.() ?? "web";
  if (platform === "web") return;

  const root = document.documentElement;
  root.classList.add("platform-native", `platform-${platform}`);
}
