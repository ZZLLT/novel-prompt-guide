import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from 'reactflow';

export type RelationshipEdgeData = {
  status: string;
  strength: number;
  tone: 'cyan' | 'amber' | 'magenta';
  cause: string;
  nextShift: string;
  evolution: string;
};

const toneColors = {
  cyan: '#06b6d4',
  magenta: '#ec4899',
  amber: '#f59e0b',
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

  if (!data) return null;

  const color = toneColors[data.tone];
  const strokeWidth = selected ? 6 : data.strength / 20 + 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth,
          filter: selected ? `drop-shadow(0 0 8px ${color})` : undefined,
          transition: 'all 0.2s ease',
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
            padding: '3px 10px',
            borderRadius: 4,
            pointerEvents: 'all',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="nodrag nopan"
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            e.currentTarget.style.transform = `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(1.05)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
            e.currentTarget.style.transform = `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(1)`;
          }}
        >
          {data.status}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(RelationshipEdge);
