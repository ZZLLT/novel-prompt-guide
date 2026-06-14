import { ChevronDown, ChevronUp, Activity, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

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
        <div className="bus-header-left">
          <Activity size={16} className="bus-icon" />
          <h2>上下文总线</h2>
        </div>
        <div className="bus-header-right">
          <Badge variant={total > 0 ? "default" : "outline"}>
            {total > 0 ? `${total} 字符` : "待加载"}
          </Badge>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      {isExpanded && (
        <>
          <div className="context-segments">
            {segments.length > 0 ? (
              segments.map((segment) => (
                <div className={`context-segment tone-${segment.tone}`} key={segment.label}>
                  <div className="segment-info">
                    <span className="segment-label">{segment.label}</span>
                    <strong className="segment-value">{segment.value.toLocaleString()}</strong>
                  </div>
                  <div className="segment-bar-container">
                    <div
                      className="segment-bar"
                      style={{ width: `${Math.max(2, Math.round((segment.value / meterTotal) * 100))}%` }}
                    />
                  </div>
                  <span className="segment-percent">
                    {Math.round((segment.value / meterTotal) * 100)}%
                  </span>
                </div>
              ))
            ) : (
              <div className="context-empty">
                <TrendingUp size={24} className="text-muted-foreground" />
                <p>暂无上下文数据</p>
              </div>
            )}
          </div>
          {error && (
            <div className="context-error">
              <Badge variant="destructive">系统提示</Badge>
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
