/**
 * 场景检测和自动提示词切换系统
 * 根据用户输入自动识别写作场景，推荐最合适的提示词模板
 */

import type { PromptTemplate } from "../types/prompts";

export type WritingScene =
  | "opening"          // 开场写作
  | "climax"           // 高潮冲突
  | "character"        // 人物塑造
  | "dialogue"         // 对话场景
  | "scene"            // 场景描写
  | "continue"         // 章节续写
  | "outline"          // 大纲规划
  | "worldbuilding"    // 世界观构建
  | "transition"       // 转折情节
  | "ending"           // 结尾收束
  | "unknown";         // 未识别

export type SceneKeywords = {
  scene: WritingScene;
  keywords: string[];
  description: string;
  recommendedPrompts: string[]; // 推荐的提示词模板ID
};

/**
 * 场景关键词映射表
 */
export const SCENE_KEYWORDS: SceneKeywords[] = [
  {
    scene: "opening",
    keywords: ["开场", "开头", "第一章", "开篇", "序幕", "引子", "开局"],
    description: "故事开场",
    recommendedPrompts: ["opening-hook-001", "opening-action-001"],
  },
  {
    scene: "climax",
    keywords: ["高潮", "冲突", "爆发", "对决", "决战", "交锋", "矛盾"],
    description: "高潮冲突",
    recommendedPrompts: ["climax-conflict-001", "climax-revelation-001"],
  },
  {
    scene: "character",
    keywords: ["人物", "角色", "性格", "出场", "登场", "介绍", "塑造", "刻画"],
    description: "人物塑造",
    recommendedPrompts: ["character-intro-001", "character-development-001"],
  },
  {
    scene: "dialogue",
    keywords: ["对话", "谈话", "交流", "对白", "说话", "聊天", "对峙"],
    description: "对话场景",
    recommendedPrompts: ["dialogue-conflict-001"],
  },
  {
    scene: "scene",
    keywords: ["场景", "环境", "氛围", "景色", "描写", "背景", "画面"],
    description: "场景描写",
    recommendedPrompts: ["scene-atmosphere-001"],
  },
  {
    scene: "continue",
    keywords: ["续写", "继续", "接下来", "然后", "下文", "接着"],
    description: "章节续写",
    recommendedPrompts: [],
  },
  {
    scene: "outline",
    keywords: ["大纲", "规划", "结构", "框架", "设计", "布局", "章节"],
    description: "大纲规划",
    recommendedPrompts: ["outline-chapter-001"],
  },
  {
    scene: "worldbuilding",
    keywords: ["世界观", "设定", "体系", "规则", "背景", "世界", "宇宙"],
    description: "世界观构建",
    recommendedPrompts: ["worldbuild-system-001"],
  },
  {
    scene: "transition",
    keywords: ["转折", "意外", "反转", "变化", "突变", "逆转"],
    description: "转折情节",
    recommendedPrompts: ["transition-twist-001"],
  },
  {
    scene: "ending",
    keywords: ["结尾", "收尾", "结束", "完结", "尾声", "落幕"],
    description: "结尾收束",
    recommendedPrompts: ["ending-cliffhanger-001"],
  },
];

/**
 * 检测用户输入的写作场景
 */
export function detectWritingScene(userInput: string): WritingScene {
  const input = userInput.toLowerCase();

  for (const sceneData of SCENE_KEYWORDS) {
    for (const keyword of sceneData.keywords) {
      if (input.includes(keyword)) {
        return sceneData.scene;
      }
    }
  }

  return "unknown";
}

/**
 * 获取场景推荐的提示词
 */
export function getRecommendedPrompts(
  scene: WritingScene,
  allTemplates: PromptTemplate[]
): PromptTemplate[] {
  const sceneData = SCENE_KEYWORDS.find((s) => s.scene === scene);
  if (!sceneData) return [];

  return allTemplates.filter((template) =>
    sceneData.recommendedPrompts.includes(template.id)
  );
}

/**
 * 智能推荐：综合场景、用户历史、收藏等因素
 */
export function getSmartRecommendations(
  userInput: string,
  allTemplates: PromptTemplate[]
): {
  scene: WritingScene;
  sceneDescription: string;
  recommendedTemplates: PromptTemplate[];
  mostUsedTemplate: PromptTemplate | null;
  favoriteTemplates: PromptTemplate[];
} {
  const scene = detectWritingScene(userInput);
  const sceneData = SCENE_KEYWORDS.find((s) => s.scene === scene);
  const recommendedTemplates = getRecommendedPrompts(scene, allTemplates);

  // 获取使用最多的模板
  const sortedByUsage = [...allTemplates].sort(
    (a, b) => b.usageCount - a.usageCount
  );
  const mostUsedTemplate = sortedByUsage[0] || null;

  // 获取收藏的模板
  const favoriteTemplates = allTemplates.filter((t) => t.favorite);

  return {
    scene,
    sceneDescription: sceneData?.description || "未识别场景",
    recommendedTemplates,
    mostUsedTemplate,
    favoriteTemplates,
  };
}

/**
 * 生成场景上下文提示
 */
export function generateSceneContext(scene: WritingScene): string {
  const contextMap: Record<WritingScene, string> = {
    opening: `
<context_tips>
开场写作要点：
- 快速进入场景，避免大段背景介绍
- 用动作或对话开场
- 暗示核心冲突
- 制造悬念或提出问题
- 字数控制在800-1200字
</context_tips>`,
    climax: `
<context_tips>
高潮写作要点：
- 情绪饱满，节奏快速
- 对话和动作结合
- 推向情绪顶点
- 留有余韵
- 字数控制在600-1000字
</context_tips>`,
    character: `
<context_tips>
人物塑造要点：
- 通过行动展现性格
- 给角色独特的语言风格
- 设计标志性细节
- 明确角色的欲望和恐惧
</context_tips>`,
    dialogue: `
<context_tips>
对话写作要点：
- 符合角色性格
- 用语气、用词展现情绪
- 穿插动作和神态描写
- 对话要有张力和潜台词
</context_tips>`,
    scene: `
<context_tips>
场景描写要点：
- 调动多种感官
- 环境与情绪呼应
- 避免大段静态堆砌
- 字数控制在200-400字
</context_tips>`,
    continue: `
<context_tips>
续写要点：
- 承接前文，保持连贯
- 推进情节，不要原地踏步
- 保持人物性格一致
- 为下文埋设伏笔
</context_tips>`,
    outline: `
<context_tips>
大纲规划要点：
- 明确起承转合
- 每章都要有推进
- 设计冲突和解决
- 埋设伏笔，留下悬念
</context_tips>`,
    worldbuilding: `
<context_tips>
世界观构建要点：
- 逻辑自洽，规则清晰
- 有层次和进阶
- 与故事冲突相关
- 留有扩展空间
</context_tips>`,
    transition: `
<context_tips>
转折写作要点：
- 转折要合理但出人意料
- 有充分的铺垫和伏笔
- 改变故事走向
- 引发新的问题
</context_tips>`,
    ending: `
<context_tips>
结尾写作要点：
- 在关键时刻戛然而止
- 制造期待和好奇
- 暗示新的冲突或问题
- 避免强行制造悬念
</context_tips>`,
    unknown: "",
  };

  return contextMap[scene] || "";
}
