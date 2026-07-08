import type { GitStatus } from "../types/git";

export async function getGitStatus(): Promise<GitStatus> {
    return {
        branch: "master",
        clean: true,
        modified: 0,
        staged: 0,
        untracked: 0,
        lastCommit: "Documentation Center",
    };
}