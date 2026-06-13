import type { PromptTemplate } from "../types/prompts";

/**
 * 默认提示词模板库
 * 参考来源：
 * - AI-automatically-generates-novels
 * - story-skills
 * - Claude AI最佳实践
 */

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  // ===== 开场类 =====
  {
    id: "opening-hook-001",
    category: "opening",
    title: "悬念式开场",
    description: "制造悬念，吸引读者好奇心",
    content: `请为我的小说写一个悬念式开场段落。

<context>
故事类型：{{故事类型}}
主角：{{主角名}}
核心冲突：{{核心冲突}}
</context>

<requirements>
- 开篇即制造悬念或提出问题
- 避免大段背景介绍
- 用动作或对话开场
- 暗示即将发生的重大事件
- 字数控制在300-500字
</requirements>

请直接输出开场段落，不要解释。`,
    variables: ["故事类型", "主角名", "核心冲突"],
    tags: ["开场", "悬念", "吸引力"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "opening-action-001",
    category: "opening",
    title: "动作式开场",
    description: "以激烈动作或冲突开始",
    content: `请为我的小说写一个动作式开场段落。

<context>
场景：{{场景}}
主角：{{主角名}}
正在发生：{{事件}}
</context>

<requirements>
- 直接进入动作场景
- 快节奏，紧张感
- 展现主角的能力或性格
- 让读者立即代入
- 字数控制在400-600字
</requirements>`,
    variables: ["场景", "主角名", "事件"],
    tags: ["开场", "动作", "节奏"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 高潮类 =====
  {
    id: "climax-conflict-001",
    category: "climax",
    title: "冲突爆发",
    description: "矛盾激化，情绪推向顶点",
    content: `请为我的小说写一个冲突爆发的高潮段落。

<context>
冲突双方：{{角色A}} vs {{角色B}}
冲突原因：{{原因}}
场景：{{场景}}
</context>

<requirements>
- 矛盾全面爆发
- 情绪激烈，节奏快速
- 对话和动作结合
- 展现角色性格
- 留有余韵，不要写完
- 字数控制在600-800字
</requirements>`,
    variables: ["角色A", "角色B", "原因", "场景"],
    tags: ["高潮", "冲突", "情绪"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "climax-revelation-001",
    category: "climax",
    title: "真相揭示",
    description: "重大秘密或真相被揭露",
    content: `请为我的小说写一个真相揭示的高潮段落。

<context>
真相内容：{{真相}}
揭示者：{{角色}}
在场人物：{{人物列表}}
</context>

<requirements>
- 真相揭示要有震撼力
- 描写在场人物的反应
- 展现情绪冲击
- 可以有回忆闪回
- 字数控制在500-700字
</requirements>`,
    variables: ["真相", "角色", "人物列表"],
    tags: ["高潮", "真相", "震撼"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 转折类 =====
  {
    id: "transition-twist-001",
    category: "transition",
    title: "意外转折",
    description: "出乎意料的情节转折",
    content: `请为我的小说写一个意外转折段落。

<context>
当前情况：{{当前情况}}
转折点：{{转折内容}}
影响：{{影响}}
</context>

<requirements>
- 转折要合理但出人意料
- 有充分的铺垫和伏笔
- 改变故事走向
- 引发新的问题
- 字数控制在400-600字
</requirements>`,
    variables: ["当前情况", "转折内容", "影响"],
    tags: ["转折", "意外", "伏笔"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 人物类 =====
  {
    id: "character-intro-001",
    category: "character",
    title: "人物初登场",
    description: "新角色的精彩出场",
    content: `请为我的小说写一个人物初登场的段落。

<context>
角色名：{{角色名}}
角色定位：{{定位}}（主角/配角/反派）
性格特点：{{性格}}
出场场景：{{场景}}
</context>

<requirements>
- 通过动作、对话、环境展现性格
- 留下深刻印象
- 避免直接描述性格
- 展现角色的独特之处
- 字数控制在300-500字
</requirements>`,
    variables: ["角色名", "定位", "性格", "场景"],
    tags: ["人物", "出场", "性格"],
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
  {
    id: "character-development-001",
    category: "character",
    title: "人物成长时刻",
    description: "角色的心理变化和成长",
    content: `请为我的小说写一个人物成长时刻。

<context>
角色：{{角色名}}
成长契机：{{事件}}
内心变化：{{变化}}
</context>

<requirements>
- 展现内心挣扎和思考
- 通过行动体现成长
- 前后对比明显
- 情感真实细腻
- 字数控制在400-600字
</requirements>`,
    variables: ["角色名", "事件", "变化"],
    tags: ["人物", "成长", "内心"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 场景类 =====
  {
    id: "scene-atmosphere-001",
    category: "scene",
    title: "氛围营造",
    description: "营造特定氛围和环境",
    content: `请为我的小说写一个氛围营造的场景描写。

<context>
场景：{{场景}}
氛围：{{氛围}}（紧张/温馨/诡异/壮丽等）
时间：{{时间}}
</context>

<requirements>
- 调动多种感官（视觉、听觉、嗅觉等）
- 环境与情节呼应
- 营造情绪基调
- 避免大段静态描写
- 字数控制在200-400字
</requirements>`,
    variables: ["场景", "氛围", "时间"],
    tags: ["场景", "氛围", "环境"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 对话类 =====
  {
    id: "dialogue-conflict-001",
    category: "dialogue",
    title: "冲突对话",
    description: "角色之间的激烈对话",
    content: `请为我的小说写一段冲突对话。

<context>
对话双方：{{角色A}} vs {{角色B}}
冲突点：{{冲突}}
场景：{{场景}}
</context>

<requirements>
- 对话要符合角色性格
- 有明显的语气和情绪
- 避免说教式对白
- 推进情节发展
- 包含动作和神态描写
- 字数控制在400-600字
</requirements>`,
    variables: ["角色A", "角色B", "冲突", "场景"],
    tags: ["对话", "冲突", "情绪"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 描写类 =====
  {
    id: "description-detail-001",
    category: "description",
    title: "细节描写",
    description: "精细的细节刻画",
    content: `请为我的小说写一段细节描写。

<context>
描写对象：{{对象}}
重点：{{重点}}
作用：{{作用}}
</context>

<requirements>
- 细节要有意义，推进情节
- 避免无关描写
- 调动多种感官
- 展现人物情绪或性格
- 字数控制在200-300字
</requirements>`,
    variables: ["对象", "重点", "作用"],
    tags: ["描写", "细节", "感官"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 结尾类 =====
  {
    id: "ending-cliffhanger-001",
    category: "ending",
    title: "悬念式结尾",
    description: "留下悬念，引人期待",
    content: `请为我的小说章节写一个悬念式结尾。

<context>
本章主要情节：{{情节}}
悬念点：{{悬念}}
下章预告：{{预告}}
</context>

<requirements>
- 在关键时刻戛然而止
- 制造期待和好奇
- 暗示新的冲突或问题
- 避免强行制造悬念
- 字数控制在200-300字
</requirements>`,
    variables: ["情节", "悬念", "预告"],
    tags: ["结尾", "悬念", "期待"],
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 大纲类 =====
  {
    id: "outline-chapter-001",
    category: "outline",
    title: "章节大纲生成",
    description: "生成单章详细大纲",
    content: `请为我的小说生成一个章节大纲。

<context>
故事阶段：{{阶段}}
本章目标：{{目标}}
涉及角色：{{角色}}
</context>

<requirements>
- 明确起承转合结构
- 列出关键情节点
- 包含冲突和解决
- 角色行动和动机
- 埋设伏笔
输出格式：
1. 开场（场景、人物、状态）
2. 发展（事件、冲突）
3. 高潮（矛盾爆发）
4. 结尾（结果、悬念）
</requirements>`,
    variables: ["阶段", "目标", "角色"],
    tags: ["大纲", "结构", "规划"],
    favorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },

  // ===== 世界观类 =====
  {
    id: "worldbuild-system-001",
    category: "worldbuild",
    title: "设定体系构建",
    description: "构建完整的设定体系",
    content: `请帮我构建一个设定体系。

<context>
设定类型：{{类型}}（修炼体系/魔法体系/科技体系等）
核心概念：{{概念}}
特点：{{特点}}
</context>

<requirements>
- 逻辑自洽，规则清晰
- 有层次和进阶
- 与故事冲突相关
- 易于理解和记忆
- 留有扩展空间
输出格式：
1. 核心规则
2. 等级划分
3. 代价和限制
4. 特殊能力
5. 与情节关联
</requirements>`,
    variables: ["类型", "概念", "特点"],
    tags: ["世界观", "体系", "设定"],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  },
];
