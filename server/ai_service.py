"""
AI服务 - 提供AI对话、生成、分析功能
"""
from typing import List, Dict, Any, Optional, AsyncGenerator
from fastapi import HTTPException
from openai import AsyncOpenAI
import json
import os
import time
import sys

# 确保stdout使用UTF-8编码
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 初始化OpenAI客户端
client = None
current_config = {
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 2000
}

def init_ai_client(api_key: str = None, base_url: str = None, model: str = None, temperature: float = None, max_tokens: int = None):
    """初始化AI客户端"""
    global client, current_config
    api_key = api_key or os.getenv("OPENAI_API_KEY")
    base_url = base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

    if not api_key:
        raise ValueError("OpenAI API key is required")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url
    )

    # 更新配置
    if model:
        current_config["model"] = model
    if temperature is not None:
        current_config["temperature"] = temperature
    if max_tokens is not None:
        current_config["max_tokens"] = max_tokens

# 提示词模板
PROMPTS = {
    "system": """你是一位专业的网文创作助手。你擅长：
1. 角色设定：创造立体、有吸引力的角色
2. 剧情设计：构思引人入胜的情节
3. 场景描写：生动的环境和氛围营造
4. 文风调整：适应不同类型的写作风格
5. 一致性检查：确保故事逻辑和角色行为前后一致

请根据用户的需求，提供专业、详细、有创意的建议和内容。""",

    "generate_character": """你是一位资深的角色设计师。请创建一个真实、立体、有吸引力的角色。

用户需求：{prompt}

创作角色时，请深入思考：
1. **核心冲突** - 这个角色内心最大的矛盾是什么？
2. **塑造因素** - 是什么经历塑造了TA的性格？
3. **深层渴望** - TA最深的渴望和最大的遗憾是什么？
4. **行为模式** - TA在面对选择时会如何权衡？有什么习惯性反应？
5. **语言特点** - TA的说话方式、口头禅、表达习惯是什么？
6. **成长空间** - TA有什么成长潜力？可能经历什么转变？

请以JSON格式返回，包含以下字段：
{{
  "name": "角色名字",
  "role": "protagonist/supporting/antagonist/minor",
  "age": 年龄,
  "gender": "性别",
  "appearance": "外貌描述（50-100字，具体生动）",
  "traits": ["性格特征1（具体描述）", "性格特征2", "性格特征3", "性格特征4"],
  "background": "背景故事（300字左右，包含关键转折点）",
  "motivation": "核心动机（为什么这么做，深层原因）",
  "fear": "最大恐惧（害怕什么，为什么害怕）",
  "desire": "最深渴望（想要什么，为什么想要）",
  "conflict": "内心冲突（矛盾的价值观或目标）",
  "skills": ["技能1", "技能2", "技能3"],
  "weaknesses": ["致命弱点1", "性格缺陷2"],
  "habits": ["习惯1", "习惯2"],
  "speech": "说话风格和口头禅",
  "relationships": [],
  "arc": "可能的成长轨迹（简述）"
}}

只返回JSON，不要其他解释。""",

    "generate_scene": """你是一位专业的场景设计师。请创作一个生动、有张力、推进剧情的场景。

用户需求：{prompt}

{context_info}

创作场景时，请注意：
1. **开场钩子** - 前50字就要抓住读者注意力
2. **环境渲染** - 用感官细节营造氛围（视觉、听觉、气味、触感）
3. **冲突设计** - 每个场景都要有冲突点（人物间、人物与环境、内心冲突）
4. **对话真实** - 符合角色性格，有潜台词，推进情节
5. **节奏把控** - 快慢结合，张弛有度
6. **情绪层次** - 情绪要有起伏和转折
7. **伏笔暗示** - 适当埋设后续伏笔
8. **结尾悬念** - 留下钩子，引导读者继续阅读

请以JSON格式返回，包含以下字段：
{{
  "title": "场景标题（吸引人，10字内）",
  "type": "scene",
  "status": "draft",
  "summary": "场景概要（150字，核心冲突+转折点）",
  "content": "场景正文（1800-2500字）

【结构建议】
- 开场（200字）：环境+钩子，立即抓住注意力
- 发展（800字）：冲突展开，对话推进，细节渲染
- 高潮（600字）：冲突爆发，情绪顶点，关键转折
- 结尾（400字）：暂时解决，留下悬念或新问题

【写作要点】
- 环境描写要服务于情节和情绪
- 对话占30-40%，要有动作和表情描写
- 至少2-3个情绪转折
- 体现角色性格和关系变化
- 节奏感：紧张-舒缓-高潮-余韵",

  "notes": "创作笔记（场景意图、埋下的伏笔、情绪设计）",
  "mood": "整体情绪（紧张/温馨/悲伤/激烈/神秘）",
  "purpose": "场景作用（推进主线/角色成长/揭示真相/情感升华）",
  "characters": ["涉及的角色ID"],
  "locations": ["场景地点"],
  "plotlines": ["关联的剧情线"],
  "hooks": ["埋下的伏笔或钩子"],
  "conflicts": ["本场景的冲突点"],
  "emotional_beats": ["情绪节奏：开场情绪 → 转折情绪 → 高潮情绪 → 结尾情绪"]
}}

只返回JSON，不要其他解释。""",

    "generate_plotline": """你是一位经验丰富的故事架构师。请设计一条完整、吸引人、有深度的剧情线。

用户需求：{prompt}

设计剧情线时，请遵循经典叙事结构：

【三幕结构】
- 第一幕（建立）：介绍人物、建立世界观、提出冲突
- 第二幕（对抗）：冲突升级、挫折与成长、中点转折
- 第三幕（解决）：高潮对决、问题解决、余韵回响

【关键要素】
1. **核心冲突** - 明确的主要矛盾，贯穿始终
2. **角色动机** - 驱动角色行动的深层原因
3. **升级阶梯** - 冲突逐步升级，步步紧逼
4. **意外转折** - 2-3个意外但合理的转折点
5. **情感节奏** - 情感起伏有致，有希望有绝望
6. **主题深化** - 不只是情节，要有价值思考

请以JSON格式返回，包含以下字段：
{{
  "title": "剧情线标题（吸引人，有悬念）",
  "type": "main/subplot/character-arc",
  "description": "剧情线描述（300字）
- 核心冲突是什么？
- 主要角色面临什么困境？
- 将如何发展和解决？
- 体现什么主题？",

  "status": "setup",

  "keyPoints": [
    {{
      "title": "起点：建立冲突",
      "description": "详细描述（100字）：
- 初始状态
- 触发事件
- 角色反应",
      "completed": false,
      "act": 1
    }},
    {{
      "title": "第一次挫折",
      "description": "详细描述：
- 遇到什么困难
- 如何尝试解决
- 失败的代价",
      "completed": false,
      "act": 1
    }},
    {{
      "title": "承诺点：不归路",
      "description": "角色做出关键决定，无法回头",
      "completed": false,
      "act": 2
    }},
    {{
      "title": "中点转折",
      "description": "重大发现或逆转，改变一切",
      "completed": false,
      "act": 2
    }},
    {{
      "title": "最黑暗时刻",
      "description": "希望破灭，似乎已无路可走",
      "completed": false,
      "act": 2
    }},
    {{
      "title": "顿悟突破",
      "description": "找到新视角或新方法",
      "completed": false,
      "act": 3
    }},
    {{
      "title": "最终对决",
      "description": "高潮冲突，决定成败",
      "completed": false,
      "act": 3
    }},
    {{
      "title": "新世界",
      "description": "冲突解决后的新状态，角色成长",
      "completed": false,
      "act": 3
    }}
  ],

  "characters": [],
  "scenes": [],
  "progress": 0,
  "color": "#e74c3c",

  "theme": "主题（这条线探讨什么？）",
  "stakes": "赌注（失败会失去什么？）",
  "resolution": "预期结局方式"
}}

关键节点要求：
- 总共6-8个节点
- 每个节点有因果关系
- 逐步升级，不走回头路
- 有意外但符合逻辑
- 体现角色成长

只返回JSON，不要其他解释。""",

    "expand_content": """请扩写以下内容：

原始内容：
{content}

目标字数：{target_length}字

要求：
1. 保持原有风格和基调
2. 增加细节描写（环境、动作、心理）
3. 丰富对话内容
4. 保持故事逻辑连贯
5. 不改变核心情节

只返回扩写后的完整内容，不要其他解释。""",

    "rewrite_content": """请根据指令改写以下内容：

原始内容：
{content}

改写指令：{instruction}

要求：
1. 严格按照指令进行改写
2. 保持核心情节不变
3. 确保文字流畅自然
4. 符合网文写作规范

只返回改写后的完整内容，不要其他解释。""",

    "summarize_content": """请压缩以下内容：

原始内容：
{content}

目标字数：{target_length}字

要求：
1. 保留核心情节
2. 删除冗余描写
3. 保持关键对话
4. 确保逻辑完整
5. 文字简洁有力

只返回压缩后的完整内容，不要其他解释。""",

    "analyze_consistency": """请分析以下内容的一致性：

角色信息：
{characters}

场景信息：
{scenes}

剧情线信息：
{plotlines}

请检查：
1. 角色性格前后是否一致
2. 角色关系是否合理
3. 剧情逻辑是否通顺
4. 时间线是否有冲突
5. 场景描写是否矛盾

以JSON格式返回分析结果：
{{
  "score": 85,
  "issues": [
    {{
      "type": "character_inconsistency",
      "severity": "medium",
      "description": "角色A在场景1中表现勇敢，但在场景3中却突然胆小",
      "entities": ["character_id", "scene_id"]
    }}
  ]
}}

只返回JSON，不要其他解释。"""
}

