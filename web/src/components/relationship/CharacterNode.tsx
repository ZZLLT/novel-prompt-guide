import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export type CharacterNodeData = {
  name: string;
  role: string;
  lane: 'lead' | 'ally' | 'force' | 'shadow';
};

const laneStyles = {
  lead: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    borderColor: '#3b82f6',
    label: '主角',
  },
  ally: {
    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
    borderColor: '#ec4899',
    label: '盟友',
  },
  force: {
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    borderColor: '#f59e0b',
    label: '引导',
  },
  shadow: {
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    borderColor: '#8b5cf6',
    label: '对抗',
  },
};

function CharacterNode({ data, selected }: NodeProps<CharacterNodeData>) {
  const style = laneStyles[data.lane];

  return (
    <div
      className="character-flow-node"
      style={{
        background: style.background,
        borderTop: `3px solid ${style.borderColor}`,
        border: '2px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '140px',
        boxShadow: selected
          ? `0 0 0 3px ${style.borderColor}40`
          : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: style.borderColor,
          width: 8,
          height: 8,
        }}
      />

      <div style={{ marginBottom: '4px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '14px',
            color: '#37352f',
            marginBottom: '2px',
          }}
        >
          {data.name}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#6b6b6b',
            lineHeight: '1.4',
          }}
        >
          {data.role}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: style.borderColor,
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
}

export default memo(CharacterNode);
