# -*- coding: utf-8 -*-
"""Prompt templates and context compaction for lower-token internal calls."""
from __future__ import annotations

from math import ceil

STAGE_LABELS = {
    "cover": "封面信息",
    "worldbuilding": "世界观构建",
    "characters": "人物设计",
    "plot": "剧情大纲",
    "chapters": "章节写作",
}

STAGE_PRIORITIES = {
    "cover": ["cover"],
    "worldbuilding": ["cover", "worldbuilding", "characters"],
    "characters": ["worldbuilding", "cover", "characters", "plot"],
    "plot": ["worldbuilding", "characters", "cover", "plot"],
    "chapters": ["plot", "characters", "worldbuilding", "chapters", "cover"],
}

STAGE_OBJECTIVES = {
    "cover": "提炼作品定位、核心卖点、读者承诺和封面简介。",
    "worldbuilding": "构建可持续制造冲突的世界规则、力量体系、势力版图和隐藏真相。",
    "characters": "设计能主动推动剧情的人物欲望、能力代价、关系张力和成长弧线。",
    "plot": "规划三幕结构、分卷目标、关键转折、爽点密度和伏笔回收。",
    "chapters": "把设定转成章节目标、场景节拍、正文草稿和章末钩子。",
}

STAGE_OUTPUTS = {
    "cover": ["书名候选", "一句话卖点", "类型定位", "120 字封面简介", "首章期待"],
    "worldbuilding": ["世界类型", "力量体系", "势力版图", "隐藏真相", "可写冲突池"],
    "characters": ["主角档案", "反派动机", "关键关系", "人物弧光", "对白声线"],
    "plot": ["一句话梗概", "三幕结构", "第一卷计划", "关键转折", "伏笔回收表"],
    "chapters": ["章节目标", "8 个场景节拍", "正文草稿", "章末钩子", "下一章承接点"],
}

DEFAULT_CONTEXT_BUDGET = 1100
CHAT_CONTEXT_BUDGET = 900
DEFAULT_GENERATION_MODE = "standard"
API_CHAT_TOKEN_LIMIT = 1200
FAST_CONTEXT_SECTION_LIMIT = 2
DUPLICATE_CACHE_TTL_SECONDS = 12
STABLE_PROMPT_RULES = (
    "固定规则：少复述原文；按阶段输出；优先写清因果、关系变化和下一步行动；"
    "避开八股分析、形容词堆叠、低信息密度和早期主线债务过快结清。"
)
DIRECT_PROSE_HINTS = (
    "正文",
    "只写",
    "写一段",
    "写出",
    "生成",
    "续写",
    "草稿",
    "片段",
    "段落",
    "开头",
    "结尾",
    "写入",
    "可直接",
)

CONTEXT_LAYER_DEFS = [
    {"id": "stable_rules", "label": "固定规则", "reason": "稳定前缀，可复用缓存"},
    {"id": "project_memory", "label": "项目记忆", "reason": "作品定位、世界规则、长期设定"},
    {"id": "character_memory", "label": "角色记忆", "reason": "人物弧光、关系状态、动机约束"},
    {"id": "plot_memory", "label": "剧情记忆", "reason": "主线、转折、伏笔和章节目标"},
    {"id": "draft_memory", "label": "章节草稿", "reason": "已有正文和场景承接"},
    {"id": "instant_instruction", "label": "即时指令", "reason": "本次用户输入"},
]

SECTION_LAYER_IDS = {
    "cover": "project_memory",
    "worldbuilding": "project_memory",
    "characters": "character_memory",
    "plot": "plot_memory",
    "chapters": "draft_memory",
}

