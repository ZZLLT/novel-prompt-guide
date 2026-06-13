import type { AgentStatus, StageId } from "../api/types";

export type AgentConfig = {
  id: string;
  name: string;
  role: string;
  stage: StageId | "all";
  status: AgentStatus;
  signal: string;
  task: string;
};

export const agents: AgentConfig[] = [
  {
    id: "lead-writer",
    name: "主笔 Agent",
    role: "章节续写 / 正文生成",
    stage: "chapters",
    status: "working",
    signal: "写作",
    task: "等待章节目标与上下文，生成第一版正文。",
  },
  {
    id: "world-architect",
    name: "世界观设计师",
    role: "规则 / 势力 / 设定约束",
    stage: "worldbuilding",
    status: "idle",
    signal: "设定",
    task: "扩展力量体系并检查可写性。",
  },
  {
    id: "character-director",
    name: "角色导演",
    role: "人物弧光 / 行动动机",
    stage: "characters",
    status: "done",
    signal: "人物",
    task: "已准备人物关系审查清单。",
  },
  {
    id: "plot-strategist",
    name: "剧情策划",
    role: "节奏 / 爽点 / 伏笔",
    stage: "plot",
    status: "waiting",
    signal: "剧情",
    task: "等待世界观与人物设定后生成分卷计划。",
  },
  {
    id: "line-editor",
    name: "润色编辑",
    role: "文风 / 节奏 / 感官细节",
    stage: "all",
    status: "idle",
    signal: "润色",
    task: "可对选中文本做改写、扩写或降重。",
  },
  {
    id: "continuity-auditor",
    name: "一致性审查",
    role: "矛盾 / 时间线 / 伏笔回收",
    stage: "all",
    status: "blocked",
    signal: "审查",
    task: "WPS 未连接时只能审查本地上下文。",
  },
  {
    id: "wps-officer",
    name: "WPS 排版官",
    role: "同步 / 格式 / 文档结构",
    stage: "all",
    status: "queued",
    signal: "文档",
    task: "排队等待文档连接状态刷新。",
  },
];
