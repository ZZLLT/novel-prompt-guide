# 🎯 智能场景切换系统实现报告

**完成时间：** 2026-06-13  
**状态：** ✅ 核心功能已实现  
**功能：** 根据用户输入自动识别写作场景，推荐最合适的提示词模板

---

## ✅ 已实现功能

### 1️⃣ 场景自动检测系统 ✅

**文件：** `web/src/utils/sceneDetection.ts`

**功能：**
- ✅ 10种写作场景自动识别
- ✅ 关键词智能匹配
- ✅ 场景上下文生成
- ✅ 智能推荐算法

**支持的场景：**
```typescript
1. opening        - 开场写作（开场、开头、第一章）
2. climax         - 高潮冲突（高潮、冲突、爆发）
3. character      - 人物塑造（人物、角色、性格）
4. dialogue       - 对话场景（对话、谈话、交流）
5. scene          - 场景描写（场景、环境、氛围）
6. continue       - 章节续写（续写、继续、接下来）
7. outline        - 大纲规划（大纲、规划、结构）
8. worldbuilding  - 世界观构建（世界观、设定、体系）
9. transition     - 转折情节（转折、意外、反转）
10. ending        - 结尾收束（结尾、收尾、结束）
```

---

### 2️⃣ 智能推荐组件 ✅

**文件：** `web/src/components/prompts/SmartRecommendation.tsx`

**功能：**
- ✅ 场景识别显示
- ✅ 推荐提示词模板列表
- ✅ 最常用模板展示
- ✅ 收藏模板快速访问
- ✅ 写作提示（每个场景4条要点）

**UI特点：**
- 渐变背景 + 蓝色边框
- 入场动画（slideIn）
- 卡片式布局
- 点击即可选择模板

---

### 3️⃣ AI助手输入框增强 ✅

**文件：** `web/src/components/AIAssistantInput.tsx`

**功能：**
- ✅ 实时场景检测（输入≥5字符自动触发）
- ✅ 智能推荐自动展示
- ✅ 一键填充提示词模板
- ✅ Shift+Enter换行
- ✅ Enter发送

**工作流程：**
```
用户输入 "帮我写第一章的开场"
    ↓
检测到：opening场景（开场写作）
    ↓
显示智能推荐：
  - 场景推荐：悬念式开场、动作式开场
  - 最常用：[用户最常用的模板]
  - 我的收藏：[用户收藏的模板]
  - 写作提示：4条开场写作要点
    ↓
用户点击模板
    ↓
自动填充到输入框
    ↓
用户微调后发送给AI
```

---

## 🎨 视觉效果

### 智能推荐卡片
```
┌─────────────────────────────────┐
│ 💡 智能推荐                     │
│                                  │
│ ✨ 开场写作                     │
│                                  │
│ 场景推荐                         │
│ ┌─────────────────────────┐    │
│ │ 悬念式开场              │    │
│ │ 制造悬念，吸引读者好奇心│    │
│ └─────────────────────────┘    │
│ ┌─────────────────────────┐    │
│ │ 动作式开场              │    │
│ │ 以激烈动作或冲突开始    │    │
│ └─────────────────────────┘    │
│                                  │
│ 📈 最常用                       │
│ ┌─────────────────────────┐    │
│ │ 章节大纲生成            │    │
│ │ 已使用 15 次            │    │
│ └─────────────────────────┘    │
│                                  │
│ ⭐ 我的收藏                     │
│ ┌───┐ ┌───┐ ┌───┐             │
│ │...│ │...│ │...│             │
│ └───┘ └───┘ └───┘             │
│                                  │
│ 写作提示                         │
│ • 开篇即入场景，避免大段背景     │
│ • 用动作或对话开场               │
│ • 暗示核心冲突                   │
│ • 制造悬念                       │
└─────────────────────────────────┘
```

---

## 🔧 技术实现

### 场景检测算法

```typescript
export function detectWritingScene(userInput: string): WritingScene {
  const input = userInput.toLowerCase();

  for (const sceneData of SCENE_KEYWORDS) {
    for (const keyword of sceneData.keywords) {
      if (input.includes(keyword)) {
        return sceneData.scene;
      }
    }
  }

  return "unknown";
}
```

### 智能推荐算法

```typescript
export function getSmartRecommendations(
  userInput: string,
  allTemplates: PromptTemplate[]
): {
  scene: WritingScene;
  sceneDescription: string;
  recommendedTemplates: PromptTemplate[];  // 场景匹配
  mostUsedTemplate: PromptTemplate | null; // 使用频率
  favoriteTemplates: PromptTemplate[];     // 收藏状态
}
```

**综合考虑：**
1. 场景匹配（主要因素）
2. 使用频率（历史习惯）
3. 收藏状态（用户偏好）

---

## 📊 使用示例

### 示例1：开场写作

**用户输入：**
```
帮我写第一章的开场，主角叫林轩
```

**系统响应：**
```
✨ 检测到场景：开场写作

推荐模板：
1. 悬念式开场
2. 动作式开场

写作提示：
• 开篇即入场景，避免大段背景
• 用动作或对话开场
• 暗示核心冲突
• 制造悬念
```

---

### 示例2：高潮冲突

**用户输入：**
```
林轩和张浩的冲突爆发了
```

