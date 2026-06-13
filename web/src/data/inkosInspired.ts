export type InkOSPipelineStage = {
  id: string;
  label: string;
  agent: string;
  phase: string;
  role: string;
  tokenPolicy: string;
};

export type InkOSTruthFile = {
  id: string;
  label: string;
  owner: string;
  purpose: string;
  tokenPolicy: string;
};

export type InkOSReviewGate = {
  label: string;
  purpose: string;
  passSignal: string;
};

export type InkOSModelRoute = {
  agent: string;
  modelTier: string;
  reason: string;
};

export const inkosPipelineStages: InkOSPipelineStage[] = [
  {
    id: "radar",
    label: "Radar",
    agent: "题材雷达",
    phase: "侦测",
    role: "扫描题材卖点、读者预期和冲突入口。",
    tokenPolicy: "只返回 3 条可用信号。",
  },
  {
    id: "planner",
    label: "Planner",
    agent: "章节规划师",
    phase: "意图",
    role: "生成下一章目标、钩子议程和回收点。",
    tokenPolicy: "读取当前焦点和少量前情摘要。",
  },
  {
    id: "composer",
    label: "Composer",
    agent: "上下文编译器",
    phase: "打包",
    role: "挑选本章真正需要的设定、人物和伏笔。",
    tokenPolicy: "按相关性裁剪上下文。",
  },
  {
    id: "architect",
    label: "Architect",
    agent: "剧情架构师",
    phase: "结构",
    role: "把章意图拆成场景节拍、转折和悬念。",
    tokenPolicy: "输出结构，不写长正文。",
  },
  {
    id: "writer",
    label: "Writer",
    agent: "正文写手",
    phase: "创作",
    role: "按节拍写正文，控制第一屏吸引力和段落节奏。",
    tokenPolicy: "使用高质量模式，但只吃压缩包。",
  },
  {
    id: "observer",
    label: "Observer",
    agent: "事实观察员",
    phase: "结算",
    role: "抽取新事实、关系变化、资源变化和伏笔状态。",
    tokenPolicy: "只看本章结果和必要设定。",
  },
  {
    id: "reflector",
    label: "Reflector",
    agent: "状态结算员",
    phase: "结算",
    role: "把观察结果变成结构化增量，避免重写全量设定。",
    tokenPolicy: "提交 JSON delta。",
  },
  {
    id: "normalizer",
    label: "Normalizer",
    agent: "长度归一器",
    phase: "修整",
    role: "修正过长、过短、节奏松散的问题。",
    tokenPolicy: "只处理长度和节奏指标。",
  },
  {
    id: "auditor",
    label: "Auditor",
    agent: "连续性审计员",
    phase: "审核",
    role: "做 33维审计，检查设定、钩子、人物动机和爽点。",
    tokenPolicy: "优先低成本模型，返回问题列表。",
  },
  {
    id: "reviser",
    label: "Reviser",
    agent: "定向修订员",
    phase: "返修",
    role: "只修关键问题，不整章重写。",
    tokenPolicy: "按 issue 精修片段。",
  },
];

export const inkosTruthFiles: InkOSTruthFile[] = [
  {
    id: "world_state",
    label: "世界状态",
    owner: "世界观设计师",
    purpose: "记录规则、禁区、势力、代价和不可逆事件。",
    tokenPolicy: "只召回本章相关规则。",
  },
  {
    id: "character_matrix",
    label: "人物矩阵",
    owner: "角色导演",
    purpose: "维护目标、秘密、关系强度、信任变化和当前立场。",
    tokenPolicy: "只传当前出场人物。",
  },
  {
    id: "resource_ledger",
    label: "资源账本",
    owner: "连续性审计员",
    purpose: "追踪金钱、道具、伤势、能力冷却和欠债。",
    tokenPolicy: "只传会影响场景选择的资源。",
  },
  {
    id: "chapter_summaries",
    label: "章节摘要",
    owner: "上下文编译器",
    purpose: "把历史章节压成因果摘要，支撑长篇续写。",
    tokenPolicy: "近期详细，远期压缩。",
  },
  {
    id: "subplot_board",
    label: "支线板",
    owner: "剧情架构师",
    purpose: "记录每条支线的当前状态、下一次推进和回收窗口。",
    tokenPolicy: "只召回相关支线。",
  },
  {
    id: "emotional_arcs",
    label: "情绪弧",
    owner: "角色导演",
    purpose: "追踪人物情绪、误会、亲密度和爆发阈值。",
    tokenPolicy: "只传变化原因和下一步倾向。",
  },
  {
    id: "pending_hooks",
    label: "待回收伏笔",
    owner: "悬念编辑",
    purpose: "管理 upsert、mention、resolve、defer 四类伏笔动作。",
    tokenPolicy: "按本章钩子议程召回。",
  },
];

export const inkosReviewGates: InkOSReviewGate[] = [
  {
    label: "草稿门",
    purpose: "确认本章是否完成章意图、场景节拍和第一屏吸引力。",
    passSignal: "可以进入事实观察。",
  },
  {
    label: "审计门",
    purpose: "用 33维审计压住设定漏洞、动机断裂、伏笔遗失和节奏塌陷。",
    passSignal: "只把关键问题交给修订。",
  },
  {
    label: "人工门",
    purpose: "用户批准后再写入正式稿，避免自动覆盖已有内容。",
    passSignal: "允许同步到 WPS。",
  },
];

export const inkosModelRoutes: InkOSModelRoute[] = [
  {
    agent: "Writer",
    modelTier: "高质量",
    reason: "正文质量最敏感，只吃压缩上下文来控费。",
  },
  {
    agent: "Auditor",
    modelTier: "快速 / 低成本",
    reason: "输出问题列表即可，适合便宜模型重复检查。",
  },
  {
    agent: "Radar",
    modelTier: "快速",
    reason: "只要题材信号和卖点，不需要长推理。",
  },
  {
    agent: "Reviser",
    modelTier: "均衡",
    reason: "按问题修片段，减少整章二次生成。",
  },
];
