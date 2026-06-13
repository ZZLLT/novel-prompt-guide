import { BookOpen, Bot, Compass, GitBranch, KeyRound, Network, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PenLine, RefreshCcw, Settings, X } from "lucide-react";
import type { ComponentType } from "react";

type WorkspaceId = "setup" | "write" | "plot" | "relationships" | "world" | "agents" | "settings";

export function WorkspaceSettingsWindow({
  activeWorkspace,
  isAssistantOpen,
  isRailCollapsed,
  lastBudgetTokens,
  onClose,
  onOpenApiSettings,
  onOpenSetup,
  onRefresh,
  onSelectWorkspace,
  onToggleAssistant,
  onToggleRail,
  statusConnected,
  statusLlm,
  workspaceItems,
}: {
  activeWorkspace: WorkspaceId;
  isAssistantOpen: boolean;
  isRailCollapsed: boolean;
  lastBudgetTokens: number;
  onClose: () => void;
  onOpenApiSettings: () => void;
  onOpenSetup: () => void;
  onRefresh: () => void;
  onSelectWorkspace: (workspace: WorkspaceId) => void;
  onToggleAssistant: () => void;
  onToggleRail: () => void;
  statusConnected: boolean;
  statusLlm: boolean;
  workspaceItems: Array<{ id: WorkspaceId; label: string; detail: string; icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }> }>;
}) {
  return (
    <section className="startup-guide-backdrop" onClick={onClose}>
      <div className="workspace-settings-window" role="dialog" aria-label="工作台设置窗口" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="workspace-settings-window-header">
          <div>
            <span>Workspace Settings</span>
            <h2>工作台设置</h2>
            <p>把低频控制收在这里，主界面只保留写作和 AI 协作所需的入口。</p>
          </div>
          <button type="button" aria-label="关闭工作台设置窗口" onClick={onClose}>
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <div className="workspace-settings-window-body">
          <section className="settings-section settings-section-primary" aria-label="常用设置">
            <header>
              <span>常用</span>
              <strong>项目与模型</strong>
            </header>
            <div className="settings-action-grid">
              <button type="button" aria-label="从工作台设置打开小说初设引导" onClick={onOpenSetup}>
                <BookOpen aria-hidden="true" size={16} />
                初设引导
              </button>
              <button type="button" aria-label="打开API设置" onClick={onOpenApiSettings}>
                <KeyRound aria-hidden="true" size={16} />
                API 设置
              </button>
              <button type="button" aria-label="刷新链路" onClick={onRefresh}>
                <RefreshCcw aria-hidden="true" size={16} />
                刷新链路
              </button>
            </div>
          </section>

          <section className="settings-section" aria-label="布局设置">
            <header>
              <span>布局</span>
              <strong>工作台显示</strong>
            </header>
            <div className="settings-action-grid">
              <button
                type="button"
                aria-expanded={!isRailCollapsed}
                aria-label={isRailCollapsed ? "展开项目导航" : "收起项目导航"}
                onClick={onToggleRail}
              >
                {isRailCollapsed ? <PanelLeftOpen aria-hidden="true" size={16} /> : <PanelLeftClose aria-hidden="true" size={16} />}
                {isRailCollapsed ? "展开项目导航" : "收起项目导航"}
              </button>
              <button
                type="button"
                aria-expanded={isAssistantOpen}
                aria-label={isAssistantOpen ? "收起 AI 助手" : "打开 AI 助手"}
                onClick={onToggleAssistant}
              >
                {isAssistantOpen ? <PanelRightClose aria-hidden="true" size={16} /> : <PanelRightOpen aria-hidden="true" size={16} />}
                {isAssistantOpen ? "收起 AI 助手" : "打开 AI 助手"}
              </button>
            </div>
          </section>

          <section className="settings-section settings-workspace-jump" aria-label="工作区快捷切换">
            <header>
              <span>工作区</span>
              <strong>切换到单独窗口或模块</strong>
            </header>
            <div className="settings-workspace-grid">
              {workspaceItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeWorkspace;
                return (
                  <button
                    type="button"
                    className={isActive ? "settings-workspace-item is-active" : "settings-workspace-item"}
                    aria-current={isActive}
                    key={item.id}
                    onClick={() => onSelectWorkspace(item.id)}
                  >
                    <Icon aria-hidden={true} size={16} />
                    <span>{item.label}</span>
                    <small>{item.detail}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="settings-section settings-status-summary" aria-label="运行状态">
            <header>
              <span>状态</span>
              <strong>当前链路</strong>
            </header>
            <dl>
              <div>
                <dt>WPS</dt>
                <dd>{statusConnected ? "ONLINE" : "OFFLINE"}</dd>
              </div>
              <div>
                <dt>API</dt>
                <dd>{statusLlm ? "READY" : "QUEUE"}</dd>
              </div>
              <div>
                <dt>Token</dt>
                <dd>{lastBudgetTokens}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
