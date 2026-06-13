# 🚀 组件迁移策略 - 分阶段执行

## 📋 当前状态

**已安装组件：** 7 个
- ✅ Button
- ✅ Skeleton
- ✅ Sonner (Toast)
- ✅ Input
- ✅ Label
- ✅ Card
- ✅ Badge

**待迁移组件数量：** ~100+ 个原生元素

---

## 🎯 拆分策略：小步快跑

### 原则

1. **一次只迁移一个文件**
2. **每次迁移后立即测试**
3. **优先迁移小文件**
4. **高可见度组件优先**

---

## 📊 Phase 1：初设引导 (InitialSetupGuide.tsx)

**文件大小：** 中等  
**可见度：** ⭐⭐⭐⭐⭐ 极高（首次打开时显示）  
**复杂度：** 低  
**预计时间：** 30 分钟

### 迁移内容
- [ ] 标题和描述 → 使用 Card 组件
- [ ] 表单输入框 → Input + Label
- [ ] 按钮 → Button 组件
- [ ] 标签 → Badge 组件

### 迁移步骤
```bash
1. 读取 InitialSetupGuide.tsx
2. 识别所有 <button> 和 <input>
3. 逐个替换为 Button 和 Input
4. 测试功能正常
5. 提交变更
```

---

## 📊 Phase 2：API 设置窗口 (ApiSettingsWindow.tsx)

**文件大小：** 小  
**可见度：** ⭐⭐⭐⭐ 高  
**复杂度：** 低  
**预计时间：** 20 分钟

### 迁移内容
- [ ] 输入框 → Input + Label
- [ ] 按钮 → Button 组件
- [ ] 状态徽章 → Badge 组件

---

## 📊 Phase 3：工作区设置 (WorkspaceSettingsWindow.tsx)

**文件大小：** 中等  
**可见度：** ⭐⭐⭐ 中  
**复杂度：** 中  
**预计时间：** 30 分钟

### 迁移内容
- [ ] 设置卡片 → Card 组件
- [ ] 切换按钮 → Button variant
- [ ] 状态指示 → Badge

---

## 📊 Phase 4：功能按钮网格 (FeatureButtonGrid.tsx)

**文件大小：** 小  
**可见度：** ⭐⭐⭐⭐ 高  
**复杂度：** 低  
**预计时间：** 20 分钟

### 迁移内容
- [ ] 功能卡片 → Card 组件
- [ ] 操作按钮 → Button 组件
- [ ] 标签 → Badge

---

## 📊 Phase 5：顶部导航栏 (App.tsx - 顶栏部分)

**文件大小：** 小（仅顶栏）  
**可见度：** ⭐⭐⭐⭐⭐ 极高  
**复杂度：** 低  
**预计时间：** 15 分钟

### 迁移内容
- [ ] 顶栏按钮 → Button 组件
- [ ] 图标按钮 → Button size="icon"

---

## 📊 Phase 6：侧边导航 (App.tsx - 导航部分)

**文件大小：** 小  
**可见度：** ⭐⭐⭐⭐⭐ 极高  
**复杂度：** 中  
**预计时间：** 25 分钟

### 迁移内容
- [ ] 导航按钮 → Button variant="ghost"
- [ ] Active 状态样式优化

---

## 📊 Phase 7-12：功能窗口（小窗口优先）

**按文件大小排序，从小到大：**

1. ⏳ BudgetWindow.tsx (预算控制)
2. ⏳ GenerationModeWindow.tsx (生成模式)
3. ⏳ PlaybookWindow.tsx (创作蓝图)
4. ⏳ DocumentWindow.tsx (文档工作台)
5. ⏳ WorkflowWindow.tsx (流水线)
6. ⏳ AuditWindow.tsx (审计)

**每个窗口：** 15-20 分钟

---

## 📊 Phase 13+：大型组件（最后处理）

