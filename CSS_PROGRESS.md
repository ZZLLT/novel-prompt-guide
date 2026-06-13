# CSS 补全进度追踪

## 状态：进行中

## 已完成批次

### 批次 1：ChapterCockpit（~30 个 class）
- `chapter-cockpit`, `cockpit-hero`, `quick-command-grid`
- `window-launcher-panel`, `window-workgroup-row`, `workgroup-active`
- `window-open-summary`, `function-window-tabs`, `function-tab-active`
- `function-window-grid`, `function-window-desk`, `function-window-dock`, `dock-active`
- `function-window-{kind}` (budget/mode/playbook/document/workflow/engine/audit/character/context/hooks/planner)
- `function-window-actions`, `function-detail-grid`, `function-detail-grid-wide`
- `function-detail-stack`, `function-window-summary`
- `window-agent-box`, `window-agent-actions`, `window-agent-status`
- `status-idle|queued|working|done|error`
- `window-resize-handle`, `field-grid`, `action-row`, `preview-grid`
- `wps-sync-status`, `span-2`

### 批次 2：AgentCommandDeck（~15 个 class）
- `agent-deck`, `agent-list`, `agent-card`, `agent-idle|working|queued|error|offline`
- `agent-head`, `agent-signal`
- `ai-assistant-box`, `ai-console-panel`, `ai-console-header`
- `assistant-status`, `assistant-idle|working|queued|error`
- `assistant-runtime-bar`, `assistant-quick-actions`
- `assistant-log`, `message-user|assistant|system`
- `assistant-input`, `command-stream`, `message-log`, `command-input`

### 批次 3：ApiSettingsWindow（~20 个 class）
- `startup-guide-backdrop`, `startup-guide-header` (部分已存在), `startup-guide-actions` (部分已存在)
- `api-settings-window`, `api-console-window`, `api-console-header`, `api-runtime-bar`, `is-queued`
- `api-preset-strip`, `api-preset-grid`, `api-preset-card`
- `api-console-body`, `api-profile-sidebar`, `api-profile-item`, `is-active`
- `api-editor-panel`, `api-settings-grid`, `api-model-panel`, `api-model-route-grid`
- `api-toggle-field`

### 批次 4：StoryFlowMap（~65 个 class，最大组件）
- `story-flow-map`, `flow-header`
- `relationship-launch-panel`, `relationship-window-layer`, `relationship-window`
- `relationship-window-header`, `relationship-toolbar`, `relationship-window-layout`
- `relationship-canvas`, `relationship-canvas-inner`, `relationship-map`
- `relationship-lines`, `relationship-line-card-layer`, `relationship-line-card`
- `card-alliance|tension|rivalry|mentor|romance`, `card-selected`
- `actor-grid`, `actor-node`, `actor-hero|heroine|mentor|rival|support`
- `actor-selected`
- `line-alliance|tension|rivalry|mentor|romance`, `line-selected`
- `relationship-side-panel`, `relationship-log`, `relationship-log-window`
- `relation-card`, `relation-alliance|tension|rivalry|mentor|romance`
- `relationship-preset-panel`, `relationship-preset-selects`, `relationship-preset-summary`
- `relationship-preset-group`, `relationship-preset-chip-row`
- `preset-chip`, `preset-positive|negative|neutral`
- `relationship-line-style-list`
- `actor-profile-panel`, `relationship-line-editor`, `relationship-strength-field`
- `relationship-suggestion-panel`, `relationship-change-panel`
- `relationship-change-actions`, `relationship-change-history`, `relationship-change-history-item`
- `change-pending|accepted|rejected`
- `relationship-change-layer`, `relationship-suggestion-layer`
- `relationship-suggestion-chip`, `suggestion-new|updated|dismissed`
- `relationship-suggestion-chip-head`
- `scene-card-board`, `scene-card-row`, `scene-card`
- `relationship-timeline`, `timeline-row`, `timeline-item`
- `timeline-alliance|tension|rivalry|mentor|romance`
- `flow-stage-rail`, `flow-stage-step`, `flow-signal-row`
- `story-function-window-desk`, `story-function-window`, `story-function-window-header`
- `story-window-grid`, `story-window-card`
- `story-window-info|action|warning`
- `story-window-agent-box`

