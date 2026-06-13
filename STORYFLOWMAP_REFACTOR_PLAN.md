# 📦 StoryFlowMap.tsx 拆分计划

**当前状态：** 2225 行超大文件  
**目标：** 拆分为多个小于 500 行的模块

---

## 🎯 拆分目标

### 原则

1. **单一职责** - 每个组件只负责一个功能
2. **可测试性** - 独立文件更容易测试
3. **可维护性** - 小文件更容易理解和修改
4. **性能** - 可以使用 React.memo 优化

### 目标结构

```
web/src/components/story-flow/
├── StoryFlowMap.tsx (300行) - 主容器，协调子组件
├── index.ts - 导出
├── types.ts - 共享类型定义
├── hooks/
│   ├── useRelationshipState.ts - 关系图状态管理
│   ├── useTimelineState.ts - 时间线状态
│   └── useSuggestionState.ts - AI建议状态
├── relationship/
│   ├── RelationshipWindow.tsx (400行) - 关系窗口容器
│   ├── RelationshipToolbar.tsx (100行) - 工具栏
│   ├── RelationshipCanvas.tsx (300行) - 画布区域
│   ├── RelationshipSidebar.tsx (400行) - 侧边栏
│   ├── components/
│   │   ├── RelationshipLog.tsx (150行)
│   │   ├── ActorProfilePanel.tsx (200行)
│   │   ├── LineEditor.tsx (200行)
│   │   ├── PresetPanel.tsx (250行)
│   │   └── SuggestionPanel.tsx (200行)
│   └── graph/ (已存在 ReactFlow 组件)
│       ├── CharacterNode.tsx
│       ├── RelationshipEdge.tsx
│       ├── layout.ts
│       └── RelationshipGraphFlow.tsx
├── timeline/
│   ├── TimelinePanel.tsx (200行)
│   └── TimelineItem.tsx (50行)
└── scenes/
    ├── SceneCardBoard.tsx (200行)
    └── SceneCard.tsx (100行)
```

---

## 📊 当前文件分析

### StoryFlowMap.tsx (2225行) 包含：

**1. 状态管理 (~300行)**
```typescript
// 关系图状态
const [relationshipWindowOpen, setRelationshipWindowOpen] = useState(false)
const [selectedActorId, setSelectedActorId] = useState<string | null>(null)
const [selectedRelationEdge, setSelectedRelationEdge] = useState<...>()
// ... 更多状态

// 拆分为：useRelationshipState.ts
```

**2. 关系图窗口 (~800行)**
```tsx
{relationshipWindowOpen && (
  <section className="relationship-window-layer">
    {/* 工具栏 */}
    {/* ReactFlow 画布 */}
    {/* 侧边栏 */}
  </section>
)}

// 拆分为：RelationshipWindow.tsx
```

**3. 侧边栏组件 (~500行)**
```tsx
<div className="relationship-side-panel">
  <RelationshipLog edges={...} />
  <RelationshipPresetPanel ... />
  <ActorProfilePanel ... />
  <RelationshipLineEditor ... />
</div>

// 拆分为：RelationshipSidebar.tsx + 子组件
```

**4. 时间线 (~200行)**
```tsx
<div className="relationship-timeline">
  {/* 时间线内容 */}
</div>

// 拆分为：TimelinePanel.tsx
```

**5. 场景卡片 (~200行)**
```tsx
<div className="scene-card-board">
  {/* 场景卡片 */}
</div>

// 拆分为：SceneCardBoard.tsx
```

**6. AI 建议 (~200行)**
```tsx
{/* AI 建议相关逻辑 */}

// 拆分为：SuggestionPanel.tsx
```

---

## 🏗️ 拆分步骤

### 阶段 1：准备工作 (30分钟)

#### 1.1 创建目录结构
```bash
mkdir -p web/src/components/story-flow/{relationship/components,relationship/graph,timeline,scenes,hooks}
```

