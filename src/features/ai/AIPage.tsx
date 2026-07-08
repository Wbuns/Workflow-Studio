import { ActionList, MetricCard, PageHeader, Panel, StatusChip } from "../../components/UI/StudioComponents";
import type { NavigationItem } from "../../types/navigation";

type AIPageProps = { activePage: NavigationItem };

export function AIPage({ activePage }: AIPageProps) {
    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="AI Session Generator" description="Build copy-ready continuation prompts from project metadata, documentation, Git, packages, and current tasks." actionLabel="Generate Development Session" />

            <section className="metrics-grid">
                <MetricCard label="System" value="Context Builder" detail="Project context collection." status="good" />
                <MetricCard label="Goal" value="Resume Faster" detail="Start new chats without rebuilding history." />
                <MetricCard label="Sources" value="Planned" detail="Metadata, docs, roadmap, Git, packages." />
                <MetricCard label="Next" value="Copy Prompt" detail="One-click session export." />
            </section>

            <section className="ai-layout">
                <Panel title="Context Sources">
                    <div className="context-list">
                        <div className="context-source"><strong>Project Metadata</strong><p>.workflowstudio/project.json — project name, milestone, workspace folders, and commands.</p></div>
                        <div className="context-source"><strong>AI Context</strong><p>.workflowstudio/ai-context.json — current focus, rules, and next milestone guidance.</p></div>
                        <div className="context-source"><strong>Documentation</strong><p>Vision, Design Bible, Roadmap, Architecture, Package System, and Development Workflow.</p></div>
                        <div className="context-source"><strong>Git Status</strong><p>Branch, clean/dirty status, last commit, and working tree summary.</p></div>
                    </div>
                </Panel>

                <Panel title="Development Session Checklist">
                    <ActionList actions={["Confirm Git status is clean", "Read workspace metadata", "Review recent package history", "Generate continuation context", "Build before committing generated changes"]} />
                    <div className="chip-row" style={{ marginTop: 12 }}>
                        <StatusChip label="Session engine next" tone="good" />
                    </div>
                </Panel>
            </section>
        </div>
    );
}
