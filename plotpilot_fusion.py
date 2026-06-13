# -*- coding: utf-8 -*-
"""Lightweight PlotPilot-inspired writing engine primitives.

This module folds in the useful ideas without importing PlotPilot's runtime
stack: versioned prompt nodes, render diagnostics, generation policies and
local quality guardrails. None of these functions call a remote model.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from string import Formatter
from typing import Any


GENERATION_PROFILES = {
    "draft_fast": {
        "label": "快速草稿",
        "model_role": "writer",
        "temperature": 0.45,
        "max_tokens": 4096,
        "token_policy": "只传章节目标、出场人物、最近剧情增量。",
    },
    "planning_macro": {
        "label": "宏观规划",
        "model_role": "planner",
        "temperature": 0.55,
        "max_tokens": 4096,
        "token_policy": "只传结构摘要、未回收伏笔和本卷目标。",
    },
    "review_gate": {
        "label": "质量审查",
        "model_role": "reviewer",
        "temperature": 0.2,
        "max_tokens": 2048,
        "token_policy": "先本地启发式筛查，再把问题清单交给低成本模型。",
    },
}


POLICY_PACKS = {
    "prompt_gateway": {
        "missing_required_variable": "fail",
        "missing_template_variable": "fail",
        "output_schema_error": "observable_failure",
    },
    "review_gate": {
        "allow_fallback": True,
        "parse_failure": "warning_result",
        "max_reported_errors": 6,
    },
    "cost_guard": {
        "remote_model_calls": "explicit_user_action_only",
        "batch_prompt_init": True,
        "cache_static_catalog": True,
    },
}


WORLDBUILDING_CONTRACT = [
    {
        "key": "core_rules",
        "label": "核心规则",
        "fields": ["世界限制", "力量代价", "不可违背的禁忌"],
    },
    {
        "key": "geography",
        "label": "空间结构",
        "fields": ["关键地点", "资源分布", "移动阻力"],
    },
    {
        "key": "society",
        "label": "社会秩序",
        "fields": ["权力结构", "公开规则", "灰色交易"],
    },
    {
        "key": "culture",
        "label": "文化心理",
        "fields": ["共同信念", "恐惧来源", "荣誉/羞耻机制"],
    },
    {
        "key": "daily_life",
        "label": "日常质感",
        "fields": ["衣食住行", "普通人的代价", "读者可感知细节"],
    },
]


PROMPT_CATEGORIES = [
    {"key": "generation", "name": "生成类", "description": "章节正文、场景节拍和段落草稿。"},
    {"key": "relationship", "name": "人物线", "description": "关系变化、动机约束和图谱增量。"},
    {"key": "quality", "name": "质量守门", "description": "语言风格、密度、节奏和宏观推进。"},
    {"key": "worldbuilding", "name": "世界观", "description": "五维设定契约与知识结构。"},
    {"key": "context", "name": "上下文", "description": "短上下文包、变量和缓存策略。"},
]


PROMPT_NODES = [
    {
        "id": "chapter-generate",
        "category": "generation",
        "name": "章节生成提示词",
        "description": "把章节目标、人物和场景节拍压成可直接写正文的短指令。",
        "version": 3,
        "tags": ["章节", "正文", "短上下文"],
        "variables": [
            {"name": "stage_label", "display_name": "阶段", "required": True, "source": "stage"},
            {"name": "chapter_goal", "display_name": "章节目标", "required": True, "source": "user"},
            {"name": "cast", "display_name": "出场人物", "required": True, "source": "character_memory"},
            {"name": "scene_beats", "display_name": "场景节拍", "required": True, "source": "plot_memory"},
        ],
        "token_policy": "只传本章目标、出场人物和节拍，不传全书设定。",
        "system_template": "你是中文长篇小说写作协作系统，当前阶段：{stage_label}。请直接服务小说文档，不写视频、配音或镜头脚本。",
        "user_template": "章节目标：{chapter_goal}\n出场人物：{cast}\n场景节拍：{scene_beats}\n输出：可继续打磨的正文草稿，保留动作、对话、冲突和章末钩子。",
    },
    {
        "id": "relationship-delta",
        "category": "relationship",
        "name": "人物关系增量提示词",
        "description": "只提交当前关系线、变化原因和下一步影响，用于更新人物图谱。",
        "version": 2,
        "tags": ["人物线", "增量", "剧情影响"],
        "variables": [
            {"name": "source_character", "display_name": "人物A", "required": True, "source": "relationship_graph"},
            {"name": "target_character", "display_name": "人物B", "required": True, "source": "relationship_graph"},
            {"name": "change_reason", "display_name": "变化原因", "required": True, "source": "user"},
            {"name": "future_shift", "display_name": "后续变化", "required": True, "source": "planner"},
        ],
        "token_policy": "只传被修改的边和相关场景，不刷新整张关系图。",
        "system_template": "你是人物关系线编辑器，只处理 {source_character} 与 {target_character} 的关系增量。",
        "user_template": "变化原因：{change_reason}\n后续变化：{future_shift}\n输出 JSON 字段：status、cause、next_shift、plot_effect。",
    },
    {
        "id": "quality-review",
        "category": "quality",
        "name": "六维质量守门提示词",
        "description": "根据本地质量报告，只让 AI 修最重要的问题，不全章重写。",
        "version": 4,
        "tags": ["审查", "修订", "低成本"],
        "variables": [
            {"name": "quality_report", "display_name": "质量报告", "required": True, "source": "local_guardrail"},
            {"name": "chapter_goal", "display_name": "章节目标", "required": True, "source": "user"},
        ],
        "token_policy": "先本地分析，再把最多 6 条问题摘要交给 reviewer 模型。",
        "system_template": "你是小说编辑审稿助手，只根据质量守门报告给修订建议。",
        "user_template": "章节目标：{chapter_goal}\n质量报告：{quality_report}\n输出：按严重度排序的修订清单，不直接重写全文。",
    },
    {
        "id": "world-contract",
        "category": "worldbuilding",
        "name": "世界观五维契约",
        "description": "把世界观拆成核心规则、空间、社会、文化、日常五维，避免散乱设定。",
        "version": 1,
        "tags": ["世界观", "契约", "知识结构"],
        "variables": [
            {"name": "premise", "display_name": "一句话设定", "required": True, "source": "cover"},
            {"name": "genre", "display_name": "类型", "required": True, "source": "cover"},
        ],
        "token_policy": "每维只写 2-3 句，避免生成长篇百科。",
        "system_template": "你是世界观契约编辑器，类型：{genre}。",
        "user_template": "一句话设定：{premise}\n输出五维：核心规则、空间结构、社会秩序、文化心理、日常质感。",
    },
    {
        "id": "context-pack",
        "category": "context",
        "name": "短上下文包",
        "description": "把任务整理成目标、限制、相关事实、输出格式四段。",
        "version": 1,
        "tags": ["token", "上下文", "缓存"],
        "variables": [
            {"name": "task", "display_name": "任务", "required": True, "source": "user"},
            {"name": "constraints", "display_name": "限制", "required": True, "source": "policy"},
            {"name": "facts", "display_name": "相关事实", "required": True, "source": "memory"},
        ],
        "token_policy": "稳定规则放前缀，变量增量放后缀，提高缓存命中。",
        "system_template": "你是上下文压缩器，目标是降低 token 消耗。",
        "user_template": "任务：{task}\n限制：{constraints}\n相关事实：{facts}\n输出四段：目标 / 限制 / 事实 / 格式。",
    },
    {
        "id": "macro-pacing",
        "category": "quality",
        "name": "宏观节奏诊断",
        "description": "检查早期是否过快结清主线债务、秘密是否同章过载。",
        "version": 1,
        "tags": ["节奏", "伏笔", "长期连载"],
        "variables": [
            {"name": "chapter_number", "display_name": "章节号", "required": True, "source": "chapter"},
            {"name": "payoff_signals", "display_name": "结清信号", "required": True, "source": "local_guardrail"},
        ],
        "token_policy": "只提交本章诊断摘要，不提交全文。",
        "system_template": "你是长篇连载节奏编辑，只判断主线债务是否过早结清。",
        "user_template": "章节号：{chapter_number}\n结清信号：{payoff_signals}\n输出：保留债务、延迟回收、制造余波的具体建议。",
    },
]


class _MissingDict(dict):
    def __missing__(self, key: str) -> str:
        return "{" + key + "}"


def _template_fields(template: str) -> set[str]:
    return {
        field_name
        for _, field_name, _, _ in Formatter().parse(template or "")
        if field_name
    }


def _node_by_id(node_id: str) -> dict[str, Any] | None:
    for node in PROMPT_NODES:
        if node["id"] == node_id:
            return node
    return None


def _node_public(node: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": node["id"],
        "category": node["category"],
        "name": node["name"],
        "description": node["description"],
        "version": node["version"],
        "tags": list(node["tags"]),
        "variables": list(node["variables"]),
        "variable_names": [item["name"] for item in node["variables"]],
        "token_policy": node["token_policy"],
    }


def get_prompt_plaza() -> dict[str, Any]:
    nodes_by_category: dict[str, list[dict[str, Any]]] = {}
    for category in PROMPT_CATEGORIES:
        nodes_by_category[category["key"]] = []
    for node in PROMPT_NODES:
        nodes_by_category.setdefault(node["category"], []).append(_node_public(node))
    return {
        "stats": {
            "node_count": len(PROMPT_NODES),
            "category_count": len(PROMPT_CATEGORIES),
            "version_count": sum(int(node["version"]) for node in PROMPT_NODES),
        },
        "categories": [
            {
                **category,
                "count": len(nodes_by_category.get(category["key"], [])),
            }
            for category in PROMPT_CATEGORIES
        ],
        "nodes_by_category": nodes_by_category,
    }


def render_prompt_node(node_id: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    node = _node_by_id(node_id)
    if not node:
        return {
            "success": False,
            "error": f"prompt node not found: {node_id}",
            "diagnostics": {"missing_variables": [], "template_variables": []},
        }
    values = {key: str(value) for key, value in (variables or {}).items()}
    template_variables = sorted(
        _template_fields(node["system_template"]) | _template_fields(node["user_template"])
    )
    required = {item["name"] for item in node["variables"] if item.get("required", True)}
    missing = sorted(name for name in (required | set(template_variables)) if not values.get(name))
    system = node["system_template"].format_map(_MissingDict(values))
    user = node["user_template"].format_map(_MissingDict(values))
    return {
        "success": not missing,
        "node": _node_public(node),
        "system": system,
        "user": user,
        "diagnostics": {
            "missing_variables": missing,
            "template_variables": template_variables,
            "provided_variables": sorted(values.keys()),
        },
    }


@dataclass(frozen=True)
class _PatternRule:
    dimension: str
    type_name: str
    pattern: re.Pattern[str]
    severity: float
    suggestion: str


STYLE_RULES = [
    _PatternRule("language_style", "八股文三段式", re.compile(r"首先.*?(其次|第二).*?(最后|最终)", re.S), 0.18, "改用动作、表情或场景细节承接情绪变化。"),
    _PatternRule("language_style", "过度理性", re.compile(r"(分析|评估|权衡|考量).{0,8}(情绪|风险|局面|关系|自己)"), 0.16, "情绪场景用身体反应替代分析词。"),
    _PatternRule("language_style", "感受拐弯", re.compile(r"一种无法.{0,8}的.{0,8}(感觉|感受|情绪)"), 0.12, "把抽象感受压成具体动作或短句。"),
    _PatternRule("language_style", "明喻滥用", re.compile(r"(像.{1,6}一样|仿佛.{1,6}一般|犹如.{1,6}般)"), 0.1, "减少明喻，用白描或动作结果承载画面。"),
]

ACTION_RE = re.compile(r"(推开|打开|关上|跑|冲|抓|握|问|答|说|发现|决定|选择|拒绝|靠近|离开|进入|逃离|对峙|威胁)")
REVEAL_RE = re.compile(r"(发现|揭示|真相|秘密|身份|告诉|承认|暴露)")
CONFLICT_RE = re.compile(r"(冲突|争吵|威胁|质问|反驳|对抗|翻脸|追杀)")
RESOLUTION_RE = re.compile(r"(彻底|完全|当场|终于|真相大白|平反|恢复身份|案件作罢|认输|败露)")
AUTHORITY_RE = re.compile(r"(城主|宗主|掌门|议会|长老会|执法堂).*?(亲临|宣布|裁决|平反)")
SECRET_RE = re.compile(r"(幕后|真凶|秘密身份|天道|本命|核心|禁区真相)")


def _chapter_number(chapter_goal: str) -> int | None:
    match = re.search(r"第\s*(\d+)\s*章", chapter_goal or "")
    if match:
        return int(match.group(1))
    return None


def _add_pattern_violations(text: str, violations: list[dict[str, Any]]) -> None:
    for rule in STYLE_RULES:
        for match in rule.pattern.finditer(text or ""):
            violations.append(
                {
                    "dimension": rule.dimension,
                    "type": rule.type_name,
                    "severity": rule.severity,
                    "description": match.group(0)[:80],
                    "suggestion": rule.suggestion,
                }
            )


def _add_density_violations(text: str, violations: list[dict[str, Any]]) -> None:
    clean = re.sub(r"\s+", "", text or "")
    if len(clean) < 40:
        return
    info_points = (
        len(ACTION_RE.findall(clean))
        + len(REVEAL_RE.findall(clean))
        + len(CONFLICT_RE.findall(clean))
        + clean.count("“")
        + clean.count('"')
    )
    density = info_points / max(1, len(clean) / 1000)
    if density < 5 or (len(clean) < 120 and info_points < 4):
        violations.append(
            {
                "dimension": "plot_density",
                "type": "信息密度偏低",
                "severity": 0.18,
                "description": f"有效信息点约 {density:.1f}/千字，段落可能偏分析或总结。",
                "suggestion": "增加角色动作、发现、选择、冲突或对话，不要只写判断结果。",
            }
        )


def _add_rhythm_violations(text: str, violations: list[dict[str, Any]]) -> None:
    sentences = [item for item in re.split(r"[。！？!?\n]+", text or "") if item.strip()]
    if not sentences:
        return
    long_sentences = [item for item in sentences if len(item) > 48]
    if len(long_sentences) >= max(2, len(sentences) // 2):
        violations.append(
            {
                "dimension": "rhythm",
                "type": "句群过重",
                "severity": 0.11,
                "description": f"{len(long_sentences)} 个长句压住阅读呼吸。",
                "suggestion": "拆短句，穿插对白、小动作或显性转折。",
            }
        )


def _add_macro_pacing_violations(text: str, chapter_goal: str, violations: list[dict[str, Any]]) -> None:
    chapter = _chapter_number(chapter_goal)
    resolution_hits = len(RESOLUTION_RE.findall(text or ""))
    authority_hits = len(AUTHORITY_RE.findall(text or ""))
    secret_hits = len(SECRET_RE.findall(text or ""))
    if chapter and chapter <= 12 and (resolution_hits >= 2 or (resolution_hits >= 1 and authority_hits >= 1)):
        violations.append(
            {
                "dimension": "macro_pacing",
                "type": "早期主线债务过快结清",
                "severity": 0.2,
                "description": "开篇出现较多终局式解决信号，长期压力源可能提前塌陷。",
                "suggestion": "保留证据缺口、反噬、未公开筹码或阶段性失败。",
            }
        )
    if chapter and chapter <= 12 and secret_hits >= 2 and resolution_hits >= 1:
        violations.append(
            {
                "dimension": "macro_pacing",
                "type": "秘密揭露过载",
                "severity": 0.13,
                "description": "重大秘密和解决动作同章密集出现。",
                "suggestion": "同章只揭一层秘密，其余改成误导、疑点或未验证线索。",
            }
        )


def analyze_quality(text: str, chapter_goal: str = "", scene_type: str = "auto") -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    _add_pattern_violations(text, violations)
    _add_density_violations(text, violations)
    _add_rhythm_violations(text, violations)
    _add_macro_pacing_violations(text, chapter_goal, violations)

    scores: dict[str, float] = {}
    for dimension in ("language_style", "plot_density", "rhythm", "macro_pacing"):
        penalty = sum(item["severity"] for item in violations if item["dimension"] == dimension)
        scores[dimension] = round(max(0.0, 1.0 - penalty), 3)

    overall_penalty = min(0.72, sum(item["severity"] for item in violations))
    overall_score = round(max(0.0, 1.0 - overall_penalty), 3)
    return {
        "overall_score": overall_score,
        "scores": scores,
        "violation_count": len(violations),
        "violations": violations[: POLICIES_MAX_REPORTED_ERRORS],
        "passed": overall_score >= 0.72 and not any(item["severity"] >= 0.2 for item in violations),
        "scene_type": scene_type,
    }


POLICIES_MAX_REPORTED_ERRORS = POLICY_PACKS["review_gate"]["max_reported_errors"]


def get_fusion_manifest() -> dict[str, Any]:
    return {
        "source_patterns": [
            "版本化提示词节点与渲染诊断",
            "六维质量守门的本地启发式前置检查",
            "生成 profile 与策略 pack 分离",
            "世界观五维契约，避免百科式散乱设定",
        ],
        "api_policy": {
            "remote_model_calls": "explicit_user_action_only",
            "local_catalog_calls": "safe_on_open",
            "token_guard": "compact_context_first",
        },
        "modules": [
            {"key": "prompt_plaza", "label": "提示词广场", "status": "fused_lightweight"},
            {"key": "quality_guardrails", "label": "质量守门", "status": "local_heuristic"},
            {"key": "generation_profiles", "label": "生成策略", "status": "config_mapped"},
            {"key": "worldbuilding_contract", "label": "世界观契约", "status": "schema_seeded"},
        ],
        "generation_profiles": GENERATION_PROFILES,
        "policy_packs": POLICY_PACKS,
        "worldbuilding_contract": WORLDBUILDING_CONTRACT,
    }
