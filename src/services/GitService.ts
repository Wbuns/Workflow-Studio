import type { GitStatus } from "../types/git";

const fallbackGitStatus: GitStatus = {
    branch: "unknown",
    clean: false,
    modified: 0,
    staged: 0,
    untracked: 0,
    lastCommit: "Git status unavailable",
};

export async function getGitStatus(): Promise<GitStatus> {
    if (!window.workflowStudio?.git) {
        return fallbackGitStatus;
    }

    return window.workflowStudio.git.getStatus();
}
