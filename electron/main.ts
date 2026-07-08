import { app, BrowserWindow, Menu, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const workspaceRoot = path.resolve(__dirname, "..");

type WorkspaceProjectType =
  | "react"
  | "electron"
  | "node"
  | "python"
  | "electron-react-typescript"
  | "unknown";

type WorkspacePackageManager = "npm" | "pnpm" | "yarn" | "unknown";

type WorkspaceCapability = {
  id: string;
  label: string;
  enabled: boolean;
  detail: string;
};

type WorkspacePackageScript = {
  name: string;
  command: string;
};

type WorkspaceAnalysis = {
  projectName: string;
  rootPath: string;
  projectType: WorkspaceProjectType;
  hasGit: boolean;
  hasPackageJson: boolean;
  hasReadme: boolean;
  hasDocs: boolean;
  hasWorkflowMetadata: boolean;
  buildCommand?: string;
  testCommand?: string;
  devCommand?: string;
  packageManager: WorkspacePackageManager;
  documentationPath?: string;
  documentationPaths: string[];
  readmePath?: string;
  workflowMetadataPath?: string;
  packageScripts: WorkspacePackageScript[];
  capabilities: WorkspaceCapability[];
  health: {
    score: number;
    warnings: string[];
    successes: string[];
  };
};

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function exists(relativePath: string) {
  return fs.existsSync(path.join(workspaceRoot, relativePath));
}

function findFirstExisting(paths: string[]) {
  return paths.find((candidate) => exists(candidate));
}

function readJson<T>(relativePath: string): T | null {
  const filePath = path.join(workspaceRoot, relativePath);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    console.warn(`Unable to read JSON file: ${relativePath}`, error);
    return null;
  }
}

function detectPackageManager(): WorkspacePackageManager {
  if (exists("pnpm-lock.yaml")) return "pnpm";
  if (exists("yarn.lock")) return "yarn";
  if (exists("package-lock.json")) return "npm";
  return exists("package.json") ? "npm" : "unknown";
}

function scriptCommand(packageManager: WorkspacePackageManager, scriptName: string) {
  const runner = packageManager === "unknown" ? "npm" : packageManager;
  return `${runner} run ${scriptName}`;
}

function detectProjectType(packageJson: PackageJson | null): WorkspaceProjectType {
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  };

  const hasElectron = Boolean(dependencies.electron);
  const hasReact = Boolean(dependencies.react);
  const hasTypeScript = Boolean(dependencies.typescript);

  if (hasElectron && hasReact && hasTypeScript) return "electron-react-typescript";
  if (hasElectron) return "electron";
  if (hasReact) return "react";
  if (packageJson) return "node";
  if (exists("pyproject.toml") || exists("requirements.txt")) return "python";

  return "unknown";
}

function detectDocumentationPaths(readmePath?: string) {
  const paths: string[] = [];

  if (readmePath) paths.push(readmePath);
  if (exists("docs")) paths.push("docs");
  if (exists("Documentation")) paths.push("Documentation");
  if (exists("CHANGELOG.md")) paths.push("CHANGELOG.md");
  if (exists("Roadmap.md")) paths.push("Roadmap.md");
  if (exists("prompts")) paths.push("prompts");
  if (exists("templates")) paths.push("templates");

  return paths;
}

function capability(
  id: string,
  label: string,
  enabled: boolean,
  enabledDetail: string,
  disabledDetail: string,
): WorkspaceCapability {
  return {
    id,
    label,
    enabled,
    detail: enabled ? enabledDetail : disabledDetail,
  };
}

function scanWorkspace(): WorkspaceAnalysis {
  const packageJson = readJson<PackageJson>("package.json");
  const workflowMetadataPath = findFirstExisting([
    ".workflowstudio/project.json",
    ".workflowstudio/metadata.json",
  ]);
  const workflowProject = workflowMetadataPath ? readJson<{ name?: string }>(workflowMetadataPath) : null;
  const readmePath = findFirstExisting(["README.md", "readme.md", "Readme.md"]);
  const documentationPaths = detectDocumentationPaths(readmePath);
  const hasGit = exists(".git");
  const hasPackageJson = Boolean(packageJson);
  const hasReadme = Boolean(readmePath);
  const hasDocs = exists("docs") || exists("Documentation");
  const hasWorkflowMetadata = Boolean(workflowMetadataPath);
  const packageManager = detectPackageManager();
  const projectType = detectProjectType(packageJson);
  const scripts = packageJson?.scripts ?? {};
  const packageScripts = Object.entries(scripts).map(([name, command]) => ({ name, command }));
  const buildCommand = scripts.build ? scriptCommand(packageManager, "build") : undefined;
  const devCommand = scripts.dev ? scriptCommand(packageManager, "dev") : undefined;
  const testCommand = scripts.test ? scriptCommand(packageManager, "test") : undefined;
  const hasPackageWorkflow = exists("_packages") && exists("_backup");
  const hasTemplates = exists("templates");
  const hasPrompts = exists("prompts");
  const hasElectronFolder = exists("electron");
  const hasSourceFolder = exists("src");
  const successes: string[] = [];
  const warnings: string[] = [];

  if (hasGit) successes.push("Git repository detected.");
  else warnings.push("Git repository was not detected.");

  if (hasPackageJson) successes.push("package.json detected.");
  else warnings.push("package.json was not detected.");

  if (hasReadme) successes.push(`${readmePath} detected.`);
  else warnings.push("README.md was not detected.");

  if (hasDocs) successes.push("Documentation folder detected.");
  else warnings.push("Documentation folder was not detected.");

  if (hasWorkflowMetadata) successes.push(`${workflowMetadataPath} detected.`);
  else warnings.push("Workflow Studio metadata was not detected.");

  if (buildCommand) successes.push(`Build command detected: ${buildCommand}.`);
  else warnings.push("Build command was not detected.");

  if (devCommand) successes.push(`Development command detected: ${devCommand}.`);
  if (testCommand) successes.push(`Test command detected: ${testCommand}.`);
  else warnings.push("Test command was not detected yet.");

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
  } else {
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
