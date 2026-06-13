# -*- coding: utf-8 -*-
from prompt_system import build_chat_payload, build_stage_prompt, compact_sections, estimate_tokens, get_prompt_policy


def test_compact_sections_prioritizes_stage_context_and_caps_chars():
    sections = {
        "cover": "封面信息" * 200,
        "worldbuilding": "世界规则" * 300,
        "characters": "人物档案" * 300,
        "plot": "剧情大纲" * 300,
        "chapters": "章节正文" * 300,
    }

    result = compact_sections(sections, "chapters", max_chars=900)

    assert result["chars"] <= 900
    assert "[plot]" in result["context"]
    assert "[characters]" in result["context"]
    assert result["raw_chars"] > result["chars"]
    assert result["saved_chars"] > 0
    assert any(layer["id"] == "plot_memory" for layer in result["layers"])
    assert any(layer["id"] == "character_memory" for layer in result["layers"])


def test_compact_sections_reports_query_recall_reasons():
    sections = {
        "worldbuilding": "禁区资源和旧秩序规则" * 120,
        "characters": "女主对白、人物关系、互相试探和信任裂缝" * 120,
        "plot": "反派围猎、公开失败和主线转折" * 120,
    }

    result = compact_sections(
        sections,
        "chapters",
        max_chars=520,
        query="重点检查女主对白和关系变化",
    )

    assert result["sections"][0] == "characters"
    assert result["recall"][0]["section"] == "characters"
    assert result["recall"][0]["label"] == "人物设计"
    assert "女主" in result["recall"][0]["matched_terms"]
    assert "关系" in result["recall"][0]["reason"]


def test_build_stage_prompt_includes_contract_and_budget_stats():
    sections = {
        "cover": "一本关于失控星城的小说" * 40,
        "worldbuilding": "城市规则和势力冲突" * 100,
        "characters": "主角与反派的关系" * 100,
    }

    bundle = build_stage_prompt("plot", sections)

    assert "输出格式" in bundle["prompt"]
    assert "剧情大纲" in bundle["prompt"]
    assert bundle["budget"]["raw_chars"] > bundle["budget"]["chars"]
    assert bundle["budget"]["saved_chars"] > 0


def test_build_chat_payload_caps_user_message_and_reports_budget():
    sections = {
        "cover": "封面信息" * 200,
        "worldbuilding": "世界规则" * 400,
        "characters": "人物档案" * 400,
        "plot": "剧情大纲" * 400,
        "chapters": "章节正文" * 400,
    }

    payload = build_chat_payload("检查第一章钩子是否足够强", "chapters", sections)

    assert "专业的网文写作 AI 协作系统" in payload["system"]
    assert "检查第一章钩子是否足够强" in payload["user"]
    assert len(payload["user"]) <= 1600
    assert payload["budget"]["raw_chars"] > payload["budget"]["chars"]
    assert payload["budget"]["saved_chars"] > 0
    assert any(layer["id"] == "stable_rules" for layer in payload["budget"]["layers"])
    assert any(layer["id"] == "instant_instruction" for layer in payload["budget"]["layers"])
    assert "recall" in payload["budget"]


def test_build_chat_payload_for_writer_direct_prose_avoids_advice_format():
    payload = build_chat_payload(
        "请生成一段可直接写入小说文档的正文片段，只写正文，不要列提纲。",
        "chapters",
        {"plot": "海边小城、废弃灯塔、失踪船员日志。"},
        model_role="writer",
    )

    assert "只输出小说正文" in payload["system"]
    assert "判断 / 建议 / 可执行下一步" not in payload["user"]
    assert "不要输出判断、建议、可执行下一步、提纲或创作说明" in payload["user"]
    assert "不要说“好的”" in payload["user"]


def test_build_stage_prompt_supports_generation_modes():
    sections = {
        "cover": "小说定位与卖点" * 120,
        "worldbuilding": "世界规则与势力冲突" * 180,
        "characters": "主角目标与反派压力" * 180,
        "plot": "主线大纲与章节钩子" * 220,
        "chapters": "章节正文草稿" * 220,
    }

    fast = build_stage_prompt("chapters", sections, mode="fast")
    deep = build_stage_prompt("chapters", sections, mode="deep")

    assert fast["mode"] == "fast"
    assert deep["mode"] == "deep"
    assert fast["budget"]["context_budget_chars"] < deep["budget"]["context_budget_chars"]
    assert fast["budget"]["chars"] < deep["budget"]["chars"]
    assert "优先速度" in fast["prompt"]


def test_build_stage_prompt_requires_relationship_flow_fields():
    bundle = build_stage_prompt(
        "plot",
        {
            "worldbuilding": "旧秩序和新规则冲突",
            "characters": "主角、女主、反派互相牵制",
        },
        mode="fast",
    )

    assert "关系变化链" in bundle["prompt"]
    assert "变化原因" in bundle["prompt"]
    assert "后续关系变化" in bundle["prompt"]


def test_get_prompt_policy_exposes_cost_guard():
    policy = get_prompt_policy("chapters")

    assert policy["cost_guard"]["api_chat_token_limit"] == 1200
    assert policy["cost_guard"]["fast_context_sections"] == 2
    assert policy["cost_guard"]["duplicate_cache_ttl_seconds"] == 12
    assert policy["context_layers"][0]["id"] == "stable_rules"
    assert policy["context_layers"][-1]["id"] == "instant_instruction"


def test_estimate_tokens_is_conservative_for_chinese_text():
    chinese_text = "主角发现禁区规则变化" * 80
    english_text = "hero finds a rule change in the forbidden zone " * 80

    assert estimate_tokens(chinese_text) >= len(chinese_text)
    assert estimate_tokens(english_text) >= len("".join(english_text.split())) // 4
