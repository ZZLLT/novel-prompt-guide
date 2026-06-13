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

    "generate_character": """请根据以下要求生成一个角色卡片：

要求：{prompt}

请以JSON格式返回，包含以下字段：
{{
  "name": "角色名字",
  "role": "protagonist/supporting/antagonist/minor",
  "age": 年龄（可选）,
  "gender": "性别",
  "appearance": "外貌描述",
  "traits": ["性格特征1", "性格特征2", "性格特征3"],
  "background": "背景故事（200字左右）",
  "motivation": "动机（为什么这么做）",
  "fear": "恐惧（最怕什么）",
  "skills": ["技能1", "技能2"],
  "weaknesses": ["弱点1", "弱点2"],
  "relationships": []
}}

只返回JSON，不要其他解释。""",

    "generate_scene": """请根据以下要求生成一个场景：

要求：{prompt}

{context_info}

请以JSON格式返回，包含以下字段：
{{
  "title": "场景标题",
  "type": "scene",
  "status": "draft",
  "summary": "场景概要（100字）",
  "content": "场景正文（1500-2000字，包含对话、动作、环境描写）",
  "notes": "创作笔记（可选）",
  "mood": "overall_mood",
  "purpose": "scene_purpose",
  "characters": ["涉及的角色ID"],
  "locations": [],
  "plotlines": []
}}

场景正文要求：
1. 生动的环境描写
2. 符合角色性格的对话
3. 推进剧情的关键事件
4. 适当的情绪渲染
5. 自然的节奏把控

只返回JSON，不要其他解释。""",

    "generate_plotline": """请根据以下要求生成一条剧情线：

要求：{prompt}

请以JSON格式返回，包含以下字段：
{{
  "title": "剧情线标题",
  "type": "main/subplot/character-arc",
  "description": "剧情线描述（200字）",
  "status": "setup",
  "keyPoints": [
    {{
      "title": "关键节点1",
      "description": "节点描述",
      "completed": false
    }},
    {{
      "title": "关键节点2",
      "description": "节点描述",
      "completed": false
    }}
  ],
  "characters": [],
  "scenes": [],
  "progress": 0,
  "color": "#e74c3c"
}}

剧情线要求：
1. 明确的起承转合
2. 5-8个关键节点
3. 节点之间有逻辑联系
4. 符合小说类型特点
5. 留有发展空间

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
