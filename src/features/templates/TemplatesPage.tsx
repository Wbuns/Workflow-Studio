import { ActionList, MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import type { NavigationItem } from "../../types/navigation";

type TemplatesPageProps = { activePage: NavigationItem };

export function TemplatesPage({ activePage }: TemplatesPageProps) {
    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="Templates" description="Reusable starters for projects, packages, documentation, prompts, and workflows." actionLabel={activePage.actionLabel} />
            <section className="metrics-grid">
                <MetricCard label="Project" value="Planned" detail="Project workspace templates." />
                <MetricCard label="Package" value="Ready Next" detail="Milestone package templates." />
                <MetricCard label="Prompts" value="Planned" detail="Reusable AI session starters." />
                <MetricCard label="Docs" value="Planned" detail="Markdown document templates." />
            </section>
            <section className="templates-layout">
                <Panel title="Template Library"><p>Template browsing and creation will be added after the AI Session Generator becomes functional.</p></Panel>
                <Panel title="Template Actions"><ActionList actions={["Browse templates", "Create package template", "Create prompt template", "Open templates folder"]} /><div className="chip-row" style={{ marginTop: 12 }}><StatusChip label="Placeholder ready" /></div></Panel>
            </section>
        </div>
    );
}
