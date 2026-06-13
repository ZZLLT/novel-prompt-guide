import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, StopCircle, RefreshCw, Trash2, Plus, MessageSquare } from "lucide-react";
import { useAIChat } from "../../hooks/useAIChat";
import type { AIContext } from "../../types/ai";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type AIChatPanelProps = {
  context: AIContext;
  isOpen: boolean;
  onClose: () => void;
};

export function AIChatPanel({ context, isOpen, onClose }: AIChatPanelProps) {
  const {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    streamingMessage,
    setCurrentConversationId,
    createConversation,
    deleteConversation,
    clearCurrentConversation,
    sendMessageStream,
    stopGeneration,
    regenerateLastMessage,
  } = useAIChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, streamingMessage]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessageStream(message, context);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    createConversation("新对话");
  };

  const handleDeleteChat = (conversationId: string) => {
    if (confirm("确定要删除这个对话吗？")) {
      deleteConversation(conversationId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-panel">
      {/* 侧边栏 - 对话列表 */}
      <div className="ai-chat-sidebar">
        <div className="ai-chat-sidebar-header">
          <h3>AI 对话</h3>
          <Button size="sm" onClick={handleNewChat}>
            <Plus size={16} />
          </Button>
        </div>

        <div className="ai-chat-conversations">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={32} />
              <p>还没有对话</p>
              <Button size="sm" onClick={handleNewChat}>
                开始对话
              </Button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                className={`ai-chat-conversation-item ${
                  conv.id === currentConversationId ? "is-active" : ""
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <div className="conversation-item-title">{conv.title}</div>
                <div className="conversation-item-meta">
                  {conv.messages.length} 条消息
                </div>
                <button
                  type="button"
                  className="conversation-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(conv.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 主对话区域 */}
      <div className="ai-chat-main">
        {/* 头部 */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-info">
            <Sparkles size={20} />
            <span>AI 助手</span>
          </div>
          <div className="ai-chat-header-actions">
            {currentConversation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCurrentConversation}
              >
                <Trash2 size={16} />
                清空
              </Button>
            )}
            <button
              type="button"
              className="ai-chat-close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="ai-chat-messages">
          {!currentConversation ? (
            <div className="ai-chat-welcome">
              <Sparkles size={48} />
              <h2>AI 创作助手</h2>
              <p>我可以帮你：</p>
              <ul>
                <li>🎭 生成角色设定和背景故事</li>
                <li>📝 创建场景大纲和正文</li>
                <li>🔀 规划剧情线和关键节点</li>
                <li>✍️ 扩写、改写、润色内容</li>
                <li>🔍 分析角色、剧情一致性</li>
                <li>💡 提供创作建议和灵感</li>
              </ul>
              <p className="ai-chat-tip">
                在下方输入框中告诉我你的需求，比如：<br />
                "创建一个冷酷的反派角色"<br />
                "生成主角登场的开场戏"<br />
                "帮我分析当前剧情是否合理"
              </p>
            </div>
          ) : (
            <>
              {currentConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}
                >
                  <div className="ai-chat-message-avatar">
                    {message.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="ai-chat-message-content">
                    <div className="ai-chat-message-text">
                      {message.content}
                    </div>
                    <div className="ai-chat-message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* 流式消息 */}
              {streamingMessage && (
                <div className="ai-chat-message is-assistant is-streaming">
                  <div className="ai-chat-message-avatar">🤖</div>
                  <div className="ai-chat-message-content">
                    <div className="ai-chat-message-text">
                      {streamingMessage}
                      <span className="ai-chat-cursor">▊</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="ai-chat-input-area">
          {isLoading && (
            <div className="ai-chat-status">
              <Sparkles size={16} className="ai-chat-loading-icon" />
              <span>AI 正在思考...</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={stopGeneration}
              >
                <StopCircle size={16} />
                停止
              </Button>
            </div>
          )}

          {currentConversation && currentConversation.messages.length > 0 && !isLoading && (
            <div className="ai-chat-actions">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => regenerateLastMessage(context)}
              >
                <RefreshCw size={16} />
                重新生成
              </Button>
            </div>
          )}

          <div className="ai-chat-input-container">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              disabled={isLoading}
              className="ai-chat-input"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="ai-chat-send-btn"
            >
              <Send size={18} />
            </Button>
          </div>

          <div className="ai-chat-context-info">
            当前工作区：{context.workspace} ·
            角色 {context.summary.characterCount} ·
            场景 {context.summary.sceneCount} ·
            剧情线 {context.summary.plotlineCount} ·
            共 {context.summary.totalWords.toLocaleString()} 字
          </div>
        </div>
      </div>
    </div>
  );
}
