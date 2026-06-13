# 🎯 人物关系图重构方案 - 使用 ReactFlow

**日期：** 2026-06-13  
**方案：** 使用专业库 ReactFlow 重新实现  
**参考项目：** Family Tree Visualization

---

## 📊 当前问题分析

### 现有实现的痛点

1. **完全自己实现** - SVG 路径、拖拽、缩放都是手写
2. **维护成本高** - 800+ 行代码只为实现基础功能
3. **功能有限** - 缺少专业图表库的标准功能
4. **视觉效果一般** - 节点和线条样式简单
5. **扩展性差** - 添加新功能需要大量代码

### 用户反馈

> "人物关系图还是太乱了"

**分析：**
- 手动实现的布局算法不够专业
- 节点位置固定但不够智能
- 关系线重叠时难以区分
- 缺少专业图表的视觉引导

---

## 🎨 新方案：ReactFlow + Dagre

### 为什么选择 ReactFlow

**ReactFlow** 是 React 生态最成熟的流程图/关系图库：

- ✅ **74.5k GitHub stars** - 业界标准
- ✅ **MIT License** - 可免费商用
- ✅ **TypeScript 原生支持**
- ✅ **高性能** - 支持数千节点
- ✅ **丰富的功能** - 缩放、平移、选择、拖拽开箱即用
- ✅ **完全可定制** - 自定义节点和边
- ✅ **活跃维护** - 持续更新

### 布局算法：Dagre

**Dagre** 是专业的图布局引擎：

- 自动计算节点位置（无需手动定义）
- 层次化布局（适合角色层级）
- 最小化边交叉
- 可配置间距和方向

---

## 🏗️ 架构设计

### 1. 数据转换层

**将现有数据转换为 ReactFlow 格式：**

```typescript
// 现有数据格式
type StoryActor = {
  id: string;
  name: string;
  role: string;
  lane: "lead" | "ally" | "force" | "shadow";
};

type RelationshipEdge = {
  id: string;
  from: string;
  to: string;
  status: string;
  strength: number;
  tone: "cyan" | "amber" | "magenta";
  cause: string;
  nextShift: string;
  evolution: string;
};

// 转换为 ReactFlow 格式
function convertToReactFlowData(
  actors: StoryActor[],
  edges: RelationshipEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes = actors.map(actor => ({
    id: actor.id,
    type: 'characterNode',
    data: {
      name: actor.name,
      role: actor.role,
      lane: actor.lane,
    },
    position: { x: 0, y: 0 }, // Dagre will calculate
  }));

  const rfEdges = edges.map(edge => ({
    id: edge.id,
    source: resolveActorId(edge.from),
    target: resolveActorId(edge.to),
    type: 'relationshipEdge',
    data: {
      status: edge.status,
      strength: edge.strength,
      tone: edge.tone,
      cause: edge.cause,
      nextShift: edge.nextShift,
      evolution: edge.evolution,
    },
    animated: edge.strength > 70,
  }));

  return { nodes, edges: rfEdges };
}
```

### 2. 自定义节点组件

**CharacterNode - 角色卡片：**

```tsx
import { Handle, Position } from 'reactflow';

type CharacterNodeProps = {
  data: {
    name: string;
    role: string;
    lane: string;
  };
  selected: boolean;
};

function CharacterNode({ data, selected }: CharacterNodeProps) {
  const laneColors = {
    lead: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '#3b82f6' },
    ally: { bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', border: '#ec4899' },
    force: { bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#f59e0b' },
    shadow: { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#8b5cf6' },
  };

  const style = laneColors[data.lane as keyof typeof laneColors];

  return (
    <div
      className={`character-node ${selected ? 'selected' : ''}`}
      style={{
        background: style.bg,
        borderTop: `3px solid ${style.border}`,
        padding: '12px 16px',
        borderRadius: '8px',
        minWidth: '120px',
        boxShadow: selected
          ? `0 0 0 3px ${style.border}`
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="character-name" style={{ fontWeight: 600, fontSize: '14px' }}>
        {data.name}
      </div>
      <div className="character-role" style={{ fontSize: '12px', color: '#6b6b6b' }}>
        {data.role}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default CharacterNode;
```

### 3. 自定义边组件

**RelationshipEdge - 关系线：**

```tsx
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from 'reactflow';

type RelationshipEdgeData = {
  status: string;
  strength: number;
  tone: 'cyan' | 'amber' | 'magenta';
  cause: string;
  nextShift: string;
};

function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const toneColors = {
    cyan: '#06b6d4',
    magenta: '#ec4899',
    amber: '#f59e0b',
  };

  const strokeWidth = (data.strength / 20 + 2).toString();
  const color = toneColors[data.tone];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? '6' : strokeWidth,
          filter: selected ? `drop-shadow(0 0 8px ${color})` : undefined,
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 13,
            fontWeight: 600,
            color: '#37352f',
            background: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            pointerEvents: 'all',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          className="nodrag nopan"
        >
          {data.status}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default RelationshipEdge;
```

### 4. 布局计算

**使用 Dagre 自动布局：**

```typescript
import dagre from '@dagrejs/dagre';
import { Node, Edge } from 'reactflow';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // 配置：从上到下，层级间距80px，节点间距60px
  dagreGraph.setGraph({
    rankdir: 'TB',
    ranksep: 80,
    nodesep: 60,
    edgesep: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

### 5. 主组件

**RelationshipGraphFlow：**

```tsx
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo, useEffect } from 'react';

