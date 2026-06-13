/**
 * AI智能建议面板
 */
import { useState, useEffect } from "react";
import { Lightbulb, AlertCircle, Info, Sparkles, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SuggestionType = "critical" | "warning" | "tip" | "idea";

type Suggestion = {
  type: SuggestionType;
  category: string;
  title: string;
  description: string;
  action?: {
    command: string;
    type: string;
    entity_id?: string;
  };
};

type SmartSuggestionsResponse = {
  suggestions: Suggestion[];
  scene: {
    scene: string;
    scene_name: string;
    confidence: number;
  };
  priority_actions: Suggestion[];
  total_count: number;
};

type AISuggestionsProps = {
  context: {
    characters: any[];
    scenes: any[];
    plotlines: any[];
    summary: {
      characterCount: number;
      sceneCount: number;
      plotlineCount: number;
    };
  };
  onExecuteAction?: (action: { command: string; type: string }) => void;
};

const suggestionConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "严重",
    variant: "destructive" as const,
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "警告",
    variant: "secondary" as const,
  },
  tip: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "提示",
    variant: "outline" as const,
  },
  idea: {
    icon: Sparkles,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "创意",
    variant: "outline" as const,
  },
};

export function AISuggestions({ context, onExecuteAction }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [context.summary.characterCount, context.summary.sceneCount, context.summary.plotlineCount]);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/suggestions/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        throw new Error("获取建议失败");
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  if (collapsed) {
    return (
      <div className="ai-suggestions-collapsed">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCollapsed(false)}
          className="gap-2"
        >
          <Lightbulb size={16} />
          AI建议 {suggestions && `(${suggestions.total_count})`}
        </Button>
      </div>
    );
  }

  return (
    <div className="ai-suggestions-panel">
      <div className="ai-suggestions-header">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="font-semibold">AI智能建议</h3>
          {suggestions && (
            <Badge variant="secondary">{suggestions.total_count}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(true)}
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="ai-suggestions-loading">
          <div className="animate-pulse">正在分析...</div>
        </div>
      )}

      {error && (
        <div className="ai-suggestions-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {suggestions && (
        <>
          {/* 当前场景 */}
          <div className="ai-suggestions-scene">
            <div className="text-sm text-muted-foreground">当前场景</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{suggestions.scene.scene_name}</Badge>
              <span className="text-xs text-muted-foreground">
                置信度: {(suggestions.scene.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 优先操作 */}
          {suggestions.priority_actions.length > 0 && (
            <div className="ai-suggestions-priority">
              <div className="text-sm font-medium mb-2">优先处理</div>
              {suggestions.priority_actions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onExecute={onExecuteAction}
                />
              ))}
            </div>
          )}

          {/* 所有建议 */}
          <div className="ai-suggestions-list">
            {suggestions.suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                onExecute={onExecuteAction}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onExecute,
}: {
  suggestion: Suggestion;
  onExecute?: (action: { command: string; type: string }) => void;
}) {
  const config = suggestionConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <div className={`suggestion-card ${config.bgColor} ${config.borderColor}`}>
      <div className="suggestion-icon">
        <Icon size={16} className={config.color} />
      </div>
      <div className="suggestion-content">
        <div className="suggestion-header">
          <span className="suggestion-title">{suggestion.title}</span>
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
        </div>
        <p className="suggestion-description">{suggestion.description}</p>
        {suggestion.action && onExecute && (
          <Button
            variant="outline"
            size="sm"
            className="suggestion-action"
            onClick={() => onExecute(suggestion.action!)}
          >
            {suggestion.action.command}
            <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

function RefreshCcw({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}
