import { ActionList, MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import type { NavigationItem } from "../../types/navigation";

type PackagesPageProps = { activePage: NavigationItem };

export function PackagesPage({ activePage }: PackagesPageProps) {
    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="Package Manager" description="Create, install, validate, back up, and roll back milestone packages." actionLabel={activePage.actionLabel} />

            <section className="metrics-grid">
                <MetricCard label="Tools" value="Ready" detail="PowerShell package tooling exists." status="good" />
                <MetricCard label="Package Folder" value="_packages" detail="Local package workspace." />
                <MetricCard label="Backups" value="Enabled" detail="Installations preserve previous files." status="good" />
                <MetricCard label="Next" value="History" detail="Package history UI comes later." />
            </section>

            <section className="packages-layout">
                <Panel title="Core Package Workflow">
                    <div className="module-checklist">
                        <span>Validate manifest and file entries.</span>
                        <span>Create backup before replacing files.</span>
                        <span>Install replacement files.</span>
                        <span>Run npm run build before commit.</span>
                    </div>
                </Panel>
                <Panel title="Package Actions">
                    <ActionList actions={["Create package", "Validate package", "Install package", "Open package folder"]} />
                    <div className="chip-row" style={{ marginTop: 12 }}>
                        <StatusChip label="Manual install ready" tone="good" />
                        <StatusChip label="UI actions coming soon" />
                    </div>
                </Panel>
            </section>
        </div>
    );
}
