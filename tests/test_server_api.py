# -*- coding: utf-8 -*-
import io
import json
import sys
import threading
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import server


class FakeHandler:
    def __init__(self, body: bytes, path="/"):
        self.path = path
        self.headers = {"Content-Length": str(len(body))}
        self.rfile = io.BytesIO(body)
        self.status = None
        self.payload = None

    def _json(self, payload, status=200):
        self.status = status
        self.payload = payload


class JsonCapture:
    def __init__(self):
        self.status = None
        self.headers = []
        self.wfile = io.BytesIO()

    def send_response(self, status):
        self.status = status

    def send_header(self, name, value):
        self.headers.append((name, value))

    def end_headers(self):
        pass


def test_enqueue_user_message_creates_queue_directory(tmp_path, monkeypatch):
    queue_dir = tmp_path / "chat_queue"
    monkeypatch.setattr(server, "CHAT_DIR", queue_dir)

    msg_id = server.enqueue_user_message("hello", "worldbuilding", "context")

    assert msg_id
    queue_file = queue_dir / "in.jsonl"
    assert queue_file.exists()
    entry = json.loads(queue_file.read_text(encoding="utf-8").strip())
    assert entry["message"] == "hello"
    assert entry["status"] == "pending"


def test_parse_json_body_reports_invalid_json():
    handler = FakeHandler(b"{bad json")

    parsed = server.parse_json_body(handler)

    assert parsed is None
    assert handler.status == 400
    assert handler.payload["error"] == "invalid_json"


def test_json_response_accepts_status_code():
    handler = JsonCapture()

    server.APIHandler._json(handler, {"error": "unknown"}, status=404)

    assert handler.status == 404
    assert json.loads(handler.wfile.getvalue().decode("utf-8")) == {"error": "unknown"}


def test_doc_read_without_section_returns_full_document(monkeypatch):
    monkeypatch.setattr(server, "read_document_text", lambda: "full document text")
    monkeypatch.setattr(server, "read_section", lambda section_id: (_ for _ in ()).throw(AssertionError("section reader should not be used")))
    handler = FakeHandler(b"", path="/api/doc/read")

    server.APIHandler.do_GET(handler)

    assert handler.payload == {"text": "full document text"}


def test_get_web_dir_prefers_built_dist(tmp_path):
    web_dir = tmp_path / "web"
    dist_dir = web_dir / "dist"
    dist_dir.mkdir(parents=True)

    assert server.get_web_dir(tmp_path) == str(dist_dir)


def test_status_returns_without_waiting_for_bridge(monkeypatch):
    calls = []
    monkeypatch.setattr(server, "_bridge_ready", False)
    monkeypatch.setattr(server, "_bridge_starting", False)
    monkeypatch.setattr(server, "_bridge_document_ready", False)
    monkeypatch.setattr(server, "_bridge_error", None)
    monkeypatch.setattr(server, "check_llm", lambda: False)
    monkeypatch.setattr(server.bridge, "diagnose", lambda: {"ok": False})
    monkeypatch.setattr(server, "start_bridge_background", lambda: calls.append("start"))

    payload = server.APIHandler._status(FakeHandler(b""))

    assert payload["connected"] is False
    assert payload["llm"] is False
    assert payload["bridge"]["ready"] is False
    assert calls == ["start"]


def test_status_times_out_wps_document_probe(monkeypatch):
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server, "check_llm", lambda: False)
    monkeypatch.setattr(server.bridge, "diagnose", lambda: {"ok": True})
    monkeypatch.setattr(server, "read_timeout", lambda func, timeout=10: None)

    payload = server.APIHandler._status(FakeHandler(b""))

    assert payload["connected"] is False
    assert payload["bridge"]["document_ready"] is False


def test_read_timeout_uses_daemon_thread_for_stuck_wps_calls():
    started = threading.Event()

    def stuck_call():
        started.set()
        time.sleep(0.2)

    result = server.read_timeout(stuck_call, timeout=0.01)

    assert result is None
    assert started.is_set()
    assert any(thread.name == "wps-read-timeout" and thread.daemon for thread in threading.enumerate())


def test_read_timeout_invokes_timeout_callback_for_stuck_wps_calls():
    started = threading.Event()
    callbacks = []

    def stuck_call():
        started.set()
        time.sleep(0.2)

    result = server.read_timeout(stuck_call, timeout=0.01, on_timeout=lambda: callbacks.append("timeout"))

    assert result is None
    assert started.is_set()
    assert callbacks == ["timeout"]


def test_status_resets_bridge_after_document_probe_timeout(monkeypatch):
    resets = []
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server, "check_llm", lambda: False)
    monkeypatch.setattr(server.bridge, "diagnose", lambda: {"ok": True})
    monkeypatch.setattr(server, "reset_bridge_after_timeout", lambda: resets.append("reset"))
    monkeypatch.setattr(server, "read_timeout", lambda func, timeout=10, on_timeout=None: on_timeout() or None)

    payload = server.APIHandler._status(FakeHandler(b""))

    assert payload["connected"] is False
    assert payload["bridge"]["document_ready"] is False
    assert resets == ["reset"]


