export type RelationshipTypePreset = {
  id: string;
  label: string;
  lineStyle: "solid" | "dashed" | "double" | "wave" | "glow";
  tone: "cyan" | "green" | "amber" | "magenta" | "violet" | "muted";
  promptHint: string;
};

export type NovelRelationshipPreset = {
  id: string;
  label: string;
  relationshipTypes: string[];
  triggers: string[];
  promptHint: string;
};

export type RelationshipLayoutPreset = {
  id: string;
  label: string;
  description: string;
};

export type RelationshipUpdateStrategyPreset = {
  id: string;
  label: string;
  description: string;
  tokenMode: "low" | "standard" | "deep";
};

export const relationshipTypePresets: RelationshipTypePreset[] = [
  { id: "trust", label: "信任", lineStyle: "solid", tone: "green", promptHint: "双方是否更愿意共享风险和资源。" },
  { id: "doubt", label: "怀疑", lineStyle: "dashed", tone: "amber", promptHint: "一方是否开始怀疑动机、身份或能力代价。" },
  { id: "alliance", label: "同盟", lineStyle: "double", tone: "green", promptHint: "是否形成可见阵营或任务绑定。" },
  { id: "trade", label: "利益交易", lineStyle: "solid", tone: "amber", promptHint: "交换了什么筹码，谁欠谁。" },
  { id: "debt", label: "债务", lineStyle: "double", tone: "amber", promptHint: "救命、资源、秘密或承诺造成的偿还压力。" },
  { id: "romance", label: "情感吸引", lineStyle: "wave", tone: "violet", promptHint: "吸引、依赖、吃醋、误会或情感阻碍。" },
  { id: "misunderstanding", label: "误会", lineStyle: "dashed", tone: "violet", promptHint: "信息缺失导致的错判，会不会在下一章爆发。" },
  { id: "protection", label: "保护", lineStyle: "solid", tone: "cyan", promptHint: "谁替谁承担了风险，是否产生依赖。" },
  { id: "control", label: "操控", lineStyle: "dashed", tone: "magenta", promptHint: "一方是否控制情报、资源或选择。" },
  { id: "use", label: "利用", lineStyle: "dashed", tone: "amber", promptHint: "合作是否只是短期工具关系。" },
  { id: "competition", label: "竞争", lineStyle: "solid", tone: "cyan", promptHint: "目标相同但资源有限，是否升级为冲突。" },
  { id: "hate", label: "仇恨", lineStyle: "double", tone: "magenta", promptHint: "公开敌意、旧仇或不可调和立场。" },
  { id: "betrayal-risk", label: "背叛风险", lineStyle: "glow", tone: "magenta", promptHint: "谁拥有背叛动机，触发条件是什么。" },
  { id: "shared-secret", label: "秘密共享", lineStyle: "dashed", tone: "violet", promptHint: "双方共享了什么秘密，暴露后影响哪条线。" },
  { id: "info-gap", label: "信息不对称", lineStyle: "dashed", tone: "cyan", promptHint: "谁知道真相，谁被误导。" },
  { id: "mentorship", label: "师承", lineStyle: "double", tone: "cyan", promptHint: "指导、考验、代价、传承或反目。" },
  { id: "blood", label: "血缘", lineStyle: "solid", tone: "magenta", promptHint: "血脉、家族、继承、隐瞒身份。" },
  { id: "faction", label: "阵营绑定", lineStyle: "double", tone: "green", promptHint: "角色是否被卷入同一阵营或组织。" },
  { id: "temporary", label: "临时合作", lineStyle: "solid", tone: "amber", promptHint: "合作结束条件和下一次变动点。" },
  { id: "complicity", label: "共犯关系", lineStyle: "glow", tone: "violet", promptHint: "一起隐瞒或犯错，后续可转化为把柄。" },
];

