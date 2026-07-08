import { app, BrowserWindow, Menu, ipcMain, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const defaultWorkspaceRoot = path.resolve(__dirname, "..");
function normalizeRoot(rootPath) {
    if (!rootPath || rootPath.trim() === ".")
        return defaultWorkspaceRoot;
    return path.resolve(rootPath);
}
function exists(rootPath, relativePath) {
    return fs.existsSync(path.join(rootPath, relativePath));
}
function findFirstExisting(rootPath, paths) {
    return paths.find((candidate) => exists(rootPath, candidate));
}
function readJson(rootPath, relativePath) {
    const filePath = path.join(rootPath, relativePath);
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
function detectPackageManager(rootPath) {
    if (exists(rootPath, "pnpm-lock.yaml"))
        return "pnpm";
    if (exists(rootPath, "yarn.lock"))
        return "yarn";
    if (exists(rootPath, "package-lock.json"))
        return "npm";
    return exists(rootPath, "package.json") ? "npm" : "unknown";
}
function scriptCommand(packageManager, scriptName) {
    const runner = packageManager === "unknown" ? "npm" : packageManager;
    return `${runner} run ${scriptName}`;
}
function detectProjectType(rootPath, packageJson) {
    const dependencies = {
        ...packageJson?.dependencies,
        ...packageJson?.devDependencies,
    };
    const hasElectron = Boolean(dependencies.electron) || exists(rootPath, "electron");
    const hasReact = Boolean(dependencies.react);
    const hasTypeScript = Boolean(dependencies.typescript) || exists(rootPath, "tsconfig.json");
    if (hasElectron && hasReact && hasTypeScript)
        return "electron-react-typescript";
    if (hasElectron)
        return "electron";
    if (hasReact)
        return "react";
    if (packageJson)
        return "node";
    if (exists(rootPath, "pyproject.toml") || exists(rootPath, "requirements.txt"))
        return "python";
    return "unknown";
}
function detectDocumentationPaths(rootPath, readmePath) {
    const paths = [];
    if (readmePath)
        paths.push(readmePath);
    if (exists(rootPath, "docs"))
        paths.push("docs");
    if (exists(rootPath, "Documentation"))
        paths.push("Documentation");
    if (exists(rootPath, "CHANGELOG.md"))
        paths.push("CHANGELOG.md");
    if (exists(rootPath, "Roadmap.md"))
        paths.push("Roadmap.md");
    if (exists(rootPath, "prompts"))
        paths.push("prompts");
    if (exists(rootPath, "templates"))
        paths.push("templates");
    return paths;
}
function capability(id, label, enabled, enabledDetail, disabledDetail) {
    return {
        id,
        label,
        enabled,
        detail: enabled ? enabledDetail : disabledDetail,
    };
}
function scanWorkspace(rootPathInput) {
    const workspaceRoot = normalizeRoot(rootPathInput);
    const packageJson = readJson(workspaceRoot, "package.json");
    const workflowMetadataPath = findFirstExisting(workspaceRoot, [
        ".workflowstudio/project.json",
        ".workflowstudio/metadata.json",
    ]);
    const workflowProject = workflowMetadataPath
        ? readJson(workspaceRoot, workflowMetadataPath)
        : null;
    const readmePath = findFirstExisting(workspaceRoot, ["README.md", "readme.md", "Readme.md"]);
    const documentationPaths = detectDocumentationPaths(workspaceRoot, readmePath);
    const hasGit = exists(workspaceRoot, ".git");
    const hasPackageJson = Boolean(packageJson);
    const hasReadme = Boolean(readmePath);
    const hasDocs = exists(workspaceRoot, "docs") || exists(workspaceRoot, "Documentation");
    const hasWorkflowMetadata = Boolean(workflowMetadataPath);
    const packageManager = detectPackageManager(workspaceRoot);
    const projectType = detectProjectType(workspaceRoot, packageJson);
    const scripts = packageJson?.scripts ?? {};
    const packageScripts = Object.entries(scripts).map(([name, command]) => ({ name, command }));
    const buildCommand = scripts.build ? scriptCommand(packageManager, "build") : undefined;
    const devCommand = scripts.dev ? scriptCommand(packageManager, "dev") : undefined;
    const testCommand = scripts.test ? scriptCommand(packageManager, "test") : undefined;
    const hasPackageWorkflow = exists(workspaceRoot, "_packages") && exists(workspaceRoot, "_backup");
    const hasTemplates = exists(workspaceRoot, "templates");
    const hasPrompts = exists(workspaceRoot, "prompts");
    const hasElectronFolder = exists(workspaceRoot, "electron");
    const hasSourceFolder = exists(workspaceRoot, "src");
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
        successes.push(`${readmePath} detected.`);
    else
        warnings.push("README.md was not detected.");
    if (hasDocs)
        successes.push("Documentation folder detected.");
    else
        warnings.push("Documentation folder was not detected.");
    if (hasWorkflowMetadata)
        successes.push(`${workflowMetadataPath} detected.`);
    else
        warnings.push("Workflow Studio metadata was not detected.");
    if (buildCommand)
        successes.push(`Build command detected: ${buildCommand}.`);
    else
        warnings.push("Build command was not detected.");
    if (devCommand)
        successes.push(`Development command detected: ${devCommand}.`);
    if (testCommand)
        successes.push(`Test command detected: ${testCommand}.`);
    else
        warnings.push("Test command was not detected yet.");
    const checks = [
        hasGit,
        hasPackageJson,
        hasReadme,
        hasDocs,
        hasWorkflowMetadata,
        Boolean(buildCommand),
        hasPackageWorkflow,
        hasSourceFolder,
    ];
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
        testCommand,
        devCommand,
        packageManager,
        documentationPath: documentationPaths[0],
        documentationPaths,
        readmePath,
        workflowMetadataPath,
        packageScripts,
        capabilities: [
            capability("git", "Git", hasGit, "Repository is available.", "Repository folder was not found."),
            capability("source", "Source", hasSourceFolder, "Source folder is available.", "src folder was not found."),
            capability("package-json", "package.json", hasPackageJson, "Node project metadata is available.", "package.json was not found."),
            capability("package-workflow", "Package Workflow", hasPackageWorkflow, "Package and backup folders are available.", "_packages and _backup were not both found."),
            capability("build", "Build", Boolean(buildCommand), "Build command is available.", "Build command was not found."),
            capability("test", "Tests", Boolean(testCommand), "Test command is available.", "Test command was not found."),
            capability("readme", "README", hasReadme, "README documentation is available.", "README.md was not found."),
            capability("docs", "Docs", hasDocs, "Documentation folder is available.", "docs folder was not found."),
            capability("workflow-metadata", "Workflow Metadata", hasWorkflowMetadata, "Workflow Studio metadata is available.", "Workflow Studio metadata was not found."),
            capability("electron", "Electron", hasElectronFolder, "Electron desktop shell is available.", "electron folder was not found."),
            capability("prompts", "Prompts", hasPrompts, "Prompt library folder is available.", "prompts folder was not found."),
            capability("templates", "Templates", hasTemplates, "Template folder is available.", "templates folder was not found."),
        ],
        health: {
            score,
            warnings,
            successes,
        },
    };
}
function runGit(rootPath, command) {
    return execSync(`git ${command}`, {
        cwd: rootPath,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    }).trim();
}
function getGitStatus(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    if (!exists(rootPath, ".git")) {
        return {
            isRepository: false,
            branch: "Not a Git repository",
            status: "not-repository",
            changedFiles: [],
            summary: "Git repository was not detected for this workspace.",
        };
    }
    try {
        const branch = runGit(rootPath, "rev-parse --abbrev-ref HEAD") || "unknown";
        const porcelain = runGit(rootPath, "status --short");
        const changedFiles = porcelain
            ? porcelain.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
            : [];
        const status = changedFiles.length > 0 ? "dirty" : "clean";
        return {
            isRepository: true,
            branch,
            status,
            changedFiles,
            summary: status === "clean"
                ? `Branch ${branch} is clean.`
                : `Branch ${branch} has ${changedFiles.length} changed file${changedFiles.length === 1 ? "" : "s"}.`,
        };
    }
    catch (error) {
        console.warn("Unable to read Git status.", error);
        return {
            isRepository: true,
            branch: "Unknown",
            status: "dirty",
            changedFiles: [],
            summary: "Git is available, but status could not be read.",
        };
    }
}
function collectMarkdownFiles(rootPath, relativeFolder, kind) {
    const folderPath = path.join(rootPath, relativeFolder);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory())
        return [];
    return fs
        .readdirSync(folderPath)
        .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
        .sort((a, b) => a.localeCompare(b))
        .map((fileName) => ({
        title: fileName.replace(/\.md$/i, ""),
        path: path.join(relativeFolder, fileName),
        kind,
    }));
}
function listDocumentation(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const entries = [];
    const readmePath = findFirstExisting(rootPath, ["README.md", "readme.md", "Readme.md"]);
    if (readmePath) {
        entries.push({ title: "README", path: readmePath, kind: "readme" });
    }
    entries.push(...collectMarkdownFiles(rootPath, "docs", "docs"));
    entries.push(...collectMarkdownFiles(rootPath, ".workflowstudio", "metadata"));
    entries.push(...collectMarkdownFiles(rootPath, "prompts", "prompt"));
    entries.push(...collectMarkdownFiles(rootPath, "templates", "template"));
    return entries;
}
ipcMain.handle("workspace:scan", (_event, rootPath) => scanWorkspace(rootPath));
ipcMain.handle("workspace:gitStatus", (_event, rootPath) => getGitStatus(rootPath));
ipcMain.handle("workspace:listDocumentation", (_event, rootPath) => listDocumentation(rootPath));
ipcMain.handle("workspace:openFolder", async () => {
    const result = await dialog.showOpenDialog({
        title: "Open Workspace Folder",
        properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0)
        return null;
    return scanWorkspace(result.filePaths[0]);
});
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
