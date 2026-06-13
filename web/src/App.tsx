import { AgentCommandDeck } from "./components/AgentCommandDeck";
import { ApiSettingsWindow } from "./components/ApiSettingsWindow";
import { ButtonShowcase } from "./components/ButtonShowcase";
import { ChapterCockpit } from "./components/ChapterCockpit";
import { ContextBus } from "./components/ContextBus";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FeatureButtonGrid, type FeatureButton } from "./components/FeatureButtonGrid";
import { FeatureShowcase, type FeatureGroup } from "./components/FeatureShowcase";
import { InitialSetupGuide } from "./components/InitialSetupGuide";
import { SkipToContent } from "./components/SkipToContent";
import { StoryFlowMap } from "./components/StoryFlowMap";
import { StoryUniverseDeck } from "./components/StoryUniverseDeck";
import { WorkspaceSettingsWindow } from "./components/WorkspaceSettingsWindow";
import { Panel } from "./components/ui";
import { useCockpit } from "./hooks/useCockpit";
import { useShortcuts, SHORTCUTS } from "./hooks/useShortcuts";
import {
  BudgetWindow,
  GenerationModeWindow,
  PlaybookWindow,
  DocumentWindow,
  WorkflowWindow,
  ChapterPlannerWindow,
  HookLedgerWindow,
  AuditWindow,
} from "./components/FeatureWindows";
import {
  BookOpen,
  Bot,
  BrainCircuit,
  Compass,
  FileOutput,
  GitBranch,
  KeyRound,
  Network,
  PanelRightClose,
  PanelRightOpen,
  PenLine,
  RefreshCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type WorkspaceId = "setup" | "write" | "plot" | "relationships" | "world" | "agents" | "settings" | "showcase";
type RelationshipFlowTarget = "overview" | "line-editor" | "suggestion";

const workspaceItems: Array<{
  id: WorkspaceId;
  label: string;
  detail: string;
  icon: typeof BookOpen;
}> = [
  { id: "setup", label: "初设", detail: "作品定位", icon: BookOpen },
  { id: "write", label: "写作", detail: "章节生成", icon: PenLine },
  { id: "plot", label: "剧情线", detail: "节拍与伏笔", icon: GitBranch },
  { id: "relationships", label: "人物关系", detail: "关系图谱", icon: Network },
  { id: "world", label: "世界设定", detail: "故事圣经", icon: Compass },
  { id: "agents", label: "AI 协作", detail: "多 Agent", icon: Bot },
  { id: "settings", label: "设置", detail: "API 与模型", icon: Settings },
  { id: "showcase", label: "组件展示", detail: "UI 组件库", icon: Sparkles },
];

const workspaceGuides: Record<WorkspaceId, { cue: string; steps: string[] }> = {
  setup: { cue: "先搭作品骨架", steps: ["填初设", "锁定卖点", "同步故事圣经"] },
  write: { cue: "正文生成流程", steps: ["填上下文", "生成提示词", "写入 WPS"] },
  plot: { cue: "剧情推进流程", steps: ["整理节拍", "检查伏笔", "安排下一章"] },
  relationships: { cue: "人物线流程", steps: ["打开图谱", "调整关系", "AI 建议入图"] },
  world: { cue: "世界设定流程", steps: ["建立规则", "检查代价", "回写设定"] },
  agents: { cue: "协作流程", steps: ["提出问题", "选择 Agent", "执行下一步"] },
  settings: { cue: "模型配置流程", steps: ["填入地址", "获取模型", "分配角色模型"] },
  showcase: { cue: "查看 UI 组件", steps: ["浏览组件", "测试交互", "了解用法"] },
};

function resolveInitialWorkspace(): WorkspaceId {
  const requested = new URLSearchParams(window.location.search).get("workspace");
  return workspaceItems.some((item) => item.id === requested) ? (requested as WorkspaceId) : "write";
}

function resolveInitialRailCollapsed() {
  return new URLSearchParams(window.location.search).get("rail") === "collapsed";
}

function resolveInitialAssistantOpen() {
  return new URLSearchParams(window.location.search).get("assistant") !== "closed";
}

function resolveInitialWorkspaceSettingsOpen() {
  return new URLSearchParams(window.location.search).get("settings") === "open";
}

function updateWorkspaceSearch(patch: Partial<{ assistant: "open" | "closed"; rail: "open" | "collapsed"; workspace: WorkspaceId }>) {
  const params = new URLSearchParams(window.location.search);
  if (patch.workspace) params.set("workspace", patch.workspace);
  if (patch.rail) params.set("rail", patch.rail);
  if (patch.assistant) params.set("assistant", patch.assistant);
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

export default function App() {
  const cockpit = useCockpit();
  const [isSetupOpen, setSetupOpen] = useState(() => new URLSearchParams(window.location.search).get("setup") !== "closed");
  const [isApiSettingsOpen, setApiSettingsOpen] = useState(() => new URLSearchParams(window.location.search).get("api") === "open");
  const [isWorkspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(resolveInitialWorkspaceSettingsOpen);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(resolveInitialWorkspace);
  const [isAssistantOpen, setAssistantOpen] = useState(resolveInitialAssistantOpen);
  const [isRailCollapsed, setRailCollapsed] = useState(resolveInitialRailCollapsed);
  const [relationshipWindowOpenSignal, setRelationshipWindowOpenSignal] = useState(0);
  const [relationshipFlowTarget, setRelationshipFlowTarget] = useState<RelationshipFlowTarget>("overview");
  const [featureHint, setFeatureHint] = useState<string>("");

  // 功能窗口状态
  const [openWindow, setOpenWindow] = useState<string | null>(null);

  const assistantToggleRef = useRef<HTMLButtonElement>(null);
  const activeWorkspaceMeta = workspaceItems.find((item) => item.id === activeWorkspace) ?? workspaceItems[1];
  const activeWorkspaceGuide = workspaceGuides[activeWorkspace] ?? { cue: "", steps: [] };

  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showFeatureHint = (feature: string) => {
    clearTimeout(hintTimeoutRef.current);
    setFeatureHint(`"${feature}" 功能窗口即将开放，敬请期待！`);
    hintTimeoutRef.current = setTimeout(() => setFeatureHint(""), 3000);
  };

  useEffect(() => {
    return () => {
      clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  const openFeatureWindow = (windowId: string) => {
    setOpenWindow(windowId);
  };

  const closeFeatureWindow = () => {
    setOpenWindow(null);
  };

  const renderStoryUniverse = (stageNavLabel = "故事阶段") => (
    <StoryUniverseDeck
      currentStage={cockpit.currentStage}
      documentState={cockpit.documentState}
      onSelectStage={cockpit.setCurrentStage}
      stageNavLabel={stageNavLabel}
      status={cockpit.status}
    />
  );

  const storyUniverse = renderStoryUniverse();

  const chapterCockpit = (
    <ChapterCockpit
      currentStage={cockpit.currentStage}
      formData={cockpit.formData}
      generationMode={cockpit.generationMode}
      onFieldChange={cockpit.setFieldValue}
      onGenerate={cockpit.actions.generate}
      onQuickCommand={cockpit.actions.queueQuickCommand}
      onSelectGenerationMode={(mode) => cockpit.actions.selectGenerationMode(mode.id, mode.command)}
      onWindowInstruction={cockpit.actions.sendWindowInstruction}
      onRead={cockpit.actions.readCurrentStage}
      onWrite={cockpit.actions.writeCurrentStage}
      lastBudget={cockpit.lastBudget}
      promptPreview={cockpit.promptPreview}
      stage={cockpit.activeStage}
      wpsSnapshot={cockpit.wpsSnapshot}
      wpsReading={cockpit.wpsReading}
      wpsSyncStatus={cockpit.wpsSyncStatus}
      wpsWriting={cockpit.wpsWriting}
    />
  );

  const agentDeck = (
    <AgentCommandDeck
      agents={cockpit.agents}
      assistantBusy={cockpit.assistantBusy}
      assistantInput={cockpit.assistantInput}
      assistantMessages={cockpit.assistantMessages}
      assistantStatus={cockpit.assistantStatus}
      chatInput={cockpit.chatInput}
      messages={cockpit.chatMessages}
      onAssistantInput={cockpit.setAssistantInput}
      onAssistantShortcut={cockpit.actions.useAssistantShortcut}
      onAskAssistant={cockpit.actions.askAssistant}
      onChatInput={cockpit.setChatInput}
      onSend={cockpit.actions.sendInstruction}
    />
  );

  const renderWorkspace = () => {
    if (activeWorkspace === "showcase") {
      return <ButtonShowcase />;
    }

    if (activeWorkspace === "setup" || activeWorkspace === "world") {
      return (
        <>
          <div className="workspace-features-hint">
            <strong>可用功能：</strong>故事阶段管理、世界设定编辑、初设引导
          </div>
          <Panel title={activeWorkspace === "setup" ? "初设工作区" : "世界设定工作区"} eyebrow="Story Bible">
            {renderStoryUniverse("主工作区故事阶段")}
          </Panel>
        </>
      );
    }

    if (activeWorkspace === "relationships") {
      return (
        <>
          <FeatureButtonGrid features={[
            { icon: Network, title: "关系图谱", description: "查看完整人物关系网络", onClick: () => openRelationshipFlowTarget("overview") },
            { icon: GitBranch, title: "关系编辑", description: "调整人物之间的关系", onClick: () => openRelationshipFlowTarget("line-editor") },
            { icon: Sparkles, title: "AI 建议", description: "智能关系分析与建议", onClick: () => openRelationshipFlowTarget("suggestion") },
          ]} />
          <Panel title="人物关系工作区" eyebrow="人物线">
            <StoryFlowMap
              relationshipWindowFocusTarget={relationshipFlowTarget}
              relationshipWindowOpenSignal={relationshipWindowOpenSignal}
            />
          </Panel>
        </>
      );
    }

    if (activeWorkspace === "plot") {
      return (
        <>
          {featureHint && (
            <div className="alert alert-info" role="alert" aria-live="polite" style={{margin: '0 32px 16px'}}>
              {featureHint}
            </div>
          )}
          <FeatureButtonGrid features={[
            { icon: Compass, title: "章节规划", description: "规划剧情节拍", onClick: () => openFeatureWindow('planner') },
            { icon: GitBranch, title: "伏笔账本", description: "管理剧情伏笔", onClick: () => openFeatureWindow('hooks') },
            { icon: RefreshCcw, title: "连续性审计", description: "检测剧情矛盾", onClick: () => openFeatureWindow('audit') },
          ]} />
          <Panel title="剧情线工作区" eyebrow="Story Arc">
            {chapterCockpit}
          </Panel>
        </>
      );
    }

    if (activeWorkspace === "agents") {
      return (
        <>
          {featureHint && (
            <div className="alert alert-info" role="alert" aria-live="polite" style={{margin: '0 32px 16px'}}>
              {featureHint}
            </div>
          )}
          <FeatureButtonGrid features={[
            { icon: Bot, title: "AI 助手", description: "智能写作建议", onClick: openAssistant },
            { icon: BrainCircuit, title: "多 Agent", description: "并行任务处理", onClick: () => showFeatureHint('多 Agent') },
            { icon: Sparkles, title: "智能优化", description: "内容质量提升", onClick: () => showFeatureHint('智能优化') },
          ]} />
          <Panel title="AI 协作工作区" eyebrow="Agent">
            <div className="workspace-empty-state">
              <div className="empty-state-illustration">
                <BrainCircuit aria-hidden="true" size={80} />
              </div>
              <h3>AI 助手已固定在右侧</h3>
              <p>多 Agent 调度、提示词提问和下一步优化建议都在右侧抽屉完成，主工作区保留给正文和结构。</p>
              <div className="empty-state-actions">
                <button type="button" className="btn btn-primary" aria-label="在 AI 协作区打开 AI 助手" onClick={() => openAssistant()}>
                  <PanelRightOpen aria-hidden="true" size={16} />
                  打开 AI 助手
                </button>
              </div>
            </div>
          </Panel>
        </>
      );
    }

    if (activeWorkspace === "settings") {
      return (
        <Panel title="设置工作区" eyebrow="功能总览">
          <div className="function-overview">
            <div className="overview-stat">
              <div className="overview-stat-value">11+</div>
              <div className="overview-stat-label">功能窗口</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">7</div>
              <div className="overview-stat-label">工作区</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{cockpit.lastBudget?.estimated_tokens ?? 0}</div>
              <div className="overview-stat-label">Token 预算</div>
            </div>
          </div>

          <FeatureShowcase groups={[
            {
              icon: SlidersHorizontal,
              title: "规划工具",
              items: [
                { icon: Sparkles, title: "预算控制", description: "控制 Token 消耗，查看成本预估，设置预算上限。", tags: ["Token 管理", "成本优化"] },
                { icon: GitBranch, title: "生成模式", description: "选择不同的生成策略：精确、平衡、创意等模式。", tags: ["多模式"] },
                { icon: BrainCircuit, title: "上下文包", description: "管理章节上下文，智能选择相关内容输入。", tags: ["上下文"] },
                { icon: Compass, title: "章节规划", description: "规划章节结构，设定节拍，安排剧情点。", tags: ["规划"] },
              ],
            },
            {
              icon: PenLine,
              title: "成稿工具",
              items: [
                { icon: BookOpen, title: "创作蓝图", description: "使用预设创作模板，快速生成章节大纲。", tags: ["模板"] },
                { icon: FileOutput, title: "文档工作台", description: "编辑、预览、导出章节内容到 WPS。", tags: ["WPS 同步"] },
                { icon: Waypoints, title: "创作流水线", description: "批量处理章节，自动化生成流程。", tags: ["自动化"] },
                { icon: Sparkles, title: "叙事引擎", description: "AI 驱动的叙事生成，智能补全剧情。", tags: ["AI 生成"] },
              ],
            },
            {
              icon: Network,
              title: "故事维护",
              items: [
                { icon: Network, title: "人物档案", description: "管理人物信息、关系网络、成长弧线。", tags: ["人物", "关系"] },
                { icon: GitBranch, title: "伏笔账本", description: "记录伏笔、追踪回收，确保前后呼应。", tags: ["伏笔"] },
                { icon: RefreshCcw, title: "连续性审计", description: "检测情节矛盾、人物设定冲突等问题。", tags: ["审计"] },
              ],
            },
          ]} />

          <div className="workspace-settings-grid">
            <article>
              <KeyRound aria-hidden="true" size={18} />
              <strong>API 与多模型</strong>
              <p>切换模型地址、获取模型列表，并配置规划、写作、审稿、助手的模型路由。</p>
              <button type="button" aria-label="设置工作区打开API设置" onClick={() => setApiSettingsOpen(true)}>
                打开 API 设置
              </button>
            </article>
            <article>
              <RefreshCcw aria-hidden="true" size={18} />
              <strong>链路状态</strong>
              <p>重新检查 WPS、后端服务和 LLM 队列状态。</p>
              <button type="button" onClick={cockpit.actions.refreshStatus}>
                刷新链路
              </button>
            </article>
          </div>
        </Panel>
      );
    }

    return (
      <>
        {featureHint && (
          <div className="alert alert-info" style={{margin: '0 32px 16px'}}>
            {featureHint}
          </div>
        )}
        <FeatureButtonGrid features={[
          { icon: Sparkles, title: "预算控制", description: "Token 成本管理", onClick: () => openFeatureWindow('budget') },
          { icon: SlidersHorizontal, title: "生成模式", description: "精确/平衡/创意", onClick: () => openFeatureWindow('mode') },
          { icon: BookOpen, title: "创作蓝图", description: "预设模板", onClick: () => openFeatureWindow('playbook') },
          { icon: FileOutput, title: "文档工作台", description: "WPS 同步", onClick: () => openFeatureWindow('document') },
          { icon: Waypoints, title: "流水线", description: "批量生成", onClick: () => openFeatureWindow('workflow') },
          { icon: Sparkles, title: "叙事引擎", description: "AI 生成", onClick: () => showFeatureHint('叙事引擎') },
        ]} />
        <Panel title="章节工作台" eyebrow="写作">
          {chapterCockpit}
        </Panel>
      </>
    );
  };

  const closeAssistant = () => {
    setAssistantOpen(false);
    updateWorkspaceSearch({ assistant: "closed" });
    assistantToggleRef.current?.focus();
  };

  const openAssistant = () => {
    setAssistantOpen(true);
    updateWorkspaceSearch({ assistant: "open" });
  };

  const askAiFromSetup = (prompt: string) => {
    openAssistant();
    cockpit.actions.askAssistant(prompt);
  };

  const toggleAssistant = () => {
    const nextOpen = !isAssistantOpen;
    setAssistantOpen(nextOpen);
    updateWorkspaceSearch({ assistant: nextOpen ? "open" : "closed" });
  };

  const toggleRail = () => {
    const nextCollapsed = !isRailCollapsed;
    setRailCollapsed(nextCollapsed);
    updateWorkspaceSearch({ rail: nextCollapsed ? "collapsed" : "open" });
  };

  const selectWorkspace = (workspace: WorkspaceId) => {
    setActiveWorkspace(workspace);
    updateWorkspaceSearch({ workspace });
  };

  const openApiSettingsFromWorkspaceSettings = () => {
    setWorkspaceSettingsOpen(false);
    setApiSettingsOpen(true);
  };

  const openSetupFromWorkspaceSettings = () => {
    setWorkspaceSettingsOpen(false);
    setSetupOpen(true);
  };

  const openRelationshipFlowTarget = (target: RelationshipFlowTarget) => {
    setRelationshipFlowTarget(target);
    setRelationshipWindowOpenSignal((value) => value + 1);
  };

  // Global keyboard shortcuts
  useShortcuts([
    {
      ...SHORTCUTS.COMMAND_PALETTE,
      callback: () => {
        // Toggle assistant as command palette for now
        toggleAssistant();
      },
    },
    {
      key: 'Escape',
      callback: () => {
        // Close any open modals/windows
        if (isSetupOpen) setSetupOpen(false);
        else if (isApiSettingsOpen) setApiSettingsOpen(false);
        else if (isWorkspaceSettingsOpen) setWorkspaceSettingsOpen(false);
        else if (isAssistantOpen) setAssistantOpen(false);
      },
    },
  ]);

  const getWorkspaceFlowAction = (step: string) => {
    if (activeWorkspace === "relationships") {
      if (step === "调整关系") return () => openRelationshipFlowTarget("line-editor");
      if (step === "AI 建议入图") return () => openRelationshipFlowTarget("suggestion");
      return () => openRelationshipFlowTarget("overview");
    }
    if (activeWorkspace === "setup" && step === "填初设") {
      return () => setSetupOpen(true);
    }
    if (activeWorkspace === "agents") {
      return openAssistant;
    }
    if (activeWorkspace === "settings") {
      return () => setApiSettingsOpen(true);
    }
    return undefined;
  };

  return (
    <>
      <SkipToContent />
      <main id="main-content" className={`app-shell workspace-os${isAssistantOpen ? " assistant-open" : " assistant-collapsed"}${isRailCollapsed ? " rail-collapsed" : ""}`}>
      <header className="top-command workspace-topbar">
        <div>
          <span>NOVEL WORKSPACE</span>
          <h1>长篇小说工作台</h1>
        </div>
        <div className="top-command-actions">
          <button type="button" aria-label="打开小说初设引导" onClick={() => setSetupOpen(true)}>
            <BookOpen aria-hidden="true" size={16} />
            初设引导
          </button>
          <button type="button" aria-label="打开工作台设置" onClick={() => setWorkspaceSettingsOpen(true)}>
            <SlidersHorizontal aria-hidden="true" size={16} />
            工作台设置
          </button>
          <button
            type="button"
            aria-controls={isAssistantOpen ? "workspace-ai-assistant" : undefined}
            aria-expanded={isAssistantOpen}
            aria-label={isAssistantOpen ? "切换 AI 助手" : "打开 AI 助手"}
            onClick={toggleAssistant}
            ref={assistantToggleRef}
          >
            {isAssistantOpen ? <PanelRightClose aria-hidden="true" size={16} /> : <PanelRightOpen aria-hidden="true" size={16} />}
            {isAssistantOpen ? "AI 助手" : "打开 AI 助手"}
          </button>
        </div>
      </header>

      <aside className="workspace-rail" aria-label="项目导航">
        <nav className="workspace-nav" aria-label="小说工作区导航">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeWorkspace;
            return (
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "workspace-nav-item active" : "workspace-nav-item"}
                key={item.id}
                onClick={() => selectWorkspace(item.id)}
              >
                <Icon aria-hidden="true" size={17} />
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </button>
            );
          })}
        </nav>

        {isRailCollapsed ? null : (
          <section className="workspace-rail-project" aria-label="项目设定">
            {storyUniverse}
          </section>
        )}
      </aside>

      <section className="workspace-main" aria-label="主工作区">
        <header className="workspace-toolbar">
          <div>
            <span>{activeWorkspaceMeta.detail}</span>
            <h2>{activeWorkspaceMeta.label}工作区</h2>
          </div>
          <div className="workspace-toolbar-actions">
            <button type="button" onClick={() => setSetupOpen(true)}>
              <BookOpen aria-hidden="true" size={15} />
              初设引导
            </button>
            <button type="button" onClick={() => selectWorkspace("relationships")}>
              <Waypoints aria-hidden="true" size={15} />
              人物线
            </button>
          </div>
        </header>
        <section className="workspace-flow-guide" aria-label="工作区流程">
          <strong>{activeWorkspaceGuide.cue}</strong>
          <ol>
            {activeWorkspaceGuide.steps.map((step, index) => {
              const action = getWorkspaceFlowAction(step);
              const content = (
                <>
                  <span className="workspace-flow-step-index" aria-hidden="true">{index + 1}</span>
                  <span className="workspace-flow-step-label">{step}</span>
                </>
              );
              return (
                <li key={step}>
                  {action ? (
                    <button type="button" className="workspace-flow-action" aria-label={step} onClick={action}>
                      {content}
                    </button>
                  ) : (
                    <span className="workspace-flow-step">{content}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
        <div className="workspace-panel">
          <ErrorBoundary>
            {renderWorkspace()}
          </ErrorBoundary>
        </div>
      </section>

      {isAssistantOpen ? (
        <aside className="assistant-drawer" id="workspace-ai-assistant" aria-label="AI 助手窗口">
          <header className="assistant-drawer-header">
            <div>
              <span>AI Copilot</span>
              <h2>AI 助手</h2>
            </div>
            <button type="button" aria-label="收起 AI 助手" onClick={closeAssistant}>
              <PanelRightClose aria-hidden="true" size={16} />
              收起 AI 助手
            </button>
          </header>
          {agentDeck}
        </aside>
      ) : null}

      <footer className="workspace-statusbar" role="contentinfo" aria-label="工作台状态栏">
        <div className="workspace-status-pills">
          <span><b>WPS</b>{cockpit.status?.connected ? "ONLINE" : "OFFLINE"}</span>
          <span><b>API</b>{cockpit.status?.llm ? "READY" : "QUEUE"}</span>
          <span><b>Token</b>{cockpit.lastBudget?.estimated_tokens ?? 0}</span>
          <span><b>阶段</b>{cockpit.activeStage.label}</span>
          {cockpit.error ? <span className="workspace-error-pill" role="status">系统提示：{cockpit.error}</span> : null}
        </div>
        <section className="bus-panel workspace-context-strip" aria-label="上下文总线">
          <ContextBus error={cockpit.error} segments={cockpit.contextSegments} />
        </section>
      </footer>
      {isSetupOpen ? (
        <InitialSetupGuide
          onClose={() => setSetupOpen(false)}
          onSubmit={cockpit.actions.applyInitialSetup}
          onAskAi={askAiFromSetup}
        />
      ) : null}
      {isWorkspaceSettingsOpen ? (
        <WorkspaceSettingsWindow
          activeWorkspace={activeWorkspace}
          isAssistantOpen={isAssistantOpen}
          isRailCollapsed={isRailCollapsed}
          lastBudgetTokens={cockpit.lastBudget?.estimated_tokens ?? 0}
          onClose={() => setWorkspaceSettingsOpen(false)}
          onOpenApiSettings={openApiSettingsFromWorkspaceSettings}
          onOpenSetup={openSetupFromWorkspaceSettings}
          onRefresh={cockpit.actions.refreshStatus}
          onSelectWorkspace={selectWorkspace}
          onToggleAssistant={toggleAssistant}
          onToggleRail={toggleRail}
          statusConnected={Boolean(cockpit.status?.connected)}
          statusLlm={Boolean(cockpit.status?.llm)}
          workspaceItems={workspaceItems}
        />
      ) : null}
      {isApiSettingsOpen ? <ApiSettingsWindow onClose={() => setApiSettingsOpen(false)} /> : null}

      {/* 功能窗口 */}
      {openWindow === 'budget' && <BudgetWindow onClose={closeFeatureWindow} />}
      {openWindow === 'mode' && <GenerationModeWindow onClose={closeFeatureWindow} />}
      {openWindow === 'playbook' && <PlaybookWindow onClose={closeFeatureWindow} />}
      {openWindow === 'document' && <DocumentWindow onClose={closeFeatureWindow} />}
      {openWindow === 'workflow' && <WorkflowWindow onClose={closeFeatureWindow} />}
      {openWindow === 'planner' && <ChapterPlannerWindow onClose={closeFeatureWindow} />}
      {openWindow === 'hooks' && <HookLedgerWindow onClose={closeFeatureWindow} />}
      {openWindow === 'audit' && <AuditWindow onClose={closeFeatureWindow} />}
    </main>
    </>
  );
}