**系统响应：**
```
✨ 检测到场景：高潮冲突

推荐模板：
1. 冲突爆发
2. 真相揭示

写作提示：
• 情绪饱满，节奏快速
• 对话和动作结合
• 推向情绪顶点
• 留有余韵
```

---

### 示例3：人物塑造

**用户输入：**
```
新角色苏晴的出场描写
```

**系统响应：**
```
✨ 检测到场景：人物塑造

推荐模板：
1. 人物初登场
2. 人物成长时刻

写作提示：
• 通过行动展现性格
• 给角色独特语言风格
• 设计标志性细节
• 明确欲望和恐惧
```

---

## 🎯 与Claude Code Skills的区别

### Claude Code Skills方式
```
优点：
✅ 系统级集成
✅ 自动触发
✅ 跨项目复用

缺点：
❌ 需要.claude/skills/目录权限
❌ 需要SKILL.md文件
❌ 配置相对复杂
```

### 我们的实现方式
```
优点：
✅ 无需特殊权限
✅ 完全项目内控制
✅ 可视化UI展示
✅ 即时反馈
✅ 易于扩展

特点：
🎨 UI驱动，用户友好
📊 智能推荐，多维度考虑
🔄 实时检测，无需额外触发
💾 持久化存储，记录习惯
```

---

## 🚀 下一步增强

### 优先级1：集成到AI助手 ⭐⭐⭐⭐⭐

**目标：** 在AI助手面板显示智能推荐

**实现方案：**
```typescript
// 在AgentCommandDeck.tsx中
import { AIAssistantInput } from "./AIAssistantInput";

// 替换原有textarea
<AIAssistantInput
  onSend={(message) => {
    onAssistantInput(message);
    onAskAssistant();
  }}
  placeholder="例如：基于当前阶段，给我一个更省 token 的提示词..."
/>
```

---

### 优先级2：上下文增强 ⭐⭐⭐⭐

**目标：** 根据当前工作区自动提供上下文

**实现：**
```typescript
// 当前在"写作"工作区
场景提示 + "当前章节：第3章" + "主角：林轩"

// 当前在"人物关系"工作区  
场景提示 + "已有角色：林轩、苏晴、张浩"

// 当前在"世界设定"工作区
场景提示 + "当前设定：修炼体系、等级划分"
```

---

### 优先级3：学习用户习惯 ⭐⭐⭐

**目标：** 根据使用历史优化推荐

**实现：**
- 记录每个场景的模板使用频率
- 记录用户的修改习惯
- 动态调整推荐权重

---

## 📚 参考项目

我们参考了这些优秀项目和资源：

1. **[story-skills](https://github.com/danjdewhurst/story-skills)**
   - Claude Code插件架构
   - Markdown驱动的提示词
   - 端到端写作流程

2. **[AI-automatically-generates-novels](https://github.com/wfcz10086/AI-automatically-generates-novels)**
   - 场景切换理念
   - 提示词管理
   - 效率优化策略

3. **Claude AI最佳实践**
   - 结构化提示词（XML标签）
   - Context/Requirements格式
   - 场景驱动的提示工程

4. **Claude Code技能文档**
   - [如何构建和安装Claude Skills](https://www.verdent.ai/guides/how-to-build-install-claude-skills)
   - [Claude Code Skills市场指南](https://skywork.ai/blog/ai-bot/install-claude-skills-ultimate-guide/)
   - [技能工厂](https://github.com/alirezarezvani/claude-code-skill-factory)

---

## 💡 使用建议

### 1. 精确输入
```
❌ "写点东西"         → 场景不明确
✅ "写第一章开场"     → 识别为opening场景
✅ "继续写对话"       → 识别为dialogue场景
```

### 2. 包含关键词
```
建议在输入中包含：
- 场景类型（开场、高潮、转折）
- 动作类型（写、续写、描写）
- 对象（人物、场景、对话）
```

### 3. 善用收藏
```
常用模板 → 点⭐收藏
场景推荐中会优先显示收藏的模板
```

---

## 📊 统计数据

```
新增文件：3个
新增代码：~600行
支持场景：10种
默认提示词：13个
关键词总数：70+个

场景检测准确率：预计85%+（基于关键词匹配）
推荐相关度：综合场景+使用频率+收藏状态
```

---

## 🎊 总结

### 已实现 ✅
- ✅ 场景自动检测系统
- ✅ 智能推荐组件
- ✅ AI助手输入框增强
- ✅ 完整的CSS样式
- ✅ 10种场景支持
- ✅ 70+关键词库

### 待集成 ⏳
- ⏳ 集成到AgentCommandDeck
- ⏳ 上下文自动填充
- ⏳ 学习用户习惯

### 优势 🌟
- 🎨 无需特殊权限
- 📊 可视化UI
- 🔄 实时检测
- 💾 持久化记录
- 🚀 易于扩展

---

**下一步：将AIAssistantInput组件集成到AgentCommandDeck中，完成智能推荐的完整闭环！**

**参考来源：**
- [story-skills - GitHub](https://github.com/danjdewhurst/story-skills)
- [AI-automatically-generates-novels - GitHub](https://github.com/wfcz10086/AI-automatically-generates-novels)
- [Claude Skills开发指南](https://www.verdent.ai/guides/how-to-build-install-claude-skills)
- [Claude Code技能市场](https://skillsmp.com/)
