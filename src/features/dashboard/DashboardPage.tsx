import { useEffect, useState } from "react";
import { MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import type { NavigationItem } from "../../types/navigation";
import { getDashboardSummary } from "./DashboardService";
import type { DashboardSummary } from "./DashboardTypes";

type DashboardPageProps = { activePage: NavigationItem };

export function DashboardPage({ activePage }: DashboardPageProps) {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);

    useEffect(() => {
        let isMounted = true;
        getDashboardSummary().then((nextSummary) => {
            if (isMounted) setSummary(nextSummary);
        });
        return () => { isMounted = false; };
    }, []);

    if (!summary) {
        return (
            <div className="workspace-page">
                <PageHeader eyebrow={activePage.eyebrow} title="Loading Workspace" description="Reading workspace metadata and preparing the dashboard." />
            </div>
        );
    }

    return (
        <div className="workspace-page">
            <PageHeader
                eyebrow={activePage.eyebrow}
                title={summary.projectName}
                description={`${summary.tagline} ${summary.description}`}
                actionLabel={activePage.actionLabel}
            />

            <section className="metrics-grid">
                <MetricCard label="Milestone" value={summary.currentMilestone} detail="Active development target." />
                <MetricCard label="Build" value="Ready" detail={summary.buildCommand} status="good" />
                <MetricCard label="Git" value={summary.gitEnabled ? "Enabled" : "Disabled"} detail="Source control awareness." status={summary.gitEnabled ? "good" : "warning"} />
                <MetricCard label="Docs" value={summary.documentationCount} detail="Tracked documentation paths." />
            </section>

            <section className="dashboard-grid">
                <Panel title="Current Project">
                    <dl className="definition-grid">
                        <div><dt>Name</dt><dd>{summary.projectName}</dd></div>
                        <div><dt>Version</dt><dd>{summary.version}</dd></div>
                        <div><dt>Type</dt><dd>{summary.projectType}</dd></div>
                        <div><dt>Test</dt><dd>{summary.testCommand}</dd></div>
                        <div className="wide-row"><dt>Description</dt><dd>{summary.description}</dd></div>
                    </dl>
                </Panel>

                <Panel title="Session Status">
                    <div className="chip-row">
                        <StatusChip label="Workspace Loaded" tone="good" />
                        <StatusChip label="Build Ready" tone="good" />
                        <StatusChip label={summary.gitEnabled ? "Git Enabled" : "Git Disabled"} tone={summary.gitEnabled ? "good" : "warning"} />
                        <StatusChip label="AI Context Planned" />
                    </div>
                </Panel>

                <Panel title="Workspace Paths">
                    <dl className="definition-grid">
                        <div><dt>Packages</dt><dd>{summary.packageFolder}</dd></div>
                        <div><dt>Backups</dt><dd>{summary.backupFolder}</dd></div>
                        <div className="wide-row"><dt>Development</dt><dd>{summary.devCommand}</dd></div>
                    </dl>
                </Panel>

                <Panel title="Next Actions">
                    <div className="module-checklist">
                        {summary.nextActions.map((action) => <span key={action}>{action}</span>)}
                    </div>
                </Panel>
            </section>
        </div>
    );
}
