import { MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import type { NavigationItem } from "../../types/navigation";

type DocumentationPageProps = { activePage: NavigationItem };

const docs = [
    ["Vision", "docs/Vision.md", "Long-term purpose and north star for Workflow Studio."],
    ["Project Charter", "docs/Project Charter.md", "Project goals, included features, non-goals, and success criteria."],
    ["Design Bible", "docs/Design Bible.md", "Core design principles and decision framework."],
    ["Technical Architecture", "docs/Technical Architecture.md", "Application layers, feature organization, services, and metadata."],
    ["Development Workflow", "docs/Development Workflow.md", "Safe package-based milestone process."],
    ["AI Workflow", "docs/AI Workflow.md", "Rules for AI context, prompts, and collaboration."],
];

export function DocumentationPage({ activePage }: DocumentationPageProps) {
    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="Documentation Center" description="Source-of-truth project knowledge, architecture, workflow, and AI context." actionLabel={activePage.actionLabel} />

            <section className="metrics-grid">
                <MetricCard label="Library" value={docs.length} detail="Core documents indexed." status="good" />
                <MetricCard label="Format" value="Markdown" detail="Human-readable project docs." />
                <MetricCard label="Status" value="Current" detail="Core docs are active." status="good" />
                <MetricCard label="Next" value="Preview" detail="Markdown reader comes later." />
            </section>

            <section className="documentation-layout">
                <Panel title="Documentation Library">
                    <div className="documentation-list">
                        {docs.map(([name, path, detail]) => (
                            <article className="documentation-card" key={name}>
                                <div>
                                    <small>{path}</small>
                                    <strong>{name}</strong>
                                    <p>{detail}</p>
                                </div>
                                <div className="chip-row"><StatusChip label="AI Context" /><StatusChip label="Core" /></div>
                            </article>
                        ))}
                    </div>
                </Panel>
                <Panel title="Selected Document">
                    <p>Markdown preview, search, and quick-open actions will be added in a future milestone. This page now uses the full desktop layout and is ready for live document loading.</p>
                </Panel>
            </section>
        </div>
    );
}
