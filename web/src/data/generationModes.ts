import type { GenerationModeId } from "../api/types";

export type GenerationMode = {
  id: GenerationModeId;
  label: string;
  buttonLabel: string;
  badge: string;
  latency: string;
  budget: string;
  focus: string;
  command: string;
};

export const generationModes: GenerationMode[] = [
  {
    id: "fast",
    label: "快速",
    buttonLabel: "快速生成",
    badge: "优先速度",
    latency: "短上下文",
    budget: "约 650 字上下文",
    focus: "用于卡点续写、灵感试探和低成本批量探索。",
    command: "请按优先速度模式处理：只读取当前阶段最相关设定，输出 5 条可立即执行的小说推进方案，不要复述长上下文。",
  },
  {
    id: "standard",
    label: "标准",
    buttonLabel: "标准生成",
    badge: "平衡质量",
    latency: "压缩上下文",
    budget: "约 1100 字上下文",
    focus: "用于日常设定、剧情规划和章节提示词生成。",
    command: "请按标准生成模式处理：压缩世界观、人物和剧情重点，给出结构完整但不冗长的下一步创作方案。",
  },
  {
    id: "deep",
    label: "深度",
    buttonLabel: "深度生成",
    badge: "优先质量",
    latency: "更多上下文",
    budget: "约 1600 字上下文",
    focus: "用于复杂伏笔、人物弧光、卷末高潮和多 Agent 接力前的深度检查。",
    command: "请按深度生成模式处理：保留更多人物动机、剧情伏笔和世界规则，先检查矛盾，再输出高质量创作方案。",
  },
];