async def chat(messages: List[Dict[str, str]], context: Dict[str, Any]) -> str:
    """普通对话"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    # 构建系统消息
    system_message = {
        "role": "system",
        "content": PROMPTS["system"] + f"\n\n当前上下文：工作区={context.get('workspace')}, 角色数={context.get('summary', {}).get('characterCount', 0)}, 场景数={context.get('summary', {}).get('sceneCount', 0)}"
    }

    # 调用OpenAI
    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[system_message] + messages,
            temperature=current_config["temperature"],
            max_tokens=current_config["max_tokens"]
        )

        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

async def chat_stream(messages: List[Dict[str, str]], context: Dict[str, Any]) -> AsyncGenerator[str, None]:
    """流式对话"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    system_message = {
        "role": "system",
        "content": PROMPTS["system"] + f"\n\n当前上下文：工作区={context.get('workspace')}"
    }

    try:
        stream = await client.chat.completions.create(
            model=current_config["model"],
            messages=[system_message] + messages,
            temperature=current_config["temperature"],
            max_tokens=current_config["max_tokens"],
            stream=True
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI stream failed: {str(e)}")

async def generate_character(prompt: str) -> Dict[str, Any]:
    """生成角色"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位角色设计专家。"},
                {"role": "user", "content": PROMPTS["generate_character"].format(prompt=prompt)}
            ],
            temperature=0.8,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        character_data = json.loads(response.choices[0].message.content)

        # 添加必要字段
        character_data["id"] = f"char-{int(os.urandom(4).hex(), 16)}"
        character_data["createdAt"] = int(time.time() * 1000)
        character_data["updatedAt"] = character_data["createdAt"]

        return character_data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generate character failed: {str(e)}")

async def generate_scene(prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """生成场景"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    context_info = ""
    if context:
        if context.get("characters"):
            char_names = [c.get("name", "") for c in context["characters"][:5]]
            context_info += f"\n可用角色：{', '.join(char_names)}"
        if context.get("plotlines"):
            plot_titles = [p.get("title", "") for p in context["plotlines"][:3]]
            context_info += f"\n相关剧情线：{', '.join(plot_titles)}"

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位场景创作专家。"},
                {"role": "user", "content": PROMPTS["generate_scene"].format(prompt=prompt, context_info=context_info)}
            ],
            temperature=0.8,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )

        scene_data = json.loads(response.choices[0].message.content)

        # 添加必要字段
        scene_data["id"] = f"scene-{int(os.urandom(4).hex(), 16)}"
        scene_data["wordCount"] = len(scene_data.get("content", ""))
        scene_data["order"] = 0
        scene_data["createdAt"] = int(time.time() * 1000)
        scene_data["updatedAt"] = scene_data["createdAt"]

        return scene_data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generate scene failed: {str(e)}")

