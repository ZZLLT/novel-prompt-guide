# 人物关系展示优化方案

**日期：** 2026-06-13  
**目标：** 优化人物关系的可视化，使其更直观、易用

---

## 📊 当前方案分析

### 现有设计

**类型：** 力导向图（Force-Directed Graph）

**组件：**
- 4 个角色节点（主角、女主、反派、导师）
- 3 条关系边（hero-heroine, hero-rival, mentor-hero）
- SVG 路径连接
- 可拖动的画布（zoom + pan）
- 关系强度显示

**优点：**
- ✅ 视觉冲击力强
- ✅ 关系一目了然
- ✅ 符合图论直觉

**缺点：**
- ❌ 实现复杂（需要处理拖拽、缩放、碰撞检测）
- ❌ 信息密度低（大量空间只显示几个节点）
- ❌ 不易扩展（5+ 角色时会很乱）
- ❌ 移动端体验差
- ❌ 难以展示详细信息（cause, nextShift, evolution 等）

---

## 🎯 优化目标

1. **降低认知负担** - 用户应该一眼看懂关系
2. **提高信息密度** - 在有限空间内展示更多信息
3. **简化实现** - 减少复杂的 SVG 和拖拽逻辑
4. **响应式友好** - 移动端也能良好展示
5. **易于扩展** - 支持更多角色和关系

---

## 💡 方案 A：优化图形化展示（渐进式改进）

### A1. 固定布局替代力导向

**改进：** 使用预定义的角色位置，而非动态计算

**布局方案：**
```
     导师(force)
        |
     主角(lead)
      /   \
  女主     反派
 (ally)  (shadow)
```

**优点：**
- 简化拖拽逻辑
- 位置可预测
- 性能更好

**CSS Grid 实现：**
```css
.relationship-canvas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 40px;
}

.actor-node[data-lane="force"] { grid-area: 1 / 2 / 2 / 3; }
.actor-node[data-lane="lead"] { grid-area: 2 / 2 / 3 / 3; }
.actor-node[data-lane="ally"] { grid-area: 3 / 1 / 4 / 2; }
.actor-node[data-lane="shadow"] { grid-area: 3 / 3 / 4 / 4; }
```

### A2. 简化关系线

**改进：** 使用直线 + 箭头，而非复杂的贝塞尔曲线

**实现：**
```tsx
<line
  x1={fromX}
  y1={fromY}
  x2={toX}
  y2={toY}
  stroke={toneColor}
  strokeWidth={strength / 20}
  markerEnd="url(#arrowhead)"
/>
```

### A3. Hover 卡片展示详情

**改进：** 鼠标悬停时显示完整信息

```tsx
<div className="relationship-tooltip">
  <h3>{edge.from} → {edge.to}</h3>
  <p><strong>状态：</strong>{edge.status}</p>
  <p><strong>强度：</strong>{edge.strength}/100</p>
  <p><strong>首见：</strong>{edge.firstSeen}</p>
  <p><strong>原因：</strong>{edge.cause}</p>
  <p><strong>下一步：</strong>{edge.nextShift}</p>
  <p><strong>演化：</strong>{edge.evolution}</p>
</div>
```

---

## 🎨 方案 B：表格/卡片式展示（推荐）

### B1. 关系矩阵视图

**设计：** 使用表格显示人物之间的关系

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│         │ 主角    │ 女主    │ 反派    │ 导师    │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ 主角    │    -    │ ↔ 互相  │ ⚡ 对抗 │ ← 扶持  │
│         │         │ 试探 64 │   82   │   57   │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ 女主    │ ↔ 试探  │    -    │   -    │   -    │
│         │   64    │         │        │        │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ 反派    │ ⚡ 对抗 │   -     │    -   │   -    │
│         │   82    │         │        │        │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ 导师    │ → 扶持  │   -     │   -    │    -   │
│         │   57    │         │        │        │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

**优点：**
- ✅ 信息密度高
- ✅ 一目了然
- ✅ 易于实现
- ✅ 响应式友好
- ✅ 易于扩展（添加角色只需添加行/列）

