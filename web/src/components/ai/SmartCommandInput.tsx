/**
 * AI智能命令输入框
 */
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CommandResult = {
  success: boolean;
  message: string;
  data: any;
  action_type: string;
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

export function SmartCommandInput({
  context,
  onResult,
  placeholder = "输入命令或自然语言，例如：续写500字、润色对话、创建角色...",
}: SmartCommandInputProps) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function executeCommand(cmd: string) {
    if (!cmd.trim()) return;

    setLoading(true);
    setLastResult(null);

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
        throw new Error("命令执行失败");
      }

      const result = await response.json();
      setLastResult(result);

      if (onResult) {
        onResult(result);
      }

      if (result.success) {
        setCommand("");
      }
    } catch (err) {
      setLastResult({
        success: false,
        message: err instanceof Error ? err.message : "未知错误",
        data: null,
        action_type: "error",
      });
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

  // Cmd+K 快捷键
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="smart-command-input"
        />
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
        <kbd>⌘ K</kbd> 或 <kbd>Ctrl+K</kbd> 快速聚焦命令输入
      </div>
    </div>
  );
}
