# -*- coding: utf-8 -*-
from plotpilot_fusion import analyze_quality, get_fusion_manifest, get_prompt_plaza, render_prompt_node


def test_prompt_plaza_exposes_versioned_nodes_and_categories():
    plaza = get_prompt_plaza()

    assert plaza["stats"]["node_count"] >= 6
    assert any(category["key"] == "quality" for category in plaza["categories"])
    assert any(category["key"] == "worldbuilding" for category in plaza["categories"])
    assert "generation" in plaza["nodes_by_category"]
    first_node = plaza["nodes_by_category"]["generation"][0]
    assert first_node["version"] >= 1
    assert first_node["variables"]
    assert first_node["token_policy"]


def test_render_prompt_node_reports_missing_variables_and_renders_when_complete():
    missing = render_prompt_node("chapter-generate", {"stage_label": "章节写作"})

    assert missing["success"] is False
    assert "chapter_goal" in missing["diagnostics"]["missing_variables"]

    rendered = render_prompt_node(
        "chapter-generate",
        {
            "stage_label": "章节写作",
            "chapter_goal": "主角在雾港档案馆发现第七封遗书。",
            "cast": "林照夜、旧档案员",
            "scene_beats": "入馆 -> 发现遗书编号 -> 灯灭",
        },
    )

    assert rendered["success"] is True
    assert "章节写作" in rendered["system"]
    assert "第七封遗书" in rendered["user"]
    assert rendered["diagnostics"]["missing_variables"] == []


def test_quality_analyzer_flags_ai_style_density_and_macro_pacing():
    report = analyze_quality(
        "首先他开始分析自己的情绪，其次他评估当前的风险，最后真相大白。"
        "秘密身份被彻底公开，城主亲临宣布平反，敌人当场认输。",
        chapter_goal="第3章：开篇冲突",
    )

    assert report["overall_score"] < 1
    dimensions = {item["dimension"] for item in report["violations"]}
    assert "language_style" in dimensions
    assert "plot_density" in dimensions
    assert "macro_pacing" in dimensions
    assert report["passed"] is False


def test_fusion_manifest_describes_backend_logic_without_remote_calls():
    manifest = get_fusion_manifest()

    assert manifest["source_patterns"]
    assert manifest["api_policy"]["remote_model_calls"] == "explicit_user_action_only"
    assert any(item["key"] == "quality_guardrails" for item in manifest["modules"])