**实现：**
```tsx
<table className="relationship-matrix">
  <thead>
    <tr>
      <th></th>
      {actors.map(actor => (
        <th key={actor.id}>{actor.name}</th>
      ))}
    </tr>
  </thead>
  <tbody>
    {actors.map(actorRow => (
      <tr key={actorRow.id}>
        <th>{actorRow.name}</th>
        {actors.map(actorCol => {
          const edge = findEdge(actorRow.id, actorCol.id);
          return (
            <td key={actorCol.id} className={edge ? 'has-relation' : ''}>
              {edge ? (
                <button onClick={() => showDetail(edge)}>
                  <span className="relation-icon">{getIcon(edge.tone)}</span>
                  <span className="relation-status">{edge.status}</span>
                  <span className="relation-strength">{edge.strength}</span>
                </button>
              ) : '-'}
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>
```

### B2. 卡片列表视图

**设计：** 每个关系用一张卡片展示

```
┌──────────────────────────────────────────────────┐
│ 主角 ↔ 女主                      [互相试探] 64% │
├──────────────────────────────────────────────────┤
│ 首见：第1章                                      │
│ 指导：主角为了证明新规则可行，必须借女主的资源  │
│       进入禁区。                                 │
│ 原因：双方目标一致但信任不足，女主怀疑主角隐瞒  │
│       金手指代价。                               │
│ 演化：互不信任 → 临时合作 → 互相背书            │
│ 下一步：从合作变成互相背书，随后因一次选择产生  │
│         信任裂缝。                               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ 主角 → 反派                      [明暗对抗] 82% │
├──────────────────────────────────────────────────┤
│ ...                                              │
└──────────────────────────────────────────────────┘
```

**优点：**
- ✅ 信息最完整
- ✅ 阅读顺畅
- ✅ 易于编辑
- ✅ 支持长文本

**实现：**
```tsx
<div className="relationship-card-list">
  {relationshipEdges.map(edge => (
    <article key={edge.id} className="relationship-card">
      <header>
        <div className="relation-parties">
          <span className="actor-name">{edge.from}</span>
          <span className="relation-arrow">↔</span>
          <span className="actor-name">{edge.to}</span>
        </div>
        <div className="relation-meta">
          <span className={`status status-${edge.tone}`}>{edge.status}</span>
          <span className="strength">{edge.strength}%</span>
        </div>
      </header>
      <dl className="relation-details">
        <dt>首见</dt>
        <dd>{edge.firstSeen}</dd>
        
        <dt>指导</dt>
        <dd>{edge.guide}</dd>
        
        <dt>原因</dt>
        <dd>{edge.cause}</dd>
        
        <dt>演化</dt>
        <dd>{edge.evolution}</dd>
        
        <dt>下一步</dt>
        <dd>{edge.nextShift}</dd>
      </dl>
      <footer>
        <button onClick={() => editRelation(edge)}>编辑</button>
        <button onClick={() => trackInTimeline(edge)}>查看时间线</button>
      </footer>
    </article>
  ))}
</div>
```

### B3. 时间线视图（推荐）

**设计：** 按场景顺序展示关系变化

```
第1章 ─────────────────────────────────────

  S01 禁区入口
  ┌────────────────────────────────────┐
  │ 主角 ↔ 女主：互相试探 [64%]        │
  │ 主角借女主资源进入禁区，但女主要求  │
  │ 交代能力代价。                      │
  └────────────────────────────────────┘

第2章 ─────────────────────────────────────

  S02 公开失败
  ┌────────────────────────────────────┐
  │ 主角 → 反派：明暗对抗 [82%]        │
  │ 反派制造公开失败，迫使主角暴露能力  │
  │ 边界。                              │
  └────────────────────────────────────┘

  S03 条件担保
  ┌────────────────────────────────────┐
  │ 导师 → 主角：带条件扶持 [57%]      │
  │ 导师从旁观者转为担保人，埋下背叛   │
  │ 误会。                              │
  └────────────────────────────────────┘
```

