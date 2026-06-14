/**
 * AI智能命令输入框
 */
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CommandResult = {
  success: boolean;
  message: string;
  data: any;
  action_type: string;
};

type CommandHistory = {
  command: string;
  timestamp: number;
  success: boolean;
};

type SmartCommandInputProps = {
  context: {
    workspace: string;
    summary: {
      characterCount: number;
      sceneCount: number;
      plotlineCount: number;
    };
  };
  onResult?: (result: CommandResult) => void;
  placeholder?: string;
};

const quickCommands = [
  { label: "续写500字", command: "续写这个场景500字" },
  { label: "润色", command: "润色这段内容" },
  { label: "生成角色", command: "创建一个主角" },
  { label: "生成场景", command: "生成开场场景" },
  { label: "写作建议", command: "给我一些写作建议" },
  { label: "检查问题", command: "检查剧情一致性" },
];

const HISTORY_KEY = "ai-command-history";
const MAX_HISTORY = 20;

export function SmartCommandInput({
  context,
  onResult,
  placeholder = "输入命令或自然语言，例如：续写500字、润色对话、创建角色...",
}: SmartCommandInputProps) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load command history", e);
    }
  }, []);

  // 保存到历史记录
  function saveToHistory(cmd: string, success: boolean) {
    const newHistory: CommandHistory[] = [
      { command: cmd, timestamp: Date.now(), success },
      ...history.filter((h) => h.command !== cmd),
    ].slice(0, MAX_HISTORY);

    setHistory(newHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save command history", e);
    }
  }

  async function executeCommand(cmd: string) {
    if (!cmd.trim()) return;

    setLoading(true);
    setLastResult(null);
    setShowHistory(false);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          context,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("⚠️ AI服务未启动，请先启动后端");
        } else if (response.status === 500) {
          throw new Error("AI服务错误，请检查API配置");
        } else {
          throw new Error(`命令执行失败 (${response.status})`);
        }
      }

      const result = await response.json();
      setLastResult(result);
      saveToHistory(cmd, result.success);

      if (onResult) {
        onResult(result);
      }

      if (result.success) {
        setCommand("");
        setHistoryIndex(-1);
      }
    } catch (err) {
      let errorMessage = "未知错误";

      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "⚠️ 无法连接到AI服务，请确保后端已启动";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      const errorResult = {
        success: false,
        message: errorMessage,
        data: null,
        action_type: "error",
      };
      setLastResult(errorResult);
      saveToHistory(cmd, false);
      console.error("Command execution failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeCommand(command);
  }

  function handleQuickCommand(cmd: string) {
    setCommand(cmd);
    inputRef.current?.focus();
  }

  // Cmd+K 快捷键 + 上下箭头导航历史
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K 聚焦
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // 上下箭头导航历史
      if (document.activeElement === inputRef.current) {
        if (e.key === "ArrowUp" && history.length > 0) {
          e.preventDefault();
          const newIndex = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(newIndex);
          setCommand(history[newIndex].command);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCommand(history[newIndex].command);
          } else {
            setHistoryIndex(-1);
            setCommand("");
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex]);

  return (
    <div className="smart-command-container">
      {/* 快捷命令 */}
      <div className="quick-commands">
        <div className="quick-commands-label">
          <Sparkles size={14} />
          <span>快捷命令</span>
        </div>
        <div className="quick-commands-list">
          {quickCommands.map((qc, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand(qc.command)}
              disabled={loading}
            >
              {qc.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 命令输入 */}
      <form onSubmit={handleSubmit} className="smart-command-input-form">
        <div className="smart-command-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder={placeholder}
            disabled={loading}
            className="smart-command-input"
          />
          {history.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="history-toggle"
              title="历史记录"
            >
              <History size={14} />
            </Button>
          )}
        </div>
        <Button
          type="submit"
          disabled={!command.trim() || loading}
          size="sm"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </form>

      {/* 历史记录下拉 */}
      {showHistory && history.length > 0 && (
        <div className="command-history-dropdown">
          <div className="command-history-header">
            <span>历史记录</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(false)}
            >
              <X size={12} />
            </Button>
          </div>
          <div className="command-history-list">
            {history.slice(0, 10).map((item, index) => (
              <button
                key={index}
                type="button"
                className="command-history-item"
                onClick={() => {
                  setCommand(item.command);
                  setShowHistory(false);
                  inputRef.current?.focus();
                }}
              >
                <span className="command-history-text">{item.command}</span>
                <Badge
                  variant={item.success ? "default" : "destructive"}
                  className="text-xs"
                >
                  {item.success ? "✓" : "✗"}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结果显示 */}
      {lastResult && (
        <div className={`command-result ${lastResult.success ? "success" : "error"}`}>
          <div className="command-result-header">
            <Badge variant={lastResult.success ? "default" : "destructive"}>
              {lastResult.action_type}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {lastResult.success ? "执行成功" : "执行失败"}
            </span>
          </div>
          <div className="command-result-message">
            {lastResult.message}
          </div>
          {lastResult.data && (
            <div className="command-result-data">
              <pre>{JSON.stringify(lastResult.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* 快捷键提示 */}
      <div className="command-hint">
        <kbd>⌘ K</kbd> 或 <kbd>Ctrl+K</kbd> 快速聚焦 · <kbd>↑</kbd> <kbd>↓</kbd> 浏览历史
      </div>
    </div>
  );
}
