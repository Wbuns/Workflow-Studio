export type GitStatus = {
  isRepository: boolean;
  branch: string;
  status: "clean" | "dirty" | "not-repository";
  changedFiles: string[];
  summary: string;
};

export type GitBridge = {
  workspace?: {
    gitStatus?: (rootPath?: string) => Promise<GitStatus>;
  };
};

const fallbackStatus: GitStatus = {
  isRepository: false,
  branch: "Unavailable",
  status: "not-repository",
  changedFiles: [],
  summary: "Git status is only available inside the Electron workspace bridge.",
};

export async function getGitStatus(rootPath?: string): Promise<GitStatus> {
  const bridge = (window as { workflowStudio?: GitBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.gitStatus) {
      return await bridge.workspace.gitStatus(rootPath);
    }
  } catch (error) {
    console.warn("Unable to load Git status.", error);
  }

  return fallbackStatus;
}