def test_start_bridge_background_skips_while_bridge_is_resetting(monkeypatch):
    starts = []
    monkeypatch.setattr(server, "_bridge_ready", False)
    monkeypatch.setattr(server, "_bridge_starting", False)
    monkeypatch.setattr(server, "_bridge_resetting", True)
    monkeypatch.setattr(server.bridge, "process", None)
    monkeypatch.setattr(server.bridge, "start", lambda: starts.append("start"))

    server.start_bridge_background()

    assert starts == []
    assert server._bridge_starting is False


def test_reset_bridge_after_timeout_stops_bridge_in_background(monkeypatch):
    stop_started = threading.Event()
    stop_finished = threading.Event()
    starts = []

    def slow_stop():
        stop_started.set()
        time.sleep(0.2)
        stop_finished.set()

    monkeypatch.setattr(server, "_bridge_ready", True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(server, "_bridge_resetting", False)
    monkeypatch.setattr(server.bridge, "stop", slow_stop)
    monkeypatch.setattr(server, "start_bridge_background", lambda: starts.append("start"))

    started_at = time.perf_counter()
    server.reset_bridge_after_timeout()
    elapsed = time.perf_counter() - started_at

    assert elapsed < 0.1
    assert stop_started.wait(0.5)
    assert server._bridge_ready is False
    assert server._bridge_document_ready is False
    assert server._bridge_resetting is True
    assert stop_finished.wait(1)
    assert starts == ["start"]


def test_write_endpoint_reports_wps_insert_failure(monkeypatch):
    monkeypatch.setattr(server, "bridge_is_ready", lambda: True)
    monkeypatch.setattr(server, "_bridge_document_ready", True)
    monkeypatch.setattr(
        server.bridge,
        "insert_text",
        lambda text, position, doc_id: '{"success": false, "error": "simulated WPS insert failure"}',
    )

    handler = FakeHandler(
        json.dumps({"text": "hello", "position": "end"}).encode("utf-8"),
        path="/api/write",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload == {"success": False, "error": "simulated WPS insert failure"}


def test_llm_config_can_be_saved_without_echoing_key(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)
    monkeypatch.delenv("NOVEL_LLM_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    handler = FakeHandler(
        json.dumps(
            {
                "endpoint": "https://api.example.com/v1",
                "model": "story-model",
                "api_key": "secret-key",
                "temperature": 0.4,
                "max_tokens": 2048,
            }
        ).encode("utf-8"),
        path="/api/llm/config",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload == {
        "endpoint": "https://api.example.com/v1",
        "model": "story-model",
        "model_routes": {
            "planner": "story-model",
            "writer": "story-model",
            "reviewer": "story-model",
            "assistant": "story-model",
        },
        "api_key_set": True,
        "api_enabled": False,
        "temperature": 0.4,
        "max_tokens": 2048,
    }
    assert json.loads(config_file.read_text(encoding="utf-8"))["api_key"] == "secret-key"


def test_llm_config_saves_model_routes_for_multi_model_work(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)
    monkeypatch.delenv("NOVEL_LLM_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    handler = FakeHandler(
        json.dumps(
            {
                "endpoint": "https://api.example.com/v1/chat/completions",
                "model": "balanced-model",
                "api_key": "secret-key",
                "api_enabled": True,
                "model_routes": {
                    "planner": "reasoner-model",
                    "writer": "writer-model",
                    "reviewer": "critic-model",
                    "assistant": "fast-model",
                },
            }
        ).encode("utf-8"),
        path="/api/llm/config",
    )

    server.APIHandler.do_POST(handler)

    saved = json.loads(config_file.read_text(encoding="utf-8"))
    assert saved["endpoint"] == "https://api.example.com/v1"
    assert saved["model_routes"]["writer"] == "writer-model"
    assert handler.payload["model_routes"]["assistant"] == "fast-model"


def test_llm_config_get_hides_saved_key(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    config_file.write_text(
        json.dumps(
            {
                "endpoint": "https://api.example.com/v1",
                "model": "story-model",
                "api_key": "secret-key",
                "temperature": 0.5,
                "max_tokens": 1024,
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)

    handler = FakeHandler(b"", path="/api/llm/config")

    server.APIHandler.do_GET(handler)

    assert handler.payload["api_key_set"] is True
    assert "api_key" not in handler.payload


def test_llm_config_can_clear_saved_key(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    config_file.write_text(
        json.dumps(
            {
                "endpoint": "https://api.example.com/v1",
                "model": "story-model",
                "api_key": "secret-key",
                "api_enabled": True,
                "temperature": 0.5,
                "max_tokens": 1024,
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)

    handler = FakeHandler(
        json.dumps({"api_key": "", "clear_api_key": True, "api_enabled": True}).encode("utf-8"),
        path="/api/llm/config",
    )

    server.APIHandler.do_POST(handler)

    saved = json.loads(config_file.read_text(encoding="utf-8"))
    assert "api_key" not in saved
    assert handler.payload["api_key_set"] is False
    assert handler.payload["api_enabled"] is False


def test_saved_key_does_not_enable_immediate_api_by_default(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)
    monkeypatch.delenv("NOVEL_LLM_API_ENABLED", raising=False)
    monkeypatch.delenv("NOVEL_LLM_ALLOW_LEGACY", raising=False)
    server._llm_available = None

    server.save_local_llm_config({"api_key": "secret-key"})

    assert server.public_llm_config()["api_key_set"] is True
    assert server.public_llm_config()["api_enabled"] is False
    assert server.check_llm() is False


def test_saving_llm_config_clears_failure_cooldown(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)
    monkeypatch.delenv("NOVEL_LLM_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    server._llm_available = False
    server._llm_failure_until = time.time() + 60

    server.save_local_llm_config(
        {
            "endpoint": "https://api.example.com/v1",
            "model": "story-model",
            "api_key": "secret-key",
            "api_enabled": True,
        }
    )

    assert server._llm_available is None
    assert server._llm_failure_until == 0


def test_chat_prefers_local_llm_config(monkeypatch):
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="fast", query="": {})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "sys",
            "user": "user",
            "context": "",
            "budget": {"chars": 1, "raw_chars": 1, "saved_chars": 0, "estimated_tokens": 1, "raw_estimated_tokens": 1, "sections": []},
        },
    )
    monkeypatch.setattr(server, "check_llm", lambda: True)
    monkeypatch.setattr(server, "estimate_chat_api_tokens", lambda payload: 1)
    monkeypatch.setattr(server, "chat_with_local_llm", lambda system, user, **kwargs: "local response")
    server.clear_chat_cache()

    handler = FakeHandler(json.dumps({"stage": "plot", "message": "hello"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(handler)

    assert handler.payload["response"] == "local response"


def test_chat_passes_model_role_to_local_llm(monkeypatch):
    calls = {}
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="fast", query="": {})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "sys",
            "user": "user",
            "context": "",
            "budget": {"chars": 1, "raw_chars": 1, "saved_chars": 0, "estimated_tokens": 1, "raw_estimated_tokens": 1, "sections": []},
        },
    )
    monkeypatch.setattr(server, "check_llm", lambda: True)
    monkeypatch.setattr(server, "estimate_chat_api_tokens", lambda payload: 1)

    def fake_chat(system, user, **kwargs):
        calls.update(kwargs)
        return "assistant model response"

    monkeypatch.setattr(server, "chat_with_local_llm", fake_chat)
    server.clear_chat_cache()

    handler = FakeHandler(
        json.dumps({"stage": "worldbuilding", "message": "hello", "model_role": "assistant"}).encode("utf-8"),
        path="/api/chat/send",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload["response"] == "assistant model response"
    assert calls["model_role"] == "assistant"
    assert calls["stage"] == "worldbuilding"


def test_clean_direct_writer_response_strips_meta_preamble():
    raw = """判断：用户要正文片段。

建议：直接写场景。

可执行下一步：

---

林砚推开档案室的门，盐雾先一步涌进来。
"""

    assert server.clean_direct_writer_response(raw) == "林砚推开档案室的门，盐雾先一步涌进来。"


def test_clean_direct_writer_response_uses_last_prose_block_after_markdown_meta():
    raw = """好的，这是根据指令生成的响应。

---

**判断**

用户需要正文。

**建议**

直接执行。

**可执行下一步**

以下是正文片段：

---

林砚的台灯是办公室里最后一盏亮着的。
"""

    assert server.clean_direct_writer_response(raw) == "林砚的台灯是办公室里最后一盏亮着的。"


def test_chat_endpoint_cleans_direct_writer_llm_response(monkeypatch):
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="fast", query="": {})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "sys",
            "user": "user",
            "context": "",
            "budget": {"chars": 1, "raw_chars": 1, "saved_chars": 0, "estimated_tokens": 1, "raw_estimated_tokens": 1, "sections": []},
        },
    )
    monkeypatch.setattr(server, "check_llm", lambda: True)
    monkeypatch.setattr(server, "estimate_chat_api_tokens", lambda payload: 1)
    monkeypatch.setattr(
        server,
        "chat_with_local_llm",
        lambda system, user, **kwargs: "判断：先分析。\n\n建议：再写。\n\n---\n\n林砚把盐封日志放进灯下。",
    )
    server.clear_chat_cache()

    handler = FakeHandler(
        json.dumps(
            {
                "stage": "chapters",
                "model_role": "writer",
                "message": "请生成一段可直接写入小说文档的正文片段，只写正文。",
            }
        ).encode("utf-8"),
        path="/api/chat/send",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload["response"] == "林砚把盐封日志放进灯下。"


def test_local_llm_chat_ignores_environment_proxy(monkeypatch):
    clients = []
    requests = []

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"choices": [{"message": {"content": "ok"}}]}

    class FakeClient:
        def __init__(self, timeout, trust_env=True):
            self.timeout = timeout
            self.trust_env = trust_env
            clients.append(self)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, json, headers):
            requests.append((url, json, headers))
            return FakeResponse()

    monkeypatch.setitem(sys.modules, "httpx", type("FakeHttpx", (), {"Client": FakeClient}))
    server._llm_failure_until = 0

    response = server.chat_with_local_llm(
        "system",
        "user",
        model_role="writer",
        stage="chapters",
        config={
            "endpoint": "https://api.example.com/v1",
            "model": "default-model",
            "model_routes": {"writer": "writer-model"},
            "api_key": "secret-key",
            "api_enabled": True,
            "temperature": 0.3,
            "max_tokens": 1024,
        },
    )

    assert response == "ok"
    assert clients[0].trust_env is False
    assert requests[0][0] == "https://api.example.com/v1/chat/completions"
    assert requests[0][1]["model"] == "writer-model"


def test_fetch_llm_models_from_openai_compatible_endpoint(monkeypatch):
    requests = []
    clients = []

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"data": [{"id": "writer-model"}, {"id": "reasoner-model"}]}

    class FakeClient:
        def __init__(self, timeout, trust_env=True):
            self.timeout = timeout
            self.trust_env = trust_env
            clients.append(self)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def get(self, url, headers):
            requests.append((url, headers))
            return FakeResponse()

    monkeypatch.setitem(sys.modules, "httpx", type("FakeHttpx", (), {"Client": FakeClient}))

    payload = server.fetch_llm_models("https://api.example.com/v1/chat/completions", "secret-key")

    assert requests[0][0] == "https://api.example.com/v1/models"
    assert requests[0][1]["Authorization"] == "Bearer secret-key"
    assert clients[0].trust_env is False
    assert payload["models"] == [{"id": "reasoner-model"}, {"id": "writer-model"}]


def test_fetch_llm_models_handles_network_errors(monkeypatch):
    class FakeClient:
        def __init__(self, timeout, trust_env=True):
            self.timeout = timeout
            self.trust_env = trust_env

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def get(self, url, headers):
            raise RuntimeError("connection refused")

    monkeypatch.setitem(sys.modules, "httpx", type("FakeHttpx", (), {"Client": FakeClient}))

    payload = server.fetch_llm_models("https://api.example.com/v1", "secret-key")

    assert payload["models"] == []
    assert "connection refused" in payload["error"]


def test_fetch_llm_models_handles_invalid_json(monkeypatch):
    class FakeResponse:
        status_code = 200

        def json(self):
            raise ValueError("not json")

    class FakeClient:
        def __init__(self, timeout, trust_env=True):
            self.timeout = timeout
            self.trust_env = trust_env

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def get(self, url, headers):
            return FakeResponse()

    monkeypatch.setitem(sys.modules, "httpx", type("FakeHttpx", (), {"Client": FakeClient}))

    payload = server.fetch_llm_models("https://api.example.com/v1", "secret-key")

    assert payload["models"] == []
    assert "模型列表解析失败" in payload["error"]


def test_llm_models_endpoint_uses_unsaved_form_values(monkeypatch):
    monkeypatch.setattr(
        server,
        "fetch_llm_models",
        lambda endpoint, api_key="": {"models": [{"id": f"{endpoint}|{api_key}"}]},
    )

    handler = FakeHandler(
        json.dumps({"endpoint": "https://api.example.com/v1", "api_key": "draft-key"}).encode("utf-8"),
        path="/api/llm/models",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload["models"] == [{"id": "https://api.example.com/v1|draft-key"}]


def test_chat_send_queues_when_saved_key_is_not_enabled(tmp_path, monkeypatch):
    config_file = tmp_path / "llm_config.json"
    config_file.write_text(
        json.dumps(
            {
                "endpoint": "https://api.example.com/v1",
                "model": "story-model",
                "api_key": "secret-key",
                "api_enabled": False,
                "temperature": 0.5,
                "max_tokens": 1024,
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(server, "LLM_CONFIG_FILE", config_file)
    monkeypatch.delenv("NOVEL_LLM_ALLOW_LEGACY", raising=False)
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="fast", query="": {})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "sys",
            "user": "user",
            "context": "",
            "budget": {"chars": 1, "raw_chars": 1, "saved_chars": 0, "estimated_tokens": 1, "raw_estimated_tokens": 1, "sections": []},
        },
    )
    monkeypatch.setattr(server, "chat_with_local_llm", lambda system, user: (_ for _ in ()).throw(AssertionError("should not call LLM")))
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: "queued-id")
    server.clear_chat_cache()
    server._llm_available = None

    handler = FakeHandler(json.dumps({"stage": "plot", "message": "hello"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(handler)

    assert handler.payload["status"] == "queued"
    assert handler.payload["msg_id"] == "queued-id"


def test_state_falls_back_when_bridge_is_not_ready(monkeypatch):
    monkeypatch.setattr(server, "_bridge_ready", False)
    monkeypatch.setattr(server, "_bridge_starting", True)
    monkeypatch.setattr(server, "_bridge_document_ready", False)
    monkeypatch.setattr(server.bridge, "diagnose", lambda: {"ok": True})
    monkeypatch.setattr(
        server,
        "read_all_sections",
        lambda: (_ for _ in ()).throw(AssertionError("should not read WPS while bridge is starting")),
    )

    handler = FakeHandler(b"", path="/api/state")

    server.APIHandler.do_GET(handler)

    assert handler.payload["next_action"] == "cover"
    assert handler.payload["sections"]["cover"]["chars"] == 0
    assert handler.payload["bridge"]["starting"] is True


def test_prompt_policy_exposes_budget_and_priority():
    policy = server.get_prompt_policy("chapters")

    assert policy["chat_budget_chars"] < 1200
    assert policy["priority_sections"][0] == "plot"
    assert "章节目标" in policy["outputs"]


def test_generate_endpoint_passes_mode_to_context_and_prompt(monkeypatch):
    calls = {}

    def fake_read_context_sections(stage, mode="standard"):
        calls["context"] = (stage, mode)
        return {"plot": "plot context"}

    def fake_build_stage_prompt(stage, sections, mode="standard"):
        calls["prompt"] = (stage, sections, mode)
        return {
            "mode": mode,
            "prompt": "prompt text",
            "context": "compact context",
            "budget": {
                "chars": 42,
                "raw_chars": 120,
                "saved_chars": 78,
                "estimated_tokens": 25,
                "raw_estimated_tokens": 70,
                "sections": ["plot"],
                "context_budget_chars": 650,
                "mode": mode,
            },
        }

    monkeypatch.setattr(server, "read_context_sections", fake_read_context_sections)
    monkeypatch.setattr(server, "build_stage_prompt", fake_build_stage_prompt)
    monkeypatch.setattr(server, "enqueue_user_message", lambda prompt, stage, context: "msg-1")

    handler = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")

    server.APIHandler.do_POST(handler)

    assert calls["context"] == ("chapters", "fast")
    assert calls["prompt"] == ("chapters", {"plot": "plot context"}, "fast")
    assert handler.payload["mode"] == "fast"
    assert handler.payload["budget"]["context_budget_chars"] == 650


def test_generate_endpoint_rejects_unknown_stage_before_reading(monkeypatch):
    monkeypatch.setattr(
        server,
        "read_context_sections",
        lambda stage, mode="standard": (_ for _ in ()).throw(AssertionError("should not read WPS")),
    )

    handler = FakeHandler(json.dumps({"stage": "editing", "mode": "fast"}).encode("utf-8"), path="/api/generate")

    server.APIHandler.do_POST(handler)

    assert handler.payload == {"error": "unknown stage"}


def test_generate_endpoint_reuses_recent_duplicate_request(monkeypatch):
    enqueue_calls = []

    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="standard", query="": {"plot": "same context"})
    monkeypatch.setattr(
        server,
        "build_stage_prompt",
        lambda stage, sections, mode="standard": {
            "mode": mode,
            "prompt": "same prompt",
            "context": "same context",
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["plot"],
                "context_budget_chars": 650,
                "mode": mode,
            },
        },
    )

    def fake_enqueue(prompt, stage, context):
        enqueue_calls.append((prompt, stage, context))
        return "msg-1"

    monkeypatch.setattr(server, "enqueue_user_message", fake_enqueue)
    server.clear_generation_cache()

    first = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")
    second = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")

    server.APIHandler.do_POST(first)
    server.APIHandler.do_POST(second)

    assert first.payload["status"] == "queued"
    assert second.payload["status"] == "reused"
    assert second.payload["msg_id"] == "msg-1"
    assert len(enqueue_calls) == 1


def test_generate_endpoint_does_not_reuse_when_context_changes(monkeypatch):
    read_calls = []
    build_calls = []
    enqueue_calls = []

    def fake_read_context_sections(stage, mode="standard", query=""):
        read_calls.append((stage, mode, query))
        return {"plot": f"context {len(read_calls)}"}

    def fake_build_stage_prompt(stage, sections, mode="standard"):
        build_calls.append((stage, sections, mode))
        return {
            "mode": mode,
            "prompt": f"prompt {sections['plot']}",
            "context": sections["plot"],
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["plot"],
                "context_budget_chars": 650,
                "mode": mode,
            },
        }

    monkeypatch.setattr(server, "read_context_sections", fake_read_context_sections)
    monkeypatch.setattr(server, "build_stage_prompt", fake_build_stage_prompt)
    monkeypatch.setattr(server, "enqueue_user_message", lambda prompt, stage, context: enqueue_calls.append((prompt, context)) or f"msg-{len(enqueue_calls)}")
    server.clear_generation_cache()

    first = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")
    second = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")

    server.APIHandler.do_POST(first)
    server.APIHandler.do_POST(second)

    assert first.payload["status"] == "queued"
    assert second.payload["status"] == "queued"
    assert second.payload["msg_id"] == "msg-2"
    assert len(read_calls) == 2
    assert len(build_calls) == 2
    assert len(enqueue_calls) == 2


def test_generate_endpoint_downgrades_oversized_prompt_before_queue(monkeypatch):
    context_modes = []
    prompt_modes = []
    enqueue_calls = []

    def fake_read_context_sections(stage, mode="standard", query=""):
        context_modes.append(mode)
        return {"plot": f"{mode} context"}

    def fake_build_stage_prompt(stage, sections, mode="standard"):
        prompt_modes.append(mode)
        prompt_text = "超大提示词" * 1200 if mode != "fast" else "短提示词"
        return {
            "mode": mode,
            "prompt": prompt_text,
            "context": sections["plot"],
            "budget": {
                "chars": len(prompt_text),
                "raw_chars": len(prompt_text),
                "saved_chars": 0,
                "estimated_tokens": server.estimate_tokens(prompt_text),
                "raw_estimated_tokens": server.estimate_tokens(prompt_text),
                "sections": ["plot"],
                "context_budget_chars": 650 if mode == "fast" else 1600,
                "mode": mode,
            },
        }

    def fake_enqueue(prompt, stage, context):
        enqueue_calls.append((prompt, stage, context))
        return "msg-fast"

    monkeypatch.setattr(server, "read_context_sections", fake_read_context_sections)
    monkeypatch.setattr(server, "build_stage_prompt", fake_build_stage_prompt)
    monkeypatch.setattr(server, "enqueue_user_message", fake_enqueue)
    server.clear_generation_cache()

    handler = FakeHandler(json.dumps({"stage": "chapters", "mode": "deep"}).encode("utf-8"), path="/api/generate")

    server.APIHandler.do_POST(handler)

    assert context_modes == ["deep", "standard", "fast"]
    assert prompt_modes == ["deep", "standard", "fast"]
    assert handler.payload["status"] == "queued"
    assert handler.payload["mode"] == "fast"
    assert handler.payload["guard"] == "auto_downgraded"
    assert handler.payload["api_token_estimate"] <= server.API_CHAT_TOKEN_LIMIT
    assert enqueue_calls == [("短提示词", "chapters", "fast context")]


def test_generate_endpoint_blocks_when_fast_prompt_is_still_oversized(monkeypatch):
    enqueue_calls = []

    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="standard", query="": {"plot": "context"})
    monkeypatch.setattr(
        server,
        "build_stage_prompt",
        lambda stage, sections, mode="standard": {
            "mode": mode,
            "prompt": "超大提示词" * 1600,
            "context": "context",
            "budget": {
                "chars": 6400,
                "raw_chars": 6400,
                "saved_chars": 0,
                "estimated_tokens": 3765,
                "raw_estimated_tokens": 3765,
                "sections": ["plot"],
                "context_budget_chars": 650,
                "mode": mode,
            },
        },
    )
    monkeypatch.setattr(server, "enqueue_user_message", lambda prompt, stage, context: enqueue_calls.append(prompt))
    server.clear_generation_cache()

    handler = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")

    server.APIHandler.do_POST(handler)

    assert handler.payload["status"] == "blocked"
    assert handler.payload["guard"] == "token_limit"
    assert handler.payload["api_token_estimate"] > server.API_CHAT_TOKEN_LIMIT
    assert enqueue_calls == []


def test_chat_endpoint_reuses_recent_duplicate_request(monkeypatch):
    enqueue_calls = []

    monkeypatch.setattr(server, "check_llm", lambda: False)
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="standard", query="": {"plot": "same context"})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "system",
            "user": f"user:{msg}",
            "context": "same context",
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["plot"],
            },
        },
    )

    def fake_enqueue(message, stage, context):
        enqueue_calls.append((message, stage, context))
        return "chat-1"

    monkeypatch.setattr(server, "enqueue_user_message", fake_enqueue)
    server.clear_chat_cache()

    first = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")
    second = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(first)
    server.APIHandler.do_POST(second)

    assert first.payload["status"] == "queued"
    assert second.payload["status"] == "reused"
    assert second.payload["msg_id"] == "chat-1"
    assert len(enqueue_calls) == 1


