# 🎯 项目功能扩展研究报告

**研究时间：** 2026-06-13  
**目标：** 为novel-prompt-guide项目寻找可融合的优秀功能和内容

---

## 📚 发现的优秀项目分类

### 🌟 一、国际开源项目

#### 1. [mythos](https://github.com/TheMostlyGreat/mythos)
**功能：** LLM小说写作应用
- ✅ 生成概念、开发角色、创建设定
- ✅ 编写完整章节
- ✅ 支持OpenAI和Anthropic模型

**可借鉴功能：**
- 角色自动生成系统
- 设定生成模板
- 章节结构化生成

**融合难度：** ⭐⭐⭐ (中等)

---

#### 2. [Story-timeline-builder](https://github.com/denmurray10/Story-timeline-builder)
**功能：** Django故事时间线构建器
- ✅ 交互式时间线管理
- ✅ 角色关系映射
- ✅ 章节组织
- ✅ 世界观构建工具
- ✅ AI写作辅助

**可借鉴功能：**
- 时间线可视化组件
- 事件依赖关系
- 多书系列管理

**融合难度：** ⭐⭐⭐⭐ (较难，需适配Django→React)

---

#### 3. [novel](https://github.com/steven-tey/novel)
**功能：** Notion风格WYSIWYG编辑器
- ✅ AI自动补全
- ✅ 所见即所得编辑
- ✅ React + TypeScript

**可借鉴功能：**
- 富文本编辑器
- AI自动补全功能
- Notion风格交互

**融合难度：** ⭐⭐⭐ (中等)

---

#### 4. [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor)
**功能：** React时间线编辑器组件
- ✅ 时间线动画编辑器
- ✅ 拖拽排序
- ✅ React组件，易集成

**可借鉴功能：**
- 剧情时间线
- 伏笔时间点标记
- 章节时间顺序

**融合难度：** ⭐⭐ (简单)
**推荐指数：** ⭐⭐⭐⭐⭐

---

#### 5. [story-skills](https://github.com/danjdewhurst/story-skills)
**功能：** Claude Code故事写作插件
- ✅ 端到端故事写作
- ✅ Markdown驱动
- ✅ Claude Code原生技能

**可借鉴功能：**
- 技能系统架构
- Markdown工作流
- 提示词模板

**融合难度：** ⭐⭐ (简单，技能集成)
**推荐指数：** ⭐⭐⭐⭐⭐

---

### 🇨🇳 二、国内开源项目

#### 6. [MuMuAINovel](https://github.com/xiamuceer-j/MuMuAINovel)
**功能：** AI智能小说创作助手
- ✅ 角色管理
- ✅ 剧情规划
- ✅ 章节生成
- ✅ 无需编程

**可借鉴功能：**
- 完整的网文工作流程
- 简化的用户体验
- 角色卡片系统

**融合难度：** ⭐⭐⭐ (中等)

---

#### 7. [AI-automatically-generates-novels](https://github.com/wfcz10086/AI-automatically-generates-novels)
**功能：** AI自动生成小说工具（v5.2）
- ✅ AI + 提示词管理
- ✅ 智能拆书
- ✅ 生书名简介
- ✅ 正文润色
- ✅ **shift+L快捷词条**
- ✅ 效率提升20倍

**可借鉴功能：**
- 快捷词条系统 ⭐⭐⭐⭐⭐
- 提示词管理 ⭐⭐⭐⭐⭐
- 智能拆书功能
- 书名简介生成

**融合难度：** ⭐⭐ (简单)
**推荐指数：** ⭐⭐⭐⭐⭐

---

#### 8. [novel-writer-skills](https://github.com/Shine8592/novel-writer-skills)
**功能：** 零成本AI中文小说写作
- ✅ 900K+字符
- ✅ ¥0 API开销
- ✅ 3个OpenClaw技能

**可借鉴功能：**
- 成本优化策略
- 技能系统设计
- 中文提示词优化

**融合难度：** ⭐⭐ (简单，技能集成)

---

