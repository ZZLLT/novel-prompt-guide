# -*- coding: utf-8 -*-
import io
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from wps_mcp_bridge import WPSMCPBridge


class SilentStdout:
    def readline(self):
        time.sleep(0.5)
        return ""


class FakeSilentProcess:
    def __init__(self):
        self.stdin = io.StringIO()
        self.stdout = SilentStdout()
        self.stderr = io.StringIO()
        self.returncode = None

    def poll(self):
        return None


def test_bridge_uses_environment_paths(tmp_path, monkeypatch):
    python_path = tmp_path / "python.exe"
    server_path = tmp_path / "mcp_server.py"
    cwd_path = tmp_path / "wps-agent"
    cwd_path.mkdir()

    monkeypatch.setenv("WPS_AGENT_PYTHON", str(python_path))
    monkeypatch.setenv("WPS_AGENT_SERVER", str(server_path))
    monkeypatch.setenv("WPS_AGENT_CWD", str(cwd_path))

    bridge = WPSMCPBridge()

    assert bridge.python == str(python_path)
    assert bridge.server_script == str(server_path)
    assert bridge.cwd == str(cwd_path)


def test_diagnose_reports_missing_server_script(tmp_path, monkeypatch):
    missing_server = tmp_path / "missing_mcp_server.py"
    monkeypatch.setenv("WPS_AGENT_PYTHON", sys.executable)
    monkeypatch.setenv("WPS_AGENT_SERVER", str(missing_server))
    monkeypatch.setenv("WPS_AGENT_CWD", str(tmp_path))

    bridge = WPSMCPBridge()
    diagnosis = bridge.diagnose()

    assert diagnosis["ok"] is False
    assert diagnosis["checks"]["python"]["exists"] is True
    assert diagnosis["checks"]["server_script"]["exists"] is False
    assert "WPS_AGENT_SERVER" in diagnosis["checks"]["server_script"]["source"]


def test_start_fails_fast_when_preflight_fails(tmp_path, monkeypatch):
    monkeypatch.setenv("WPS_AGENT_PYTHON", str(tmp_path / "missing_python.exe"))
    monkeypatch.setenv("WPS_AGENT_SERVER", str(tmp_path / "missing_mcp_server.py"))
    monkeypatch.setenv("WPS_AGENT_CWD", str(tmp_path))

    bridge = WPSMCPBridge()

    try:
        bridge.start()
    except RuntimeError as e:
        assert "WPS MCP bridge preflight failed" in str(e)
    else:
        raise AssertionError("bridge.start() should fail before spawning subprocess")


def test_send_request_timeout_is_not_blocked_by_stdout_readline():
    bridge = WPSMCPBridge()
    bridge.process = FakeSilentProcess()

    started_at = time.perf_counter()
    try:
        bridge._send_request({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, timeout=0.05)
    except TimeoutError:
        elapsed = time.perf_counter() - started_at
    else:
        raise AssertionError("_send_request should time out when the MCP server is silent")

    assert elapsed < 0.2