1. ⏳ ChapterCockpit.tsx (章节工作台)
2. ⏳ StoryFlowMap.tsx (先拆分再迁移)
3. ⏳ AgentCommandDeck.tsx (AI 助手)

---

## 🎯 今天的目标：完成 Phase 1-3

**预计总时间：** 1.5 小时  
**完成后可见成果：**
- ✨ 初设引导使用 shadcn/ui 组件
- ✨ API 设置窗口现代化
- ✨ 工作区设置更美观

---

## 🔄 执行流程（每个 Phase）

```bash
# 1. 读取目标文件
Read <target-file>

# 2. 创建备份分支（可选）
git checkout -b migrate/<component-name>

# 3. 执行迁移（小范围修改）
Edit <target-file>
# 只替换 3-5 个元素

# 4. 测试构建
npm run build

# 5. 视觉测试
npm run dev
# 手动检查 UI

# 6. 提交（可选）
git add <target-file>
git commit -m "migrate: <component-name> to shadcn/ui"

# 7. 重复 3-6 直到文件完成
```

---

## 📝 迁移检查清单（每个组件）

### 替换映射

**按钮：**
```tsx
❌ <button type="button" onClick={...}>文本</button>
✅ <Button onClick={...}>文本</Button>

❌ <button className="primary">保存</button>
✅ <Button>保存</Button>

❌ <button className="secondary">取消</button>
✅ <Button variant="outline">取消</Button>

❌ <button className="danger">删除</button>
✅ <Button variant="destructive">删除</Button>
```

**输入框：**
```tsx
❌ <input type="text" placeholder="..." />
✅ <Input placeholder="..." />

❌ <label>标签</label><input />
✅ <Label>标签</Label><Input />
```

**卡片：**
```tsx
❌ <div className="card">
     <h3>标题</h3>
     <p>描述</p>
   </div>
✅ <Card>
     <CardHeader>
       <CardTitle>标题</CardTitle>
       <CardDescription>描述</CardDescription>
     </CardHeader>
   </Card>
```

**徽章：**
```tsx
❌ <span className="badge">标签</span>
✅ <Badge>标签</Badge>

❌ <span className="status online">在线</span>
✅ <Badge variant="secondary">在线</Badge>
```

---

## 🚨 注意事项

### 保持功能一致

1. **事件处理器** - 保持所有 onClick, onChange 不变
2. **Aria 属性** - 保留所有无障碍属性
3. **条件渲染** - 不要改变显示逻辑
4. **样式覆盖** - 使用 className prop 添加自定义样式

### 测试要点

1. **视觉检查** - 按钮、输入框位置和样式
2. **交互测试** - 点击、输入是否正常
3. **状态测试** - Hover、Focus、Disabled 状态
4. **响应式** - 不同屏幕尺寸

---

## 📊 进度追踪

```
Phase 1: InitialSetupGuide    ░░░░░░░░░░░░░░░░░░░░  0%
Phase 2: ApiSettingsWindow     ░░░░░░░░░░░░░░░░░░░░  0%
Phase 3: WorkspaceSettings     ░░░░░░░░░░░░░░░░░░░░  0%
Phase 4: FeatureButtonGrid     ░░░░░░░░░░░░░░░░░░░░  0%
Phase 5: App.tsx (顶栏)        ░░░░░░░░░░░░░░░░░░░░  0%
Phase 6: App.tsx (导航)        ░░░░░░░░░░░░░░░░░░░░  0%
Phase 7-12: 功能窗口           ░░░░░░░░░░░░░░░░░░░░  0%
Phase 13+: 大型组件            ░░░░░░░░░░░░░░░░░░░░  0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总体进度                        ░░░░░░░░░░░░░░░░░░░░  0%
```

---

## 🎯 立即开始：Phase 1

**目标文件：** InitialSetupGuide.tsx  
**预计时间：** 30 分钟  
**开始吗？** 👇

准备好后我们开始第一个文件的迁移！
