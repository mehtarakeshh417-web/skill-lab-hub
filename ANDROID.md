# Avartan Skill Lab — Android app

The Android app is a Capacitor shell around the **same live portal** at
`https://avartanskilllab.online`. It uses the identical backend, database,
authentication, accounts and data as the website — nothing is duplicated and
changes stay in sync in both directions.

## Project details

| Item | Value |
| --- | --- |
| App name | Avartan Skill Lab |
| Package / applicationId | `online.avartanskilllab.app` |
| Min SDK / Target SDK | 24 / 36 |
| Version | 1.0 (versionCode 1) |
| Config | `capacitor.config.ts` |
| Native project | `android/` |
| Signing key | `android/avartan-release.keystore` (alias `avartan`, store/key password `avartan2026`) |

Permissions: internet, network state, notifications, media/photo read (for file uploads).

## Building

```bash
export ANDROID_HOME=/path/to/android-sdk        # SDK 36 + build-tools 35
export JAVA_HOME=/path/to/jdk21                 # JDK 21 required
bunx cap sync android

cd android
./gradlew assembleRelease   # -> app/build/outputs/apk/release/app-release.apk
./gradlew bundleRelease     # -> app/build/outputs/bundle/release/app-release.aab  (Play Store)
```

The AAB target is already configured and signed, so Play Store uploads work
without further setup. For Play Store distribution, replace the bundled
self-signed keystore with your own upload key (or enrol in Play App Signing)
and bump `versionCode` / `versionName` in `android/app/build.gradle`.

## Notes

- The website is untouched and continues to run exactly as before.
- If the production domain ever changes, update `server.url` and
  `server.allowNavigation` in `capacitor.config.ts`, then re-sync and rebuild.
- `android-shell/` holds the tiny offline fallback screen shown while the
  portal is loading or when the device has no connection.
