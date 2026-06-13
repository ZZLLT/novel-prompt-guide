import type { GenerationModeId, PromptBudget, PromptPolicy, StageId } from "../api/types";
import type { StageConfig } from "../data/stages";
import type { FormDataByStage } from "../hooks/useCockpit";
import { CreativePlaybook } from "./CreativePlaybook";
import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import { FileInput, FileOutput, GripHorizontal, SendHorizontal, Sparkles, X } from "lucide-react";
import { playbooks, type StagePlaybook } from "../data/playbooks";
import { generationModes, type GenerationMode } from "../data/generationModes";
import { GenerationModePanel } from "./GenerationModePanel";
import { PromptBudgetPanel } from "./PromptBudgetPanel";
import { PromptPlazaLite } from "./PromptPlazaLite";
import { promptPolicies } from "../data/promptPolicies";
import { StoryFlowMap } from "./StoryFlowMap";
import { InkOSReferencePanel, InkOSReferenceWindow } from "./InkOSReferencePanel";
import { NarrativeEngineWindow } from "./NarrativeEngineWindow";

type CockpitFunctionWindowId =
  | "budget"
  | "mode"
  | "playbook"
  | "document"
  | "workflow"
  | "engine"
  | "audit"
  | "character"
  | "context"
  | "hooks"
  | "planner";
type WindowSendStatus = "idle" | "sending" | "sent" | "error";
type FunctionWindowGroupId = "planning" | "drafting" | "story";
type WorkbenchCard = {
  label: string;
  title: string;
  detail: string;
  tokenPolicy: string;
};

type CockpitWindowInstance = {
  kind: CockpitFunctionWindowId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  draft: string;
  sendStatus: WindowSendStatus;
};

type WindowSize = {
  width: number;
  height: number;
};

type WindowPosition = {
  x: number;
  y: number;
};

const functionWindowTitles: Record<CockpitFunctionWindowId, string> = {
  budget: "预算控制窗口",
  mode: "生成模式窗口",
  playbook: "创作蓝图窗口",
  document: "文档工作台窗口",
  workflow: "创作流水线窗口",
  engine: "叙事引擎窗口",
  audit: "连续性审计窗口",
  character: "人物档案窗口",
  context: "上下文包窗口",
  hooks: "伏笔账本窗口",
  planner: "章节规划窗口",
};

const functionWindowButtonLabels: Record<CockpitFunctionWindowId, string> = {
  budget: "预算",
  mode: "模式",
  playbook: "蓝图",
  document: "文档",
  workflow: "流水线",
  engine: "引擎",
  audit: "审计",
  character: "人物",
  context: "上下文",
  hooks: "伏笔",
  planner: "规划",
};

const functionWindowAriaLabels: Record<CockpitFunctionWindowId, string> = {
  budget: "打开预算窗口",
  mode: "打开生成模式窗口",
  playbook: "打开创作蓝图窗口",
  document: "打开文档窗口",
  workflow: "打开流水线窗口",
  engine: "打开叙事引擎窗口",
  audit: "打开连续性审计窗口",
  character: "打开人物档案窗口",
  context: "打开上下文包窗口",
  hooks: "打开伏笔账本窗口",
  planner: "打开章节规划窗口",
};


const functionWindowOffsets: Record<CockpitFunctionWindowId, { x: number; y: number }> = {
  budget: { x: 0, y: 0 },
  mode: { x: 36, y: 28 },
  playbook: { x: 72, y: 56 },
  document: { x: 108, y: 84 },
  workflow: { x: 0, y: 24 },
  engine: { x: 24, y: 42 },
  audit: { x: 18, y: 18 },
  character: { x: 54, y: 46 },
  context: { x: 90, y: 74 },
  hooks: { x: 126, y: 102 },
  planner: { x: 162, y: 130 },
};

const functionWindowDefaultSizes: Record<CockpitFunctionWindowId, WindowSize> = {
  budget: { width: 860, height: 380 },
  mode: { width: 980, height: 520 },
  playbook: { width: 980, height: 520 },
  document: { width: 980, height: 520 },
  workflow: { width: 1180, height: 720 },
  engine: { width: 1180, height: 720 },
  audit: { width: 980, height: 560 },
  character: { width: 980, height: 560 },
  context: { width: 980, height: 520 },
  hooks: { width: 980, height: 560 },
  planner: { width: 980, height: 560 },
};

