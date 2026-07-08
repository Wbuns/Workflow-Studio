import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { simpleGit } from "simple-git";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
function getProjectRoot() {
    return app.isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
}
async function getGitStatus() {
    const git = simpleGit(getProjectRoot());
    const status = await git.status();
    const log = await git.log({ maxCount: 1 });
    const staged = status.staged.length + status.created.length + status.deleted.length + status.renamed.length;
    const modified = status.modified.length;
    const untracked = status.not_added.length;
    return {
        branch: status.current || "unknown",
        clean: status.isClean(),
        modified,
        staged,
        untracked,
        lastCommit: log.latest?.message ?? "No commit detected",
    };
}
function registerIpcHandlers() {
    ipcMain.handle("git:get-status", async () => {
        try {
            return await getGitStatus();
        }
        catch (error) {
            console.error("Failed to read Git status:", error);
            return {
                branch: "unknown",
                clean: false,
                modified: 0,
                staged: 0,
                untracked: 0,
                lastCommit: "Git status unavailable",
            };
        }
    });
}
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 900,
        minHeight: 600,
        title: "Workflow Studio",
        backgroundColor: "#0f172a",
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    mainWindow.once("ready-to-show", () => {
        mainWindow.maximize();
        mainWindow.show();
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}
app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    registerIpcHandlers();
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
