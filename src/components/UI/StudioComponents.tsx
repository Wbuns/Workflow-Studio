import type { ReactNode } from "react";

type PageHeaderProps = {
    eyebrow: string;
    title: string;
    description?: string;
    actionLabel?: string;
};

export function PageHeader({ eyebrow, title, description, actionLabel }: PageHeaderProps) {
    return (
        <section className="page-header">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {actionLabel && (
                <button type="button" className="primary-button">
                    {actionLabel}
                </button>
            )}
        </section>
    );
}

type MetricCardProps = {
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    status?: "good" | "warning" | "neutral";
};

export function MetricCard({ label, value, detail, status = "neutral" }: MetricCardProps) {
    return (
        <article className={`metric-card status-${status}`}>
            <span>{label}</span>
            <strong>{value}</strong>
            {detail && <p>{detail}</p>}
        </article>
    );
}

type PanelProps = {
    title: string;
    children: ReactNode;
    className?: string;
};

export function Panel({ title, children, className = "" }: PanelProps) {
    return (
        <section className={`studio-panel ${className}`.trim()}>
            <h3>{title}</h3>
            {children}
        </section>
    );
}

type StatusChipProps = {
    label: string;
    tone?: "good" | "warning" | "neutral";
};

export function StatusChip({ label, tone = "neutral" }: StatusChipProps) {
    return <span className={`status-chip ${tone}`}>{label}</span>;
}

type ActionListProps = {
    actions: string[];
};

export function ActionList({ actions }: ActionListProps) {
    return (
        <div className="action-list">
            {actions.map((action) => (
                <button type="button" key={action}>
                    {action}
                </button>
            ))}
        </div>
    );
}