async def generate_plotline(prompt: str) -> Dict[str, Any]:
    """生成剧情线"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位剧情设计专家。"},
                {"role": "user", "content": PROMPTS["generate_plotline"].format(prompt=prompt)}
            ],
            temperature=0.8,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        plotline_data = json.loads(response.choices[0].message.content)

        # 添加必要字段
        plotline_data["id"] = f"plot-{int(os.urandom(4).hex(), 16)}"
        plotline_data["createdAt"] = int(time.time() * 1000)
        plotline_data["updatedAt"] = plotline_data["createdAt"]

        return plotline_data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generate plotline failed: {str(e)}")

async def expand_content(content: str, target_length: int, context: Optional[Dict[str, Any]] = None) -> str:
    """扩写内容"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位内容扩写专家。"},
                {"role": "user", "content": PROMPTS["expand_content"].format(content=content, target_length=target_length)}
            ],
            temperature=0.7,
            max_tokens=4000
        )

        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Expand content failed: {str(e)}")

async def rewrite_content(content: str, instruction: str, context: Optional[Dict[str, Any]] = None) -> str:
    """改写内容"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位内容改写专家。"},
                {"role": "user", "content": PROMPTS["rewrite_content"].format(content=content, instruction=instruction)}
            ],
            temperature=0.7,
            max_tokens=4000
        )

        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rewrite content failed: {str(e)}")

async def summarize_content(content: str, target_length: int) -> str:
    """压缩内容"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位内容精简专家。"},
                {"role": "user", "content": PROMPTS["summarize_content"].format(content=content, target_length=target_length)}
            ],
            temperature=0.6,
            max_tokens=3000
        )

        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarize content failed: {str(e)}")

async def analyze_consistency(entities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """分析一致性"""
    if not client:
        raise HTTPException(status_code=500, detail="AI client not initialized")

    characters = [e for e in entities if e.get("type") == "character"]
    scenes = [e for e in entities if e.get("type") == "scene"]
    plotlines = [e for e in entities if e.get("type") == "plotline"]

    try:
        response = await client.chat.completions.create(
            model=current_config["model"],
            messages=[
                {"role": "system", "content": "你是一位故事一致性分析专家。"},
                {"role": "user", "content": PROMPTS["analyze_consistency"].format(
                    characters=json.dumps(characters, ensure_ascii=False),
                    scenes=json.dumps(scenes, ensure_ascii=False),
                    plotlines=json.dumps(plotlines, ensure_ascii=False)
                )}
            ],
            temperature=0.5,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyze consistency failed: {str(e)}")
