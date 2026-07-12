import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("workflowStudio", {
    version: "1.5.3",
    platform: process.platform,
    workspace: {
        scan: (rootPath) => ipcRenderer.invoke("workspace:scan", rootPath),
        openFolder: () => ipcRenderer.invoke("workspace:openFolder"),
        gitStatus: (rootPath) => ipcRenderer.invoke("workspace:gitStatus", rootPath),
        listDocumentation: (rootPath) => ipcRenderer.invoke("workspace:listDocumentation", rootPath),
        listPackages: (rootPath) => ipcRenderer.invoke("workspace:listPackages", rootPath),
        getPackageTree: (rootPath) => ipcRenderer.invoke("workspace:getPackageTree", rootPath),
        listTemplates: (rootPath) => ipcRenderer.invoke("workspace:listTemplates", rootPath),
        listProjectTimeline: (rootPath) => ipcRenderer.invoke("workspace:listProjectTimeline", rootPath),
        openPath: (rootPath, relativePath) => ipcRenderer.invoke("workspace:openPath", rootPath, relativePath),
        createAISnapshot: (rootPath) => ipcRenderer.invoke("workspace:createAISnapshot", rootPath),
        listAISnapshots: (rootPath) => ipcRenderer.invoke("workspace:listAISnapshots", rootPath),
        openAISnapshotFolder: (rootPath) => ipcRenderer.invoke("workspace:openAISnapshotFolder", rootPath),
        getAIPackageReadiness: (rootPath) => ipcRenderer.invoke("workspace:getAIPackageReadiness", rootPath),
        createAIPackage: (input) => ipcRenderer.invoke("workspace:createAIPackage", input),
        importGeneratedPackage: (rootPath, sourcePath) => ipcRenderer.invoke("workspace:importGeneratedPackage", rootPath, sourcePath),
        runDevelopmentPipeline: (rootPath, packagePath, suggestedCommitMessage) => ipcRenderer.invoke("workspace:runDevelopmentPipeline", rootPath, packagePath, suggestedCommitMessage),
        runCommand: (rootPath, commandId, approvedPermission) => ipcRenderer.invoke("workspace:runCommand", rootPath, commandId, approvedPermission),
        cancelCommand: (executionId) => ipcRenderer.invoke("workspace:cancelCommand", executionId),
        onCommandOutput: (listener) => {
            const handler = (_event, output) => listener(output);
            ipcRenderer.on("workspace:commandOutput", handler);
            return () => ipcRenderer.removeListener("workspace:commandOutput", handler);
        },
    },
    developer: {
        openDownloads: () => ipcRenderer.invoke("developer:openDownloads"),
        openPackageFolder: (rootPath) => ipcRenderer.invoke("developer:openPackageFolder", rootPath),
        openBackupFolder: (rootPath) => ipcRenderer.invoke("developer:openBackupFolder", rootPath),
        cleanSnapshotStaging: () => ipcRenderer.invoke("developer:cleanSnapshotStaging"),
        installLatestPackage: (rootPath) => ipcRenderer.invoke("developer:installLatestPackage", rootPath),
        installPackage: (rootPath) => ipcRenderer.invoke("developer:installPackage", rootPath),
        validateWorkspace: (rootPath) => ipcRenderer.invoke("developer:validateWorkspace", rootPath),
        listAutomationHistory: () => ipcRenderer.invoke("developer:listAutomationHistory"),
        clearAutomationHistory: () => ipcRenderer.invoke("developer:clearAutomationHistory"),
        recordAutomationOperation: (record) => ipcRenderer.invoke("developer:recordAutomationOperation", record),
        getGitAutomationState: (rootPath) => ipcRenderer.invoke("developer:getGitAutomationState", rootPath),
        commitChanges: (rootPath, message) => ipcRenderer.invoke("developer:commitChanges", rootPath, message),
        pushBranch: (rootPath) => ipcRenderer.invoke("developer:pushBranch", rootPath),
    },
    scanWorkspace: (rootPath) => ipcRenderer.invoke("workspace:scan", rootPath),
    openWorkspaceFolder: () => ipcRenderer.invoke("workspace:openFolder"),
});
