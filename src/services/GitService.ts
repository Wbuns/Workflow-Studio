import type { GitStatus } from "../types/git";
import type { GitRepositoryStatus } from "../types/workflowstudioApi";

type NormalizedGitStatus = GitStatus & {
  available: boolean;
  branch: string;
  clean: boolean;
  modified: number;
  staged: number;
  untracked: number;
  lastCommit: string;
  ahead: number;
  behind: number;
  summary: string;
  error?: string;
};

function createUnavailableStatus(): GitStatus {
  return {
    available: false,
    branch: "Unknown",
    clean: true,
    modified: 0,
    staged: 0,
    untracked: 0,
    lastCommit: "Unavailable",
    ahead: 0,
    behind: 0,
    summary: "Git integration is unavailable in this environment.",
  } as NormalizedGitStatus;
}

function countChangedFiles(status: GitRepositoryStatus): Pick<NormalizedGitStatus, "modified" | "staged" | "untracked"> {
  let modified = 0;
  let staged = 0;
  let untracked = 0;

  for (const file of status.changedFiles ?? []) {
    const state = file.status.toLowerCase();

    if (state.includes("untracked") || state.includes("??")) {
      untracked += 1;
      continue;
    }

    if (state.includes("staged") || state.includes("index")) {
      staged += 1;
      continue;
    }

    modified += 1;
  }

  return { modified, staged, untracked };
}

function getLastCommit(status: GitRepositoryStatus): string {
  const firstRawLine = status.raw
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstRawLine ?? "Not loaded";
}

function normalizeGitStatus(status: GitRepositoryStatus): GitStatus {
  const fileCounts = countChangedFiles(status);

  return {
    available: status.available,
    branch: status.branch || "Unknown",
    clean: status.isClean,
    modified: fileCounts.modified,
    staged: fileCounts.staged,
    untracked: fileCounts.untracked,
    lastCommit: getLastCommit(status),
    ahead: status.ahead,
    behind: status.behind,
    summary: status.summary,
    error: status.error,
  } as NormalizedGitStatus;
}

export async function getGitStatus(): Promise<GitStatus> {
  if (!window.workflowStudio?.git) {
    return createUnavailableStatus();
  }

  const status = await window.workflowStudio.git.getStatus();
  return normalizeGitStatus(status);
}

export const GitService = {
  getStatus: getGitStatus,
  getGitStatus,
};

export default GitService;
