export type DevelopmentSession = {
    schemaVersion: string;
    activeProject: string;
    activeMilestone: string;
    currentTask: string;
    nextTask: string;
    lastBuild: string;
    gitStatus: string;
    lastCommit: string;
    lastSession: string;
    notes: string[];
};

export async function getCurrentSession(): Promise<DevelopmentSession> {
    return {
        schemaVersion: "1.0",
        activeProject: "Workflow Studio",
        activeMilestone: "Workflow Studio Core",
        currentTask: "Development Session Engine",
        nextTask: "Documentation Center",
        lastBuild: "Passed",
        gitStatus: "Clean",
        lastCommit: "",
        lastSession: "",
        notes: [
            "Workflow Studio Core sprint",
            "Finish Core then return to Orivex",
        ],
    };
}