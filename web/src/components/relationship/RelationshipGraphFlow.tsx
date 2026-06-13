import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CharacterNode, { type CharacterNodeData } from './CharacterNode';
import RelationshipEdge, { type RelationshipEdgeData } from './RelationshipEdge';
import { RelationshipToolbar } from './RelationshipToolbar';
import { RelationshipLegend } from './RelationshipLegend';
import { getLayoutedElements } from './layout';
import type { StoryActor, RelationshipEdge as RelEdge } from '../../data/storyFlow';

const nodeTypes: NodeTypes = {
  characterNode: CharacterNode,
};

const edgeTypes: EdgeTypes = {
  relationshipEdge: RelationshipEdge,
};

// 解析角色名称到ID
function resolveActorId(name: string, actors: StoryActor[]): string {
  const actor = actors.find(a => a.name === name);
  return actor?.id || '';
}

// 转换数据为ReactFlow格式
function convertToReactFlowData(
  actors: StoryActor[],
  relationships: RelEdge[]
): { nodes: Node<CharacterNodeData>[]; edges: Edge<RelationshipEdgeData>[] } {
  const nodes: Node<CharacterNodeData>[] = actors.map(actor => ({
    id: actor.id,
    type: 'characterNode',
    data: {
      name: actor.name,
      role: actor.role,
      lane: actor.lane,
    },
    position: { x: 0, y: 0 }, // Dagre will calculate
  }));

  const rfEdges: Edge<RelationshipEdgeData>[] = relationships.map(edge => ({
    id: edge.id,
    source: resolveActorId(edge.from, actors),
    target: resolveActorId(edge.to, actors),
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

type RelationshipGraphFlowProps = {
  actors: StoryActor[];
  relationships: RelEdge[];
  selectedActorId: string | null;
  selectedEdgeId: string | null;
  onNodeClick: (actorId: string) => void;
  onEdgeClick: (edgeId: string) => void;
};

function RelationshipGraphFlow({
  actors,
  relationships,
  selectedActorId,
  selectedEdgeId,
  onNodeClick,
  onEdgeClick,
}: RelationshipGraphFlowProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [legendVisible, setLegendVisible] = useState(true);

  // 转换和布局数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const converted = convertToReactFlowData(actors, relationships);
    return getLayoutedElements(converted.nodes, converted.edges);
  }, [actors, relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 更新选中状态
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedActorId,
      }))
    );
  }, [selectedActorId, setNodes]);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        selected: edge.id === selectedEdgeId,
      }))
    );
  }, [selectedEdgeId, setEdges]);

  // 初始化时自动居中
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  // 节点点击处理
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  // 边点击处理
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      onEdgeClick(edge.id);
    },
    [onEdgeClick]
  );

  return (
    <>
      <RelationshipToolbar
        actorCount={actors.length}
        relationshipCount={relationships.length}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView({ padding: 0.2, duration: 500 })}
        onToggleLegend={() => setLegendVisible(!legendVisible)}
      />
      <div className="relationship-canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.5}
          maxZoom={2}
          defaultEdgeOptions={{
            style: { strokeWidth: 2 },
          }}
        >
          <Background color="#e8e5e0" gap={16} size={1} />
          <Controls
            showZoom
            showFitView
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              const laneColors: Record<string, string> = {
                lead: '#3b82f6',
                ally: '#ec4899',
                force: '#f59e0b',
                shadow: '#8b5cf6',
              };
              return laneColors[node.data.lane] || '#999';
            }}
            style={{
              background: '#f7f6f3',
              border: '1px solid #e8e5e0',
              borderRadius: '4px',
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
        <RelationshipLegend visible={legendVisible} />
      </div>
    </>
  );
}

export default RelationshipGraphFlow;
