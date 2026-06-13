# -*- coding: utf-8 -*-
import json

import pytest

import server


def test_read_context_sections_only_reads_stage_priority(monkeypatch):
    calls = []

    def fake_read_section(section_id):
        calls.append(section_id)
        return f"{section_id}-text"

    monkeypatch.setattr(server, "read_section", fake_read_section)
    server.clear_context_cache()

    sections = server.read_context_sections("worldbuilding")

    assert calls == ["cover", "worldbuilding", "characters"]
    assert set(sections) == {"cover", "worldbuilding", "characters"}


def test_read_context_sections_reuses_recent_cache(monkeypatch):
    calls = []

    def fake_read_section(section_id):
        calls.append(section_id)
        return f"{section_id}-text"

    monkeypatch.setattr(server, "read_section", fake_read_section)
    server.clear_context_cache()

    first = server.read_context_sections("plot")
    second = server.read_context_sections("plot")

    assert first == second
    assert calls == ["worldbuilding", "characters", "cover", "plot"]


def test_fast_context_mode_reads_fewer_sections(monkeypatch):
    calls = []

    def fake_read_section(section_id):
        calls.append(section_id)
        return f"{section_id}-text"

    monkeypatch.setattr(server, "read_section", fake_read_section)
    server.clear_context_cache()

    sections = server.read_context_sections("chapters", mode="fast")

    assert calls == ["plot", "characters"]
    assert set(sections) == {"plot", "characters"}


def test_empty_section_reads_are_not_cached(monkeypatch):
    responses = iter(["", "cover-text"])
    calls = []

    def fake_read_section(section_id):
        calls.append(section_id)
        return next(responses)

    monkeypatch.setattr(server, "read_section", fake_read_section)
    server.clear_context_cache()

    assert server.read_cached_section("cover") == ""
    assert server.read_cached_section("cover") == "cover-text"
    assert calls == ["cover", "cover"]


def test_read_section_returns_immediately_when_document_not_ready(monkeypatch):
    calls = []
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", False)
    monkeypatch.setattr(server.bridge, "read_paragraphs", lambda *args: calls.append(args) or "unexpected")

    assert server.read_section("plot") == ""
    assert calls == []


def test_read_section_uses_full_text_not_truncated_paragraphs(monkeypatch):
    marker = "[PARA-14-MARKER]"
    full_text = "\r".join(f"paragraph-{index}" for index in range(1, 14)) + f"\r{marker}"
    calls = []

    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server.bridge, "read_full_text", lambda doc_id: calls.append(doc_id) or json.dumps({"text": full_text, "success": True}))
    monkeypatch.setattr(server.bridge, "read_paragraphs", lambda *args: (_ for _ in ()).throw(AssertionError("paragraph API should not be used")))
    server.clear_context_cache()

    assert marker in server.read_section("cover")
    assert calls == [1]


def test_read_all_sections_reuses_full_text_cache(monkeypatch):
    calls = []
    full_text = "\n".join(f"paragraph-{index}" for index in range(1, 8))

    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server.bridge, "read_full_text", lambda doc_id: calls.append(doc_id) or json.dumps({"text": full_text, "success": True}))
    server.clear_context_cache()

    sections = server.read_all_sections()

    assert set(sections) == {"cover", "worldbuilding", "characters", "plot", "chapters"}
    assert calls == [1]


def test_write_to_wps_clears_context_cache(monkeypatch):
    current_text = {"cover": "old-cover"}
    calls = []

    def fake_read_section(section_id):
        calls.append(section_id)
        return current_text[section_id]

    monkeypatch.setattr(server, "read_section", fake_read_section)
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server.bridge, "insert_text", lambda text, position, doc_id: {"success": True})
    server.clear_context_cache()

    assert server.read_cached_section("cover") == "old-cover"
    current_text["cover"] = "new-cover"
    server.write_to_wps("new text")

    assert server.read_cached_section("cover") == "new-cover"
    assert calls == ["cover", "cover"]


def test_write_to_wps_resets_bridge_when_insert_times_out(monkeypatch):
    resets = []
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server, "reset_bridge_after_timeout", lambda: resets.append("reset"))
    monkeypatch.setattr(server, "read_timeout", lambda func, timeout=10, on_timeout=None: on_timeout() or None)

    with pytest.raises(RuntimeError, match="timed out"):
        server.write_to_wps("new text")

    assert resets == ["reset"]


def test_write_to_wps_raises_when_bridge_reports_failure(monkeypatch):
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(
        server.bridge,
        "insert_text",
        lambda text, position, doc_id: '{"success": false, "error": "insert denied"}',
    )

    with pytest.raises(RuntimeError, match="insert denied"):
        server.write_to_wps("new text")
