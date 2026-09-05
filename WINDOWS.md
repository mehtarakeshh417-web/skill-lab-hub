# Avartan Skill Lab — Windows app

The Windows app is an Electron shell around the **same live portal** at
`https://avartanskilllab.online`. It uses the identical backend, database,
authentication, accounts and data as the website — nothing is duplicated and
changes stay in sync in both directions.

## Details

| Item | Value |
| --- | --- |
| App name | Avartan Skill Lab |
| Executable | `Avartan Skill Lab.exe` |
| Main process | `electron/main.cjs` |
| Icon | `electron/avartan.ico` (official Avartan logo, 16–256 px) |
| Entry point in package.json | `"main": "electron/main.cjs"` |

The window loads the live portal directly, so the app always shows the latest
published website. Navigation is restricted to the portal domains; external
links (e.g. Google sign-in pages) open in the system browser.

## Running

1. Unzip `avartan-skill-lab-windows.zip`.
2. Open the `Avartan Skill Lab-win32-x64` folder.
3. Double-click `Avartan Skill Lab.exe` (pin to taskbar or create a desktop
   shortcut if desired).

The app is unsigned, so Windows SmartScreen may show a one-time warning —
click **More info → Run anyway**. An internet connection is required.

## Rebuilding

```bash
npm install --save-dev electron @electron/packager
npx @electron/packager . "Avartan Skill Lab" \
  --platform=win32 --arch=x64 \
  --electron-version=<installed electron version> \
  --icon=electron/avartan.ico \
  --out=electron-release --overwrite \
  --ignore='^/node_modules' --ignore='^/src' --ignore='^/public' \
  --ignore='^/electron-release' --ignore='^/android' --ignore='^/ios' \
  --ignore='^/supabase' --ignore='^/\.'
```

Build output goes to `electron-release/` which is git-ignored. If the
production domain ever changes, update `PORTAL_URL` and `ALLOWED_HOSTS` in
`electron/main.cjs` and repackage.
