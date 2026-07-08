import type { NavigationItem } from "../../types/navigation";
import "./DocumentationPage.css";

type DocumentationPageProps = {
  activePage: NavigationItem;
};

const documents = [
  {
    title: "Vision",
    path: "docs/Vision.md",
    category: "Direction",
    summary: "Long-term purpose and north star for Workflow Studio.",
  },
  {
    title: "Project Charter",
    path: "docs/Project Charter.md",
    category: "Scope",
    summary: "Project goals, included features, non-goals, and success criteria.",
  },
  {
    title: "Design Bible",
    path: "docs/Design Bible.md",
    category: "Philosophy",
    summary: "Core design principles and decision framework.",
  },
  {
    title: "Technical Architecture",
    path: "docs/Technical Architecture.md",
    category: "Architecture",
    summary: "Application layers, feature organization, services, and metadata.",
  },
  {
    title: "Development Workflow",
    path: "docs/Development Workflow.md",
    category: "Workflow",
    summary: "The build, test, package, commit, and documentation lifecycle.",
  },
  {
    title: "Package System",
    path: "docs/Package System.md",
    category: "Packages",
    summary: "Milestone package structure, validation, backups, and rollback goals.",
  },
  {
    title: "AI Workflow",
    path: "docs/AI Workflow.md",
    category: "AI",
    summary: "Context generation, continuation prompts, and AI collaboration rules.",
  },
  {
    title: "Project Metadata Specification",
    path: "docs/Project Metadata Specification.md",
    category: "Specification",
    summary: "The .workflowstudio metadata model used to understand projects.",
  },
];

export function DocumentationPage({ activePage }: DocumentationPageProps) {
  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.description}</h2>
        <p>
          Documentation is treated as part of the product. This center collects
          the source-of-truth documents that guide architecture, workflow,
          packages, AI context, and future Orivex development.
        </p>
      </section>

      <section className="documentation-layout">
        <article className="module-panel">
          <h3>Documentation Library</h3>
          <div className="documentation-list">
            {documents.map((document) => (
              <button className="document-card" type="button" key={document.path}>
                <span>{document.category}</span>
                <strong>{document.title}</strong>
                <small>{document.path}</small>
                <p>{document.summary}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="module-panel">
          <h3>Selected Document</h3>
          <p>
            Markdown preview and search will be added in a future milestone. For
            Workflow Studio Core, this page establishes the documentation module
            and the main project knowledge map.
          </p>

          <div className="module-checklist">
            <span>Vision</span>
            <span>Design Bible</span>
            <span>Architecture</span>
            <span>Workflow</span>
            <span>AI</span>
            <span>Packages</span>
          </div>
        </article>
      </section>
    </>
  );
}