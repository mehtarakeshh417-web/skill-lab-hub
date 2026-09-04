# Avartan Skill Lab — iOS app

The iOS app is a Capacitor shell around the exact same live application
(`https://avartanskilllab.online`). It uses the same backend, database,
authentication, users and data as the website and the Android app — nothing is
duplicated or migrated.

## What is included

- `ios/App/App.xcodeproj` — complete Xcode project (bundle id
  `online.avartanskilllab.app`, display name **Avartan Skill Lab**, version 1.1,
  deployment target iOS 15).
- App icon (1024×1024) and splash assets generated from the brand logo.
- Splash Screen and Status Bar plugins pre-registered via Swift Package Manager.
- Info.plist configured with photo library / camera / Face ID usage strings,
  `ITSAppUsesNonExemptEncryption = false`, portrait + landscape support.

## iPhone-specific layout

All iPhone layout work lives in a dedicated CSS layer at the end of
`src/styles.css`, scoped to `html.platform-ios`. That class is added at runtime
only inside the native shell (`src/lib/native-platform.ts`), so the website in a
desktop or mobile browser is byte-for-byte unaffected.

The layer handles: safe-area insets (Dynamic Island, notch, home indicator),
single-column reflow of dashboard grids, compacted card padding and radii, an
iPhone type scale, 44pt touch targets, 16px inputs (prevents focus zoom),
tables that scroll inside their own card, full-width sheets and dialogs sized to
the safe area, momentum scrolling, and capped iframe/editor heights.

## Building and installing on an iPhone

Requires macOS with Xcode 15+ and CocoaPods is **not** needed (SPM is used).

```bash
bun install
bun run ios:sync     # cap sync ios
bun run ios:open     # opens ios/App/App.xcodeproj in Xcode
```

In Xcode:

1. Select the **App** target → Signing & Capabilities → choose your Apple
   Developer team (automatic signing).
2. Pick your connected iPhone as the run destination and press ⌘R to install.
3. For distribution: Product → Archive → Distribute App (App Store Connect or
   Ad Hoc / TestFlight).

An `.ipa` can only be produced on macOS with Xcode and a signing certificate —
it cannot be compiled in this Linux environment.

## Keeping it in sync

The shell loads the live deployment, so publishing the website automatically
updates the iOS app. Only re-run `bun run ios:sync` when native config, plugins
or icons change.
