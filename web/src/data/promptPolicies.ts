import type { PromptPolicy, StageId } from "../api/types";

const shared = {
  context_budget_chars: 1100,
  chat_budget_chars: 900,
  cost_guard: {
    api_chat_token_limit: 1200,
    fast_context_sections: 2,
    duplicate_cache_ttl_seconds: 12,
  },
  context_layers: [
    { id: "stable_rules", label: "固定规则", reason: "稳定前缀，可复用缓存" },
    { id: "project_memory", label: "项目记忆", reason: "作品定位、世界规则、长期设定" },
    { id: "character_memory", label: "角色记忆", reason: "人物弧光、关系状态、动机约束" },
    { id: "plot_memory", label: "剧情记忆", reason: "主线、转折、伏笔和章节目标" },
    { id: "draft_memory", label: "章节草稿", reason: "已有正文和场景承接" },
    { id: "instant_instruction", label: "即时指令", reason: "本次用户输入" },
  ],
};

export const promptPolicies: Record<StageId, PromptPolicy> = {
  cover: {
    ...shared,
    stage: "cover",
    label: "封面信息",
    priority_sections: ["cover"],
    outputs: ["书名候选", "一句话卖点", "类型定位", "封面简介"],
  },
  worldbuilding: {
    ...shared,
    stage: "worldbuilding",
    label: "世界观构建",
    priority_sections: ["cover", "worldbuilding", "characters"],
    outputs: ["力量体系", "势力版图", "世界规则", "隐藏真相"],
  },
  characters: {
    ...shared,
    stage: "characters",
    label: "人物设计",
    priority_sections: ["worldbuilding", "cover", "characters", "plot"],
    outputs: ["主角档案", "反派动机", "关键关系", "人物弧光"],
  },
  plot: {
    ...shared,
    stage: "plot",
    label: "剧情大纲",
    priority_sections: ["worldbuilding", "characters", "cover", "plot"],
    outputs: ["三幕结构", "第一卷计划", "关键转折", "伏笔回收表"],
  },
  chapters: {
    ...shared,
    stage: "chapters",
    label: "章节写作",
    priority_sections: ["plot", "characters", "worldbuilding", "chapters", "cover"],
    outputs: ["章节目标", "场景节拍", "正文草稿", "章末钩子"],
  },
};
