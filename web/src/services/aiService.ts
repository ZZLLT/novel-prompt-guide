import type { AIMessage, AIContext, AIActionResult } from "../types/ai";
import type { CharacterCard } from "../types/character";
import type { SceneCard } from "../types/scene";
import type { Plotline } from "../types/plotline";

/**
 * AI服务 - 与LLM API交互
 */

// API配置
const API_BASE_URL = "http://127.0.0.1:8000/api";

export class AIService {
  /**
   * 发送对话消息
   */
  async chat(messages: AIMessage[], context: AIContext): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI chat failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("AI chat error:", error);
      throw error;
    }
  }

  /**
   * 流式对话
   */
  async *chatStream(
    messages: AIMessage[],
    context: AIContext
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI chat stream failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                yield parsed.delta;
              }
            } catch (e) {
              // 跳过无效JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("AI chat stream error:", error);
      throw error;
    }
  }

  /**
   * 生成角色
   */
  async generateCharacter(prompt: string): Promise<CharacterCard> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate/character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Generate character failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.character;
    } catch (error) {
      console.error("Generate character error:", error);
      throw error;
    }
  }

  /**
   * 生成场景
   */
  async generateScene(
    prompt: string,
    context?: {
      characters?: CharacterCard[];
      plotlines?: Plotline[];
    }
  ): Promise<SceneCard> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate/scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });

      if (!response.ok) {
        throw new Error(`Generate scene failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.scene;
    } catch (error) {
      console.error("Generate scene error:", error);
      throw error;
    }
  }

  /**
   * 生成剧情线
   */
  async generatePlotline(prompt: string): Promise<Plotline> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate/plotline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Generate plotline failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plotline;
    } catch (error) {
      console.error("Generate plotline error:", error);
      throw error;
    }
  }

  /**
   * 扩写内容
   */
  async expandContent(
    content: string,
    targetLength: number,
    context?: any
  ): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/modify/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, targetLength, context }),
      });

      if (!response.ok) {
        throw new Error(`Expand content failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Expand content error:", error);
      throw error;
    }
  }

  /**
   * 改写内容
   */
  async rewriteContent(
    content: string,
    instruction: string,
    context?: any
  ): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/modify/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, instruction, context }),
      });

      if (!response.ok) {
        throw new Error(`Rewrite content failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Rewrite content error:", error);
      throw error;
    }
  }

  /**
   * 压缩内容
   */
  async summarizeContent(
    content: string,
    targetLength: number
  ): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/modify/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, targetLength }),
      });

      if (!response.ok) {
        throw new Error(`Summarize content failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Summarize content error:", error);
      throw error;
    }
  }

  /**
   * 分析一致性
   */
  async analyzeConsistency(entities: any[]): Promise<{
    issues: Array<{
      type: string;
      severity: "low" | "medium" | "high";
      description: string;
      entities: string[];
    }>;
    score: number;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/analyze/consistency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entities }),
      });

      if (!response.ok) {
        throw new Error(`Analyze consistency failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Analyze consistency error:", error);
      throw error;
    }
  }

  /**
   * 执行AI命令
   */
  async executeCommand(
    command: string,
    context: AIContext
  ): Promise<AIActionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, context }),
      });

      if (!response.ok) {
        throw new Error(`Execute command failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Execute command error:", error);
      return {
        success: false,
        message: "执行失败",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// 单例
export const aiService = new AIService();