#### 9. [inking](https://github.com/nanmenyu/inking)
**功能：** 深度、简洁、直观的写作工具
- ✅ 适合小说创作
- ✅ 简洁UI

**可借鉴功能：**
- UI/UX设计理念
- 简洁的交互模式

**融合难度：** ⭐ (参考设计)

---

### 📝 三、传统写作工具

#### 10. [Manuskript](https://github.com/olivierkes/manuskript)
**功能：** 开源Scrivener替代
- ✅ 角色数据库
- ✅ 设定数据库
- ✅ 对象数据库
- ✅ 草稿管理
- ✅ 导出ePub/ODT/DOCX

**可借鉴功能：**
- 数据库结构设计
- 导出功能
- 分心模式

**融合难度：** ⭐⭐⭐⭐ (较难，Python桌面应用)

---

#### 11. [TreeWriter](https://github.com/Blecki/TreeWriter)
**功能：** 手稿编辑工具
- ✅ 树形章节结构
- ✅ 专为长篇小说设计

**可借鉴功能：**
- 树形导航
- 章节层级管理

**融合难度：** ⭐⭐⭐ (中等)

---

#### 12. [warewoolf](https://github.com/brsloan/warewoolf)
**功能：** 极简小说写作系统
- ✅ 无鼠标可用
- ✅ 富文本编辑器
- ✅ 键盘优先

**可借鉴功能：**
- 键盘快捷键系统
- 无鼠标操作设计

**融合难度：** ⭐⭐ (简单)

---

### 🎨 四、Claude Code技能

#### 13. Creative Storytelling Skill (mcpmarket.com)
**功能：** 创意故事写作技能
- ✅ 小说写作框架
- ✅ 漫画脚本
- ✅ 世界观构建

**可借鉴功能：**
- 框架系统
- 提示词模板

**融合难度：** ⭐ (直接安装)

---

#### 14. Creative Writing Craft Skill (mcpmarket.com)
**功能：** 创意写作工艺技能
- ✅ 故事架构工具包
- ✅ 角色发展
- ✅ 视角细微差别

**可借鉴功能：**
- 完整工具包
- 写作技巧指导

**融合难度：** ⭐ (直接安装)

---

### 🔧 五、Awesome Lists

#### 15. [awesome-writing-tools](https://github.com/yowainwright/awesome-writing-tools)
**内容：** 写作工具精选列表
- 语法检查
- 风格指南
- 编辑器
- 组织工具

**价值：** 发现更多工具

---

#### 16. [awesome-writing](https://github.com/armstrongl/awesome-writing)
**内容：** 写作资源列表
- 写作指南
- 工具推荐
- 学习资源

**价值：** 综合参考

---

#### 17. [awesome-wysiwyg](https://github.com/JiHong88/awesome-wysiwyg)
**内容：** WYSIWYG编辑器列表
- 富文本编辑器
- Markdown编辑器
- 代码编辑器

**价值：** 选择合适编辑器

---

## 💡 推荐融合功能优先级

### 🥇 优先级1：立即实现（1-2天）

#### 1.1 快捷词条系统 ⭐⭐⭐⭐⭐
**来源：** AI-automatically-generates-novels
**功能：**
- shift+L快速插入常用词条
- 预设词条库（人名、地名、功法等）
- 自定义词条
- 分类管理

**实现方案：**
```typescript
// 数据结构
type QuickSnippet = {
  id: string;
  category: string; // 人名/地名/功法/情节
  label: string;
  content: string;
  hotkey?: string;
};

// 组件位置
web/src/components/QuickSnippets.tsx
web/src/hooks/useQuickSnippets.ts
```

**效果：** 效率提升20倍

---

#### 1.2 提示词管理系统 ⭐⭐⭐⭐⭐
**来源：** AI-automatically-generates-novels + story-skills
**功能：**
- 提示词模板库
- 分类管理（开场/高潮/转折/人物/场景）
- 导入/导出提示词
- 历史记录
- 收藏功能

**实现方案：**
```typescript
// 数据结构
type PromptTemplate = {
  id: string;
  category: string;
  title: string;
  content: string;
  variables: string[]; // 可替换变量
  tags: string[];
  favorite: boolean;
};

// 新增工作区
"prompts" 工作区
```