def test_chat_endpoint_releases_inflight_when_reusing_chat_cache(monkeypatch):
    monkeypatch.setattr(server, "check_llm", lambda: False)
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="standard", query="": {"plot": "same context"})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "system",
            "user": f"user:{msg}",
            "context": "same context",
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["plot"],
            },
        },
    )
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: "chat-1")
    server.clear_chat_cache()

    first = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")
    second = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(first)
    server._chat_request_cache.clear()
    server.APIHandler.do_POST(second)

    assert second.payload["status"] == "reused"
    assert not server._inflight_request_events
    assert list(server._chat_request_cache.values())[0]["payload"] == {
        "msg_id": "chat-1",
        "status": "reused",
        "budget": second.payload["budget"],
    }


def test_duplicate_request_waits_for_inflight_cache_result():
    cache = {}
    signature = "same-request"
    observed = []

    cached, owns_request = server.begin_request(cache, signature, ttl=12)
    assert cached is None
    assert owns_request is True

    def duplicate_request():
      observed.append(server.begin_request(cache, signature, ttl=12, wait_seconds=2))

    thread = threading.Thread(target=duplicate_request)
    thread.start()
    time.sleep(0.05)
    server.remember_request(cache, signature, {"msg_id": "one", "status": "queued"})
    thread.join(timeout=2)

    assert observed == [({"msg_id": "one", "status": "queued"}, False)]