const windowWorkgroups: Array<{
  id: string;
  label: string;
  detail: string;
  windows: CockpitFunctionWindowId[];
}> = [
  {
    id: "planning",
    label: "规划工作组",
    detail: "规划、上下文、预算",
    windows: ["planner", "context", "budget"],
  },
  {
    id: "relationship",
    label: "人物线工作组",
    detail: "人物、伏笔、审计",
    windows: ["character", "hooks", "audit"],
  },
  {
    id: "drafting",
    label: "成稿工作组",
    detail: "模式、文档、流水线",
    windows: ["mode", "document", "workflow"],
  },
];

const functionWindowGroups: Array<{
  id: FunctionWindowGroupId;
  label: string;
  detail: string;
  windows: CockpitFunctionWindowId[];
}> = [
  {
    id: "planning",
    label: "规划",
    detail: "预算 / 上下文 / 章节",
    windows: ["budget", "planner", "context", "mode"],
  },
  {
    id: "drafting",
    label: "成稿",
    detail: "蓝图 / 文档 / 流水线",
    windows: ["playbook", "document", "workflow", "engine"],
  },
  {
    id: "story",
    label: "故事维护",
    detail: "人物 / 伏笔 / 审计",
    windows: ["character", "hooks", "audit"],
  },
];

const continuityAuditCards: WorkbenchCard[] = [
  {
    label: "时序",
    title: "知识顺序审计",
    detail: "检查角色是否提前知道尚未出现的信息，避免读者觉得人物像读过大纲。",
    tokenPolicy: "只传当前章节目标、相关角色已知信息和最近 3 个事件。",
  },
  {
    label: "账本",
    title: "伏笔账本",
    detail: "记录伏笔的埋设、误导、延期和回收状态，让章节推进有明确偿还对象。",
    tokenPolicy: "只提交未回收伏笔和本章会触发的伏笔。",
  },
  {
    label: "冲突",
    title: "矛盾触发器",
    detail: "把设定冲突、资源变化、关系转向变成审计问题，先找问题再让 AI 修片段。",
    tokenPolicy: "让低成本模型返回问题列表，不直接重写整章。",
  },
];

const characterDossierCards: WorkbenchCard[] = [
  {
    label: "目标",
    title: "人物目标卡",
    detail: "记录人物当前想要什么、为什么必须现在行动、失败后会失去什么。",
    tokenPolicy: "只传本章出场人物的目标和阻力。",
  },
  {
    label: "关系",
    title: "关系状态卡",
    detail: "记录信任、债务、误会、立场变化，以及下一次关系变化的触发条件。",
    tokenPolicy: "只传与本场景关系线相关的人物。",
  },
  {
    label: "隐藏",
    title: "秘密与代价",
    detail: "记录人物暂时隐瞒的信息、能力代价、不能说出口的理由和爆发时机。",
    tokenPolicy: "只传会影响本章选择的秘密。",
  },
];

const contextPackCards: WorkbenchCard[] = [
  {
    label: "短包",
    title: "短上下文包",
    detail: "把本次任务压成目标、限制、相关人物、相关伏笔、输出格式五段。",
    tokenPolicy: "默认控制在 900 字以内，超过就改走队列。",
  },
  {
    label: "增量",
    title: "只传增量",
    detail: "章节完成后只沉淀新事实、关系变化和资源变化，不反复提交全量设定。",
    tokenPolicy: "使用 delta 更新，减少重复 token。",
  },
  {
    label: "路由",
    title: "模型分工",
    detail: "审计和分类走快模型，正文和关键润色走高质量模型，避免所有任务都用贵模型。",
    tokenPolicy: "按窗口任务发短指令，禁止后台自动调用。",
  },
];

const hookLedgerCards: WorkbenchCard[] = [
  {
    label: "埋设",
    title: "埋设记录",
    detail: "记录伏笔内容、首次出现章节、表面解释、真实解释和读者当时能看到的信息。",
    tokenPolicy: "只提交未回收伏笔和本章会触发的伏笔。",
  },
  {
    label: "误导",
    title: "误导解释",
    detail: "为同一个伏笔保留误导解释和真实解释，避免回收时像临时补设定。",
    tokenPolicy: "只让 AI 判断解释是否自洽，不重写正文。",
  },
  {
    label: "回收",
    title: "回收窗口",
    detail: "标记最早可回收章节、最佳回收章节和过期风险，让长篇连载有债务表。",
    tokenPolicy: "输出表格或问题清单，限制在短上下文内。",
  },
];

