import { StatusPill } from "./ui";
import type { AgentRuntime, AssistantStatus, ChatMessage } from "../hooks/useCockpit";
import { Lightbulb, ListChecks, Send, WandSparkles } from "lucide-react";

export function AgentCommandDeck({
  agents,
  assistantBusy,
  assistantInput,
  assistantMessages,
  assistantStatus,
  chatInput,
  messages,
  onAssistantInput,
  onAssistantShortcut,
  onAskAssistant,
  onChatInput,
  onSend,
}: {
  agents: AgentRuntime[];
  assistantBusy: boolean;
  assistantInput: string;
  assistantMessages: ChatMessage[];
  assistantStatus: AssistantStatus;
  chatInput: string;
  messages: ChatMessage[];
  onAssistantInput: (value: string) => void;
  onAssistantShortcut: (kind: "prompt" | "next") => void;
  onAskAssistant: () => void;
  onChatInput: (value: string) => void;
  onSend: () => void;
}) {
  const activeAgent = agents.find((agent) => agent.status === "working")
    ?? agents.find((agent) => agent.status === "queued")
    ?? agents[0];
  const assistantStatusLabel: Record<AssistantStatus, string> = {
    idle: "待提问",
    sending: "发送中",
    queued: "已入队",
    answered: "已回复",
    error: "失败",
  };
  const askButtonText = assistantBusy ? "等待 AI 返回" : "询问 AI 助手";

  return (
    <div className="agent-deck">
      <section className="ai-assistant-box ai-console-panel" aria-label="AI助手" aria-busy={assistantBusy}>
        <header className="ai-console-header">
          <div>
            <span>Assistant Control</span>
            <h3>AI 控制台</h3>
            <p>只在你点击时提交问题，默认使用短上下文和当前任务路由。</p>
          </div>
          <strong className={`assistant-status assistant-${assistantStatus}`}>{assistantStatusLabel[assistantStatus]}</strong>
        </header>
        <div className="assistant-runtime-bar" aria-label="AI助手运行状态">
          <div>
            <span>当前任务模型</span>
            <strong>当前处理：{activeAgent?.name ?? "助手 Agent"}</strong>
          </div>
          <div>
            <span>提示词广场</span>
            <strong>短上下文 / 可复用</strong>
          </div>
          <div>
            <span>提交方式</span>
            <strong>手动触发</strong>
          </div>
        </div>
        <div className="assistant-quick-actions">
          <button type="button" aria-label="生成提示词选项" onClick={() => onAssistantShortcut("prompt")}>
            <WandSparkles aria-hidden="true" size={15} />
            提示词
          </button>
          <button type="button" aria-label="获取下一步优化" onClick={() => onAssistantShortcut("next")}>
            <ListChecks aria-hidden="true" size={15} />
            下一步
          </button>
        </div>
        <div className="assistant-log">
          {assistantMessages.map((message) => (
            <p className={`message-${message.from}`} key={message.id}>{message.text}</p>
          ))}
        </div>
        <label className="assistant-input">
          <span>AI 助手提问</span>
          <textarea
            aria-label="AI助手提问"
            value={assistantInput}
            maxLength={600}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onAssistantInput(event.target.value)}
            placeholder="例如：基于当前阶段，给我一个更省 token 的提示词和下一步优化顺序。"
          />
        </label>
        <button type="button" aria-label="询问AI助手" disabled={!assistantInput.trim() || assistantBusy} onClick={() => onAskAssistant()}>
          <Lightbulb aria-hidden="true" size={16} />
          {askButtonText}
        </button>
      </section>

      <div className="agent-list">
        {agents.map((agent) => (
          <article className={`agent-card agent-${agent.status}`} key={agent.id}>
            <div className="agent-head">
              <span className="agent-signal">{agent.signal}</span>
              <StatusPill status={agent.status} />
            </div>
            <h3>{agent.name}</h3>
            <p>{agent.role}</p>
            <small>{agent.output || agent.task}</small>
          </article>
        ))}
      </div>

      <div className="command-stream">
        <h3>任务流</h3>
        <div className="message-log">
          {messages.map((message) => (
            <p className={`message-${message.from}`} key={message.id}>{message.text}</p>
          ))}
        </div>
        <label className="command-input">
          <span>调度指令</span>
          <textarea
            value={chatInput}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChatInput(event.target.value)}
            placeholder="例如：让剧情策划检查第一章钩子是否足够强。"
          />
        </label>
        <button type="button" onClick={onSend}>
          <Send aria-hidden="true" size={16} />
          发送给 Agent
        </button>
      </div>
    </div>
  );
}