### 批次 5：小型组件
- **ContextBus**: `context-bus`, `context-segments`, `context-segment`, `tone-{tone}`, `bus-header`, `incident-line`
- **StoryUniverseDeck**: `universe-deck`, `ship-status`, `stage-map`, `stage-node`, `active`, `stage-callsign`, `codex-snapshot`
- **WorkspaceSettingsWindow**: `startup-guide-backdrop`, `workspace-settings-window`, `workspace-settings-window-header`, `workspace-settings-window-body`, `settings-section`, `settings-section-primary`, `settings-action-grid`, `settings-workspace-jump`, `settings-workspace-grid`, `settings-workspace-item`, `is-active`, `settings-status-summary`

### 批次 6：面板组件
- **GenerationModePanel**: `generation-mode-panel`, `mode-panel-header`, `mode-grid`, `mode-card`, `active`, `mode-card-top`
- **CreativePlaybook**: `creative-playbook`, `playbook-header`, `playbook-metrics`, `playbook-columns`, `beat-list`, `relay-list`, `seed-bank`
- **NarrativeEngineWindow**: `narrative-engine-window`, `function-detail-grid`, `function-detail-grid-wide`, `function-detail-stack`, `function-window-summary`

### 批次 7：提示词与流水线
- **PromptBudgetPanel**: `prompt-budget-panel-compact`, `prompt-budget-strip`, `budget-layer-strip`, `budget-recall-strip`
- **PromptPlazaLite**: `prompt-plaza-lite`, `prompt-plaza-header`, `prompt-plaza-metrics`, `prompt-plaza-toolbar`, `prompt-plaza-tabs`, `prompt-plaza-schema`, `prompt-node-grid`, `prompt-node-card`, `prompt-node-card-head`, `prompt-node-meta`, `prompt-plaza-footer`
- **InkOSReferencePanel**: `inkos-reference-panel`, `inkos-reference-header`, `inkos-mini-flow`, `inkos-window-layout`, `inkos-window-hero`, `inkos-pipeline-lane`, `inkos-window-columns`, `inkos-reference-card`, `inkos-truth-grid`, `inkos-gate-list`, `inkos-route-list`

## 待验证
- [x] 所有 class 已写入 modern.css
- [x] `npm run build` 通过 (2.68s, 1732 modules)
- [ ] 浏览器检查各组件渲染正常

---

## Bug 审计记录

### 前端 Bug

#### 高严重度（已修复，上一轮会话）

| # | 文件 | Bug | 修复方式 |
|---|------|-----|---------|
| 1 | App.tsx | `setTimeout` 未清理，组件卸载后仍执行回调 | 改为 `useRef` + `clearTimeout` |
| 2 | App.tsx | ErrorBoundary 未包裹根组件，白屏无兜底 | 在 `main.tsx` 中添加 `<ErrorBoundary>` |
| 3 | App.tsx | 导航项错误使用 `aria-pressed` | 改为 `aria-current` |
| 4 | App.tsx | `useEffect` 缺少依赖项，数据可能过期 | 补全依赖数组 |
| 5 | App.tsx | 模态框缺少 backdrop 点击关闭和 `stopPropagation` | 添加 `onClick={onClose}` 和 `e.stopPropagation()` |

#### 中严重度（已修复，本轮会话）

| # | 文件 | Bug | 修复方式 |
|---|------|-----|---------|
| 6 | GenerationModePanel.tsx | 模式选择按钮是导航项，错误使用 `aria-pressed` | 改为 `aria-current={active}` |
| 7 | PromptPlazaLite.tsx | 分类标签 active 按钮缺少 `aria-current` | 添加 `aria-current="true"` |
| 8 | WorkspaceSettingsWindow.tsx | 工作区切换按钮错误使用 `aria-pressed` | 改为 `aria-current={isActive}` |
| 9 | WorkspaceSettingsWindow.tsx | 模态框缺少 backdrop 点击关闭 | 添加 `onClick={onClose}` 到 backdrop，`stopPropagation` 到窗口 |
| 10 | InitialSetupGuide.tsx | 模态框缺少 backdrop 点击关闭 | 同上 |

#### 低严重度（待修复）

| # | 文件 | Bug | 说明 |
|---|------|-----|------|
| 11 | App.tsx | 缺少 skip-to-content 跳转链接 | 键盘用户无法跳过导航直达主内容 |
| 12 | App.tsx | `contextSegments` useMemo 内重复计算 | 可缓存中间结果提升性能 |
| 13 | PromptBudgetPanel.tsx | 复杂三元链可读性差 | 运算符优先级正确，建议重构为 if-else 提高可维护性 |

#### 已审查（无 bug）

