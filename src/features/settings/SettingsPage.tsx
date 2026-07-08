import { ActionList, MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import type { NavigationItem } from "../../types/navigation";

type SettingsPageProps = { activePage: NavigationItem };

export function SettingsPage({ activePage }: SettingsPageProps) {
    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="Settings" description="Configure workspace paths, package behavior, backups, AI preferences, and app options." actionLabel={activePage.actionLabel} />
            <section className="metrics-grid">
                <MetricCard label="Theme" value="Dark" detail="Default development theme." status="good" />
                <MetricCard label="Backups" value="Enabled" detail="Package installs preserve files." status="good" />
                <MetricCard label="AI" value="Manual" detail="Generate context after next milestone." />
                <MetricCard label="Packages" value="Local" detail="Uses _packages folder." />
            </section>
            <section className="settings-layout">
                <Panel title="Workspace Settings">
                    <div className="settings-list">
                        <div className="settings-row"><strong>Package Folder</strong><p>_packages</p></div>
                        <div className="settings-row"><strong>Backup Folder</strong><p>_backup</p></div>
                        <div className="settings-row"><strong>Build Command</strong><p>npm run build</p></div>
                    </div>
                </Panel>
                <Panel title="Settings Actions"><ActionList actions={["Open settings file", "Validate metadata", "Reset app layout", "Export workspace settings"]} /><div className="chip-row" style={{ marginTop: 12 }}><StatusChip label="UI placeholder" /></div></Panel>
            </section>
        </div>
    );
}
