import { app, BrowserWindow, Menu, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const workspaceRoot = path.resolve(__dirname, "..");
function exists(relativePath) {
    return fs.existsSync(path.join(workspaceRoot, relativePath));
}
function readJson(relativePath) {
    const filePath = path.join(workspaceRoot, relativePath);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    catch (error) {
        console.warn(`Unable to read JSON file: ${relativePath}`, error);
        return null;
    }
}
function detectPackageManager() {
    if (exists("pnpm-lock.yaml")) {
        return "pnpm";
    }
    if (exists("yarn.lock")) {
        return "yarn";
    }
    if (exists("package-lock.json")) {
        return "npm";
    }
    return exists("package.json") ? "npm" : "unknown";
}
function detectProjectType(packageJson) {
    const dependencies = {
        ...packageJson?.dependencies,
        ...packageJson?.devDependencies,
    };
    const hasElectron = Boolean(dependencies.electron);
    const hasReact = Boolean(dependencies.react);
    const hasTypeScript = Boolean(dependencies.typescript);
    if (hasElectron && hasReact && hasTypeScript) {
        return "electron-react-typescript";
    }
    if (hasElectron) {
        return "electron";
    }
    if (hasReact) {
        return "react";
    }
    if (packageJson) {
        return "node";
    }
    if (exists("pyproject.toml") || exists("requirements.txt")) {
        return "python";
    }
    return "unknown";
}
function capability(id, label, enabled, enabledDetail, disabledDetail) {
    return {
        id,
        label,
        enabled,
        detail: enabled ? enabledDetail : disabledDetail,
    };
}
function scanWorkspace() {
    const packageJson = readJson("package.json");
    const workflowProject = readJson(".workflowstudio/project.json");
    const hasGit = exists(".git");
    const hasPackageJson = Boolean(packageJson);
    const hasReadme = exists("README.md") || exists("readme.md");
    const hasDocs = exists("docs");
    const hasWorkflowMetadata = exists(".workflowstudio/project.json");
    const packageManager = detectPackageManager();
    const projectType = detectProjectType(packageJson);
    const buildCommand = packageJson?.scripts?.build ? `${packageManager === "unknown" ? "npm" : packageManager} run build` : undefined;
    const successes = [];
    const warnings = [];
    if (hasGit)
        successes.push("Git repository detected.");
    else
        warnings.push("Git repository was not detected.");
    if (hasPackageJson)
        successes.push("package.json detected.");
    else
        warnings.push("package.json was not detected.");
    if (hasReadme)
        successes.push("README.md detected.");
    else
        warnings.push("README.md was not detected.");
    if (hasDocs)
        successes.push("Documentation folder detected.");
    else
        warnings.push("Documentation folder was not detected.");
    if (hasWorkflowMetadata)
        successes.push("Workflow Studio metadata detected.");
    else
        warnings.push(".workflowstudio/project.json was not detected.");
    if (buildCommand)
        successes.push(`Build command detected: ${buildCommand}.`);
    else
        warnings.push("Build command was not detected.");
    const checks = [hasGit, hasPackageJson, hasReadme, hasDocs, hasWorkflowMetadata, Boolean(buildCommand)];
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    return {
        projectName: workflowProject?.name ?? packageJson?.name ?? path.basename(workspaceRoot),
        rootPath: workspaceRoot,
        projectType,
        hasGit,
        hasPackageJson,
        hasReadme,
        hasDocs,
        hasWorkflowMetadata,
        buildCommand,
        packageManager,
        documentationPath: hasDocs ? "docs" : hasReadme ? "README.md" : undefined,
        capabilities: [
            capability("git", "Git", hasGit, "Repository is available.", "Repository folder was not found."),
            capability("package-json", "package.json", hasPackageJson, "Node project metadata is available.", "package.json was not found."),
            capability("build", "Build", Boolean(buildCommand), "Build command is available.", "Build command was not found."),
            capability("readme", "README", hasReadme, "README documentation is available.", "README.md was not found."),
            capability("docs", "Docs", hasDocs, "Documentation folder is available.", "docs folder was not found."),
            capability("workflow-metadata", "Workflow Metadata", hasWorkflowMetadata, "Workflow Studio metadata is available.", "Workflow Studio metadata was not found."),
        ],
        health: {
            score,
            warnings,
            successes,
        },
    };
}
ipcMain.handle("workspace:scan", () => scanWorkspace());
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
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