#### 1.2 创建类型文件
```typescript
// web/src/components/story-flow/types.ts
export type StoryActor = {
  id: string;
  name: string;
  role: string;
  lane: 'lead' | 'ally' | 'force' | 'shadow';
};

export type RelationshipEdge = {
  id: string;
  from: string;
  to: string;
  status: string;
  strength: number;
  tone: 'cyan' | 'amber' | 'magenta';
  cause: string;
  nextShift: string;
  evolution: string;
};

// ... 更多类型
```

#### 1.3 创建 index.ts
```typescript
// web/src/components/story-flow/index.ts
export { StoryFlowMap } from './StoryFlowMap';
export * from './types';
```

---

### 阶段 2：提取状态管理 (1小时)

#### 2.1 创建 useRelationshipState.ts

```typescript
// web/src/components/story-flow/hooks/useRelationshipState.ts
import { useState, useCallback } from 'react';
import type { StoryActor, RelationshipEdge } from '../types';

export function useRelationshipState(
  initialActors: StoryActor[],
  initialEdges: RelationshipEdge[]
) {
  const [actors, setActors] = useState(initialActors);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const addActor = useCallback((actor: StoryActor) => {
    setActors(prev => [...prev, actor]);
  }, []);

  const updateActor = useCallback((id: string, data: Partial<StoryActor>) => {
    setActors(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const removeActor = useCallback((id: string) => {
    setActors(prev => prev.filter(a => a.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
  }, []);

  const addEdge = useCallback((edge: RelationshipEdge) => {
    setEdges(prev => [...prev, edge]);
  }, []);

  const updateEdge = useCallback((id: string, data: Partial<RelationshipEdge>) => {
    setEdges(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const removeEdge = useCallback((id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    actors,
    edges,
    selectedActorId,
    selectedEdgeId,
    setSelectedActorId,
    setSelectedEdgeId,
    addActor,
    updateActor,
    removeActor,
    addEdge,
    updateEdge,
    removeEdge,
  };
}
```

---

### 阶段 3：拆分关系图窗口 (2小时)

#### 3.1 创建 RelationshipWindow.tsx

```typescript
// web/src/components/story-flow/relationship/RelationshipWindow.tsx
import { ReactFlowProvider } from 'reactflow';
import RelationshipToolbar from './RelationshipToolbar';
import RelationshipCanvas from './RelationshipCanvas';
import RelationshipSidebar from './RelationshipSidebar';
import type { StoryActor, RelationshipEdge } from '../types';

type Props = {
  actors: StoryActor[];
  edges: RelationshipEdge[];
  selectedActorId: string | null;
  selectedEdgeId: string | null;
  onActorClick: (id: string) => void;
  onEdgeClick: (id: string) => void;
  onClose: () => void;
};

export default function RelationshipWindow({
  actors,
  edges,
  selectedActorId,
  selectedEdgeId,
  onActorClick,
  onEdgeClick,
  onClose,
}: Props) {
  return (
    <section className="relationship-window-layer">
      <div className="relationship-window">
        <RelationshipToolbar onClose={onClose} />
        
        <div className="relationship-window-layout">
          <ReactFlowProvider>
            <RelationshipCanvas
              actors={actors}
              edges={edges}
              selectedActorId={selectedActorId}
              selectedEdgeId={selectedEdgeId}
              onActorClick={onActorClick}
              onEdgeClick={onEdgeClick}
            />
          </ReactFlowProvider>
          
          <RelationshipSidebar
            actors={actors}
            edges={edges}
            selectedActorId={selectedActorId}
            selectedEdgeId={selectedEdgeId}
          />
        </div>
      </div>
    </section>
  );
}
```

#### 3.2 创建 RelationshipToolbar.tsx

