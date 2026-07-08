import { useEffect, useState } from "react";
import { ActionList, MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import { getGitStatus } from "../../services/GitService";
import type { GitStatus } from "../../types/git";
import type { NavigationItem } from "../../types/navigation";

type GitPageProps = { activePage: NavigationItem };

export function GitPage({ activePage }: GitPageProps) {
    const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);

    useEffect(() => {
        let isMounted = true;
        getGitStatus().then((status) => {
            if (isMounted) setGitStatus(status);
        });
        return () => { isMounted = false; };
    }, []);

    const clean = gitStatus?.clean ?? false;
    const workingTree = gitStatus ? (clean ? "Clean" : "Changes") : "Loading";

    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="Git Assistant" description="Review repository status before committing milestone work." actionLabel={activePage.actionLabel} />

            <section className="metrics-grid">
                <MetricCard label="Branch" value={gitStatus?.branch ?? "Loading"} detail="Current working branch." />
                <MetricCard label="Working Tree" value={workingTree} detail={clean ? "No pending changes detected." : "Review pending changes before commit."} status={clean ? "good" : "warning"} />
                <MetricCard label="Modified" value={gitStatus?.modified ?? 0} detail="Changed files." />
                <MetricCard label="Untracked" value={gitStatus?.untracked ?? 0} detail="New files not yet tracked." />
            </section>

            <section className="git-layout">
                <Panel title="Repository Summary">
                    <dl className="definition-grid">
                        <div><dt>Staged Files</dt><dd>{gitStatus?.staged ?? 0}</dd></div>
                        <div><dt>Untracked Files</dt><dd>{gitStatus?.untracked ?? 0}</dd></div>
                        <div className="wide-row"><dt>Last Commit</dt><dd>{gitStatus?.lastCommit ?? "Loading Git status"}</dd></div>
                    </dl>
                    <div className="chip-row" style={{ marginTop: 12 }}>
                        <StatusChip label={clean ? "Clean" : "Dirty"} tone={clean ? "good" : "warning"} />
                        <StatusChip label="Build before commit" />
                    </div>
                </Panel>

                <Panel title="Commit Checklist">
                    <ActionList actions={["Run npm run build", "Review changed files", "Update documentation if needed", "Commit stable milestone"]} />
                </Panel>
            </section>
        </div>
    );
}