- ContextBus.tsx, CreativePlaybook.tsx, FeatureWindows.tsx, FeatureShowcase.tsx
- FeatureButtonGrid.tsx, FunctionWindow.tsx, InkOSReferencePanel.tsx
- NarrativeEngineWindow.tsx, StoryUniverseDeck.tsx, ui.tsx
- hooks/useCockpit.ts — 所有异步操作使用 `pendingRef` 防重复提交，`try/catch/finally` 完备
- api/client.ts — `ApiError` 类正确处理状态码和错误码

### 后端 Bug（server.py）

#### 已修复

| # | 位置 | Bug | 修复方式 |
|---|------|-----|---------|
| 1 | `/api/write` (line 1147) | `body.get("text","")` 允许空文本写入 WPS | 添加非空字符串校验，空文本返回 400 |

#### 非 Bug（设计意图）

| 位置 | 疑问 | 结论 |
|------|------|------|
| `VALID_STAGE_IDS` 不含 `editing` | 与 `read_section()` 映射不一致 | 前端测试断言 `generatePrompt("editing")` 应报错，editing 区域只读不可生成 |
| `_context_cache` 无显式锁 | 线程安全？ | Python GIL 保证 dict 操作原子性，TTL=20s 窗口极短，实际安全 |

### 构建验证

```
vite v7.3.5 building client environment for production...
✓ 1732 modules transformed.
dist/index.html          0.40 kB │ gzip:   0.29 kB
dist/assets/index-BtGuYaZx.css  101.56 kB │ gzip:  10.98 kB
dist/assets/index-xt6twdsn.js   368.64 kB │ gzip: 116.30 kB
✓ built in 2.68s
```

---

## 用户反馈修复（当前会话）

### 已修复

| # | 问题 | 修复方式 | 状态 |
|---|------|---------|------|
| 1 | 设置界面打不开 | 添加 `.startup-guide-backdrop` CSS（所有模态框共用） | ✅ 完成 |
| 2 | 初设引导不够突出，没有具体引导 | 重写 `InitialSetupGuide.tsx`（280 行），8 步向导 + 进度条 + 步骤指示器 | ✅ 完成 |
| 3 | 没有引入和 AI 对话的建议 | 每步添加「AI 建议」按钮，传递 `onAskAi` prop 到 App，自动打开助手并发送提问 | ✅ 完成 |

### 新增 CSS（modern.css +140 行）

- `.startup-guide-backdrop` — 模态框背景遮罩（fix modal visibility）
- `.startup-guide-enhanced` — 增强版初设容器
- `.setup-mode-toggle` — 逐步/全部填写切换
- `.setup-progress-bar`, `.setup-progress-fill` — 进度条
- `.setup-step-indicators`, `.setup-step-dot`, `.is-current`, `.is-done` — 步骤指示器
- `.setup-stepped-body` — 逐步模式内容区
- `.setup-field-card`, `.is-active`, `.is-filled` — 字段卡片
- `.setup-field-head`, `.setup-field-number`, `.setup-field-label`, `.setup-field-badge` — 字段头部
- `.setup-ai-btn` — AI 建议按钮
- `.setup-field-hint` — 字段提示文字
- `.setup-step-nav`, `.setup-submit-btn` — 步骤导航
- `.setup-ai-footer`, `.setup-ai-all-btn` — AI 规划按钮

### 代码改动

- `web/src/components/InitialSetupGuide.tsx` — 完整重写（96 → 280 行）
- `web/src/App.tsx:117` — `useRef` 添加初始值参数
- `web/src/App.tsx:367` — 新增 `askAiFromSetup()` 函数
- `web/src/App.tsx:562` — 传递 `onAskAi={askAiFromSetup}` 到 InitialSetupGuide
- `web/src/styles/modern.css` — 添加 ~140 行增强初设样式

### 构建验证（当前会话）

```
vite v7.3.5 building client environment for production...
✓ 1732 modules transformed.
dist/index.html                 0.40 kB │ gzip:   0.30 kB
dist/assets/index-DLICx_1I.css 107.39 kB │ gzip:  11.61 kB
dist/assets/index-Cil6Y4Fb.js  373.30 kB │ gzip: 118.18 kB
✓ built in 2.71s
```

---

## 待办：系统性引导

用户反馈的其他问题：
- 其他功能不够系统性的引导
- 没有填入式内容
- 没有引入和 AI 对话的修改以及建议（针对其他工作区）

需要为每个工作区添加类似的引导和 AI 集成功能。
