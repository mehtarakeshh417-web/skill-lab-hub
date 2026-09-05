// Avartan Skill Lab — Windows desktop shell.
// Loads the live portal so the app always uses the exact same backend,
// database, authentication, accounts and data as the website.
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const PORTAL_URL = "https://avartanskilllab.online";

// Hosts that are allowed to open inside the app window.
const ALLOWED_HOSTS = new Set([
  "avartanskilllab.online",
  "www.avartanskilllab.online",
  "avartanskillshub.lovable.app",
]);

function isAllowedInApp(url) {
  try {
    const host = new URL(url).hostname;
    if (ALLOWED_HOSTS.has(host)) return true;
    // Supabase auth/API and Google sign-in flows.
    if (host.endsWith(".supabase.co")) return true;
    if (host === "accounts.google.com" || host.endsWith(".google.com")) return true;
    return false;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: "Avartan Skill Lab",
    icon: path.join(__dirname, "avartan.ico"),
    backgroundColor: "#0b0f1a",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.loadURL(PORTAL_URL);

  // Keep in-app navigation on the portal; open everything else in the
  // user's default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedInApp(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedInApp(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