const chapterPlannerCards: WorkbenchCard[] = [
  {
    label: "目标",
    title: "章节目标",
    detail: "明确本章要改变什么：人物关系、资源状态、世界认知、主线位置或读者期待。",
    tokenPolicy: "只传上一章结果和本章目标。",
  },
  {
    label: "节拍",
    title: "场景节拍",
    detail: "把章节拆成入口画面、目标碰撞、信息奖励、关系变化、章末推进。",
    tokenPolicy: "先产结构，不直接写长正文。",
  },
  {
    label: "钩子",
    title: "章末钩子",
    detail: "设计危险、误会、发现、反转、情感拉扯五类结尾，保证下一章有点击理由。",
    tokenPolicy: "只返回 3-5 个可选钩子。",
  },
];

const functionWindowMinSize: WindowSize = { width: 560, height: 320 };
const functionWindowMaxSize: WindowSize = { width: 1320, height: 840 };
const minVisibleWindowWidth = 160;
const minVisibleWindowHeader = 64;
const windowTopMargin = 16;
const windowEdgeMargin = 16;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampRange(value: number, min: number, max: number) {
  return clampNumber(value, min, Math.max(min, max));
}

function getViewportSize() {
  return {
    width: window.innerWidth || 1440,
    height: window.innerHeight || 900,
  };
}

function getRenderedWindowSize(size: WindowSize): WindowSize {
  const viewport = getViewportSize();
  return {
    width: Math.min(size.width, Math.max(minVisibleWindowWidth, viewport.width - 80)),
    height: Math.min(size.height, Math.max(minVisibleWindowHeader, viewport.height - 80)),
  };
}

function getFunctionWindowBasePosition(kind: CockpitFunctionWindowId) {
  const viewport = getViewportSize();
  const isWideWindow = kind === "workflow" || kind === "engine";
  return {
    left: isWideWindow ? viewport.width / 2 - 590 : viewport.width / 2 - 490,
    top: isWideWindow ? clampNumber(viewport.height / 2 - 360, 32, 120) : viewport.height / 2 - 250,
  };
}

function clampFloatingWindowPosition(
  position: WindowPosition,
  size: WindowSize,
  basePosition: { left: number; top: number },
): WindowPosition {
  const viewport = getViewportSize();
  const renderedSize = getRenderedWindowSize(size);
  return {
    x: clampRange(
      position.x,
      windowEdgeMargin - basePosition.left,
      viewport.width - renderedSize.width - windowEdgeMargin - basePosition.left,
    ),
    y: clampRange(
      position.y,
      windowTopMargin - basePosition.top,
      viewport.height - renderedSize.height - windowEdgeMargin - basePosition.top,
    ),
  };
}

function clampWindowSize(size: WindowSize, minSize: WindowSize, maxSize: WindowSize): WindowSize {
  return {
    width: Math.min(maxSize.width, Math.max(minSize.width, size.width)),
    height: Math.min(maxSize.height, Math.max(minSize.height, size.height)),
  };
}

function createFunctionWindow(kind: CockpitFunctionWindowId, z: number): CockpitWindowInstance {
  return {
    kind,
    x: functionWindowOffsets[kind].x,
    y: functionWindowOffsets[kind].y,
    width: functionWindowDefaultSizes[kind].width,
    height: functionWindowDefaultSizes[kind].height,
    z,
    draft: "",
    sendStatus: "idle",
  };
}

function getInitialFunctionWindow(): CockpitFunctionWindowId | null {
  const feature = new URLSearchParams(window.location.search).get("feature");
  if (
    feature === "budget" ||
    feature === "mode" ||
    feature === "playbook" ||
    feature === "document" ||
    feature === "workflow" ||
    feature === "engine" ||
    feature === "audit" ||
    feature === "character" ||
    feature === "context" ||
    feature === "hooks" ||
    feature === "planner"
  ) {
    return feature;
  }
  return null;
}

