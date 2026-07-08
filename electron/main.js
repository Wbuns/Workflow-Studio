import { app, BrowserWindow } from "electron";
import path from "node:path";
const isDev = !app.isPackaged;
function createWindow() {
    const window = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 1100,
        minHeight: 720,
        backgroundColor: "#0f141b",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    if (isDev) {
        window.loadURL("http://localhost:5173");
    }
    else {
        window.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
