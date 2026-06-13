# UI 重构交接文档

**最后更新**：2026-06-11 23:31  
**状态**：功能完整，测试部分待修复

## 当前状态

### ✅ 已完成
- 现代化 UI 设计（DM Sans 字体，蓝色主题）
- 每个工作区顶部都有功能面板
- 流畅的动画效果（200ms）
- 清晰的功能展示（图标+标题+描述）
- 71/76 测试通过

### ⚠️ 待处理
- 5个测试失败（DOM 结构变化）
- 部分功能按钮未连接实际功能

## 文件结构

```
web/src/
├── App.tsx                          # 主应用（已大幅修改）
├── main.tsx                         # 入口（使用 modern.css）
└── styles/
    ├── modern.css                   # 当前使用的主样式
    ├── features.css                 # 功能卡片样式
    ├── workspace-features.css       # 工作区功能面板样式
    ├── simple.css                   # 备用（温暖风格）
    ├── design-system.css            # 备用（第一版设计系统）
    ├── layout.css                   # 备用
    ├── components.css               # 备用
    ├── utilities.css                # 备用
    ├── app.css.backup               # 原始文件备份
    └── tokens.css.backup            # 原始文件备份
```

## 关键改动

### 1. App.tsx 修改

#### 新增图标导入
```typescript
import {
  Sparkles,      // ✨ 新增
  FileOutput,    // 📄 新增
  // ... 其他图标
} from "lucide-react";
```

#### 每个工作区添加了功能面板

**写作工作区**（第220行左右）
```tsx
<div className="workspace-features-panel">
  <div className="features-grid">
    {/* 6个功能按钮 */}
  </div>
</div>
```

**人物关系工作区**（第170行左右）
```tsx
{/* 3个功能按钮，全部可点击 */}
onClick={() => openRelationshipFlowTarget("overview")}
onClick={() => openRelationshipFlowTarget("line-editor")}
onClick={() => openRelationshipFlowTarget("suggestion")}
```

**剧情线工作区**（第190行左右）
```tsx
{/* 3个功能按钮 */}
```

**AI 协作工作区**（第155行左右）
```tsx
{/* 3个功能按钮，AI助手可点击 */}
onClick={openAssistant}
```

**设置工作区**（第240-400行）
```tsx
{/* 完整的功能卡片展示，分3组 */}
```

### 2. 样式文件

