import { useEffect, useMemo, useRef, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceSearchIndex, WorkspaceSearchResult } from "../../types/workspaceSearch";
import { buildWorkspaceSearchIndex, filterWorkspaceSearchResults } from "../../services/WorkspaceSearchService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type WorkspaceSearchProps = {
  rootPath?: string;
  navigationItems: NavigationItem[];
  onNavigate: (pageId: string) => void;
};

function kindLabel(kind: WorkspaceSearchResult["kind"]) {
  if (kind === "navigation") return "Page";
  if (kind === "documentation") return "Document";
  if (kind === "package") return "Package";
  if (kind === "snapshot") return "Snapshot";
  if (kind === "timeline") return "Activity";
  if (kind === "template") return "Template";
  return "Metadata";
}

export function WorkspaceSearch({ rootPath, navigationItems, onNavigate }: WorkspaceSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<WorkspaceSearchIndex>();
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => filterWorkspaceSearchResults(index?.results ?? [], query),
    [index, query],
  );

  async function loadIndex() {
    setLoading(true);
    try {
      setIndex(await buildWorkspaceSearchIndex(rootPath, navigationItems));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        return;
      }
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        void activate(results[activeIndex]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, isOpen, results]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    void loadIndex();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen, rootPath]);

  useEffect(() => setActiveIndex(0), [query]);

  async function activate(result: WorkspaceSearchResult) {
    setIsOpen(false);
    if (result.path && result.kind !== "navigation") {
      const opened = await openWorkspacePath(rootPath, result.path);
      if (opened.ok) return;
    }
    if (result.pageId) onNavigate(result.pageId);
  }

  if (!isOpen) return null;

  return (
    <div className="workspace-search-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
      <section className="workspace-search" role="dialog" aria-modal="true" aria-label="Global Workspace Search" onMouseDown={(event) => event.stopPropagation()}>
        <header className="workspace-search-header">
          <div>
            <p className="eyebrow">Global Workspace Search</p>
            <h2>Search the active project</h2>
          </div>
          <kbd>Esc</kbd>
        </header>
        <div className="workspace-search-input-row">
          <span aria-hidden="true">⌕</span>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documentation, packages, snapshots, timeline, templates, and pages..." aria-label="Search the active workspace" />
          <button className="text-button" type="button" onClick={() => void loadIndex()} disabled={loading}>{loading ? "Indexing…" : "Refresh"}</button>
        </div>
        <div className="workspace-search-results" role="listbox">
          {loading && !index ? <p className="workspace-search-empty">Building the workspace index.</p> : results.length ? results.map((result, resultIndex) => (
            <button key={result.id} type="button" role="option" aria-selected={resultIndex === activeIndex} className={resultIndex === activeIndex ? "workspace-search-result active" : "workspace-search-result"} onMouseEnter={() => setActiveIndex(resultIndex)} onClick={() => void activate(result)}>
              <span className={`workspace-search-kind kind-${result.kind}`}>{kindLabel(result.kind)}</span>
              <span className="workspace-search-result-copy"><strong>{result.title}</strong><small>{result.detail}</small>{result.location && <code>{result.location}</code>}</span>
              <span className="workspace-search-action">{result.path ? "Open" : "Go"}</span>
            </button>
          )) : <p className="workspace-search-empty">No workspace results match “{query}”.</p>}
        </div>
        {index?.warnings.length ? <footer className="workspace-search-warning">{index.warnings[0]}</footer> : <footer><span>↑↓ Navigate</span><span>Enter Open</span><span>Ctrl+K Search</span></footer>}
      </section>
    </div>
  );
}