```typescript
// web/src/components/story-flow/relationship/RelationshipToolbar.tsx
import { Move, X } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export default function RelationshipToolbar({ onClose }: Props) {
  return (
    <header className="relationship-window-header">
      <div className="relationship-toolbar">
        <Move aria-hidden="true" size={16} />
        <span>ReactFlow 图谱</span>
        <button
          type="button"
          aria-label="关闭人物关系窗口"
          onClick={onClose}
        >
          <X aria-hidden="true" size={15} />
        </button>
      </div>
    </header>
  );
}
```

#### 3.3 创建 RelationshipCanvas.tsx

```typescript
// web/src/components/story-flow/relationship/RelationshipCanvas.tsx
import RelationshipGraphFlow from './graph/RelationshipGraphFlow';
import type { StoryActor, RelationshipEdge } from '../types';

type Props = {
  actors: StoryActor[];
  edges: RelationshipEdge[];
  selectedActorId: string | null;
  selectedEdgeId: string | null;
  onActorClick: (id: string) => void;
  onEdgeClick: (id: string) => void;
};

export default function RelationshipCanvas(props: Props) {
  return (
    <div className="relationship-canvas" aria-label="人物关系图谱">
      <RelationshipGraphFlow {...props} />
    </div>
  );
}
```

#### 3.4 创建 RelationshipSidebar.tsx

```typescript
// web/src/components/story-flow/relationship/RelationshipSidebar.tsx
import RelationshipLog from './components/RelationshipLog';
import ActorProfilePanel from './components/ActorProfilePanel';
import LineEditor from './components/LineEditor';
import PresetPanel from './components/PresetPanel';
import type { StoryActor, RelationshipEdge } from '../types';

type Props = {
  actors: StoryActor[];
  edges: RelationshipEdge[];
  selectedActorId: string | null;
  selectedEdgeId: string | null;
};

export default function RelationshipSidebar({
  actors,
  edges,
  selectedActorId,
  selectedEdgeId,
}: Props) {
  const selectedActor = actors.find(a => a.id === selectedActorId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  return (
    <div className="relationship-side-panel">
      <RelationshipLog edges={edges} />
      <PresetPanel />
      <ActorProfilePanel actor={selectedActor} actors={actors} edges={edges} />
      <LineEditor edge={selectedEdge} />
    </div>
  );
}
```

---

### 阶段 4：提取侧边栏子组件 (1.5小时)

每个子组件从原 StoryFlowMap.tsx 中复制对应的 JSX 和逻辑：

```typescript
// web/src/components/story-flow/relationship/components/RelationshipLog.tsx
// web/src/components/story-flow/relationship/components/ActorProfilePanel.tsx
// web/src/components/story-flow/relationship/components/LineEditor.tsx
// web/src/components/story-flow/relationship/components/PresetPanel.tsx
```

---

### 阶段 5：提取时间线和场景卡片 (1小时)

```typescript
// web/src/components/story-flow/timeline/TimelinePanel.tsx
// web/src/components/story-flow/scenes/SceneCardBoard.tsx
```

---

### 阶段 6：重写主组件 (30分钟)

```typescript
// web/src/components/story-flow/StoryFlowMap.tsx (300行)
import { useState } from 'react';
import RelationshipWindow from './relationship/RelationshipWindow';
import TimelinePanel from './timeline/TimelinePanel';
import SceneCardBoard from './scenes/SceneCardBoard';
import { useRelationshipState } from './hooks/useRelationshipState';

export function StoryFlowMap() {
  const [windowOpen, setWindowOpen] = useState(false);
  
  const {
    actors,
    edges,
    selectedActorId,
    selectedEdgeId,
    setSelectedActorId,
    setSelectedEdgeId,
    addActor,
    updateActor,
    // ... 更多方法
  } = useRelationshipState(initialActors, initialEdges);

  return (
    <div className="story-flow-map">
      {/* 打开关系窗口的按钮 */}
      
      {windowOpen && (
        <RelationshipWindow
          actors={actors}
          edges={edges}
          selectedActorId={selectedActorId}
          selectedEdgeId={selectedEdgeId}
          onActorClick={setSelectedActorId}
          onEdgeClick={setSelectedEdgeId}
          onClose={() => setWindowOpen(false)}
        />
      )}
      
      <TimelinePanel />
      <SceneCardBoard />
    </div>
  );
}
```