def test_chat_endpoint_releases_inflight_when_queue_write_fails(monkeypatch):
    monkeypatch.setattr(server, "check_llm", lambda: False)
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="fast", query="": {"plot": "context"})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "system",
            "user": f"user:{msg}",
            "context": "context",
            "budget": {
                "chars": 20,
                "raw_chars": 20,
                "saved_chars": 0,
                "estimated_tokens": 5,
                "raw_estimated_tokens": 5,
                "sections": ["plot"],
            },
        },
    )
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: (_ for _ in ()).throw(RuntimeError("queue write failed")))
    server.clear_chat_cache()

    handler = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")

    with pytest.raises(RuntimeError, match="queue write failed"):
        server.APIHandler.do_POST(handler)

    assert not server._inflight_request_events


def test_generate_endpoint_releases_inflight_when_queue_write_fails(monkeypatch):
    prompt_bundle = {
        "mode": "fast",
        "prompt": "生成一段短提示词",
        "context": "compact context",
        "budget": {
            "chars": 20,
            "raw_chars": 20,
            "saved_chars": 0,
            "estimated_tokens": 5,
            "raw_estimated_tokens": 5,
            "sections": ["plot"],
        },
    }
    monkeypatch.setattr(server, "build_guarded_generation_bundle", lambda stage, mode: (prompt_bundle, 5, None))
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: (_ for _ in ()).throw(RuntimeError("queue write failed")))
    server.clear_generation_cache()

    handler = FakeHandler(json.dumps({"stage": "chapters", "mode": "fast"}).encode("utf-8"), path="/api/generate")

    with pytest.raises(RuntimeError, match="queue write failed"):
        server.APIHandler.do_POST(handler)

    assert not server._inflight_request_events