export function ChapterCockpit({
  currentStage,
  formData,
  generationMode,
  onFieldChange,
  onGenerate,
  onQuickCommand,
  onSelectGenerationMode,
  onWindowInstruction,
  onRead,
  onWrite,
  lastBudget,
  promptPreview,
  stage,
  wpsSnapshot,
  wpsReading,
  wpsSyncStatus,
  wpsWriting,
}: {
  currentStage: StageId;
  formData: FormDataByStage;
  generationMode: GenerationModeId;
  onFieldChange: (fieldId: string, value: string) => void;
  onGenerate: () => void;
  onQuickCommand: (command: string) => void;
  onSelectGenerationMode: (mode: GenerationMode) => void;
  onWindowInstruction: (message: string, stageOverride?: StageId) => Promise<unknown>;
  onRead: () => void;
  onWrite: () => void;
  lastBudget: PromptBudget | null;
  promptPreview: string;
  stage: StageConfig;
  wpsSnapshot: string;
  wpsReading: boolean;
  wpsSyncStatus: string;
  wpsWriting: boolean;
}) {
  const [functionWindows, setFunctionWindows] = useState<CockpitWindowInstance[]>(() => {
    const initialWindow = getInitialFunctionWindow();
    return initialWindow ? [createFunctionWindow(initialWindow, 1)] : [];
  });
  const [activeFunctionGroupId, setActiveFunctionGroupId] = useState<FunctionWindowGroupId>("planning");
  const nextZRef = useRef(2);
  const dragRef = useRef<{
    kind: CockpitFunctionWindowId;
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const resizeRef = useRef<{
    kind: CockpitFunctionWindowId;
    pointerId: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);
  const policy = promptPolicies[currentStage];
  const playbook = playbooks[currentStage];
  const selectedMode = generationModes.find((mode) => mode.id === generationMode) ?? generationModes[0];
  const activeFunctionGroup = functionWindowGroups.find((group) => group.id === activeFunctionGroupId) ?? functionWindowGroups[0];
  const openWindowNames = functionWindows.map((window) => functionWindowTitles[window.kind].replace("窗口", ""));
  const openWindowSummary = openWindowNames.length
    ? `已打开 ${openWindowNames.length} 个窗口：${openWindowNames.join("、")}`
    : "尚未打开窗口，可先选择一个工作组。";

  function bringWindowToFront(kind: CockpitFunctionWindowId) {
    const z = nextZRef.current++;
    setFunctionWindows((prev) => prev.map((window) => (window.kind === kind ? { ...window, z } : window)));
  }

  function openFunctionWindow(kind: CockpitFunctionWindowId) {
    const z = nextZRef.current++;
    setFunctionWindows((prev) => {
      if (prev.some((window) => window.kind === kind)) {
        return prev.map((window) => (window.kind === kind ? { ...window, z } : window));
      }
      return [...prev, createFunctionWindow(kind, z)];
    });
  }

  function openWindowWorkgroup(kinds: CockpitFunctionWindowId[]) {
    const zByKind = new Map<CockpitFunctionWindowId, number>();
    kinds.forEach((kind) => {
      zByKind.set(kind, nextZRef.current++);
    });
    setFunctionWindows((prev) => {
      const existingKinds = new Set(prev.map((window) => window.kind));
      const nextWindows = prev.map((window) => (
        zByKind.has(window.kind) ? { ...window, z: zByKind.get(window.kind)! } : window
      ));
      kinds.forEach((kind) => {
        if (!existingKinds.has(kind)) {
          nextWindows.push(createFunctionWindow(kind, zByKind.get(kind)!));
        }
      });
      return nextWindows;
    });
  }

  function closeFunctionWindow(kind: CockpitFunctionWindowId) {
    setFunctionWindows((prev) => prev.filter((window) => window.kind !== kind));
  }

  function updateWindow(kind: CockpitFunctionWindowId, patch: Partial<CockpitWindowInstance>) {
    setFunctionWindows((prev) => prev.map((window) => (window.kind === kind ? { ...window, ...patch } : window)));
  }

  function startWindowDrag(kind: CockpitFunctionWindowId, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const currentWindow = functionWindows.find((window) => window.kind === kind);
    if (!currentWindow) return;
    bringWindowToFront(kind);
    dragRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: currentWindow.x,
      baseY: currentWindow.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveWindow(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const currentWindow = functionWindows.find((window) => window.kind === drag.kind);
    if (!currentWindow) return;
    const nextPosition = clampFloatingWindowPosition(
      {
        x: drag.baseX + event.clientX - drag.startX,
        y: drag.baseY + event.clientY - drag.startY,
      },
      currentWindow,
      getFunctionWindowBasePosition(drag.kind),
    );
    updateWindow(drag.kind, nextPosition);
  }

  function stopWindowDrag(event: PointerEvent<HTMLElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  }

  function startWindowResize(kind: CockpitFunctionWindowId, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const currentWindow = functionWindows.find((window) => window.kind === kind);
    if (!currentWindow) return;
    event.stopPropagation();
    bringWindowToFront(kind);
    resizeRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: currentWindow.width,
      height: currentWindow.height,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveWindowResize(event: PointerEvent<HTMLElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const size = clampWindowSize(
      {
        width: resize.width + event.clientX - resize.startX,
        height: resize.height + event.clientY - resize.startY,
      },
      functionWindowMinSize,
      functionWindowMaxSize,
    );
    const currentWindow = functionWindows.find((window) => window.kind === resize.kind);
    const nextPosition = currentWindow
      ? clampFloatingWindowPosition(currentWindow, size, getFunctionWindowBasePosition(resize.kind))
      : undefined;
    updateWindow(resize.kind, nextPosition ? { ...size, ...nextPosition } : size);
  }

  function stopWindowResize(event: PointerEvent<HTMLElement>) {
    if (!resizeRef.current || resizeRef.current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resizeRef.current = null;
  }

  async function submitWindowInstruction(window: CockpitWindowInstance) {
    const title = functionWindowTitles[window.kind];
    const message = window.draft.trim();
    if (!message || window.sendStatus === "sending") return;
    updateWindow(window.kind, { draft: "", sendStatus: "sending" });
    try {
      await onWindowInstruction(`[${title}]\n${message}\n约束：只围绕本窗口功能回答，优先给可执行短建议。`);
      updateWindow(window.kind, { sendStatus: "sent" });
    } catch {
      updateWindow(window.kind, { sendStatus: "error" });
    }
  }

  return (
    <div className="chapter-cockpit">
      <header className="cockpit-hero">
        <span>当前阶段 / {stage.label}</span>
        <h2>章节工作台</h2>
        <p>{stage.summary}</p>
      </header>

      <div className="quick-command-grid" aria-label="阶段指令">
        {stage.quickCommands.map((command) => (
          <button type="button" key={command} onClick={() => onQuickCommand(command)}>
            {command}
          </button>
        ))}
      </div>

      <section className="window-launcher-panel" aria-label="窗口总览">
        <header>
          <span>功能窗口</span>
          <strong>窗口总览</strong>
          <p>每个按钮都会打开一个可拖动、可调整大小、可直接发送 AI 指令的独立窗口。</p>
        </header>
        <div className="window-workgroup-row" aria-label="工作组快捷打开">
          {windowWorkgroups.map((group) => {
            const isOpen = group.windows.every((kind) => functionWindows.some((window) => window.kind === kind));
            return (
              <button
                className={isOpen ? "workgroup-active" : ""}
                type="button"
                aria-label={`打开${group.label}`}
                key={group.id}
                onClick={() => openWindowWorkgroup(group.windows)}
              >
                <span>{group.label}</span>
                <small>{group.detail}</small>
              </button>
            );
          })}
        </div>
        <p className="window-open-summary" aria-live="polite">{openWindowSummary}</p>
        <div className="function-window-tabs" aria-label="功能窗口分类">
          {functionWindowGroups.map((group) => (
            <button
              className={group.id === activeFunctionGroupId ? "function-tab-active" : ""}
              type="button"
              aria-pressed={group.id === activeFunctionGroupId}
              aria-label={`查看${group.label}功能窗口`}
              key={group.id}
              onClick={() => setActiveFunctionGroupId(group.id)}
            >
              <span>{group.label}</span>
              <small>{group.detail}</small>
            </button>
          ))}
        </div>
        <div className="function-window-grid" aria-label={`${activeFunctionGroup.label}功能窗口`}>
          {activeFunctionGroup.windows.map((kind) => {
            const title = functionWindowTitles[kind];
            const Icon = kind === "document" ? FileInput : Sparkles;
            return (
              <button type="button" aria-label={functionWindowAriaLabels[kind]} key={kind} onClick={() => openFunctionWindow(kind)}>
                <Icon aria-hidden="true" size={15} />
                <span>{functionWindowButtonLabels[kind]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <PromptBudgetPanel budget={lastBudget} policy={policy} />

      <PromptPlazaLite
        onQueueCommand={onQuickCommand}
        policy={policy}
        promptPreview={promptPreview}
      />

      <StoryFlowMap onSendPlotInstruction={(message) => onWindowInstruction(message, "plot")} />

      <InkOSReferencePanel onOpen={() => openFunctionWindow("workflow")} />

      <GenerationModePanel
        modes={generationModes}
        selectedMode={generationMode}
        onSelectMode={onSelectGenerationMode}
      />

      <CreativePlaybook onQueueCommand={onQuickCommand} playbook={playbook} />

      <div className="field-grid">
        {stage.fields.map((field) => {
          const value = formData[currentStage][field.id] ?? "";
          return (
            <label className={field.multiline ? "control-field span-2" : "control-field"} key={field.id}>
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  value={value}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange(field.id, event.target.value)}
                  placeholder={field.hint}
                />
              ) : (
                <input
                  value={value}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => onFieldChange(field.id, event.target.value)}
                  placeholder={field.hint}
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="action-row">
        <button type="button" onClick={onGenerate}>
          <Sparkles aria-hidden="true" size={16} />
          生成提示词
        </button>
        <button type="button" disabled={wpsWriting} onClick={onWrite}>
          <FileOutput aria-hidden="true" size={16} />
          {wpsWriting ? "写入中" : "写入 WPS"}
        </button>
        <button type="button" disabled={wpsReading} onClick={onRead}>
          <FileInput aria-hidden="true" size={16} />
          {wpsReading ? "读取中" : "读取 WPS"}
        </button>
      </div>

      <div className="preview-grid">
        <article>
          <h3>Prompt 预览</h3>
          <p>{promptPreview || "Agent 生成的提示词会在这里显示。"}</p>
        </article>
        <article>
          <h3>WPS 快照</h3>
          <p>{wpsSnapshot || "读取 WPS 后显示当前阶段片段，不会自动覆盖本地编辑。"}</p>
          <small className="wps-sync-status">{wpsSyncStatus}</small>
        </article>
      </div>

      {functionWindows.length ? (
        <div className="function-window-desk" aria-label="多窗口工作台">
          <FunctionWindowDock
            activeWindows={functionWindows}
            onClose={closeFunctionWindow}
            onOpen={openFunctionWindow}
          />
          {functionWindows.map((window) => (
            <CockpitFunctionWindow
              key={window.kind}
              activeWindow={window.kind}
              budget={lastBudget}
              draft={window.draft}
              generationMode={selectedMode}
              onBringToFront={() => bringWindowToFront(window.kind)}
              onClose={() => closeFunctionWindow(window.kind)}
              onDragEnd={stopWindowDrag}
              onDragMove={moveWindow}
              onDragStart={(event) => startWindowDrag(window.kind, event)}
              onDraftChange={(value) => updateWindow(window.kind, { draft: value, sendStatus: "idle" })}
              onResizeEnd={stopWindowResize}
              onResizeMove={moveWindowResize}
              onResizeStart={(event) => startWindowResize(window.kind, event)}
              onSubmitInstruction={() => submitWindowInstruction(window)}
              playbook={playbook}
              policy={policy}
              promptPreview={promptPreview}
              sendStatus={window.sendStatus}
              stage={stage}
              transform={`translate(${window.x}px, ${window.y}px)`}
              size={{ width: window.width, height: window.height }}
              wpsSnapshot={wpsSnapshot}
              wpsSyncStatus={wpsSyncStatus}
              zIndex={window.z}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FunctionWindowDock({
  activeWindows,
  onClose,
  onOpen,
}: {
  activeWindows: CockpitWindowInstance[];
  onClose: (kind: CockpitFunctionWindowId) => void;
  onOpen: (kind: CockpitFunctionWindowId) => void;
}) {
  const activeKinds = new Set(activeWindows.map((window) => window.kind));
  const orderedKinds = Object.keys(functionWindowTitles) as CockpitFunctionWindowId[];

  return (
    <nav className="function-window-dock" aria-label="功能窗口快捷栏">
      <span>窗口</span>
      {orderedKinds.map((kind) => (
        <button
          className={activeKinds.has(kind) ? "dock-active" : undefined}
          key={kind}
          type="button"
          aria-label={`从快捷栏打开${functionWindowTitles[kind]}`}
          onClick={() => onOpen(kind)}
        >
          {functionWindowTitles[kind].replace("窗口", "")}
        </button>
      ))}
      {activeWindows.length ? (
        <button type="button" aria-label="关闭全部功能窗口" onClick={() => activeWindows.forEach((window) => onClose(window.kind))}>
          全关
        </button>
      ) : null}
    </nav>
  );
}

function CockpitFunctionWindow({
  activeWindow,
  budget,
  draft,
  generationMode,
  onBringToFront,
  onClose,
  onDragEnd,
  onDragMove,
  onDragStart,
  onDraftChange,
  onResizeEnd,
  onResizeMove,
  onResizeStart,
  onSubmitInstruction,
  playbook,
  policy,
  promptPreview,
  sendStatus,
  size,
  stage,
  transform,
  wpsSnapshot,
  wpsSyncStatus,
  zIndex,
}: {
  activeWindow: CockpitFunctionWindowId;
  budget: PromptBudget | null;
  draft: string;
  generationMode: GenerationMode;
  onBringToFront: () => void;
  onClose: () => void;
  onDragEnd: (event: PointerEvent<HTMLElement>) => void;
  onDragMove: (event: PointerEvent<HTMLElement>) => void;
  onDragStart: (event: PointerEvent<HTMLElement>) => void;
  onDraftChange: (value: string) => void;
  onResizeEnd: (event: PointerEvent<HTMLElement>) => void;
  onResizeMove: (event: PointerEvent<HTMLElement>) => void;
  onResizeStart: (event: PointerEvent<HTMLElement>) => void;
  onSubmitInstruction: () => void;
  playbook: StagePlaybook;
  policy: PromptPolicy;
  promptPreview: string;
  sendStatus: WindowSendStatus;
  size: WindowSize;
  stage: StageConfig;
  transform: string;
  wpsSnapshot: string;
  wpsSyncStatus: string;
  zIndex: number;
}) {
  const savedTokens = budget ? Math.max(0, budget.raw_estimated_tokens - budget.estimated_tokens) : 0;
  const cacheTtl = policy.cost_guard?.duplicate_cache_ttl_seconds ?? 0;
  const windowTitle = functionWindowTitles[activeWindow];

  return (
    <section
      className={`function-window function-window-${activeWindow}`}
      role="dialog"
      aria-label={windowTitle}
      aria-modal="true"
      style={{
        transform,
        zIndex,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: "calc(100vw - 80px)",
        maxHeight: "calc(100vh - 80px)",
      }}
      onPointerDown={onBringToFront}
    >
      <header
        className="function-window-header"
        aria-label={`拖动${windowTitle}`}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div>
          <span>独立窗口</span>
          <strong>{windowTitle}</strong>
        </div>
        <div className="function-window-actions">
          <GripHorizontal aria-hidden="true" size={16} />
          <button type="button" aria-label="关闭功能窗口" onPointerDown={(event) => event.stopPropagation()} onClick={onClose}>
            <X aria-hidden="true" size={15} />
          </button>
        </div>
      </header>
      <div className="function-window-body">
        {activeWindow === "budget" ? (
          <div className="function-detail-grid">
            <article>
              <span>Token 分层预算</span>
              <strong>生成 {budget?.context_budget_chars ?? policy.context_budget_chars} 字 / 聊天 {policy.chat_budget_chars} 字</strong>
              <p>只把当前阶段需要的世界观、人物和剧情片段送入上下文，避免每次把整本设定重新提交。</p>
            </article>
            <article>
              <span>重复请求防护</span>
              <strong>{cacheTtl}s 内复用相同请求</strong>
              <p>短时间内重复点击不会重复消耗 API，优先使用请求签名缓存。</p>
            </article>
            <article>
              <span>节省结果</span>
              <strong>已省 {savedTokens} tok</strong>
              <p>预算条保持在主界面小尺寸显示，详细解释放在这里查看。</p>
            </article>
          </div>
        ) : null}

        {activeWindow === "mode" ? (
          <div className="function-detail-grid">
            <article>
              <span>速度 / 质量切换</span>
              <strong>{generationMode.label}：{generationMode.badge}</strong>
              <p>{generationMode.focus}</p>
            </article>
            <article>
              <span>API 调用策略</span>
              <strong>{generationMode.latency} / {generationMode.budget}</strong>
              <p>快速模式只读短上下文，标准模式平衡压缩，深度模式只用于复杂伏笔和人物弧光检查。</p>
            </article>
            <article>
              <span>适用动作</span>
              <strong>{generationMode.buttonLabel}</strong>
              <p>{generationMode.command}</p>
            </article>
          </div>
        ) : null}

        {activeWindow === "playbook" ? (
          <div className="function-detail-grid">
            <article>
              <span>阶段作用</span>
              <strong>{stage.label}</strong>
              <p>{playbook.promise}</p>
            </article>
            <article>
              <span>接力分工</span>
              <strong>{playbook.relay.map((item) => item.agent).join(" -> ")}</strong>
              <p>{playbook.target}</p>
            </article>
            <article>
              <span>风险处理</span>
              <strong>{playbook.risk}</strong>
              <p>把风险拆给不同 Agent 审查，减少一次提示词里塞满所有任务造成的 token 浪费。</p>
            </article>
          </div>
        ) : null}

        {activeWindow === "document" ? (
          <div className="function-detail-grid function-detail-grid-wide">
            <article>
              <span>Prompt 预览区</span>
              <strong>生成前检查</strong>
              <p>{promptPreview || "这里用于检查即将写入或提交给 Agent 的提示词，确认上下文足够短、目标足够明确。"}</p>
            </article>
            <article>
              <span>WPS 同步区</span>
              <strong>读写分离</strong>
              <p>{wpsSnapshot || "读取 WPS 只更新快照，不自动覆盖本地编辑；写入动作仍由用户显式点击触发。"}</p>
              <small className="wps-sync-status">{wpsSyncStatus}</small>
            </article>
          </div>
        ) : null}

        {activeWindow === "workflow" ? <InkOSReferenceWindow /> : null}

        {activeWindow === "engine" ? <NarrativeEngineWindow /> : null}

        {activeWindow === "audit" ? (
          <WorkbenchCardGrid
            cards={continuityAuditCards}
            summary="把时间线、伏笔和人物已知信息拆成可审计的问题，先定位矛盾，再决定是否让 AI 精修片段。"
          />
        ) : null}

        {activeWindow === "character" ? (
          <WorkbenchCardGrid
            cards={characterDossierCards}
            summary="把人物目标、关系状态和秘密代价单独维护，写小说文档时可以快速判断本章人物该做什么、为什么做。"
          />
        ) : null}

        {activeWindow === "context" ? (
          <WorkbenchCardGrid
            cards={contextPackCards}
            summary="把每次请求压成短上下文包，明确只传本次任务需要的设定、人物和伏笔，降低 API token 消耗。"
          />
        ) : null}

        {activeWindow === "hooks" ? (
          <WorkbenchCardGrid
            cards={hookLedgerCards}
            summary="把伏笔当成文档债务管理：什么时候埋、读者看到什么、什么时候回收、回收前不能破坏哪些信息。"
          />
        ) : null}

        {activeWindow === "planner" ? (
          <WorkbenchCardGrid
            cards={chapterPlannerCards}
            summary="把章节从一句想法拆成可写的文档结构，先规划目标和节拍，再决定是否让 AI 写正文。"
          />
        ) : null}

        <WindowAgentBox
          draft={draft}
          onDraftChange={onDraftChange}
          onSubmit={onSubmitInstruction}
          status={sendStatus}
          title={windowTitle}
        />
        <button
          type="button"
          className="window-resize-handle"
          aria-label={`调整${windowTitle}大小`}
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        />
      </div>
    </section>
  );
}

function WorkbenchCardGrid({ cards, summary }: { cards: WorkbenchCard[]; summary: string }) {
  return (
    <div className="function-detail-stack">
      <p className="function-window-summary">{summary}</p>
      <div className="function-detail-grid">
        {cards.map((card) => (
          <article key={card.title}>
            <span>{card.label}</span>
            <strong>{card.title}</strong>
            <p>{card.detail}</p>
            <em>{card.tokenPolicy}</em>
          </article>
        ))}
      </div>
    </div>
  );
}

function WindowAgentBox({
  draft,
  onDraftChange,
  onSubmit,
  status,
  title,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  status: WindowSendStatus;
  title: string;
}) {
  const statusLabel: Record<WindowSendStatus, string> = {
    idle: "待发送",
    sending: "发送中",
    sent: "已发送",
    error: "发送失败",
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="window-agent-box" onSubmit={handleSubmit}>
      <label>
        <span>{title} AI 指令</span>
        <textarea
          aria-label={`${title} AI 指令`}
          value={draft}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onDraftChange(event.target.value)}
          placeholder="只写这个窗口要处理的问题，例如：压缩人物上下文，保留关键关系变化。"
        />
      </label>
      <div className="window-agent-actions">
        <span className={`window-agent-status status-${status}`}>{statusLabel[status]}</span>
        <button type="submit" aria-label={`发送${title}指令`} disabled={!draft.trim() || status === "sending"}>
          <SendHorizontal aria-hidden="true" size={15} />
          发送
        </button>
      </div>
    </form>
  );
}