---

### 阶段 7：更新导入和测试 (30分钟)

#### 7.1 更新 StoryFlowMap.test.tsx

```typescript
// 更新导入路径
import { StoryFlowMap } from './story-flow';

// 测试仍然使用相同的 API
```

#### 7.2 更新使用 StoryFlowMap 的地方

```typescript
// 在 App.tsx 或其他地方
import { StoryFlowMap } from '@/components/story-flow';
```

---

## ⏱️ 时间估算

```
阶段 1: 准备工作              0.5h
阶段 2: 提取状态管理          1.0h
阶段 3: 拆分关系图窗口        2.0h
阶段 4: 提取侧边栏子组件      1.5h
阶段 5: 提取时间线和场景      1.0h
阶段 6: 重写主组件            0.5h
阶段 7: 更新导入和测试        0.5h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计                          7.0h
```

---

## 📊 拆分前后对比

### Before
```
StoryFlowMap.tsx              2225 行
```

### After
```
StoryFlowMap.tsx               300 行  ↓ 86%
├── types.ts                    50 行
├── hooks/
│   └── useRelationshipState   100 行
├── relationship/
│   ├── RelationshipWindow     150 行
│   ├── RelationshipToolbar     50 行
│   ├── RelationshipCanvas      50 行
│   ├── RelationshipSidebar    100 行
│   └── components/
│       ├── RelationshipLog    150 行
│       ├── ActorProfilePanel  200 行
│       ├── LineEditor         200 行
│       ├── PresetPanel        250 行
│       └── SuggestionPanel    200 行
├── timeline/
│   └── TimelinePanel          200 行
└── scenes/
    └── SceneCardBoard         200 行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计                          2200 行 (相同)

但是：
✅ 每个文件 < 300 行
✅ 清晰的职责划分
✅ 更容易测试
✅ 更容易维护
✅ 可以使用 React.memo 优化
```

---

## 🎯 拆分优先级

### 立即拆分（高优先级）

1. ✅ **RelationshipWindow** - 独立的窗口容器
2. ✅ **useRelationshipState** - 状态管理逻辑
3. ✅ **RelationshipSidebar** - 侧边栏容器

### 后续拆分（中优先级）

4. **侧边栏子组件** - Log, Profile, Editor, Preset
5. **TimelinePanel** - 时间线
6. **SceneCardBoard** - 场景卡片

### 最后拆分（低优先级）

7. **细粒度组件** - 更小的可复用组件

---

## 🚀 实施建议

### 方案 A：渐进式拆分（推荐）

**第1步：** 提取 useRelationshipState（1h）
- 风险最小
- 立即减少主文件复杂度
- 不影响现有功能

**第2步：** 提取 RelationshipWindow（2h）
- 独立窗口逻辑
- 测试更容易

**第3步：** 逐个提取子组件（3-4h）
- 每次提取一个
- 每次测试验证

### 方案 B：一次性拆分

**时间：** 连续 7 小时
**风险：** 较高
**适合：** 有完整时间块

---

## ✅ 成功标准

### 代码质量

- [x] 每个文件 < 500 行
- [x] 清晰的模块边界
- [x] 类型定义完整
- [x] 没有循环依赖

### 功能完整性

- [x] 所有功能正常工作
- [x] 测试全部通过
- [x] 无控制台错误

### 性能

- [x] 构建时间不增加
- [x] 运行时性能不降低
- [x] 可以使用 React.memo 优化

---

**这个计划可以在 shadcn/ui 完成后执行，或者与其并行进行。**

**推荐：** shadcn/ui 完成后再拆分，避免同时修改太多代码。
