/**
 * AI对话消息类型定义
 */

export type AIMessageRole = 'user' | 'assistant' | 'system';

export type AIContext = {
  // 当前工作区
  workspace: string;

  // 当前编辑的实体
  currentEntity?: {
    type: 'character' | 'scene' | 'plotline' | 'world';
    id: string;
    data: any;
  };

  // 项目数据概览
  summary: {
    characterCount: number;
    sceneCount: number;
    plotlineCount: number;
    totalWords: number;
  };
};

export type AIMessage = {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: number;
  context?: AIContext;

  // 操作建议（AI可以建议执行的操作）
  suggestedActions?: Array<{
    type: 'create' | 'modify' | 'delete';
    entity: 'character' | 'scene' | 'plotline';
    data: any;
    description: string;
  }>;
};

export type AIConversation = {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
};

export type AICommand = {
  type: 'create' | 'modify' | 'delete' | 'analyze' | 'query' | 'generate';
  entity: 'character' | 'scene' | 'plotline' | 'world' | 'general';
  action: string;
  parameters: Record<string, any>;
};

// AI操作结果
export type AIActionResult = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};
