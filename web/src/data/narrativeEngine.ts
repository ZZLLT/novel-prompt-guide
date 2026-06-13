export type NarrativeEngineCard = {
  label: string;
  title: string;
  detail: string;
  tokenPolicy: string;
};

export const narrativeStateCards: NarrativeEngineCard[] = [
  {
    label: "状态机",
    title: "叙事状态快照",
    detail: "把 Story Bible、人物档案、地点、世界规则、章级摘要链、事件流和伏笔状态合成一份当前快照。",
    tokenPolicy: "生成前只装配当前章节需要的快照切片，不把整本设定反复提交。",
  },
  {
    label: "摘要链",
    title: "章级摘要链",
    detail: "每章完成后沉淀短摘要、状态变化、关系变化和未解决问题，作为跨章记忆骨架。",
    tokenPolicy: "保留上一章结果和最近关键摘要，旧章节只按查询召回。",
  },
  {
    label: "事件流",
    title: "叙事事件流",
    detail: "记录谁在何时做了什么、造成什么后果，并把因果边挂到人物关系和伏笔账本上。",
    tokenPolicy: "只提交本章新增事件 delta，让 AI 判断因果是否断裂。",
  },
];

export const narrativeDagCards: NarrativeEngineCard[] = [
  {
    label: "DAG",
    title: "故事线 DAG",
    detail: "把主线、支线、人物弧光和伏笔线拆成可汇合的节点，避免长篇推进时只靠线性大纲。",
    tokenPolicy: "规划时只传相关分支和汇合节点，减少无关支线消耗。",
  },
  {
    label: "守护",
    title: "人工审核门",
    detail: "章节生成后先停在审核节点，确认是否继续、重写、补设定或回滚到上一检查点。",
    tokenPolicy: "审核输出问题清单和决策建议，不直接重写全文。",
  },
  {
    label: "恢复",
    title: "检查点快照",
    detail: "每次推进重要阶段前保存快照：当前目标、人物状态、伏笔债务、质量分和下一章约束。",
    tokenPolicy: "只存结构化状态摘要，避免把大段正文塞进长期记忆。",
  },
];

export const narrativeGovernanceCards: NarrativeEngineCard[] = [
  {
    label: "伏笔",
    title: "伏笔注册表",
    detail: "追踪埋设、误导、延期、苏醒、回收和过期风险，让每个钩子都有偿还计划。",
    tokenPolicy: "只提交未回收伏笔和本章触发项，禁止全量伏笔表自动上送。",
  },
  {
    label: "质量",
    title: "质量治理闭环",
    detail: "把人物一致性、节奏、文风漂移、信息顺序和伏笔闭合率拆成独立审查维度。",
    tokenPolicy: "低成本模型先出诊断，高质量模型只处理必要改写。",
  },
  {
    label: "张力",
    title: "张力心电图",
    detail: "为章节维护张力评分、低谷诊断和下一章提升建议，避免连续章节没有推进感。",
    tokenPolicy: "只提交章节摘要和节拍，不提交完整正文。",
  },
];

export const narrativeEnginePipeline = [
  "宏观规划",
  "幕级节拍",
  "章节执行剧本",
  "上下文装配",
  "LLM 生成",
  "质量审查",
  "章末状态沉淀",
  "人工审核门",
];
