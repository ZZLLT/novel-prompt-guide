/**
 * 角色卡片系统类型定义
 * 参考：MuMuAINovel
 */

export type CharacterRole = 'protagonist' | 'supporting' | 'antagonist' | 'minor';

export type CharacterRelationship = {
  targetId: string;
  type: string;        // 关系类型：朋友、敌人、师徒、亲人等
  description: string; // 关系描述
  strength: number;    // 关系强度 1-10
};

export type CharacterCard = {
  id: string;
  name: string;
  avatar?: string;
  role: CharacterRole;

  // 基础信息
  age?: number;
  gender?: string;
  occupation?: string;

  // 外貌描写
  appearance: string;

  // 性格特征（标签）
  traits: string[];  // ['勇敢', '固执', '善良', '冲动']

  // 背景故事
  background: string;

  // 动机和恐惧
  motivation: string;  // 想要什么
  fear: string;        // 害怕什么
  goal: string;        // 目标

  // 能力和弱点
  skills: string[];      // 技能/优势
  weaknesses: string[];  // 弱点

  // 关系网络
  relationships: CharacterRelationship[];

  // 发展弧光
  characterArc?: string;  // 角色成长轨迹

  // 经典台词
  signature: string;  // 标志性台词或口头禅

  // 笔记
  notes: string;

  // 元数据
  createdAt: number;
  updatedAt: number;

  // 标签（用于分组和筛选）
  tags: string[];

  // 颜色（用于可视化）
  color?: string;
};

// 角色特征预设标签
export const CHARACTER_TRAITS = {
  positive: [
    '勇敢', '善良', '诚实', '忠诚', '智慧', '谦逊',
    '坚韧', '乐观', '慷慨', '温柔', '幽默', '负责',
    '自信', '冷静', '理性', '果断', '创新', '包容'
  ],
  negative: [
    '固执', '冲动', '傲慢', '懦弱', '自私', '冷酷',
    '多疑', '悲观', '贪婪', '暴躁', '虚荣', '懒惰',
    '狡猾', '优柔寡断', '偏执', '冷漠', '报复心强'
  ],
  neutral: [
    '内向', '外向', '谨慎', '大胆', '严肃', '随和',
    '理想主义', '现实主义', '感性', '理性', '独立', '依赖'
  ]
};

// 关系类型预设
export const RELATIONSHIP_TYPES = [
  '朋友', '密友', '恋人', '夫妻', '前任',
  '敌人', '宿敌', '竞争对手',
  '师徒', '同门', '前辈', '后辈',
  '父母', '子女', '兄弟姐妹', '亲戚',
  '上司', '下属', '同事', '合作伙伴',
  '陌生人', '熟人', '邻居',
  '暗恋', '单恋', '互相欣赏',
  '其他'
];

// 角色角色预设
export const CHARACTER_ROLES: Record<CharacterRole, { label: string; icon: string; description: string }> = {
  protagonist: {
    label: '主角',
    icon: '⭐',
    description: '故事的核心人物，推动剧情发展'
  },
  supporting: {
    label: '配角',
    icon: '✨',
    description: '重要的辅助角色，与主角互动密切'
  },
  antagonist: {
    label: '反派',
    icon: '⚡',
    description: '与主角对立的角色，制造冲突'
  },
  minor: {
    label: '次要',
    icon: '💫',
    description: '出场较少的角色，推动特定情节'
  }
};
