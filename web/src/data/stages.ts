import type { StageId } from "../api/types";

export type StageField = {
  id: string;
  label: string;
  hint: string;
  multiline?: boolean;
};

export type StageConfig = {
  id: StageId;
  label: string;
  callsign: string;
  summary: string;
  fields: StageField[];
  quickCommands: string[];
};

export const stageOrder: StageId[] = ["cover", "worldbuilding", "characters", "plot", "chapters"];

export const stages: Record<StageId, StageConfig> = {
  cover: {
    id: "cover",
    label: "封面信息",
    callsign: "初设",
    summary: "锁定作品名、类型、风格与核心创意。",
    fields: [
      { id: "title", label: "作品名称", hint: "你的小说叫什么" },
      { id: "genre", label: "类型频段", hint: "玄幻 / 科幻 / 都市异能 / 悬疑..." },
      { id: "style", label: "文风参数", hint: "爽文快节奏 / 慢热铺陈 / 硬核设定..." },
      { id: "concept", label: "核心创意", hint: "一句话说明最吸引人的设定", multiline: true },
    ],
    quickCommands: ["提炼一句话卖点", "生成封面简介", "匹配网文类型"],
  },
  worldbuilding: {
    id: "worldbuilding",
    label: "世界观构建",
    callsign: "世界",
    summary: "建立力量体系、世界规则、势力版图与隐藏真相。",
    fields: [
      { id: "world_type", label: "世界类型", hint: "现代都市+异能？末日废土？架空王朝？" },
      { id: "era", label: "时代背景", hint: "灵气复苏第三年、星历 404 年..." },
      { id: "scale", label: "世界规模", hint: "一座城市、一片大陆、多个位面" },
      { id: "conflict", label: "核心冲突", hint: "世界面临的根本矛盾", multiline: true },
      { id: "power_source", label: "力量来源", hint: "力量从何而来，如何升级，有何代价", multiline: true },
      { id: "rules", label: "独特规则", hint: "1-2 条能持续制造剧情的规则", multiline: true },
    ],
    quickCommands: ["设计力量体系", "扩展势力版图", "检查世界规则"],
  },
  characters: {
    id: "characters",
    label: "人物设计",
    callsign: "人物",
    summary: "塑造主角、反派、配角关系和成长弧线。",
    fields: [
      { id: "name", label: "主角代号", hint: "姓名和含义" },
      { id: "profile", label: "基本档案", hint: "年龄、外貌标志、身份标签", multiline: true },
      { id: "background", label: "身份背景", hint: "出身与三个关键事件", multiline: true },
      { id: "personality", label: "性格矩阵", hint: "优点、缺陷、习惯、口头禅", multiline: true },
      { id: "ability", label: "金手指协议", hint: "能力机制、限制、代价、成长路径", multiline: true },
      { id: "arc", label: "人物弧光", hint: "开篇状态 -> 中期变化 -> 结局形态", multiline: true },
    ],
    quickCommands: ["设计主角档案", "生成反派动机", "检查人物弧光"],
  },
  plot: {
    id: "plot",
    label: "剧情大纲",
    callsign: "剧情",
    summary: "组织三幕结构、分卷目标、爽点分布与伏笔回收。",
    fields: [
      { id: "oneliner", label: "一句话梗概", hint: "这是一个关于___的故事", multiline: true },
      { id: "act1", label: "第一幕", hint: "初始状态、触发事件、第一转折", multiline: true },
      { id: "act2", label: "第二幕", hint: "对抗升级、中点、最低谷", multiline: true },
      { id: "act3", label: "第三幕", hint: "最终对决、高潮、结局", multiline: true },
      { id: "twists", label: "关键转折", hint: "5 个意外但合理的转折", multiline: true },
      { id: "volume1", label: "第一卷计划", hint: "卷名、目标、事件、卷末钩子", multiline: true },
    ],
    quickCommands: ["展开三幕结构", "设计卷末钩子", "规划爽点节奏"],
  },
  chapters: {
    id: "chapters",
    label: "章节写作",
    callsign: "写作",
    summary: "把设定转化为章节目标、核心看点、正文草稿和章末钩子。",
    fields: [
      { id: "ch_title", label: "章节标题", hint: "第 1 章：..." },
      { id: "ch_goal", label: "本章目标", hint: "这一章要完成什么" },
      { id: "highlights", label: "核心看点", hint: "最精彩或最重要的部分", multiline: true },
      { id: "characters", label: "出场角色", hint: "本章登场角色与关系变化", multiline: true },
      { id: "hook", label: "章末钩子", hint: "如何让读者想看下一章", multiline: true },
      { id: "content", label: "正文草稿", hint: "在此书写或粘贴章节正文", multiline: true },
    ],
    quickCommands: ["写第一章正文", "续写下一章", "强化章末钩子"],
  },
};
