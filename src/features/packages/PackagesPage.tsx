import { useEffect, useMemo, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import { getWorkspacePackageTree, type WorkspacePackageTreeNode } from "../../services/PackageLibraryService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type PackagesPageProps = { activePage: NavigationItem; rootPath?: string };

function FolderNode({ node, selectedPath, onSelect }: {
  node: WorkspacePackageTreeNode; selectedPath: string; onSelect: (node: WorkspacePackageTreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(node.path === "_packages" || node.path === "_backup");
  const hasChildren = Boolean(node.children?.length);
  return <div className="package-tree-node">
    <button className={`package-tree-row ${selectedPath === node.path ? "selected" : ""}`} onClick={() => {
      if (node.kind === "folder") setExpanded((value) => !value);
      onSelect(node);
    }}>
      <span className="package-tree-caret">{node.kind === "folder" ? (expanded ? "▾" : "▸") : "·"}</span>
      <span>{node.kind === "folder" ? "📁" : "📄"}</span>
      <span>{node.name}</span>
    </button>
    {expanded && hasChildren && <div className="package-tree-children">
      {node.children!.map((child) => <FolderNode key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} />)}
    </div>}
  </div>;
}

function findNode(nodes: WorkspacePackageTreeNode[], path: string): WorkspacePackageTreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    const child = node.children ? findNode(node.children, path) : undefined;
    if (child) return child;
  }
}

export function PackagesPage({ activePage, rootPath }: PackagesPageProps) {
  const [tree, setTree] = useState<WorkspacePackageTreeNode[] | null>(null);
  const [selectedPath, setSelectedPath] = useState("_packages");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    getWorkspacePackageTree(rootPath).then((nodes) => { if (mounted) { setTree(nodes); if (!findNode(nodes, selectedPath)) setSelectedPath(nodes[0]?.path ?? ""); } });
    return () => { mounted = false; };
  }, [rootPath]);

  const selected = useMemo(() => tree ? findNode(tree, selectedPath) : undefined, [tree, selectedPath]);
  const breadcrumbs = selectedPath ? selectedPath.split(/[\/]/).filter(Boolean) : [];

  async function openSelected() {
    if (!selectedPath) return;
    const result = await openWorkspacePath(rootPath, selectedPath);
    setStatus(result.message);
  }

  return <>
    <section className="hero-panel">
      <p className="eyebrow">{activePage.eyebrow}</p><h2>Package Explorer</h2>
      <p>Browse packages and backups as a compact folder tree instead of a flat file list.</p>
    </section>
    <section className="detail-panel package-explorer-panel">
      <div className="package-explorer-toolbar">
        <div className="package-breadcrumbs">
          {breadcrumbs.length ? breadcrumbs.map((part, index) => {
            const target = breadcrumbs.slice(0, index + 1).join("/");
            return <span key={target}><button onClick={() => setSelectedPath(target)}>{part}</button>{index < breadcrumbs.length - 1 && <em>/</em>}</span>;
          }) : <span>No package folder selected</span>}
        </div>
        <button className="secondary-button" disabled={!selectedPath} onClick={openSelected}>Open in Explorer</button>
      </div>
      {status && <p className="package-explorer-status">{status}</p>}
      <div className="package-explorer-layout">
        <aside className="package-tree">
          {tree === null ? <p className="empty-state">Scanning package folders.</p> : tree.length ? tree.map((node) => <FolderNode key={node.path} node={node} selectedPath={selectedPath} onSelect={(next) => setSelectedPath(next.path)} />) : <p className="empty-state">No _packages or _backup folders were detected.</p>}
        </aside>
        <div className="package-folder-preview">
          <p className="eyebrow">Selected Item</p>
          <h3>{selected?.name ?? "Nothing selected"}</h3>
          <p>{selected?.path ?? "Choose a package or backup from the tree."}</p>
          {selected?.kind === "folder" && <div className="package-folder-grid">
            {(selected.children ?? []).map((child) => <button key={child.path} onClick={() => setSelectedPath(child.path)}>
              <span>{child.kind === "folder" ? "📁" : "📄"}</span><strong>{child.name}</strong>
            </button>)}
            {selected.children?.length === 0 && <p className="empty-state">This folder is empty.</p>}
          </div>}
          {selected?.kind === "file" && <button className="primary-button" onClick={openSelected}>Open File</button>}
        </div>
      </div>
    </section>
  </>;
}
