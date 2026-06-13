"""
场景自动检测系统 - 分析用户输入，智能识别创作场景
"""
import re
from typing import Dict, Optional, List


class SceneDetector:
    """场景检测器 - 识别用户当前的创作场景和需求"""

    def __init__(self):
        # 场景关键词映射
        self.scene_patterns = {
            "开始写作": {
                "keywords": ["开始", "新书", "新故事", "想写", "要写"],
                "scene": "start_writing",
                "suggestions": ["规划大纲", "创建主角", "设定世界观"]
            },
            "规划阶段": {
                "keywords": ["大纲", "规划", "构思", "设定", "世界观"],
                "scene": "planning",
                "suggestions": ["创建角色", "设计剧情线", "构建世界观"]
            },
            "角色创作": {
                "keywords": ["角色", "人物", "主角", "反派", "配角", "人设"],
                "scene": "character_creation",
                "suggestions": ["生成角色卡片", "设计角色关系", "完善角色背景"]
            },
            "场景创作": {
                "keywords": ["场景", "情节", "章节", "桥段"],
                "scene": "scene_writing",
                "suggestions": ["生成场景", "添加冲突点", "丰富细节描写"]
            },
            "续写中": {
                "keywords": ["续写", "接着写", "下一章", "继续"],
                "scene": "continuing",
                "suggestions": ["续写内容", "推进剧情", "设计转折"]
            },
            "修改润色": {
                "keywords": ["润色", "修改", "优化", "改写", "调整"],
                "scene": "polishing",
                "suggestions": ["润色文字", "优化对话", "增强描写"]
            },
            "遇到瓶颈": {
                "keywords": ["卡文", "不知道", "写不下去", "没灵感", "困难"],
                "scene": "stuck",
                "suggestions": ["分析剧情", "提供创意", "建议下一步"]
            },
            "检查问题": {
                "keywords": ["检查", "审查", "问题", "漏洞", "矛盾", "bug"],
                "scene": "reviewing",
                "suggestions": ["一致性检查", "找出漏洞", "分析问题"]
            }
        }

    def detect_scene(self, user_input: str, context: Dict) -> Dict:
        """
        检测当前创作场景

        返回: {
            "scene": "场景类型",
            "confidence": 0.8,  # 置信度
            "suggestions": [...],  # 建议的操作
            "detected_needs": [...]  # 检测到的需求
        }
        """
        user_input_lower = user_input.lower()

        # 检测匹配的场景
        scene_scores = {}
        for scene_name, scene_info in self.scene_patterns.items():
            score = 0
            for keyword in scene_info["keywords"]:
                if keyword in user_input_lower:
                    score += 1

            if score > 0:
                scene_scores[scene_info["scene"]] = {
                    "score": score,
                    "name": scene_name,
                    "suggestions": scene_info["suggestions"]
                }

        # 如果没有明确匹配，根据上下文推断
        if not scene_scores:
            scene_scores = self._infer_from_context(context)

        # 选择得分最高的场景
        if scene_scores:
            best_scene = max(scene_scores.items(), key=lambda x: x[1]["score"])
            confidence = min(best_scene[1]["score"] / 3, 1.0)  # 归一化到0-1

            return {
                "scene": best_scene[0],
                "scene_name": best_scene[1]["name"],
                "confidence": confidence,
                "suggestions": best_scene[1]["suggestions"],
                "detected_needs": self._extract_needs(user_input)
            }

        # 默认场景
        return {
            "scene": "general",
            "scene_name": "一般对话",
            "confidence": 0.5,
            "suggestions": ["查看当前进度", "获取建议"],
            "detected_needs": []
        }

    def _infer_from_context(self, context: Dict) -> Dict:
        """根据上下文推断场景"""
        summary = context.get("summary", {})
        character_count = summary.get("characterCount", 0)
        scene_count = summary.get("sceneCount", 0)
        plotline_count = summary.get("plotlineCount", 0)

        scores = {}

        # 如果什么都没有，推断为开始写作
        if character_count == 0 and scene_count == 0:
            scores["start_writing"] = {
                "score": 2,
                "name": "开始写作",
                "suggestions": ["创建角色", "规划大纲"]
            }

        # 如果有角色但没场景，推断为场景创作
        if character_count > 0 and scene_count == 0:
            scores["scene_writing"] = {
                "score": 2,
                "name": "场景创作",
                "suggestions": ["生成第一个场景"]
            }

        # 如果有场景，推断为续写
        if scene_count > 0:
            scores["continuing"] = {
                "score": 1,
                "name": "续写中",
                "suggestions": ["续写下一个场景"]
            }

        return scores

    def _extract_needs(self, user_input: str) -> List[str]:
        """提取用户需求"""
        needs = []

        need_patterns = {
            "需要角色": ["角色", "人物", "主角"],
            "需要场景": ["场景", "情节"],
            "需要大纲": ["大纲", "规划"],
            "需要灵感": ["灵感", "创意", "点子"],
            "需要修改": ["修改", "改", "调整"],
            "需要检查": ["检查", "审查", "问题"]
        }

        for need, keywords in need_patterns.items():
            if any(kw in user_input for kw in keywords):
                needs.append(need)

        return needs


# 全局实例
scene_detector = SceneDetector()
