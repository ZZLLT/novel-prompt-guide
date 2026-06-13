# Claude 接手交接文档：小说文档工作室 UI 重构

接手项目：`D:\OH-WorkSpace\novel-prompt-guide`

当前项目不是 git repo，不能依赖 `git status`、`git diff` 或提交历史判断改动。请直接检查文件内容。

## 本轮已完成

### 1. UI 风格重构

目标是把原来的深色/霓虹/控制台式界面改成更适合小说文档写作的“文档工作室”风格。

主要效果：

- 主界面从深色 cockpit 改为浅色、低噪音、文档优先的工作台。
- 顶部按钮减少，只保留高频入口：`初设引导`、`工作台设置`、`AI 助手`。
- 预算区压缩为小尺寸状态区，避免抢占主写作区。
- 功能窗口保持可多开、可拖动、可调整大小、可直接发 AI 指令。
- 人物关系窗口改成浅色网格，人物卡片缩小，关系线颜色更清晰。
- 设置、API、多模型、工作区切换等低频控制收纳到独立设置窗口。

### 2. 新增工作台设置窗口

入口：顶部按钮 `工作台设置`

直达参数：

```text
http://127.0.0.1:5173/?setup=closed&settings=open
```

设置窗口包含：

- 常用：初设引导、API 设置、刷新链路
- 布局：收起/展开项目导航、收起/打开 AI 助手
- 工作区：初设、写作、剧情线、人物关系、世界设定、AI 协作、设置
- 状态：WPS、API、Token

相关文件：

- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/styles/app.css`

### 3. 功能窗口入口分组

原来 `窗口总览` 里 11 个按钮同时铺开，界面很乱。现在改为：

- 工作组快捷打开：
  - 规划工作组
  - 人物线工作组
  - 成稿工作组
- 单窗口分类：
  - 规划：预算、规划、上下文、模式
  - 成稿：蓝图、文档、流水线、引擎
  - 故事维护：人物、伏笔、审计

所有单窗口仍然可以：

- 多开
- 拖动
- 调整大小
- 从窗口内直接给 AI 发送短指令
- 从窗口 dock 恢复/打开

相关文件：

- `web/src/components/ChapterCockpit.tsx`
- `web/src/App.test.tsx`
- `web/src/styles/app.css`

### 4. 设计记录

已新增设计记录：

```text
docs/superpowers/specs/2026-06-09-editorial-studio-ui-design.md
```

该文档定义了本轮 UI 方向：

- Document-first
- Low-noise editorial style
- Dense desktop workflow
- Windowed tools
- AI explicit, no hidden auto calls

## 关键改动文件

请优先阅读这些文件：

```text
web/src/App.tsx
web/src/App.test.tsx
web/src/components/ChapterCockpit.tsx
web/src/components/StoryFlowMap.tsx
web/src/styles/tokens.css
web/src/styles/app.css
docs/superpowers/specs/2026-06-09-editorial-studio-ui-design.md
```

其中 `web/src/styles/app.css` 已经很大，当前做法是在文件底部追加 Editorial Studio 覆写层，尽量减少大范围重写风险。后续如果继续优化，建议逐步拆分 CSS，而不是继续无限追加。

## 验证结果

本轮最后一次验证均通过：

```powershell
npm test -- --run
```

结果：

```text
6 passed
76 tests passed
```

```powershell
npm run build
```

结果：通过。

```powershell
python -m pytest tests -q
```

结果：

```text
80 passed
```

```powershell
python -m py_compile server.py prompt_system.py wps_mcp_bridge.py plotpilot_fusion.py
```

结果：通过。

## 截图自检产物

截图保存在：

```text
tmp/editorial-settings-v2.png
tmp/editorial-grouped-windows-v1.png
tmp/editorial-relations-v2.png
tmp/editorial-window-v2.png
tmp/editorial-write-v2.png
```

其中最重要的是：

- `tmp/editorial-settings-v2.png`：工作台设置窗口
- `tmp/editorial-grouped-windows-v1.png`：功能窗口分组后的写作区
- `tmp/editorial-relations-v2.png`：浅色人物关系窗口

## 启动方式

前端开发界面：

```powershell
npm run dev
```

默认地址：

```text
http://127.0.0.1:5173/
```

后端：

```powershell
npm start
```

实际执行的是：

```powershell
python server.py
```

常用直达链接：

```text
http://127.0.0.1:5173/?setup=closed
http://127.0.0.1:5173/?setup=closed&settings=open
http://127.0.0.1:5173/?setup=closed&workspace=relationships&relations=open
http://127.0.0.1:5173/?setup=closed&feature=planner
```

## 接手时请注意

### 不要恢复旧 UI

用户明确反馈：

- UI 太丑
- 按钮都在一个界面太乱
- 不是要抄其他项目 UI
- 是要重构成适合写小说文档的界面

所以后续不要回到深色霓虹、控制台、大片按钮、卡片堆满屏的方向。

### 不要引入隐藏 API 调用

用户非常在意 token 消耗。当前原则：

- AI 请求必须由用户显式点击触发。
- 不要自动轮询调用 LLM。
- 不要因为窗口打开、切换 tab、拖动人物线就调用 API。
- 提交给 AI 的内容应尽量是短结构化上下文。

### 测试中已有相关保护

`web/src/App.test.tsx` 和 `web/src/components/StoryFlowMap.test.tsx` 覆盖了：

- 初设引导
- API 设置
- 多模型路由
- 工作台设置窗口
- 功能窗口分组
- 功能窗口拖动/缩放
- 窗口内 AI 指令
- 人物关系窗口
- 人物关系建议入图
- 无隐藏 API 调用

## 建议 Claude 后续任务

### 优先级 1：CSS 拆分

`web/src/styles/app.css` 已经过大。建议拆成：

```text
web/src/styles/base.css
web/src/styles/workspace.css
web/src/styles/windows.css
web/src/styles/relationships.css
web/src/styles/assistant.css
web/src/styles/api-settings.css
```

注意拆分时必须保持测试通过。

### 优先级 2：继续减少主界面低频内容

当前主界面已经减少顶部按钮和功能窗口按钮，但仍有不少模块直接堆在写作区：

- Prompt Plaza
- Story Flow Map
- InkOS Reference Panel
- Generation Mode Panel
- Creative Playbook
- Field Grid
- Preview Grid

建议继续做“折叠/窗口化/分区切换”，但不要移除功能。

### 优先级 3：人物关系编辑继续增强

可继续优化：

- 人物节点可拖动后保存布局
- 关系线拖动后更直观地修改关系
- 关系卡片固定位置和多线连接预设
- 关系变化随剧情事件生成 delta
- 更明确的人物信息面板

注意：这些操作不应自动调用 AI，除非用户点击提交。

### 优先级 4：启动入口体验

用户之前反馈“找不到启动项”。建议增加：

- README 启动说明
- `start-dev.bat`
- `start-all.bat`
- 明确前端地址和后端地址
- 检测端口占用并提示

### 优先级 5：API 模型获取体验

用户之前反馈“已填入 API，但无法获取相关模型”。建议继续检查：

- `fetchLlmModels`
- 后端 `/api/llm/models`
- endpoint 是否自动规范化 `/v1`、`/models`
- OpenAI compatible 网关错误信息是否清晰
- API key 是否只保存在后端，不泄露到前端日志

## 给 Claude 的建议工作流

1. 先运行：

```powershell
npm test -- --run
python -m pytest tests -q
```

2. 启动前端：

```powershell
npm run dev
```

3. 打开：

```text
http://127.0.0.1:5173/?setup=closed&settings=open
```

4. 对照截图：

```text
tmp/editorial-settings-v2.png
tmp/editorial-grouped-windows-v1.png
tmp/editorial-relations-v2.png
```

5. 再继续做拆分或下一轮 UI 优化。

## 最后一次已知稳定状态

最后一次完整验证时间：2026-06-09

结果：

- 前端测试：76 passed
- 前端构建：passed
- 后端测试：80 passed
- Python 编译：passed
- 截图自检：passed

当前交接文档写入时间：2026-06-11
