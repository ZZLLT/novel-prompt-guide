# 🚀 项目深度优化计划 - 融合17个优秀项目

**创建时间：** 2026-06-13  
**目标：** 融合优秀开源项目的核心功能，打造专业级网文创作工具

---

## 📊 已完成功能总览

```
✅ 提示词管理系统（13个模板）
✅ 智能场景切换（10种场景）
✅ AI助手智能推荐（完整闭环）
✅ ReactFlow人物关系图
✅ shadcn/ui组件库
✅ 快捷键系统
✅ 8个工作区
```

---

## 🎯 优先级1：立即实现（1-2天）

### 1.1 角色卡片系统 ⭐⭐⭐⭐⭐

**参考：** [MuMuAINovel](https://github.com/xiamuceer-j/MuMuAINovel)

**功能描述：**
- 完整的角色卡片编辑器
- 角色特征标签系统
- 角色关系快速关联
- AI生成角色背景故事

**实现方案：**
```typescript
// 数据结构
type CharacterCard = {
  id: string;
  name: string;
  avatar?: string;
  role: 'protagonist' | 'supporting' | 'antagonist' | 'minor';
  
  // 基础信息
  age?: number;
  gender?: string;
  appearance: string;
  
  // 性格特征（标签）
  traits: string[];  // ['勇敢', '固执', '善良']
  
  // 背景故事
  background: string;
  motivation: string;  // 动机
  fear: string;        // 恐惧
  
  // 能力
  skills: string[];
  weaknesses: string[];
  
  // 关系
  relationships: Array<{
    targetId: string;
    type: string;
    description: string;
  }>;
  
  // 元数据
  createdAt: number;
  updatedAt: number;
};
```

**UI组件：**
- CharacterCardEditor - 编辑器
- CharacterGallery - 画廊视图
- CharacterTraitSelector - 特征标签选择器

**预计时间：** 6小时

---

### 1.2 场景卡片系统 ⭐⭐⭐⭐⭐

**参考：** [obsidian-storyline](https://github.com/PixeroJan/obsidian-storyline)

**功能描述：**
- 场景编辑器（场景、章节、幕）
- 场景状态管理（草稿/进行中/完成）
- 字数统计
- 场景关联（前置/后续场景）
- 涉及角色/地点标记

**实现方案：**
```typescript
type SceneCard = {
  id: string;
  title: string;
  type: 'scene' | 'chapter' | 'act';
  
  // 状态
  status: 'draft' | 'in-progress' | 'completed' | 'needs-revision';
  
  // 内容
  summary: string;      // 概要
  content: string;      // 正文
  notes: string;        // 笔记
  
  // 统计
  wordCount: number;
  targetWordCount?: number;
  
  // 关联
  characters: string[];  // 涉及角色ID
  locations: string[];   // 涉及地点ID
  plotlines: string[];   // 相关剧情线ID
  
  // 顺序
  order: number;
  previousScene?: string;
  nextScene?: string;
  
  // 元数据
  createdAt: number;
  updatedAt: number;
};
```

**UI组件：**
- SceneEditor - 场景编辑器
- SceneKanban - 看板视图（按状态分组）
- SceneTimeline - 时间线视图

**预计时间：** 8小时

---

### 1.3 剧情线追踪 ⭐⭐⭐⭐

**参考：** [obsidian-storyline](https://github.com/PixeroJan/obsidian-storyline)

**功能描述：**
- 主线/支线管理
- 剧情线状态追踪
- 场景关联
- 可视化展示

**实现方案：**
```typescript
type Plotline = {
  id: string;
  title: string;
  type: 'main' | 'subplot' | 'character-arc';
  
  description: string;
  status: 'setup' | 'development' | 'climax' | 'resolution' | 'completed';
  
  // 关联场景
  scenes: Array<{
    sceneId: string;
    order: number;
    note: string;
  }>;
  
  // 涉及角色
  characters: string[];
  
  // 进度
  progress: number;  // 0-100
  
  color: string;  // 可视化颜色
  
  createdAt: number;
  updatedAt: number;
};
```

**UI组件：**
- PlotlineManager - 剧情线管理器
- PlotlineVisualizer - 可视化展示（与场景时间线结合）

**预计时间：** 5小时

---

## 🎯 优先级2：短期实现（3-5天）

### 2.1 AI自动补全编辑器 ⭐⭐⭐⭐⭐

**参考：** [novel (steven-tey)](https://github.com/steven-tey/novel)

**功能描述：**
- Notion风格WYSIWYG编辑器
- AI自动补全（Cmd+J）
- TipTap扩展支持
- Markdown快捷键

**技术栈：**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install ai @ai-sdk/openai
```

**核心功能：**
- `/` 斜杠命令（快速插入）
- AI续写（选中文本 + Cmd+J）
- AI改写/润色/扩写
- 实时字数统计

**预计时间：** 12小时

---

### 2.2 时间线可视化编辑器 ⭐⭐⭐⭐⭐

**参考：** [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor)

**功能描述：**
- 拖拽式时间线编辑
- 多轨道支持（角色线/剧情线/时间线）
- 场景卡片时间轴排列
- 伏笔标记和提醒

**实现方案：**
```bash
npm install @xzdarcy/react-timeline-editor
```

**功能设计：**
```typescript
type TimelineTrack = {
  id: string;
  name: string;
  type: 'character' | 'plotline' | 'scene';
  items: Array<{
    id: string;
    start: number;
    end: number;
    title: string;
    color: string;
    data: any;
  }>;
};
```

**UI特点：**
- 轨道颜色区分
- 缩放/平移
- 时间标尺
- 悬浮预览

**预计时间：** 10小时

---

### 2.3 进度追踪仪表板 ⭐⭐⭐⭐

**参考：** [obsidian-storyline](https://github.com/PixeroJan/obsidian-storyline) + MuMuAINovel

**功能描述：**
- 总体字数统计
- 章节完成度
- 日常写作目标
- 写作速度分析
- 剧情线完成度

**实现方案：**
```typescript
type WritingProgress = {
  // 总体统计
  totalWords: number;
  targetWords: number;
  percentComplete: number;
  
  // 章节统计
  chaptersCompleted: number;
  chaptersTotal: number;
  scenesCompleted: number;
  scenesTotal: number;
  
  // 日常目标
  dailyTarget: number;
  todayWords: number;
  streak: number;  // 连续天数
  
  // 历史记录
  writingHistory: Array<{
    date: string;
    words: number;
  }>;
  
  // 剧情线进度
  plotlines: Array<{
    id: string;
    name: string;
    progress: number;
  }>;
};
```

**可视化：**
- 进度环形图
- 字数趋势图（7天/30天）
- 剧情线进度条
- 热力图日历

**预计时间：** 8小时

---

## 🎯 优先级3：中期实现（1-2周）

### 3.1 世界观百科（Codex系统） ⭐⭐⭐⭐

**参考：** [obsidian-storyline](https://github.com/PixeroJan/obsidian-storyline) Codex功能

**功能描述：**
- 分类管理（地点/物品/组织/生物/魔法）
- 标签系统
- 关联场景
- 搜索和筛选

**数据结构：**
```typescript
type CodexEntry = {
  id: string;
  category: 'location' | 'item' | 'faction' | 'creature' | 'magic' | 'custom';
  name: string;
  description: string;
  
  // 属性（根据类别不同）
  properties: Record<string, any>;
  
  // 标签
  tags: string[];
  
  // 关联
  relatedEntries: string[];
  relatedScenes: string[];
  
  // 图片
  image?: string;
  
  createdAt: number;
  updatedAt: number;
};
```

**UI组件：**
- CodexBrowser - 浏览器
- CodexEditor - 编辑器
- CodexSearch - 搜索

**预计时间：** 10小时

---

### 3.2 版本控制和历史记录 ⭐⭐⭐

**功能描述：**
- 场景版本历史
- 对比差异
- 回滚功能
- 分支写作（多个版本对比）

**实现方案：**
```typescript
type SceneVersion = {
  id: string;
  sceneId: string;
  version: number;
  content: string;
  wordCount: number;
  note: string;
  createdAt: number;
  createdBy: string;
};
```

**预计时间：** 6小时

---

### 3.3 导出功能 ⭐⭐⭐⭐

**参考：** Manuskript导出功能

**支持格式：**
- Word (DOCX)
- ePub
- PDF
- Markdown
- 纯文本

**导出选项：**
- 章节选择
- 格式模板
- 目录生成
- 页眉页脚
- 字体样式

**预计时间：** 8小时

---

## 🎯 优先级4：长期规划（1个月+）

### 4.1 协作功能 ⭐⭐

**功能：**
- 多人同时编辑
- 评论系统
- 变更追踪
- 权限管理

**预计时间：** 20小时

---

### 4.2 插件系统 ⭐⭐⭐

**功能：**
- 自定义提示词
- 自定义场景类型
- 自定义导出模板
- 主题系统

**预计时间：** 15小时

---

### 4.3 移动端适配 ⭐⭐

**功能：**
- 响应式布局
- 触摸优化
- 离线支持

**预计时间：** 12小时

---

## 📋 推荐实施顺序

### 第1周：核心内容管理
```
Day 1-2: 角色卡片系统（6h）
Day 3-4: 场景卡片系统（8h）
Day 5:   剧情线追踪（5h）
Day 6-7: 进度追踪仪表板（8h）
```

### 第2周：编辑器升级
```
Day 1-3: AI自动补全编辑器（12h）
Day 4-5: 时间线可视化编辑器（10h）
```

### 第3周：世界观和导出
```
Day 1-2: 世界观百科（10h）
Day 3-4: 版本控制（6h）
Day 5-6: 导出功能（8h）
```

---

## 🔧 技术栈升级

### 新增依赖
```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@xzdarcy/react-timeline-editor": "^0.x",
  "ai": "^3.x",
  "@ai-sdk/openai": "^0.x",
  "docx": "^8.x",
  "epub-gen": "^0.x",
  "jspdf": "^2.x",
  "recharts": "^2.x"
}
```

### 目录结构优化
```
web/src/
├── components/
│   ├── character/
│   │   ├── CharacterCard.tsx
│   │   ├── CharacterEditor.tsx
│   │   └── CharacterGallery.tsx
│   ├── scene/
│   │   ├── SceneCard.tsx
│   │   ├── SceneEditor.tsx
│   │   ├── SceneKanban.tsx
│   │   └── SceneTimeline.tsx
│   ├── plotline/
│   │   ├── PlotlineManager.tsx
│   │   └── PlotlineVisualizer.tsx
│   ├── editor/
│   │   ├── NovelEditor.tsx
│   │   ├── AICompletion.tsx
│   │   └── EditorExtensions.tsx
│   ├── timeline/
│   │   └── TimelineEditor.tsx
│   ├── progress/
│   │   └── ProgressDashboard.tsx
│   └── codex/
│       ├── CodexBrowser.tsx
│       └── CodexEditor.tsx
├── hooks/
│   ├── useCharacters.ts
│   ├── useScenes.ts
│   ├── usePlotlines.ts
│   └── useProgress.ts
└── types/
    ├── character.ts
    ├── scene.ts
    ├── plotline.ts
    └── codex.ts
```

---

## 📊 功能对比表

| 功能 | 当前状态 | 目标状态 | 参考项目 |
|------|---------|---------|---------|
| 角色管理 | 基础关系图 | 完整卡片系统 | MuMuAINovel |
| 场景管理 | 无 | 卡片+状态追踪 | obsidian-storyline |
| 剧情线 | 基础伏笔 | 可视化追踪 | obsidian-storyline |
| 编辑器 | 基础textarea | AI自动补全 | novel |
| 时间线 | 无 | 可视化编辑器 | react-timeline-editor |
| 进度追踪 | 无 | 完整仪表板 | MuMuAINovel |
| 世界观 | 基础设定 | Codex系统 | obsidian-storyline |
| 导出 | 无 | 多格式导出 | Manuskript |

---

## 💰 预计时间投入

```
优先级1（立即）：    19小时（2-3天）
优先级2（短期）：    30小时（4-5天）
优先级3（中期）：    24小时（3-4天）
优先级4（长期）：    47小时（6-7天）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计：              120小时（15-19天）
```

---

## 🎯 立即行动计划

### 明天开始：角色卡片系统

**Why选择角色卡片？**
1. 用户需求强烈（网文核心）
2. 与现有关系图完美配合
3. 数据结构清晰
4. UI组件可复用
5. 立即见效

**实施步骤：**
1. 创建数据类型（1h）
2. 创建CharacterCardEditor组件（3h）
3. 创建CharacterGallery组件（2h）
4. 集成到现有关系图（1h）
5. 测试和优化（1h）

---

## 📚 参考项目链接

1. [MuMuAINovel](https://github.com/xiamuceer-j/MuMuAINovel) - 角色管理、进度追踪
2. [obsidian-storyline](https://github.com/PixeroJan/obsidian-storyline) - 场景、剧情线、Codex
3. [novel by steven-tey](https://github.com/steven-tey/novel) - AI自动补全编辑器
4. [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor) - 时间线编辑器
5. [Manuskript](https://github.com/olivierkes/manuskript) - 导出功能

---

**下一步：立即实现角色卡片系统！**