SECTION_QUERY_HINTS = {
    "characters": ("人物", "角色", "主角", "女主", "反派", "导师", "对白", "关系", "动机", "弧光"),
    "plot": ("剧情", "主线", "支线", "转折", "伏笔", "冲突", "钩子", "节奏", "爽点"),
    "worldbuilding": ("世界", "设定", "规则", "力量", "势力", "地图", "禁区", "体系"),
    "chapters": ("章节", "场景", "正文", "草稿", "段落", "开头", "结尾"),
    "cover": ("书名", "简介", "卖点", "类型", "读者"),
}

PROMPT_MODES = {
    "fast": {
        "label": "快速",
        "context_budget_chars": 650,
        "strategy": "优先速度：只保留最相关设定，输出可立即执行的短清单。",
    },
    "standard": {
        "label": "标准",
        "context_budget_chars": DEFAULT_CONTEXT_BUDGET,
        "strategy": "平衡速度与质量：压缩关键上下文，输出完整但不冗长。",
    },
    "deep": {
        "label": "深度",
        "context_budget_chars": 1600,
        "strategy": "优先质量：保留更多人物、剧情和伏笔信息，适合复杂章节。",
    },
}


def normalize_generation_mode(mode: str | None) -> str:
    if mode in PROMPT_MODES:
        return mode
    return DEFAULT_GENERATION_MODE


def estimate_tokens(text: str) -> int:
    """Return a conservative token estimate for mixed Chinese/English text."""
    compact = "".join(text.split())
    if not compact:
        return 0
    cjk_chars = sum(1 for char in compact if "\u3400" <= char <= "\u9fff")
    non_cjk_chars = len(compact) - cjk_chars
    return cjk_chars + ceil(non_cjk_chars / 4)


def _trim_middle(text: str, max_chars: int) -> str:
    clean = " ".join(text.split())
    if len(clean) <= max_chars:
        return clean
    if max_chars <= 24:
        return clean[:max_chars]
    head = max_chars // 2
    tail = max_chars - head - 12
    return f"{clean[:head]} ...[压缩]... {clean[-tail:]}"


def _layer_meta(layer_id: str) -> dict[str, str]:
    for layer in CONTEXT_LAYER_DEFS:
        if layer["id"] == layer_id:
            return layer
    return {"id": layer_id, "label": layer_id, "reason": ""}


def _make_layer(layer_id: str, chars: int, reason: str | None = None) -> dict[str, object]:
    meta = _layer_meta(layer_id)
    return {
        "id": layer_id,
        "label": meta["label"],
        "chars": chars,
        "estimated_tokens": estimate_tokens("x" * chars),
        "reason": reason or meta["reason"],
    }


def _layer_totals(chunks: list[tuple[str, str]]) -> list[dict[str, object]]:
    totals: dict[str, int] = {}
    for section_id, text in chunks:
        layer_id = SECTION_LAYER_IDS.get(section_id, "project_memory")
        totals[layer_id] = totals.get(layer_id, 0) + len(text)
    return [_make_layer(layer_id, totals[layer_id]) for layer_id in [item["id"] for item in CONTEXT_LAYER_DEFS] if totals.get(layer_id, 0)]


def _matched_query_terms(section_id: str, query: str) -> list[str]:
    if not query:
        return []
    return [term for term in SECTION_QUERY_HINTS.get(section_id, ()) if term in query]


def _rank_sections_for_query(priorities: list[str], query: str) -> list[str]:
    if not query:
        return list(priorities)
    indexed = {section_id: index for index, section_id in enumerate(priorities)}
    return sorted(
        priorities,
        key=lambda section_id: (-len(_matched_query_terms(section_id, query)), indexed[section_id]),
    )


def _recall_item(section_id: str, query: str) -> dict[str, object]:
    matched_terms = _matched_query_terms(section_id, query)
    reason = f"命中：{'、'.join(matched_terms)}" if matched_terms else "阶段优先召回"
    return {
        "section": section_id,
        "label": STAGE_LABELS.get(section_id, section_id),
        "reason": reason,
        "matched_terms": matched_terms,
    }


