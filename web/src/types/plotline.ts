/**
 * 剧情线追踪系统类型定义
 * 参考：obsidian-storyline
 */

export type PlotlineType = 'main' | 'subplot' | 'character-arc';
export type PlotlineStatus = 'setup' | 'development' | 'climax' | 'resolution' | 'completed';

export type Plotline = {
  id: string;
  title: string;
  type: PlotlineType;

  // 描述
  description: string;

  // 状态
  status: PlotlineStatus;

  // 关联场景
  scenes: Array<{
    sceneId: string;
    order: number;
    note: string;  // 该场景在剧情线中的作用
  }>;

  // 涉及角色
  characters: string[];

  // 进度
  progress: number;  // 0-100

  // 可视化颜色
  color: string;

  // 开始和结束
  startScene?: string;
  endScene?: string;

  // 关键节点
  keyPoints: Array<{
    id: string;
    title: string;
    description: string;
    sceneId?: string;  // 关联场景
    completed: boolean;
  }>;

  // 标签
  tags: string[];

  // 元数据
  createdAt: number;
  updatedAt: number;
};

// 剧情线类型配置
export const PLOTLINE_TYPES: Record<PlotlineType, { label: string; icon: string; description: string }> = {
  main: {
    label: '主线',
    icon: '⭐',
    description: '故事的核心剧情线'
  },
  subplot: {
    label: '支线',
    icon: '✨',
    description: '辅助的次要剧情线'
  },
  'character-arc': {
    label: '角色线',
    icon: '👤',
    description: '角色成长和变化的轨迹'
  }
};

// 剧情线状态配置
export const PLOTLINE_STATUS: Record<PlotlineStatus, { label: string; color: string; icon: string }> = {
  setup: {
    label: '铺垫',
    color: '#6b7280',
    icon: '🌱'
  },
  development: {
    label: '发展',
    color: '#3b82f6',
    icon: '📈'
  },
  climax: {
    label: '高潮',
    color: '#ef4444',
    icon: '🔥'
  },
  resolution: {
    label: '收尾',
    color: '#f59e0b',
    icon: '🎯'
  },
  completed: {
    label: '完结',
    color: '#10b981',
    icon: '✅'
  }
};

// 预设颜色
export const PLOTLINE_COLORS = [
  '#ef4444', // 红
  '#f59e0b', // 橙
  '#eab308', // 黄
  '#22c55e', // 绿
  '#06b6d4', // 青
  '#3b82f6', // 蓝
  '#8b5cf6', // 紫
  '#ec4899', // 粉
  '#64748b', // 灰
];