**效果：** 增强AI助手功能

---

#### 1.3 增强快捷键系统 ⭐⭐⭐⭐
**来源：** warewoolf + useShortcuts（已有）
**功能：**
- shift+L: 快捷词条
- Ctrl+P: 提示词搜索
- Ctrl+Shift+C: 复制当前章节
- Ctrl+Shift+N: 新建角色
- Ctrl+Shift+R: 新建关系

**实现方案：** 扩展现有useShortcuts.ts

**效果：** 键盘流操作，效率倍增

---

### 🥈 优先级2：短期实现（3-5天）

#### 2.1 时间线可视化 ⭐⭐⭐⭐⭐
**来源：** react-timeline-editor + Story-timeline-builder
**功能：**
- 章节时间线
- 伏笔埋设时间点
- 角色出场时间线
- 事件依赖关系
- 拖拽调整顺序

**实现方案：**
```bash
npm install react-timeline-editor
```

**新增组件：**
```
web/src/components/timeline/
├── TimelineView.tsx
├── ChapterTimeline.tsx
├── PlotPointTimeline.tsx
└── CharacterTimeline.tsx
```

**效果：** 剧情线工作区可视化增强

---

#### 2.2 角色自动生成 ⭐⭐⭐⭐
**来源：** mythos
**功能：**
- 根据简短描述生成完整角色
- 自动生成背景故事
- 性格特征分析
- 动机和目标
- 关系建议

**实现方案：**
- 集成到现有人物关系工作区
- 新增"AI生成角色"按钮
- 使用Claude API生成

**效果：** 减少角色创建时间

---

#### 2.3 富文本编辑器升级 ⭐⭐⭐⭐
**来源：** novel (Notion风格)
**功能：**
- Notion风格编辑
- AI自动补全
- Markdown支持
- 代码块
- 图片插入

**实现方案：**
```bash
# 考虑使用
- novel (Notion风格)
- TipTap (灵活)
- Lexical (Meta出品)
```

**效果：** 写作体验大幅提升

---

### 🥉 优先级3：中期实现（1-2周）

#### 3.1 智能拆书/生成大纲 ⭐⭐⭐⭐
**来源：** AI-automatically-generates-novels + MuMuAINovel
**功能：**
- 输入简短故事概念
- AI生成完整大纲
- 章节结构规划
- 剧情节拍建议
- 角色配置建议

**实现方案：**
- 新增"智能大纲"功能窗口
- 使用Claude API生成
- 可编辑和调整

---

#### 3.2 书名简介生成器 ⭐⭐⭐
**来源：** AI-automatically-generates-novels
**功能：**
- 根据大纲生成书名
- 生成简介/文案
- 多个备选方案
- 风格选择（爽文/仙侠/都市等）

**实现方案：**
- 集成到初设工作区
- 新增"生成书名"按钮

---

#### 3.3 章节树形导航 ⭐⭐⭐
**来源：** TreeWriter + Manuskript
**功能：**
- 树形章节结构
- 拖拽重排序
- 卷/篇/章层级
- 折叠/展开
- 快速跳转

**实现方案：**
```typescript
// 使用React组件库
- react-arborist
- react-complex-tree
```

---

### 🏆 优先级4：长期规划（1个月+）

#### 4.1 导出功能增强 ⭐⭐⭐⭐
**来源：** Manuskript
**功能：**
- 导出Word (DOCX)
- 导出ePub
- 导出PDF
- 导出Markdown
- 自定义模板

---

#### 4.2 版本控制/历史记录 ⭐⭐⭐
**功能：**
- 章节版本历史
- 对比差异
- 回滚功能
- 分支写作

---

#### 4.3 协作功能 ⭐⭐
**功能：**
- 多人协作
- 评论功能
- 权限管理

---

## 🎯 推荐实施计划

### 第一周：快捷词条+提示词管理

**Day 1-2: 快捷词条系统**
1. 创建QuickSnippets组件
2. 实现shift+L触发
3. 创建默认词条库
4. 持久化存储

