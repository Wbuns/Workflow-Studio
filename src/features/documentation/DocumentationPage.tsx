import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import {
  listDocumentation,
  type DocumentationEntry,
} from "../../services/DocumentationService";

type DocumentationPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

function formatKind(kind: DocumentationEntry["kind"]) {
  if (kind === "readme") return "README";
  if (kind === "docs") return "Docs";
  if (kind === "metadata") return "Metadata";
  if (kind === "prompt") return "Prompt";
  return "Template";
}

export function DocumentationPage({ activePage, rootPath }: DocumentationPageProps) {
  const [entries, setEntries] = useState<DocumentationEntry[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    listDocumentation(rootPath).then((nextEntries) => {
      if (isMounted) {
        setEntries(nextEntries);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rootPath]);

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Documentation</h2>
        <p>
          <strong>Documentation discovery is active.</strong> This page now lists Markdown
          knowledge files found in the selected workspace.
        </p>
      </section>

      <section className="detail-panel documentation-panel">
        <h3>Detected Documents</h3>
        {entries === null ? (
          <p className="empty-state">Scanning documentation paths.</p>
        ) : entries.length > 0 ? (
          <div className="documentation-list">
            {entries.map((entry) => (
              <article className="documentation-card" key={`${entry.kind}-${entry.path}`}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.path}</span>
                </div>
                <mark>{formatKind(entry.kind)}</mark>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No Markdown documentation was detected yet. Add README.md or docs/*.md to make this
            workspace easier to resume.
          </p>
        )}
      </section>
    </>
  );
}
