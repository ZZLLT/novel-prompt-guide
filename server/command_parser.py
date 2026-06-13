"""
智能命令解析器 - 将自然语言转换为AI操作
"""
import re
from typing import Dict, Any, Optional, List, Tuple


class CommandParser:
    """解析自然语言命令"""

    def __init__(self):
        # 命令模式定义
        self.patterns = [
            # 续写命令
            (r"续写(.+?)(\d+)字", "continue", lambda m: {"length": int(m.group(2))}),
            (r"续写(.+)", "continue", lambda m: {"length": 500}),

            # 润色命令
            (r"润色(.+)", "polish", lambda m: {}),
            (r"优化(.+)", "polish", lambda m: {}),

            # 风格转换
            (r"改成(.+?)风格", "change_style", lambda m: {"style": m.group(1)}),
            (r"改为(.+?)风格", "change_style", lambda m: {"style": m.group(1)}),
            (r"转换成(.+?)风格", "change_style", lambda m: {"style": m.group(1)}),

            # 批量生成
            (r"生成(\d+)个角色", "generate_batch_characters", lambda m: {"count": int(m.group(1))}),
            (r"生成(\d+)个场景", "generate_batch_scenes", lambda m: {"count": int(m.group(1))}),

            # 分析命令
            (r"分析(.+?)的矛盾", "analyze_conflict", lambda m: {"target": m.group(1)}),
            (r"找出(.+?)的漏洞", "find_plot_holes", lambda m: {"target": m.group(1)}),
            (r"检查(.+?)的一致性", "check_consistency", lambda m: {"target": m.group(1)}),

            # 建议命令
            (r"给我?(.*)写作建议", "get_suggestions", lambda m: {}),
            (r"我该怎么写(.+)", "get_advice", lambda m: {"topic": m.group(1)}),

            # 对话优化
            (r"优化对话", "optimize_dialogue", lambda m: {}),
            (r"改进对话", "optimize_dialogue", lambda m: {}),

            # 扩写/压缩
            (r"扩写(.+?)到(\d+)字", "expand", lambda m: {"length": int(m.group(2))}),
            (r"压缩(.+?)到(\d+)字", "summarize", lambda m: {"length": int(m.group(2))}),

            # 创建命令（已有）
            (r"创建.*角色", "generate_character", lambda m: {}),
            (r"生成.*场景", "generate_scene", lambda m: {}),
            (r"创建.*剧情", "generate_plotline", lambda m: {}),
        ]

    def parse(self, command: str) -> Tuple[Optional[str], Dict[str, Any], str]:
        """
        解析命令

        Returns:
            (action, params, original_command)
            - action: 识别出的动作类型
            - params: 提取的参数
            - original_command: 原始命令
        """
        command = command.strip()

        for pattern, action, param_extractor in self.patterns:
            match = re.search(pattern, command)
            if match:
                try:
                    params = param_extractor(match)
                    return action, params, command
                except Exception as e:
                    print(f"参数提取失败: {e}")
                    continue

        # 未识别的命令，返回None
        return None, {}, command


