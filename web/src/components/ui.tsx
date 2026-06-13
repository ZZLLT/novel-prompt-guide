import type { AgentStatus } from "../api/types";

export function statusLabel(status: AgentStatus): string {
  const labels: Record<AgentStatus, string> = {
    idle: "待命",
    queued: "排队中",
    working: "思考中",
    waiting: "等待用户",
    done: "已完成",
    blocked: "阻塞",
  };
  return labels[status];
}

export function StatusPill({ status }: { status: AgentStatus }) {
  return <span className={`status-pill status-${status}`}>{statusLabel(status)}</span>;
}

export function Panel({
  children,
  className = "",
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  eyebrow?: string;
}) {
  return (
    <section className={`panel-shell ${className}`} aria-label={title}>
      <div className="panel-titlebar">
        {eyebrow ? <span className="panel-eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