**优点：**
- ✅ 符合创作思路（按剧情顺序）
- ✅ 清晰展示关系演化
- ✅ 与场景卡片联动
- ✅ 易于理解

---

## 🎯 推荐方案：B3 时间线 + B1 矩阵

### 组合方案

**主视图：** 时间线视图（默认）  
**辅助视图：** 关系矩阵（快速查看全局）

**布局：**
```
┌─────────────────────────────────────────────┐
│ [时间线视图] [矩阵视图] [列表视图]         │ ← 标签切换
├─────────────────────────────────────────────┤
│                                             │
│  时间线内容区域                              │
│  （按章节分组的关系变化）                     │
│                                             │
├─────────────────────────────────────────────┤
│ 当前选中：主角 ↔ 女主                        │
│ [完整信息面板]                               │
└─────────────────────────────────────────────┘
```

---

## 💻 实现建议

### 方案 1：完全重写（推荐）

**步骤：**
1. 创建新组件 `RelationshipTimeline.tsx`
2. 创建新组件 `RelationshipMatrix.tsx`
3. 创建新组件 `RelationshipCardList.tsx`
4. 在 `StoryFlowMap.tsx` 中添加视图切换
5. 逐步迁移数据和逻辑

**预估时间：** 3-4 小时

### 方案 2：渐进式改进

**步骤：**
1. 保留现有图形视图
2. 添加"切换到表格视图"按钮
3. 实现简化的表格视图
4. 收集用户反馈
5. 根据反馈决定是否移除图形视图

**预估时间：** 2-3 小时

---

## 📊 方案对比

| 指标 | 图形视图（当前） | 矩阵视图（B1） | 卡片列表（B2） | 时间线（B3） |
|------|-----------------|---------------|---------------|-------------|
| **实现复杂度** | 高 (SVG + 拖拽) | 低 (表格) | 低 (卡片) | 中 (分组) |
| **信息密度** | 低 | 高 | 中 | 高 |
| **可读性** | 中 | 高 | 高 | 最高 |
| **扩展性** | 差 (5+角色很乱) | 优 (N×N) | 优 (线性) | 优 (线性) |
| **移动端** | 差 | 优 | 优 | 优 |
| **编辑友好** | 差 | 中 | 优 | 优 |
| **视觉冲击** | 高 | 低 | 中 | 中 |
| **符合思路** | 低 | 中 | 中 | 最高 |

**推荐：** 时间线视图（B3）+ 矩阵视图（B1）组合

---

## 🎨 设计稿（时间线视图）

### 视觉风格

**色彩方案：**
- cyan (互相/合作)：`#2dd4bf`
- magenta (对抗/冲突)：`#f472b6`
- amber (单向/引导)：`#fbbf24`

**卡片样式：**
```css
.timeline-item {
  background: var(--color-bg);
  border-left: 4px solid var(--tone-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.timeline-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateX(4px);
}
```

**章节分隔：**
```css
.chapter-divider {
  display: flex;
  align-items: center;
  margin: 32px 0 16px;
  color: var(--color-text-subtle);
  font-weight: 600;
}

.chapter-divider::after {
  content: "";
  flex: 1;
  height: 2px;
  background: var(--color-border);
  margin-left: 16px;
}
```

---

## 🚀 下一步

请选择你想要的方案：

### 选项 A：完全重写为时间线视图
- 移除复杂的 SVG 图形
- 实现时间线 + 矩阵组合视图
- 更符合创作思路
- **推荐** ⭐

### 选项 B：优化现有图形视图
- 简化拖拽逻辑
- 改用固定布局
- 添加详情卡片
- 保留视觉冲击力

### 选项 C：双视图并存
- 保留图形视图
- 添加表格/时间线视图
- 让用户选择
- 工作量最大

**我的推荐：选项 A - 完全重写为时间线视图**

原因：
1. 时间线更符合创作者的思维方式（按剧情顺序）
2. 信息密度更高，展示更完整
3. 实现更简单，维护成本低
4. 移动端友好
5. 易于扩展（支持更多角色和关系）

---

**你想选择哪个方案？我可以立即开始实现。**
