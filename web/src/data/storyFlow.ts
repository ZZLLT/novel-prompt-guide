export type FlowStage = {
  id: string;
  label: string;
  summary: string;
};

export type StoryActor = {
  id: string;
  name: string;
  role: string;
  lane: "lead" | "ally" | "force" | "shadow";
};

export type RelationshipEdge = {
  id: string;
  from: string;
  to: string;
  status: string;
  strength: number;
  firstSeen: string;
  pathD: string;
  guide: string;
  cause: string;
  nextShift: string;
  evolution: string;
  tone: "cyan" | "amber" | "magenta";
};

export type FlowSignal = {
  label: "因果链" | "回收点" | "下一章落点";
  value: string;
};

export type SceneCard = {
  id: string;
  title: string;
  plotLine: string;
  goal: string;
  conflict: string;
  hook: string;
  relationEdgeId: string;
};

export type RelationshipTimelineItem = {
  id: string;
  sceneTitle: string;
  plotLine: string;
  edgeId: string;
  relation: string;
  status: string;
  cause: string;
  nextShift: string;
  tone: RelationshipEdge["tone"];
};

export const flowSignals: FlowSignal[] = [
  {
    label: "因果链",
    value: "能力曝光 -> 关系试探 -> 公开失败 -> 阵营选择",
  },
  {
    label: "回收点",
    value: "禁区资源、导师代价、女主怀疑需要在第三章前各回收一次。",
  },
  {
    label: "下一章落点",
    value: "让主角用一次错误选择换取女主短暂信任，同时触发反派围猎。",
  },
];

export const flowStages: FlowStage[] = [
  {
    id: "seed",
    label: "设定种子",
    summary: "把世界规则、主角缺口和核心矛盾压成可复用记忆。",
  },
  {
    id: "turn",
    label: "关系转折",
    summary: "每个事件都必须改变至少一组人物关系或势力态度。",
  },
  {
    id: "draft",
    label: "章节落点",
    summary: "用关系变化反推场景目标、爽点和章末钩子。",
  },
];

export const storyActors: StoryActor[] = [
  {
    id: "hero",
    name: "主角",
    role: "目标 / 缺口 / 行动力",
    lane: "lead",
  },
  {
    id: "heroine",
    name: "女主",
    role: "价值观镜像 / 情感拉力",
    lane: "ally",
  },
  {
    id: "rival",
    name: "反派",
    role: "外部压力 / 旧秩序代言",
    lane: "shadow",
  },
  {
    id: "mentor",
    name: "导师",
    role: "信息门槛 / 代价提示",
    lane: "force",
  },
];

export const relationshipEdges: RelationshipEdge[] = [
  {
    id: "hero-heroine",
    from: "主角",
    to: "女主",
    status: "互相试探",
    strength: 64,
    firstSeen: "第1章",
    pathD: "M106 62 C232 18 392 18 610 64",
    guide: "主角为了证明新规则可行，必须借女主的资源进入禁区。",
    cause: "双方目标一致但信任不足，女主怀疑主角隐瞒金手指代价。",
    nextShift: "从合作变成互相背书，随后因一次选择产生信任裂缝。",
    evolution: "互不信任 -> 临时合作 -> 互相背书",
    tone: "cyan",
  },
  {
    id: "hero-rival",
    from: "主角",
    to: "反派",
    status: "明暗对抗",
    strength: 82,
    firstSeen: "第2章",
    pathD: "M112 140 C255 202 430 202 620 142",
    guide: "反派制造一次公开失败，迫使主角暴露能力边界。",
    cause: "主角触碰旧秩序利益，反派需要证明他只是偶然变量。",
    nextShift: "对抗升级为围猎，主角必须争取导师和女主的双线支持。",
    evolution: "被忽视 -> 被试探 -> 公开围猎",
    tone: "magenta",
  },
  {
    id: "mentor-hero",
    from: "导师",
    to: "主角",
    status: "带条件扶持",
    strength: 57,
    firstSeen: "第1章",
    pathD: "M620 194 C480 158 300 154 116 106",
    guide: "导师给出线索，但要求主角先承担一次不可逆代价。",
    cause: "导师知道隐藏真相，却不能直接破坏势力平衡。",
    nextShift: "导师由旁观者转为担保人，同时埋下背叛误会。",
    evolution: "旁观考验 -> 条件扶持 -> 风险担保",
    tone: "amber",
  },
];

export const sceneCards: SceneCard[] = [
  {
    id: "s01",
    title: "S01 禁区入口",
    plotLine: "主线 / 关系线",
    goal: "主角借女主资源进入禁区，证明新规则可行。",
    conflict: "女主愿意合作，却要求主角先交代能力代价。",
    hook: "禁区门开启后，反派提前布下公开失败局。",
    relationEdgeId: "hero-heroine",
  },
  {
    id: "s02",
    title: "S02 公开失败",
    plotLine: "主线 / 反派线",
    goal: "让主角第一次暴露能力边界。",
    conflict: "反派把试探伪装成规则审核，逼导师表态。",
    hook: "导师承认线索有效，但代价不可逆。",
    relationEdgeId: "hero-rival",
  },
  {
    id: "s03",
    title: "S03 条件担保",
    plotLine: "导师线 / 伏笔线",
    goal: "导师从旁观者转为担保人。",
    conflict: "担保换来短暂安全，也制造背叛误会。",
    hook: "女主发现导师隐瞒了禁区资源来源。",
    relationEdgeId: "mentor-hero",
  },
];

export const relationshipTimeline: RelationshipTimelineItem[] = sceneCards
  .map((scene) => {
    const edge = relationshipEdges.find((item) => item.id === scene.relationEdgeId);
    if (!edge) {
      return null;
    }
    return {
      id: scene.id,
      sceneTitle: scene.title,
      plotLine: scene.plotLine,
      edgeId: edge.id,
      relation: `${edge.from} -> ${edge.to}`,
      status: edge.status,
      cause: edge.cause,
      nextShift: edge.nextShift,
      tone: edge.tone,
    };
  })
  .filter((item): item is RelationshipTimelineItem => item !== null);
