"""
AI智能建议系统 - 主动分析并提供创作建议
"""
from typing import Dict, List, Any
import json


class SuggestionAnalyzer:
    """建议分析器"""

    def __init__(self):
        # 建议类型权重
        self.suggestion_weights = {
            "critical": 10,    # 严重问题
            "warning": 7,      # 警告
            "tip": 5,          # 提示
            "idea": 3          # 创意点子
        }

    def analyze_context(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        分析创作上下文，生成建议

        context: {
            "characters": [...],  # 角色列表
            "scenes": [...],      # 场景列表
            "plotlines": [...],   # 剧情线列表
            "summary": {...}      # 统计摘要
        }

        返回建议列表
        """
        suggestions = []

        # 1. 检查角色相关问题
        suggestions.extend(self._check_characters(context))

        # 2. 检查场景相关问题
        suggestions.extend(self._check_scenes(context))

        # 3. 检查剧情线相关问题
        suggestions.extend(self._check_plotlines(context))

        # 4. 检查整体结构
        suggestions.extend(self._check_structure(context))

        # 5. 提供创意建议
        suggestions.extend(self._generate_creative_ideas(context))

        # 按优先级排序
        suggestions.sort(key=lambda x: self.suggestion_weights.get(x["type"], 0), reverse=True)

        return suggestions[:10]  # 最多返回10条建议

    def _check_characters(self, context: Dict) -> List[Dict]:
        """检查角色相关问题"""
        suggestions = []
        characters = context.get("characters", [])

        if not characters:
            suggestions.append({
                "type": "critical",
                "category": "character",
                "title": "还没有创建角色",
                "description": "故事需要角色来推动。建议至少创建一个主角。",
                "action": {
                    "command": "创建一个主角",
                    "type": "generate_character"
                }
            })
            return suggestions

        # 检查主角
        protagonists = [c for c in characters if c.get("role") == "protagonist"]
        if not protagonists:
            suggestions.append({
                "type": "warning",
                "category": "character",
                "title": "缺少主角",
                "description": "故事需要一个明确的主角来承载读者视角。",
                "action": {
                    "command": "创建主角",
                    "type": "generate_character"
                }
            })

        # 检查反派
        antagonists = [c for c in characters if c.get("role") == "antagonist"]
        if not antagonists and len(characters) > 2:
            suggestions.append({
                "type": "tip",
                "category": "character",
                "title": "建议添加反派角色",
                "description": "一个强大的反派能让故事更有张力和冲突。",
                "action": {
                    "command": "创建一个反派",
                    "type": "generate_character"
                }
            })

        # 检查角色动机
        for char in characters[:3]:  # 只检查前3个主要角色
            if not char.get("motivation"):
                suggestions.append({
                    "type": "warning",
                    "category": "character",
                    "title": f"角色「{char.get('name', '未命名')}」缺少动机",
                    "description": "角色需要明确的动机来驱动行为，让读者理解其选择。",
                    "action": {
                        "command": f"为「{char.get('name')}」添加动机",
                        "type": "edit_character",
                        "entity_id": char.get("id")
                    }
                })

        return suggestions

    def _check_scenes(self, context: Dict) -> List[Dict]:
        """检查场景相关问题"""
        suggestions = []
        scenes = context.get("scenes", [])

        if not scenes:
            suggestions.append({
                "type": "warning",
                "category": "scene",
                "title": "还没有创建场景",
                "description": "开始创作第一个场景，让故事动起来。",
                "action": {
                    "command": "生成开场场景",
                    "type": "generate_scene"
                }
            })
            return suggestions

        # 检查场景冲突
        scenes_without_conflict = [
            s for s in scenes
            if not s.get("conflicts") or len(s.get("conflicts", [])) == 0
        ]

        if scenes_without_conflict and len(scenes_without_conflict) > len(scenes) * 0.3:
            suggestions.append({
                "type": "warning",
                "category": "scene",
                "title": f"{len(scenes_without_conflict)}个场景缺少冲突点",
                "description": "没有冲突的场景容易让读者感到乏味。每个场景都应该有明确的冲突。",
                "action": {
                    "command": "为场景添加冲突点",
                    "type": "enhance_scenes"
                }
            })

        # 检查场景长度
        short_scenes = [s for s in scenes if len(s.get("content", "")) < 800]
        if short_scenes and len(short_scenes) > 2:
            suggestions.append({
                "type": "tip",
                "category": "scene",
                "title": f"{len(short_scenes)}个场景内容较短",
                "description": "场景内容过短可能展开不充分，建议扩写到1500字以上。",
                "action": {
                    "command": "扩写短场景",
                    "type": "expand_scenes"
                }
            })

        return suggestions

    def _check_plotlines(self, context: Dict) -> List[Dict]:
        """检查剧情线相关问题"""
        suggestions = []
        plotlines = context.get("plotlines", [])

        if not plotlines:
            suggestions.append({
                "type": "tip",
                "category": "plotline",
                "title": "建议规划剧情线",
                "description": "创建剧情线可以帮助你掌控故事走向，避免写着写着就迷失方向。",
                "action": {
                    "command": "创建主线剧情",
                    "type": "generate_plotline"
                }
            })
            return suggestions

        # 检查主线
        main_plotlines = [p for p in plotlines if p.get("type") == "main"]
        if not main_plotlines:
            suggestions.append({
                "type": "warning",
                "category": "plotline",
                "title": "缺少主线剧情",
                "description": "故事需要一条明确的主线来贯穿全文。",
                "action": {
                    "command": "创建主线剧情",
                    "type": "generate_plotline"
                }
            })

        # 检查剧情线进度
        for plotline in plotlines:
            progress = plotline.get("progress", 0)
            key_points = plotline.get("keyPoints", [])
            completed_points = [kp for kp in key_points if kp.get("completed")]

            if progress < 30 and len(completed_points) < 3:
                suggestions.append({
                    "type": "tip",
                    "category": "plotline",
                    "title": f"剧情线「{plotline.get('title')}」进展缓慢",
                    "description": "剧情线长时间没有推进，可能需要加快节奏。",
                    "action": {
                        "command": f"推进「{plotline.get('title')}」剧情",
                        "type": "advance_plotline",
                        "entity_id": plotline.get("id")
                    }
                })

        return suggestions

    def _check_structure(self, context: Dict) -> List[Dict]:
        """检查整体结构"""
        suggestions = []
        summary = context.get("summary", {})

        character_count = summary.get("characterCount", 0)
        scene_count = summary.get("sceneCount", 0)
        plotline_count = summary.get("plotlineCount", 0)

        # 检查内容平衡
        if character_count > 10 and scene_count < 5:
            suggestions.append({
                "type": "warning",
                "category": "structure",
                "title": "角色过多但场景太少",
                "description": f"已有{character_count}个角色，但只有{scene_count}个场景。建议多创作场景来展现角色。",
                "action": {
                    "command": "生成更多场景",
                    "type": "generate_scenes"
                }
            })

        if scene_count > 10 and plotline_count == 0:
            suggestions.append({
                "type": "warning",
                "category": "structure",
                "title": "场景较多但缺少剧情规划",
                "description": "建议创建剧情线来梳理故事脉络，避免情节混乱。",
                "action": {
                    "command": "梳理剧情线",
                    "type": "organize_plotlines"
                }
            })

        return suggestions

    def _generate_creative_ideas(self, context: Dict) -> List[Dict]:
        """生成创意建议"""
        suggestions = []
        characters = context.get("characters", [])
        scenes = context.get("scenes", [])
        plotlines = context.get("plotlines", [])

        # 基于现有内容提供创意点子
        if characters and len(characters) >= 2:
            suggestions.append({
                "type": "idea",
                "category": "creative",
                "title": "💡 尝试角色关系的意外转折",
                "description": "让两个看似对立的角色发现共同目标，或让盟友产生分歧，增加故事张力。",
                "action": {
                    "command": "设计角色关系转折",
                    "type": "creative_twist"
                }
            })

        if scenes and len(scenes) >= 3:
            suggestions.append({
                "type": "idea",
                "category": "creative",
                "title": "💡 添加一个意外事件",
                "description": "在平静的剧情中插入一个意外事件，打破平衡，推动故事发展。",
                "action": {
                    "command": "设计意外事件",
                    "type": "plot_twist"
                }
            })

        if plotlines:
            suggestions.append({
                "type": "idea",
                "category": "creative",
                "title": "💡 考虑添加支线剧情",
                "description": "支线剧情可以丰富故事层次，为配角增加戏份，让世界更立体。",
                "action": {
                    "command": "创建支线剧情",
                    "type": "generate_subplot"
                }
            })

        return suggestions


# 全局实例
suggestion_analyzer = SuggestionAnalyzer()
