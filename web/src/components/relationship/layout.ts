import dagre from '@dagrejs/dagre';
import type { Node, Edge } from 'reactflow';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 85;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 配置布局参数
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,  // 层级间距
    nodesep: 80,   // 同层节点间距
    edgesep: 30,   // 边的间距
    marginx: 20,
    marginy: 20,
  });

  // 添加节点
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // 添加边
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 执行布局
  dagre.layout(dagreGraph);

  // 应用计算后的位置
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