def _with_prompt_layers(
    compact: dict[str, object],
    instant_instruction: str = "",
) -> dict[str, object]:
    layers = [_make_layer("stable_rules", len(STABLE_PROMPT_RULES))]
    layers.extend(compact.get("layers", []))
    if instant_instruction.strip():
        layers.append(_make_layer("instant_instruction", len(_trim_middle(instant_instruction, 420))))
    compact = {**compact, "layers": layers}
    return compact


def is_direct_prose_request(message: str, stage: str, model_role: str | None = None) -> bool:
    if stage != "chapters" or model_role != "writer":
        return False
    text = str(message or "")
    return any(hint in text for hint in DIRECT_PROSE_HINTS)


def compact_sections(
    sections: dict[str, str],
    stage: str,
    max_chars: int = DEFAULT_CONTEXT_BUDGET,
    query: str = "",
) -> dict[str, object]:
    """Select stage-relevant sections and cap the context sent to model APIs."""
    priorities = _rank_sections_for_query(STAGE_PRIORITIES.get(stage, STAGE_PRIORITIES["worldbuilding"]), query)
    raw_text = "\n".join(value for value in sections.values() if value.strip())
    usable_sections = [(key, sections.get(key, "")) for key in priorities if sections.get(key, "").strip()]
    if not usable_sections:
        return {
            "context": "（暂无可用 WPS 上下文，仅根据当前用户指令生成。）",
            "chars": 0,
            "raw_chars": len(raw_text),
            "saved_chars": len(raw_text),
            "estimated_tokens": 0,
            "raw_estimated_tokens": estimate_tokens(raw_text),
            "sections": [],
            "layers": [],
            "recall": [],
        }

    per_section = max(120, max_chars // len(usable_sections))
    chunks: list[str] = []
    layer_chunks: list[tuple[str, str]] = []
    used_sections: list[str] = []
    remaining = max_chars
    separator_budget = 2 * max(0, len(usable_sections) - 1)
    remaining = max(0, remaining - separator_budget)
    for key, value in usable_sections:
        if remaining <= 0:
            break
        prefix = f"[{key}]\n"
        budget = min(per_section, max(0, remaining - len(prefix)))
        trimmed = _trim_middle(value, budget)
        chunk = f"{prefix}{trimmed}"
        if len(chunk) > remaining:
            chunk = chunk[:remaining]
        chunks.append(chunk)
        layer_chunks.append((key, chunk))
        used_sections.append(key)
        remaining -= len(chunk)

    context = "\n\n".join(chunks)
    raw_chars = len(raw_text)
    chars = len(context)
    return {
        "context": context,
        "chars": chars,
        "raw_chars": raw_chars,
        "saved_chars": max(0, raw_chars - chars),
        "estimated_tokens": estimate_tokens(context),
        "raw_estimated_tokens": estimate_tokens(raw_text),
        "sections": used_sections,
        "layers": _layer_totals(layer_chunks),
        "recall": [_recall_item(section_id, query) for section_id in used_sections],
    }


def build_stage_prompt(
    stage: str,
    sections: dict[str, str],
    max_chars: int | None = None,
    mode: str = DEFAULT_GENERATION_MODE,
) -> dict[str, object]:
    mode_id = normalize_generation_mode(mode)
    mode_config = PROMPT_MODES[mode_id]
    context_budget = max_chars if max_chars is not None else mode_config["context_budget_chars"]
    label = STAGE_LABELS.get(stage, STAGE_LABELS["worldbuilding"])
    outputs = STAGE_OUTPUTS.get(stage, STAGE_OUTPUTS["worldbuilding"])
    compact = compact_sections(sections, stage, max_chars=context_budget)
    compact = _with_prompt_layers(compact)
    compact["context_budget_chars"] = context_budget
    compact["mode"] = mode_id
    output_lines = "\n".join(f"{index}. {item}" for index, item in enumerate(outputs, start=1))
    prompt = f"""你是专业的 AI 小说创作协作系统，当前阶段：{label}。
{STABLE_PROMPT_RULES}
生成模式：{mode_config["label"]} / {mode_config["strategy"]}

目标：
{STAGE_OBJECTIVES.get(stage, STAGE_OBJECTIVES["worldbuilding"])}

压缩上下文：
{compact["context"]}

输出格式：
{output_lines}

要求：
- 只使用与当前阶段相关的信息，不要复述无关设定。
- 必须补一段“关系变化链”：写清角色 A -> 角色 B 的当前状态、主要剧情引导、变化原因、后续关系变化。
- 每个关键剧情转折都要说明“为什么现在变化”，不要只写事件结果。
- 每条内容必须可直接用于写作或后续 Agent 协作。
- 如果上下文不足，明确列出缺口，并给出可补充的问题。"""
    return {
        "mode": mode_id,
        "prompt": prompt,
        "context": compact["context"],
        "budget": compact,
    }


def build_chat_payload(
    message: str,
    stage: str,
    sections: dict[str, str],
    max_chars: int = CHAT_CONTEXT_BUDGET,
    model_role: str | None = None,
) -> dict[str, object]:
    compact = compact_sections(sections, stage, max_chars=max_chars, query=message)
    compact = _with_prompt_layers(compact, instant_instruction=message)
    if is_direct_prose_request(message, stage, model_role):
        system = (
            "你是专业的中文小说正文写手。只输出小说正文，不输出判断、建议、提纲、解释或下一步计划。"
            f"{STABLE_PROMPT_RULES}"
            "优先使用压缩上下文保持人物、因果和氛围一致；如果上下文不足，也要直接补齐合理细节写成正文。"
        )
        user = f"""当前阶段：{STAGE_LABELS.get(stage, stage)}

压缩上下文：
{compact["context"]}

用户写作指令：{_trim_middle(message, 420)}

输出要求：
- 只输出可直接粘贴进小说文档的正文。
- 不要输出判断、建议、可执行下一步、提纲或创作说明。
- 不要说“好的”“以下是正文”“根据指令生成”等开场白，第一行直接进入故事。
- 保留画面、行动、异常细节、人物目标和章末钩子。
- 不要用 Markdown 标题、项目符号或分隔线。"""
    else:
        system = (
            "你是专业的网文写作 AI 协作系统。"
            f"{STABLE_PROMPT_RULES}"
            "优先使用压缩上下文回答，保持具体、可执行、少空话。"
            "除非用户要求，不要重复大段原文。"
        )
        user = f"""当前阶段：{STAGE_LABELS.get(stage, stage)}

压缩上下文：
{compact["context"]}

用户指令：
{_trim_middle(message, 420)}

请按“判断 / 建议 / 可执行下一步”三段输出。"""
    if len(user) > 1600:
        user = user[:1600]
    return {
        "system": system,
        "user": user,
        "context": compact["context"],
        "budget": compact,
    }


def get_prompt_policy(stage: str) -> dict[str, object]:
    return {
        "stage": stage,
        "label": STAGE_LABELS.get(stage, stage),
        "context_budget_chars": DEFAULT_CONTEXT_BUDGET,
        "chat_budget_chars": CHAT_CONTEXT_BUDGET,
        "cost_guard": {
            "api_chat_token_limit": API_CHAT_TOKEN_LIMIT,
            "fast_context_sections": FAST_CONTEXT_SECTION_LIMIT,
            "duplicate_cache_ttl_seconds": DUPLICATE_CACHE_TTL_SECONDS,
        },
        "context_layers": CONTEXT_LAYER_DEFS,
        "priority_sections": STAGE_PRIORITIES.get(stage, STAGE_PRIORITIES["worldbuilding"]),
        "outputs": STAGE_OUTPUTS.get(stage, STAGE_OUTPUTS["worldbuilding"]),
        "modes": PROMPT_MODES,
    }
