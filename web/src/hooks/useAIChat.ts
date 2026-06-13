import { useState, useCallback, useRef } from "react";
import type { AIMessage, AIConversation, AIContext } from "../types/ai";
import { aiService } from "../services/aiService";

const STORAGE_KEY = "ai_conversations";

export function useAIChat() {
  const [conversations, setConversations] = useState<AIConversation[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Failed to load AI conversations:", error);
      }
    }
    return [];
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");

  const abortControllerRef = useRef<AbortController | null>(null);

  // 保存对话
  const saveConversations = useCallback((newConversations: AIConversation[]) => {
    setConversations(newConversations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConversations));
  }, []);

  // 获取当前对话
  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  // 创建新对话
  const createConversation = useCallback(
    (title: string = "新对话") => {
      const newConversation: AIConversation = {
        id: `conv-${Date.now()}`,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newConversations = [newConversation, ...conversations];
      saveConversations(newConversations);
      setCurrentConversationId(newConversation.id);

      return newConversation.id;
    },
    [conversations, saveConversations]
  );

  // 删除对话
  const deleteConversation = useCallback(
    (conversationId: string) => {
      const newConversations = conversations.filter((c) => c.id !== conversationId);
      saveConversations(newConversations);

      if (currentConversationId === conversationId) {
        setCurrentConversationId(newConversations[0]?.id || null);
      }
    },
    [conversations, currentConversationId, saveConversations]
  );

  // 清空当前对话
  const clearCurrentConversation = useCallback(() => {
    if (!currentConversationId) return;

    const newConversations = conversations.map((c) =>
      c.id === currentConversationId
        ? { ...c, messages: [], updatedAt: Date.now() }
        : c
    );
    saveConversations(newConversations);
  }, [currentConversationId, conversations, saveConversations]);

  // 发送消息（普通）
  const sendMessage = useCallback(
    async (content: string, context: AIContext) => {
      if (!content.trim()) return;

      // 确保有对话
      let convId = currentConversationId;
      if (!convId) {
        convId = createConversation();
      }

      const userMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
        context,
      };

      // 添加用户消息
      const newConversations = conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              updatedAt: Date.now(),
            }
          : c
      );
      saveConversations(newConversations);

      setIsLoading(true);

      try {
        // 调用AI
        const conv = newConversations.find((c) => c.id === convId);
        if (!conv) throw new Error("Conversation not found");

        const response = await aiService.chat(conv.messages, context);

        // 添加AI回复
        const assistantMessage: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        };

        const finalConversations = conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, userMessage, assistantMessage],
                updatedAt: Date.now(),
              }
            : c
        );
        saveConversations(finalConversations);
      } catch (error) {
        console.error("AI chat error:", error);

        // 添加错误消息
        const errorMessage: AIMessage = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: `抱歉，发生了错误：${error instanceof Error ? error.message : "未知错误"}`,
          timestamp: Date.now(),
        };

        const errorConversations = conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, userMessage, errorMessage],
                updatedAt: Date.now(),
              }
            : c
        );
        saveConversations(errorConversations);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, conversations, createConversation, saveConversations]
  );

  // 发送消息（流式）
  const sendMessageStream = useCallback(
    async (content: string, context: AIContext) => {
      if (!content.trim()) return;

      // 确保有对话
      let convId = currentConversationId;
      if (!convId) {
        convId = createConversation();
      }

      const userMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
        context,
      };

      // 添加用户消息
      const newConversations = conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              updatedAt: Date.now(),
            }
          : c
      );
      saveConversations(newConversations);

      setIsLoading(true);
      setStreamingMessage("");

      // 创建AbortController用于取消
      abortControllerRef.current = new AbortController();

      try {
        const conv = newConversations.find((c) => c.id === convId);
        if (!conv) throw new Error("Conversation not found");

        let fullResponse = "";

        // 流式接收
        for await (const delta of aiService.chatStream(conv.messages, context)) {
          fullResponse += delta;
          setStreamingMessage(fullResponse);
        }

        // 完成后添加完整消息
        const assistantMessage: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: fullResponse,
          timestamp: Date.now(),
        };

        const finalConversations = conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, userMessage, assistantMessage],
                updatedAt: Date.now(),
              }
            : c
        );
        saveConversations(finalConversations);
        setStreamingMessage("");
      } catch (error) {
        console.error("AI stream error:", error);

        const errorMessage: AIMessage = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: `抱歉，发生了错误：${error instanceof Error ? error.message : "未知错误"}`,
          timestamp: Date.now(),
        };

        const errorConversations = conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, userMessage, errorMessage],
                updatedAt: Date.now(),
              }
            : c
        );
        saveConversations(errorConversations);
        setStreamingMessage("");
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [currentConversationId, conversations, createConversation, saveConversations]
  );

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStreamingMessage("");
    }
  }, []);

  // 重新生成最后一条消息
  const regenerateLastMessage = useCallback(
    async (context: AIContext) => {
      if (!currentConversationId || !currentConversation) return;

      const messages = currentConversation.messages;
      if (messages.length < 2) return;

      // 移除最后一条AI消息 - 找到最后一条用户消息
      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserMessageIndex = i;
          break;
        }
      }

      if (lastUserMessageIndex === -1) return;

      const newMessages = messages.slice(0, lastUserMessageIndex + 1);
      const lastUserMessage = messages[lastUserMessageIndex];

      // 更新对话
      const newConversations = conversations.map((c) =>
        c.id === currentConversationId
          ? { ...c, messages: newMessages, updatedAt: Date.now() }
          : c
      );
      saveConversations(newConversations);

      // 重新发送
      await sendMessageStream(lastUserMessage.content, context);
    },
    [currentConversationId, currentConversation, conversations, saveConversations, sendMessageStream]
  );

  return {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    streamingMessage,
    setCurrentConversationId,
    createConversation,
    deleteConversation,
    clearCurrentConversation,
    sendMessage,
    sendMessageStream,
    stopGeneration,
    regenerateLastMessage,
  };
}
