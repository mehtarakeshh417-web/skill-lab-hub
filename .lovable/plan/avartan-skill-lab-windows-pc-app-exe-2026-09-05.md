# Avartan Skill Lab — Windows PC App (.exe)

## Goal
A Windows desktop app named **Avartan Skill Lab**: a single installable/clickable `.exe` with the official Avartan logo that opens the live website `https://avartanskilllab.online` in its own app window. Same backend, database, accounts, and data — exactly like the Android/iOS shells. The existing website, Android APK, and iOS project remain completely untouched.

## Approach
Use **Electron** (Windows app shell that loads the live site) rather than packaging a copy of the code — so the app always shows the latest live website, and no web code is duplicated or changed.

## Steps

1. **Electron shell**
   - Create `electron/main.cjs` (CommonJS main process): a `BrowserWindow` (~1280x800, min 1024x640) that loads `https://avartanskilllab.online` directly (no local build, no `vite.config` base changes).
   - Window title "Avartan Skill Lab", official Avartan logo as the window/taskbar icon.
   - `contextIsolation: true`, `nodeIntegration: false` for safety.
   - External links (Google sign-in etc.) open in the system browser; navigation stays on the portal domains.
   - Set `"main": "electron/main.cjs"` in `package.json`.

2. **Windows icon**
   - Generate a proper multi-size `avartan.ico` (16/24/32/48/64/128/256 px) from the official `src/assets/avartan-logo.jpg` and place it at `electron/avartan.ico` — used for the window, taskbar, and the `.exe` file icon.

3. **Build the .exe**
   - Install dev dependencies: `electron` + `@electron/packager`.
   - Package for Windows: `npx @electron/packager . "Avartan Skill Lab" --platform=win32 --arch=x64 --icon=electron/avartan.ico --out=electron-release --overwrite` (excluding `node_modules`, `src`, etc.).
   - Result: `Avartan Skill Lab.exe` + supporting files in `electron-release/Avartan Skill Lab-win32-x64/`.

4. **Deliverable**
   - Zip the Windows folder to `/mnt/documents/avartan-skill-lab-windows.zip` and share it as a downloadable artifact.
   - User unzips on a Windows PC and double-clicks `Avartan Skill Lab.exe` — the app opens the live portal with the Avartan logo in the taskbar.
   - Add a short `WINDOWS.md` with run/rebuild instructions.

## Notes / limitations
- A self-contained installer (`.msi`/`.exe` setup wizard) needs `electron-builder`, whose packaging tools don't run reliably in this Linux environment — so the deliverable is a **portable zip** (extract and run). It behaves exactly like an installed app; you can also pin it to the taskbar or create a desktop shortcut.
- The `.exe` is unsigned, so Windows SmartScreen may show a one-time "unrecognized app" prompt — click **More info → Run anyway**.
- Requires internet (it loads the live site), same as the mobile apps.

## No changes to
- Any website code, layout, or functionality
- Android project / APK
- iOS project
- Backend, database, or auth
