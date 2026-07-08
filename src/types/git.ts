export type GitStatus = {
    branch: string;
    clean: boolean;
    modified: number;
    staged: number;
    untracked: number;
    lastCommit: string;
};
