export function ContextBus({
  error,
  segments,
}: {
  error: string | null;
  segments: Array<{ label: string; value: number; tone: string }>;
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const meterTotal = total || 1;
  return (
    <div className="context-bus">
      <div className="bus-header">
        <h2>上下文总线</h2>
        <span>{total > 0 ? `${total} 字符信号` : "等待上下文"}</span>
      </div>
      <div className="context-segments">
        {segments.map((segment) => (
          <div className={`context-segment tone-${segment.tone}`} key={segment.label}>
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
            <i style={{ width: `${Math.max(8, Math.round((segment.value / meterTotal) * 100))}%` }} />
          </div>
        ))}
      </div>
      {error ? <p className="incident-line">系统提示：{error}</p> : null}
    </div>
  );
}