class CommandExecutor:
    """执行解析后的命令"""

    async def execute(
        self,
        action: str,
        params: Dict[str, Any],
        context: Dict[str, Any],
        ai_service  # 传入ai_service模块
    ) -> Dict[str, Any]:
        """
        执行命令

        Returns:
            {
                "success": bool,
                "message": str,
                "data": Any,
                "action_type": str
            }
        """

        # 续写命令
        if action == "continue":
            return await self._continue_content(params, context, ai_service)

        # 润色命令
        elif action == "polish":
            return await self._polish_content(params, context, ai_service)

        # 风格转换
        elif action == "change_style":
            return await self._change_style(params, context, ai_service)

        # 批量生成
        elif action == "generate_batch_characters":
            return await self._generate_batch_characters(params, context, ai_service)

        elif action == "generate_batch_scenes":
            return await self._generate_batch_scenes(params, context, ai_service)

        # 分析命令
        elif action == "analyze_conflict":
            return await self._analyze_conflict(params, context, ai_service)

        elif action == "find_plot_holes":
            return await self._find_plot_holes(params, context, ai_service)

        elif action == "check_consistency":
            return await self._check_consistency(params, context, ai_service)

        # 建议命令
        elif action == "get_suggestions":
            return await self._get_suggestions(params, context, ai_service)

        elif action == "get_advice":
            return await self._get_advice(params, context, ai_service)

        # 对话优化
        elif action == "optimize_dialogue":
            return await self._optimize_dialogue(params, context, ai_service)

        # 扩写/压缩
        elif action == "expand":
            return await self._expand_content(params, context, ai_service)

        elif action == "summarize":
            return await self._summarize_content(params, context, ai_service)

        # 已有的生成命令
        elif action == "generate_character":
            character = await ai_service.generate_character(params.get("prompt", "创建一个角色"))
            return {
                "success": True,
                "message": f"已创建角色：{character.get('name')}",
                "data": {"type": "character", "entity": character},
                "action_type": "generate"
            }

        elif action == "generate_scene":
            scene = await ai_service.generate_scene(params.get("prompt", "生成一个场景"))
            return {
                "success": True,
                "message": f"已生成场景：{scene.get('title')}",
                "data": {"type": "scene", "entity": scene},
                "action_type": "generate"
            }

        elif action == "generate_plotline":
            plotline = await ai_service.generate_plotline(params.get("prompt", "创建一条剧情线"))
            return {
                "success": True,
                "message": f"已创建剧情线：{plotline.get('title')}",
                "data": {"type": "plotline", "entity": plotline},
                "action_type": "generate"
            }

        else:
            return {
                "success": False,
                "message": f"未知的命令类型：{action}",
                "data": None,
                "action_type": "unknown"
            }

    # ===== 命令实现 =====

    async def _continue_content(self, params: Dict, context: Dict, ai_service) -> Dict:
        """续写内容"""
        length = params.get("length", 500)

        # 获取当前场景或选中的内容
        current_content = context.get("selectedContent", "")
        if not current_content:
            return {
                "success": False,
                "message": "请先选择要续写的内容",
                "data": None,
                "action_type": "continue"
            }

        # 使用AI续写
        prompt = f"""请续写以下内容，续写{length}字左右：

{current_content}

要求：
1. 保持原有风格和语气
2. 情节自然衔接
3. 字数约{length}字
4. 只返回续写部分，不要重复原文"""

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": f"已续写{len(result)}字",
            "data": {"type": "text", "content": result},
            "action_type": "continue"
        }

    async def _polish_content(self, params: Dict, context: Dict, ai_service) -> Dict:
        """润色内容"""
        current_content = context.get("selectedContent", "")
        if not current_content:
            return {
                "success": False,
                "message": "请先选择要润色的内容",
                "data": None,
                "action_type": "polish"
            }

        result = await ai_service.rewrite_content(
            content=current_content,
            instruction="请润色这段文字，使其更加生动、流畅、有感染力。保持原意，但提升表达质量。",
            context=context
        )

        return {
            "success": True,
            "message": "润色完成",
            "data": {"type": "text", "content": result},
            "action_type": "polish"
        }

    async def _change_style(self, params: Dict, context: Dict, ai_service) -> Dict:
        """改变风格"""
        style = params.get("style", "")
        current_content = context.get("selectedContent", "")

        if not current_content:
            return {
                "success": False,
                "message": "请先选择要转换风格的内容",
                "data": None,
                "action_type": "change_style"
            }

        result = await ai_service.rewrite_content(
            content=current_content,
            instruction=f"请将这段文字改写成{style}风格，保持核心内容不变。",
            context=context
        )

        return {
            "success": True,
            "message": f"已转换为{style}风格",
            "data": {"type": "text", "content": result},
            "action_type": "change_style"
        }

    async def _generate_batch_characters(self, params: Dict, context: Dict, ai_service) -> Dict:
        """批量生成角色"""
        count = params.get("count", 3)

        prompt = f"""请一次性生成{count}个角色，包含：主角、配角、反派等。

要求：
1. 角色之间要有关联
2. 性格互补或对立
3. 每个角色都要完整

返回JSON数组格式：
[
  {{"name": "...", "role": "...", ...}},
  {{"name": "...", "role": "...", ...}}
]"""

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": f"已生成{count}个角色",
            "data": {"type": "batch_characters", "content": result},
            "action_type": "generate_batch"
        }

    async def _generate_batch_scenes(self, params: Dict, context: Dict, ai_service) -> Dict:
        """批量生成场景"""
        count = params.get("count", 5)

        prompt = f"请根据当前剧情生成{count}个连贯的场景大纲"

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": f"已生成{count}个场景大纲",
            "data": {"type": "batch_scenes", "content": result},
            "action_type": "generate_batch"
        }

    async def _analyze_conflict(self, params: Dict, context: Dict, ai_service) -> Dict:
        """分析矛盾点"""
        target = params.get("target", "")

        prompt = f"请分析{target}中存在的矛盾点和冲突，包括：内心冲突、人物冲突、情节冲突等"

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": "分析完成",
            "data": {"type": "analysis", "content": result},
            "action_type": "analyze"
        }

    async def _find_plot_holes(self, params: Dict, context: Dict, ai_service) -> Dict:
        """找出剧情漏洞"""
        prompt = "请仔细分析当前剧情，找出所有逻辑漏洞、时间线矛盾、角色行为不合理之处"

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": "检查完成",
            "data": {"type": "plot_holes", "content": result},
            "action_type": "analyze"
        }

    async def _check_consistency(self, params: Dict, context: Dict, ai_service) -> Dict:
        """检查一致性"""
        entities = context.get("entities", [])
        result = await ai_service.analyze_consistency(entities)

        return {
            "success": True,
            "message": f"一致性得分：{result.get('score', 0)}",
            "data": {"type": "consistency", "result": result},
            "action_type": "analyze"
        }

    async def _get_suggestions(self, params: Dict, context: Dict, ai_service) -> Dict:
        """获取写作建议"""
        prompt = """基于当前的创作进度，请给出5条具体的写作建议：
1. 剧情发展方向
2. 角色塑造建议
3. 场景设计建议
4. 节奏把控建议
5. 创意点子"""

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": "已生成建议",
            "data": {"type": "suggestions", "content": result},
            "action_type": "suggest"
        }

    async def _get_advice(self, params: Dict, context: Dict, ai_service) -> Dict:
        """获取具体建议"""
        topic = params.get("topic", "")
        prompt = f"关于'{topic}'，请给出详细的创作建议和具体方法"

        messages = [{"role": "user", "content": prompt}]
        result = await ai_service.chat(messages, context)

        return {
            "success": True,
            "message": "建议已生成",
            "data": {"type": "advice", "content": result},
            "action_type": "suggest"
        }

    async def _optimize_dialogue(self, params: Dict, context: Dict, ai_service) -> Dict:
        """优化对话"""
        current_content = context.get("selectedContent", "")
        if not current_content:
            return {
                "success": False,
                "message": "请先选择包含对话的内容",
                "data": None,
                "action_type": "optimize_dialogue"
            }

        result = await ai_service.rewrite_content(
            content=current_content,
            instruction="请优化对话部分，使其更加自然、有张力、符合角色性格。保持情节不变。",
            context=context
        )

        return {
            "success": True,
            "message": "对话优化完成",
            "data": {"type": "text", "content": result},
            "action_type": "optimize"
        }

    async def _expand_content(self, params: Dict, context: Dict, ai_service) -> Dict:
        """扩写内容"""
        length = params.get("length", 1000)
        current_content = context.get("selectedContent", "")

        if not current_content:
            return {
                "success": False,
                "message": "请先选择要扩写的内容",
                "data": None,
                "action_type": "expand"
            }

        result = await ai_service.expand_content(
            content=current_content,
            target_length=length,
            context=context
        )

        return {
            "success": True,
            "message": f"已扩写到约{length}字",
            "data": {"type": "text", "content": result},
            "action_type": "expand"
        }

    async def _summarize_content(self, params: Dict, context: Dict, ai_service) -> Dict:
        """压缩内容"""
        length = params.get("length", 200)
        current_content = context.get("selectedContent", "")

        if not current_content:
            return {
                "success": False,
                "message": "请先选择要压缩的内容",
                "data": None,
                "action_type": "summarize"
            }

        result = await ai_service.summarize_content(
            content=current_content,
            target_length=length
        )

        return {
            "success": True,
            "message": f"已压缩到约{length}字",
            "data": {"type": "text", "content": result},
            "action_type": "summarize"
        }


# 全局实例
parser = CommandParser()
executor = CommandExecutor()
