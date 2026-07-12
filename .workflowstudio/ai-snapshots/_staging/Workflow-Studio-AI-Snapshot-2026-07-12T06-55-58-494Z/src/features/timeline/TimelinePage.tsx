import { useEffect, useMemo, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { ProjectTimelineEvent, ProjectTimelineEventKind } from "../../types/timeline";
import { getProjectTimeline } from "../../services/TimelineService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type TimelinePageProps = { activePage: NavigationItem; rootPath?: string };
type TimelineFilter = "all" | ProjectTimelineEventKind;

const filterLabels: Array<{ id: TimelineFilter; label: string }> = [
  { id: "all", label: "All Activity" },
  { id: "git", label: "Git" },
  { id: "package", label: "Packages" },
  { id: "snapshot", label: "Snapshots" },
  { id: "workspace", label: "Workspace" },
];

function dateGroup(isoDate: string) {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const key = date.toDateString();
  if (key === today.toDateString()) return "Today";
  if (key === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function iconFor(kind: ProjectTimelineEventKind) {
  if (kind === "git") return "G";
  if (kind === "package") return "P";
  if (kind === "snapshot") return "AI";
  return "W";
}

export function TimelinePage({ activePage, rootPath }: TimelinePageProps) {
  const [events, setEvents] = useState<ProjectTimelineEvent[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function refresh() {
    setLoading(true);
    const result = await getProjectTimeline(rootPath);
    setEvents(result.events);
    setWarnings(result.warnings);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, [rootPath]);

  const grouped = useMemo(() => {
    const visible = filter === "all" ? events : events.filter((event) => event.kind === filter);
    return visible.reduce<Array<{ label: string; events: ProjectTimelineEvent[] }>>((groups, event) => {
      const label = dateGroup(event.occurredAt);
      const current = groups[groups.length - 1];
      if (!current || current.label !== label) groups.push({ label, events: [event] });
      else current.events.push(event);
      return groups;
    }, []);
  }, [events, filter]);

  async function openEvent(event: ProjectTimelineEvent) {
    if (!event.path) return;
    const result = await openWorkspacePath(rootPath, event.path);
    setStatus(result.message);
  }

  return <>
    <section className="hero-panel timeline-hero">
      <div>
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Project Timeline</h2>
        <p>Review Git commits, generated packages, AI snapshots, and current workspace activity in one chronological history.</p>
      </div>
      <button className="secondary-button" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
    </section>

    <section className="detail-panel timeline-panel">
      <div className="timeline-toolbar" role="tablist" aria-label="Timeline filters">
        {filterLabels.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>
      {status && <p className="timeline-status">{status}</p>}
      {warnings.map((warning) => <p className="timeline-warning" key={warning}>{warning}</p>)}
      {loading ? <p className="empty-state timeline-empty">Loading project activity.</p> : grouped.length === 0 ? <p className="empty-state timeline-empty">No matching project activity was found yet.</p> : <div className="timeline-groups">
        {grouped.map((group) => <section className="timeline-group" key={group.label}>
          <h3>{group.label}</h3>
          <div className="timeline-events">
            {group.events.map((event) => <article className={`timeline-event timeline-event-${event.kind}`} key={event.id}>
              <div className="timeline-event-marker">{iconFor(event.kind)}</div>
              <div className="timeline-event-content">
                <div className="timeline-event-heading">
                  <div><span>{event.kind}</span><h4>{event.title}</h4></div>
                  <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                </div>
                <p>{event.detail}</p>
                {event.path && <button className="timeline-open-button" onClick={() => void openEvent(event)}>Open {event.kind === "snapshot" ? "snapshot" : "location"}</button>}
              </div>
            </article>)}
          </div>
        </section>)}
      </div>}
    </section>
  </>;
}