import CharacterNode from './CharacterNode';
import RelationshipEdge from './RelationshipEdge';
import { getLayoutedElements } from './layout';

const nodeTypes = {
  characterNode: CharacterNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

function RelationshipGraphFlow({
  actors,
  relationships,
  onNodeClick,
  onEdgeClick,
}) {
  const { fitView } = useReactFlow();
  
  // 转换和布局数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const converted = convertToReactFlowData(actors, relationships);
    return getLayoutedElements(converted.nodes, converted.edges);
  }, [actors, relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 初始化时自动居中
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
  }, [fitView]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Background color="#e8e5e0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const laneColors = {
              lead: '#3b82f6',
              ally: '#ec4899',
              force: '#f59e0b',
              shadow: '#8b5cf6',
            };
            return laneColors[node.data.lane] || '#666';
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default RelationshipGraphFlow;
```

---

## 📦 依赖安装

```bash
npm install reactflow @dagrejs/dagre
npm install --save-dev @types/dagre
```

**包大小：**
- reactflow: ~80KB (gzipped)
- @dagrejs/dagre: ~25KB (gzipped)
- **总计：~105KB** (可接受)

---

## 🎨 视觉效果对比

### 当前实现

- ❌ 固定的4个位置
- ❌ 手动定义的贝塞尔曲线
- ❌ 简单的 SVG path
- ❌ 基础的缩放和平移
- ❌ 节点拖拽需要手写逻辑

### ReactFlow 实现

- ✅ **Dagre 自动布局** - 智能计算最优位置
- ✅ **专业的曲线** - 平滑的贝塞尔曲线
- ✅ **丰富的交互** - 开箱即用的缩放、平移、选择
- ✅ **节点拖拽** - 内置支持，带吸附效果
- ✅ **Mini Map** - 小地图导航
- ✅ **控制面板** - 缩放、居中按钮
- ✅ **网格背景** - 专业的视觉引导
- ✅ **动画支持** - 边可以流动动画

---

## 🚀 实施步骤

### 第1步：安装依赖（5分钟）

```bash
cd D:\OH-WorkSpace\novel-prompt-guide
npm install reactflow @dagrejs/dagre
npm install --save-dev @types/dagre
```

### 第2步：创建新组件（30分钟）

创建以下文件：
- `web/src/components/relationship/CharacterNode.tsx`
- `web/src/components/relationship/RelationshipEdge.tsx`
- `web/src/components/relationship/layout.ts`
- `web/src/components/relationship/RelationshipGraphFlow.tsx`

### 第3步：集成到 StoryFlowMap（20分钟）

在 `StoryFlowMap.tsx` 中：
1. Import 新的 RelationshipGraphFlow 组件
2. 替换现有的 RelationshipGraph 组件
3. 传递数据和事件处理器

### 第4步：添加 CSS 样式（15分钟）

在 `modern.css` 中添加 ReactFlow 主题覆盖。

### 第5步：测试和调整（20分钟）

- 测试节点点击
- 测试边选择
- 测试侧边栏联动
- 调整颜色和间距

**预计总时间：~1.5 小时**

---

## 💡 额外功能（可选）

### 轻松添加的功能

1. **节点分组**
   ```typescript
   // 添加背景高亮区域
   <Background color="#e8e5e0" gap={16} />
   ```

2. **关系强度动画**
   ```typescript
   animated: edge.strength > 70  // 强关系流动动画
   ```

3. **搜索高亮**
   ```typescript
   const { setCenter } = useReactFlow();
   setCenter(node.position.x, node.position.y, { duration: 800 });
   ```

4. **导出为图片**
   ```typescript
   import { getRectOfNodes, getTransformForBounds } from 'reactflow';
   // 导出 PNG/SVG
   ```

5. **撤销/重做**
   ```typescript
   // ReactFlow 内置支持
   ```

---

## 📊 对比总结

| 指标 | 当前实现 | ReactFlow方案 |
|------|---------|--------------|
| **代码量** | 800+ 行 | ~300 行 |
| **布局质量** | 固定/手动 | 智能自动 |
| **功能丰富度** | 基础 | 专业级 |
| **可维护性** | 低 | 高 |
| **扩展性** | 差 | 优秀 |
| **视觉效果** | 一般 | 专业 |
| **包大小** | 0 | +105KB |
| **学习曲线** | 高（自己维护） | 低（文档完善） |

---

## 🎯 推荐理由

1. **节省时间** - 减少 500+ 行自定义代码
2. **专业品质** - 使用业界标准库
3. **功能丰富** - Mini Map、Controls、动画等
4. **易于维护** - 清晰的 API 和文档
5. **持续更新** - 活跃的社区支持
6. **可扩展** - 轻松添加新功能

---

## 📚 参考资源

- [ReactFlow 官方文档](https://reactflow.dev/)
- [ReactFlow GitHub](https://github.com/wbkd/react-flow)
- [Family Tree Visualization Example](https://www.tva.sg/insights/reactflow-family-tree-visualization)
- [relation-graph](https://github.com/seeksdream/relation-graph)

---

**准备好开始实施了吗？我可以立即开始创建新的 ReactFlow 实现。**