export const novelRelationshipPresets: NovelRelationshipPreset[] = [
  {
    id: "xuanhuan",
    label: "玄幻修仙",
    relationshipTypes: ["师承", "宗门", "血仇", "机缘", "夺宝", "道侣", "因果债"],
    triggers: ["拜师", "夺宝", "救命", "渡劫", "宗门站队", "血脉暴露"],
    promptHint: "重点追踪师承代价、宗门阵营、机缘归属和因果债。",
  },
  {
    id: "urban",
    label: "都市异能",
    relationshipTypes: ["身份隐藏", "资源交易", "组织压迫", "舆论反转", "能力代价"],
    triggers: ["暴露能力", "公开站队", "资源交换", "替对方背锅", "组织追捕"],
    promptHint: "重点追踪身份秘密、资源债务、组织压力和能力代价。",
  },
  {
    id: "mystery",
    label: "悬疑推理",
    relationshipTypes: ["嫌疑", "证词", "隐瞒", "误导", "线索共享", "真相接近度"],
    triggers: ["目击秘密", "提供线索", "拒绝帮助", "作伪证", "发现矛盾"],
    promptHint: "重点追踪谁知道什么、谁在误导、谁的嫌疑变化。",
  },
  {
    id: "political",
    label: "权谋朝堂",
    relationshipTypes: ["阵营", "把柄", "盟约", "试探", "背刺", "利益交换"],
    triggers: ["公开站队", "私下承诺", "夺走资源", "暴露把柄", "背叛阵营"],
    promptHint: "重点追踪阵营、把柄、盟约、背刺风险和利益交换。",
  },
  {
    id: "apocalypse",
    label: "末世生存",
    relationshipTypes: ["物资依赖", "队伍信任", "背叛风险", "救命债", "据点归属"],
    triggers: ["分配物资", "救命", "抛弃队友", "共同战斗", "据点迁移"],
    promptHint: "重点追踪物资债、队伍信任、据点归属和生存背叛。",
  },
  {
    id: "scifi",
    label: "科幻星际",
    relationshipTypes: ["舰队阵营", "AI 权限", "殖民冲突", "技术垄断", "身份编号"],
    triggers: ["权限转移", "技术泄露", "舰队站队", "殖民冲突", "身份篡改"],
    promptHint: "重点追踪权限、技术垄断、舰队阵营和身份系统。",
  },
  {
    id: "romance",
    label: "恋爱成长",
    relationshipTypes: ["吸引", "误会", "依赖", "吃醋", "和解", "情感阻碍"],
    triggers: ["隐瞒", "吃醋", "牺牲", "误伤", "私下承诺", "共同代价"],
    promptHint: "重点追踪情感距离、误会来源、依赖变化和和解条件。",
  },
  {
    id: "infinite",
    label: "无限流",
    relationshipTypes: ["队友信任", "任务利益", "隐藏身份", "临时背叛", "通关债务"],
    triggers: ["组队", "任务分配", "隐藏身份暴露", "临时背叛", "通关救援"],
    promptHint: "重点追踪任务绑定、临时利益、隐藏身份和通关债务。",
  },
];

export const relationshipLayoutPresets: RelationshipLayoutPreset[] = [
  { id: "protagonist", label: "主角中心图", description: "主角固定在中心，其余角色按关系强度环绕。" },
  { id: "faction", label: "阵营分组图", description: "按势力、组织、立场分区，适合权谋和群像。" },
  { id: "emotion", label: "情感关系图", description: "突出吸引、误会、依赖和情感阻碍。" },
  { id: "conflict", label: "冲突关系图", description: "只显示敌对、竞争、仇恨和背叛风险。" },
  { id: "secret", label: "秘密线索图", description: "突出隐藏关系、把柄、证词和信息不对称。" },
  { id: "chapter-focus", label: "当前章节聚焦图", description: "只显示本章出场人物和变化关系。" },
  { id: "volume", label: "第一卷关系图", description: "展示第一卷主线关系的长期变化。" },
  { id: "whole-book", label: "全书长期关系图", description: "保留全书级人物关系，不因单章事件频繁改动。" },
  { id: "villain", label: "反派势力图", description: "从反派和旧秩序视角查看压迫链条。" },
  { id: "supporting", label: "配角功能图", description: "按导师、资源、线索、阻碍、情感功能归类配角。" },
];

export const relationshipUpdateStrategyPresets: RelationshipUpdateStrategyPreset[] = [
  { id: "conservative", label: "保守更新", description: "只改文本明确写出的关系。", tokenMode: "low" },
  { id: "standard", label: "标准更新", description: "根据人物行为推断轻微变化。", tokenMode: "standard" },
  { id: "aggressive", label: "激进更新", description: "主动推断隐藏关系、背叛风险和后续钩子。", tokenMode: "deep" },
  { id: "chapter", label: "当前章更新", description: "只读取本章摘要、出场人物和关键事件。", tokenMode: "low" },
  { id: "recent", label: "最近三章更新", description: "结合短期上下文，适合连续冲突。", tokenMode: "standard" },
  { id: "global", label: "全局设定更新", description: "允许影响长期人物线和全书关系。", tokenMode: "deep" },
  { id: "low-token", label: "低 token 更新", description: "只传人物名、事件、已有关系 id 和变化类型。", tokenMode: "low" },
  { id: "recap", label: "精准复盘更新", description: "传本章摘要和关键对话，生成更细关系变化。", tokenMode: "deep" },
];

export const relationshipEventPresets = [
  "救命",
  "隐瞒",
  "欺骗",
  "牺牲",
  "交易",
  "共同战斗",
  "公开站队",
  "私下承诺",
  "利益冲突",
  "被迫合作",
  "误伤",
  "目击秘密",
  "暴露能力",
  "替对方背锅",
  "夺走资源",
  "提供线索",
  "拒绝帮助",
  "背叛阵营",
];

export const relationshipLineStylePresets = [
  "实线：公开稳定关系",
  "虚线：隐藏关系",
  "双线：强绑定关系",
  "波浪线：暧昧/不稳定关系",
  "红线：冲突/敌对",
  "绿线：同盟/信任",
  "黄线：利益/债务",
  "紫线：秘密/操控",
  "灰线：已弱化/冷却",
  "发光线：当前章节重点关系",
];