def test_chat_endpoint_does_not_reuse_when_context_changes(monkeypatch):
    read_calls = []
    build_calls = []
    enqueue_calls = []

    monkeypatch.setattr(server, "check_llm", lambda: False)

    def fake_read_context_sections(stage, mode="standard", query=""):
        read_calls.append((stage, mode, query))
        return {"plot": f"context {len(read_calls)}"}

    def fake_build_chat_payload(msg, stage, ctx, **kwargs):
        build_calls.append((msg, stage, ctx))
        return {
            "system": "system",
            "user": f"user:{msg}",
            "context": ctx["plot"],
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["plot"],
            },
        }

    monkeypatch.setattr(server, "read_context_sections", fake_read_context_sections)
    monkeypatch.setattr(server, "build_chat_payload", fake_build_chat_payload)
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: enqueue_calls.append((message, context)) or f"chat-{len(enqueue_calls)}")
    server.clear_chat_cache()

    first = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")
    second = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(first)
    server.APIHandler.do_POST(second)

    assert first.payload["status"] == "queued"
    assert second.payload["status"] == "queued"
    assert second.payload["msg_id"] == "chat-2"
    assert len(read_calls) == 2
    assert len(build_calls) == 2
    assert len(enqueue_calls) == 2


def test_chat_endpoint_reads_fast_context_by_default(monkeypatch):
    calls = {}

    monkeypatch.setattr(server, "check_llm", lambda: False)

    def fake_read_context_sections(stage, mode="standard", query=""):
        calls["context"] = (stage, mode)
        return {"plot": "compact context"}

    monkeypatch.setattr(server, "read_context_sections", fake_read_context_sections)
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "system",
            "user": "user",
            "context": "compact context",
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["plot"],
            },
        },
    )
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: "chat-fast")
    server.clear_chat_cache()

    handler = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(handler)

    assert calls["context"] == ("plot", "fast")


