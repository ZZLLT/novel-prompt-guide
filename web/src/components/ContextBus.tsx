import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function ContextBus({
  error,
  segments,
}: {
  error: string | null;
  segments: Array<{ label: string; value: number; tone: string }>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const meterTotal = total || 1;

  return (
    <div className={`context-bus ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button
        type="button"
        className="bus-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "收起上下文总线" : "展开上下文总线"}
      >
        <h2>上下文总线</h2>
        <span>{total > 0 ? `${total} 字符信号` : "等待上下文"}</span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {isExpanded && (
        <>
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
        </>
      )}
    </div>
  );
}