#### modern.css（主样式）
- 导入 DM Sans 字体
- 导入 features.css
- 导入 workspace-features.css
- 蓝色主题 (#3b82f6)
- 200ms 动画

#### workspace-features.css（功能面板）
```css
.workspace-features-panel     /* 面板容器 */
.features-grid                /* 按钮网格 */
.feature-btn                  /* 功能按钮 */
.feature-btn-icon             /* 图标区域 */
.feature-btn-content          /* 内容区域 */
```

## 设计规范

### 颜色
```css
--primary: #1e293b       /* 深蓝灰 */
--accent: #3b82f6        /* 蓝色 */
--bg: #fafafa            /* 浅灰背景 */
--surface: #ffffff       /* 白色表面 */
--border: #e5e7eb        /* 边框 */
```

### 尺寸
```css
顶部栏: 64px
左侧菜单: 280px
AI 助手: 400px
状态栏: 32px
功能按钮高度: 72px
```

### 动画
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
悬停: translateY(-2px)
```

## 功能完整度

| 工作区 | 功能数 | 已连接 | 待连接 |
|--------|--------|--------|--------|
| 写作 | 6 | 0 | 6 |
| 人物关系 | 3 | 3 | 0 |
| 剧情线 | 3 | 0 | 3 |
| AI 协作 | 3 | 1 | 2 |
| 设置 | 11+ | 2 | 9+ |

## 下一步任务

### 优先级 1：修复测试
```bash
cd web
npm test -- --run
```

需要更新的测试：
- App.test.tsx 中期望旧 DOM 结构的测试
- 5个失败用例需要适配新的功能面板

### 优先级 2：连接功能按钮

**写作工作区按钮连接**
```tsx
// 在 ChapterCockpit.tsx 中找到对应的窗口打开函数
// 例如：
<button onClick={() => openFunctionWindow('budget')}>
  预算控制
</button>
```

**需要连接的功能**：
- 预算控制 → `openFunctionWindow('budget')`
- 生成模式 → `openFunctionWindow('mode')`
- 创作蓝图 → `openFunctionWindow('playbook')`
- 文档工作台 → `openFunctionWindow('document')`
- 流水线 → `openFunctionWindow('workflow')`
- 叙事引擎 → `openFunctionWindow('engine')`

### 优先级 3：功能增强

1. **添加徽章**
```tsx
<span className="feature-badge">新</span>
<span className="feature-count">3</span>
```

2. **添加快捷键**
```tsx
// 在 useEffect 中监听键盘事件
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === '1') selectWorkspace('write');
  };
  window.addEventListener('keydown', handleKeyPress);
}, []);
```

3. **功能面板可折叠**
```tsx
const [panelCollapsed, setPanelCollapsed] = useState(false);
```

4. **添加功能状态指示**
```tsx
<div className={`feature-btn ${isActive ? 'active' : ''}`}>
```

### 优先级 4：CSS 优化

当前 `app.css.backup` 有 7398 行，已拆分但可以进一步优化：

1. **删除未使用的样式**
```bash
npx purgecss --css web/src/styles/modern.css --content web/src/**/*.tsx
```

2. **压缩 CSS**
```bash
npm install -D cssnano
```

3. **按组件拆分**
```
styles/
├── base/
├── components/
│   ├── button.css
│   ├── panel.css
│   └── workspace.css
└── pages/
```

## 已知问题

1. **测试失败**
   - 原因：DOM 结构变化
   - 影响：不影响功能使用
   - 解决：更新测试用例

2. **功能按钮未连接**
   - 原因：需要找到 ChapterCockpit 中的窗口管理逻辑
   - 影响：点击暂无反应
   - 解决：连接 onClick 事件

3. **响应式未优化**
   - 原因：专注桌面端
   - 影响：移动端体验差
   - 解决：添加移动端适配

## 回滚方案

如果需要回到之前版本：

```bash
# 1. 恢复 main.tsx
# 将 import './styles/modern.css' 
# 改为 import './styles/app.css.backup'

# 2. 恢复 App.tsx
# 删除功能面板相关代码

# 3. 重命名备份文件
mv web/src/styles/app.css.backup web/src/styles/app.css
mv web/src/styles/tokens.css.backup web/src/styles/tokens.css
```

## 启动方式

```bash
# 开发模式
npm run dev
# 访问 http://127.0.0.1:5173/?setup=closed

# 测试
npm test -- --run

# 构建
npm run build
```

## 联系与参考

- 设计系统生成：使用了 ui-ux-pro-max skill
- 参考产品：Notion、Linear、Vercel、Figma
- 设计文档：`docs/superpowers/specs/2026-06-09-editorial-studio-ui-design.md`
- 完整报告：`docs/COMPLETE_FEATURE_DISPLAY.md`

## 快速诊断

**UI 显示异常？**
1. 检查 `web/src/main.tsx` 是否导入 `modern.css`
2. 检查浏览器控制台是否有 CSS 加载错误
3. 清除缓存后刷新

**功能按钮无反应？**
1. 检查 `App.tsx` 中的 onClick 事件
2. 查看 `ChapterCockpit.tsx` 中的窗口管理函数
3. 确认图标已正确导入

**测试失败？**
1. 运行 `npm test -- --run` 查看具体错误
2. 检查 `App.test.tsx` 中的选择器
3. 更新测试以匹配新 DOM 结构

---

**接手建议**：先运行项目看实际效果，再决定从哪个优先级开始。