def test_chat_endpoint_passes_message_as_context_query(monkeypatch):
    calls = {}

    monkeypatch.setattr(server, "check_llm", lambda: False)

    def fake_read_context_sections(stage, mode="standard", query=""):
        calls["query"] = query
        return {"characters": "角色关系"}

    monkeypatch.setattr(server, "read_context_sections", fake_read_context_sections)
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "system",
            "user": "user",
            "context": "角色关系",
            "budget": {
                "chars": 20,
                "raw_chars": 80,
                "saved_chars": 60,
                "estimated_tokens": 12,
                "raw_estimated_tokens": 48,
                "sections": ["characters"],
            },
        },
    )
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: "chat-query")
    server.clear_chat_cache()

    handler = FakeHandler(json.dumps({"stage": "chapters", "message": "重点检查女主对白和关系变化"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(handler)

    assert calls["query"] == "重点检查女主对白和关系变化"


def test_read_context_sections_reorders_fast_sections_by_query(monkeypatch):
    calls = []

    def fake_read_cached_section(section_id):
        calls.append(section_id)
        return f"{section_id} content"

    monkeypatch.setattr(server, "read_cached_section", fake_read_cached_section)

    sections = server.read_context_sections("chapters", mode="fast", query="女主对白和人物关系")

    assert list(sections.keys())[0] == "characters"
    assert calls[:2] == ["characters", "plot"]


def test_chat_llm_guard_blocks_oversized_payload():
    payload = {
        "system": "系统" * 1000,
        "user": "用户" * 1000,
    }

    assert server.estimate_chat_api_tokens(payload) > server.API_CHAT_TOKEN_LIMIT
    assert not server.can_call_chat_llm(payload)


def test_chat_endpoint_returns_token_guard_when_payload_is_oversized(monkeypatch):
    monkeypatch.setattr(server, "check_llm", lambda: True)
    monkeypatch.setattr(server, "read_context_sections", lambda stage, mode="standard", query="": {"plot": "context"})
    monkeypatch.setattr(
        server,
        "build_chat_payload",
        lambda msg, stage, ctx, **kwargs: {
            "system": "系统" * 1000,
            "user": "用户" * 1000,
            "context": "context",
            "budget": {
                "chars": 2000,
                "raw_chars": 2600,
                "saved_chars": 600,
                "estimated_tokens": 1500,
                "raw_estimated_tokens": 1800,
                "sections": ["plot"],
            },
        },
    )
    monkeypatch.setattr(server, "enqueue_user_message", lambda message, stage, context: "guarded")
    server.clear_chat_cache()

    handler = FakeHandler(json.dumps({"stage": "plot", "message": "检查冲突"}).encode("utf-8"), path="/api/chat/send")

    server.APIHandler.do_POST(handler)

    assert handler.payload["status"] == "queued"
    assert handler.payload["guard"] == "token_limit"
    assert handler.payload["api_token_estimate"] > server.API_CHAT_TOKEN_LIMIT


def test_prompt_plaza_endpoint_returns_fused_prompt_nodes():
    handler = FakeHandler(b"", path="/api/prompts/plaza")

    server.APIHandler.do_GET(handler)

    assert handler.payload["stats"]["node_count"] >= 6
    assert "generation" in handler.payload["nodes_by_category"]
    assert any(category["key"] == "quality" for category in handler.payload["categories"])


def test_prompt_render_endpoint_validates_variables_without_ai_call():
    handler = FakeHandler(
        json.dumps(
            {
                "node_id": "chapter-generate",
                "variables": {
                    "stage_label": "章节写作",
                    "chapter_goal": "主角打开禁区日志。",
                    "cast": "林照夜",
                    "scene_beats": "入场 -> 发现 -> 逃离",
                },
            }
        ).encode("utf-8"),
        path="/api/prompts/render",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload["success"] is True
    assert "禁区日志" in handler.payload["user"]
    assert handler.payload["diagnostics"]["missing_variables"] == []


def test_quality_analyze_endpoint_returns_guardrail_report():
    handler = FakeHandler(
        json.dumps(
            {
                "text": "首先他分析了局面，最后真相大白，城主亲临宣布平反，敌人当场认输。",
                "chapter_goal": "第2章",
            }
        ).encode("utf-8"),
        path="/api/quality/analyze",
    )

    server.APIHandler.do_POST(handler)

    assert handler.payload["overall_score"] < 1
    assert handler.payload["violations"]
    assert any(item["dimension"] == "language_style" for item in handler.payload["violations"])


def test_fusion_manifest_endpoint_documents_policy_and_modules():
    handler = FakeHandler(b"", path="/api/plotpilot/fusion")

    server.APIHandler.do_GET(handler)

    assert handler.payload["api_policy"]["remote_model_calls"] == "explicit_user_action_only"
    assert any(module["key"] == "prompt_plaza" for module in handler.payload["modules"])
