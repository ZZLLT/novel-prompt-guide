/**
 * 场景卡片系统类型定义
 * 参考：obsidian-storyline
 */

export type SceneType = 'scene' | 'chapter' | 'act';
export type SceneStatus = 'draft' | 'in-progress' | 'completed' | 'needs-revision';

export type SceneCard = {
  id: string;
  title: string;
  type: SceneType;

  // 状态
  status: SceneStatus;

  // 内容
  summary: string;      // 概要
  content: string;      // 正文
  notes: string;        // 笔记

  // 统计
  wordCount: number;
  targetWordCount?: number;

  // 关联
  characters: string[];  // 涉及角色ID
  locations: string[];   // 涉及地点
  plotlines: string[];   // 相关剧情线ID

  // 顺序
  order: number;
  previousScene?: string;
  nextScene?: string;

  // 目的和冲突
  purpose: string;       // 场景目的
  conflict: string;      // 主要冲突

  // 情绪基调
  mood?: string;         // 情绪氛围

  // 标签
  tags: string[];

  // 元数据
  createdAt: number;
  updatedAt: number;
};

// 场景类型配置
export const SCENE_TYPES: Record<SceneType, { label: string; icon: string; description: string }> = {
  scene: {
    label: '场景',
    icon: '🎬',
    description: '单个场景，最小的叙事单位'
  },
  chapter: {
    label: '章节',
    icon: '📖',
    description: '一个章节，包含多个场景'
  },
  act: {
    label: '幕',
    icon: '🎭',
    description: '故事的一个大段落，包含多个章节'
  }
};

// 场景状态配置
export const SCENE_STATUS: Record<SceneStatus, { label: string; color: string; icon: string }> = {
  draft: {
    label: '草稿',
    color: '#9ca3af',
    icon: '✏️'
  },
  'in-progress': {
    label: '进行中',
    color: '#3b82f6',
    icon: '⏳'
  },
  completed: {
    label: '已完成',
    color: '#10b981',
    icon: '✅'
  },
  'needs-revision': {
    label: '待修改',
    color: '#f59e0b',
    icon: '🔄'
  }
};

// 情绪基调预设
export const SCENE_MOODS = [
  '紧张',
  '轻松',
  '悲伤',
  '快乐',
  '恐怖',
  '浪漫',
  '神秘',
  '激动',
  '平静',
  '愤怒',
  '温馨',
  '诡异',
  '史诗',
  '幽默',
  '感人'
];

// 场景目的预设
export const SCENE_PURPOSES = [
  '推进主线剧情',
  '角色发展',
  '世界观展示',
  '情感渲染',
  '制造悬念',
  '揭示信息',
  '角色互动',
  '冲突爆发',
  '铺设伏笔',
  '氛围营造',
  '过渡转折',
  '高潮场景'
];