**Day 3-5: 提示词管理系统**
1. 创建提示词库数据结构
2. 新增"提示词库"工作区
3. 实现分类管理
4. 导入默认提示词模板
5. 集成到AI助手

---

### 第二周：时间线可视化

**Day 1-3: 安装和配置**
1. 安装react-timeline-editor
2. 创建TimelineView组件
3. 适配现有数据结构

**Day 4-5: 功能完善**
1. 章节时间线
2. 伏笔时间点
3. 拖拽排序

---

### 第三周：富文本编辑器

**Day 1-3: 编辑器选型和安装**
1. 评估novel/TipTap/Lexical
2. 安装和配置
3. 基础集成

**Day 4-5: AI自动补全**
1. 集成Claude API
2. 实现自动补全
3. 测试优化

---

## 📚 参考资源链接

### 开源项目
- [mythos - LLM小说写作应用](https://github.com/TheMostlyGreat/mythos)
- [Story-timeline-builder - Django故事时间线](https://github.com/denmurray10/Story-timeline-builder)
- [novel - Notion风格编辑器](https://github.com/steven-tey/novel)
- [react-timeline-editor - React时间线组件](https://github.com/xzdarcy/react-timeline-editor)
- [story-skills - Claude Code故事技能](https://github.com/danjdewhurst/story-skills)
- [MuMuAINovel - AI智能小说助手](https://github.com/xiamuceer-j/MuMuAINovel)
- [AI-automatically-generates-novels - AI自动生成小说](https://github.com/wfcz10086/AI-automatically-generates-novels)
- [novel-writer-skills - 零成本写作技能](https://github.com/Shine8592/novel-writer-skills)
- [inking - 简洁写作工具](https://github.com/nanmenyu/inking)
- [Manuskript - 开源写作工具](https://github.com/olivierkes/manuskript)
- [TreeWriter - 手稿编辑器](https://github.com/Blecki/TreeWriter)
- [warewoolf - 极简写作系统](https://github.com/brsloan/warewoolf)

### Claude Code资源
- [story-skills GitHub](https://github.com/danjdewhurst/story-skills)
- [claude-code-skills Marketplace](https://github.com/daymade/claude-code-skills)
- [Skills Marketplace](https://skillsmp.com/)
- [Creative Storytelling Skill](https://mcpmarket.com/tools/skills/creative-storytelling)
- [Creative Writing Craft Skill](https://mcpmarket.com/tools/skills/creative-writing-craft-1)

### Awesome Lists
- [awesome-writing-tools](https://github.com/yowainwright/awesome-writing-tools)
- [awesome-writing](https://github.com/armstrongl/awesome-writing)
- [awesome-wysiwyg](https://github.com/JiHong88/awesome-wysiwyg)

### 教程和指南
- [Story Development with Claude](https://intfiction.org/t/story-development-with-claude-a-methodology-for-authored-interactive-fiction/79033)
- [Claude for Writing a Book](https://kenny-kane.com/claude-for-writing-a-book)
- [10 Claude Prompts for Story Writing](https://chatsmith.io/blogs/prompt/claude-prompts-for-story-writing-00218)
- [Using Claude for Long-Form Fiction](https://yourcreativeedge.substack.com/p/using-claude-for-long-form-fiction)

---

## 🎊 总结

### 最推荐融合的功能（按优先级）

1. **快捷词条系统** ⭐⭐⭐⭐⭐
   - 最简单
   - 最实用
   - 立即见效

2. **提示词管理系统** ⭐⭐⭐⭐⭐
   - 增强AI助手
   - 提升工作效率
   - 易于实现

3. **时间线可视化** ⭐⭐⭐⭐⭐
   - 视觉化提升
   - React组件
   - 易于集成

4. **富文本编辑器** ⭐⭐⭐⭐
   - 体验提升
   - 现代化
   - AI自动补全

5. **角色自动生成** ⭐⭐⭐⭐
   - 功能扩展
   - AI驱动
   - 减少重复工作

---

**建议：** 先实现快捷词条和提示词管理，立即提升项目实用性！
