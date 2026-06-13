/**
 * 提示词模板类型定义
 */

export type PromptCategory =
  | "opening"      // 开场
  | "climax"       // 高潮
  | "transition"   // 转折
  | "character"    // 人物
  | "scene"        // 场景
  | "dialogue"     // 对话
  | "description"  // 描写
  | "ending"       // 结尾
  | "outline"      // 大纲
  | "worldbuild"   // 世界观
  | "custom";      // 自定义

export type PromptTemplate = {
  id: string;
  category: PromptCategory;
  title: string;
  description: string;
  content: string;
  variables: string[];      // 可替换变量，如 {{角色名}}
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  usageCount: number;      // 使用次数
};

export type PromptHistory = {
  id: string;
  templateId: string;
  content: string;          // 填充变量后的实际内容
  timestamp: number;
};

export const PROMPT_CATEGORIES: Record<PromptCategory, { label: string; icon: string; description: string }> = {
  opening: {
    label: "开场",
    icon: "🎬",
    description: "故事开头、章节开篇",
  },
  climax: {
    label: "高潮",
    icon: "⚡",
    description: "冲突爆发、情绪高点",
  },
  transition: {
    label: "转折",
    icon: "🔄",
    description: "剧情转折、意外发生",
  },
  character: {
    label: "人物",
    icon: "👤",
    description: "角色塑造、性格描写",
  },
  scene: {
    label: "场景",
    icon: "🏞️",
    description: "环境描写、氛围营造",
  },
  dialogue: {
    label: "对话",
    icon: "💬",
    description: "人物对话、语言风格",
  },
  description: {
    label: "描写",
    icon: "✍️",
    description: "细节描写、感官体验",
  },
  ending: {
    label: "结尾",
    icon: "🎭",
    description: "章节结尾、故事收尾",
  },
  outline: {
    label: "大纲",
    icon: "📋",
    description: "情节规划、结构设计",
  },
  worldbuild: {
    label: "世界观",
    icon: "🌍",
    description: "设定构建、规则制定",
  },
  custom: {
    label: "自定义",
    icon: "⚙️",
    description: "用户自定义提示词",
  },
};
