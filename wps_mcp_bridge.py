# -*- coding: utf-8 -*-
"""
WPS MCP Bridge — 直连 WPS Agent MCP 服务器
绕过 Hanako 插件层，直接子进程通信，提供同步 API
"""
import subprocess
import json
import sys
import os
import time
import queue
from pathlib import Path
from threading import RLock, Thread


class WPSMCPBridge:
    """WPS Agent MCP 服务器的直连桥接"""

    def __init__(self):
        default_cwd = r"D:\OH-WorkSpace\wps-agent"
        self.python = os.environ.get(
            "WPS_AGENT_PYTHON",
            r"C:\Users\31601\.conda\envs\wps-agent\python.exe",
        )
        self.server_script = os.environ.get(
            "WPS_AGENT_SERVER",
            str(Path(default_cwd) / "mcp_server.py"),
        )
        self.cwd = os.environ.get("WPS_AGENT_CWD", str(Path(self.server_script).parent))
        self.process = None
        self._lock = RLock()
        self._request_id = 0
        self._stdout_queue = queue.Queue()
        self._stdout_reader = None

    def diagnose(self) -> dict:
        """Return path diagnostics without starting the MCP subprocess."""
        checks = {
            "python": self._path_check(
                self.python,
                source="WPS_AGENT_PYTHON" if os.environ.get("WPS_AGENT_PYTHON") else "default",
                kind="file",
            ),
            "server_script": self._path_check(
                self.server_script,
                source="WPS_AGENT_SERVER" if os.environ.get("WPS_AGENT_SERVER") else "default",
                kind="file",
            ),
            "cwd": self._path_check(
                self.cwd,
                source="WPS_AGENT_CWD" if os.environ.get("WPS_AGENT_CWD") else "server_script_parent",
                kind="dir",
            ),
        }
        return {
            "ok": all(item["valid"] for item in checks.values()),
            "checks": checks,
        }

    def _path_check(self, value: str, source: str, kind: str) -> dict:
        path = Path(value)
        exists = path.exists()
        valid = exists and (path.is_dir() if kind == "dir" else path.is_file())
        return {
            "path": str(path),
            "source": source,
            "exists": exists,
            "kind": kind,
            "valid": valid,
        }

    def _preflight(self):
        diagnosis = self.diagnose()
        if diagnosis["ok"]:
            return
        failed = [
            f"{name}={item['path']} ({item['source']})"
            for name, item in diagnosis["checks"].items()
            if not item["valid"]
        ]
        raise RuntimeError("WPS MCP bridge preflight failed: " + "; ".join(failed))

    def start(self):
        """启动 MCP 服务器子进程"""
        if self.process and self.process.poll() is None:
            if not self._stdout_reader or not self._stdout_reader.is_alive():
                self._start_stdout_reader(self.process, self._stdout_queue)
            return  # already running

        self._preflight()
        self._stdout_queue = queue.Queue()
        self.process = subprocess.Popen(
            [self.python, self.server_script],
            cwd=self.cwd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            encoding="utf-8",
        )
        self._start_stdout_reader(self.process, self._stdout_queue)
        # Read initialization message (server sends a hello/ready)
        # Actually, MCP protocol requires an initialize request first
        self._initialize()

    def _start_stdout_reader(self, process, output_queue):
        def read_loop():
            try:
                for line in process.stdout:
                    output_queue.put(line)
            finally:
                output_queue.put(None)

        self._stdout_reader = Thread(target=read_loop, daemon=True, name="wps-mcp-stdout")
        self._stdout_reader.start()

    def _initialize(self):
        """发送 MCP 初始化握手"""
        req = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "wps-mcp-bridge", "version": "1.0"},
            },
        }
        resp = self._send_request(req)
        # Send initialized notification
        self._send_notification("notifications/initialized", {})
        return resp

    def _next_id(self):
        self._request_id += 1
        return self._request_id

    def _send_request(self, req: dict, timeout: float = 30.0) -> dict:
        """发送 JSON-RPC 请求并等待响应"""
        with self._lock:
            if not self.process or self.process.poll() is not None:
                self.start()

            # Send
            line = json.dumps(req, ensure_ascii=False) + "\n"
            try:
                self.process.stdin.write(line)
                self.process.stdin.flush()
            except (BrokenPipeError, OSError) as e:
                raise RuntimeError(f"Failed to write to MCP server: {e}")

            # Read response (MCP sends one JSON-RPC response per request, but may
            # intersperse with log messages on stderr, which we ignore)
            response_line = None
            deadline = time.time() + timeout
            request_id = req.get("id")
            while time.time() < deadline:
                try:
                    line = self._stdout_queue.get(timeout=max(0.01, deadline - time.time()))
                except queue.Empty:
                    break
                if not line:
                    if self.process.poll() is not None:
                        stderr_output = self.process.stderr.read()
                        raise RuntimeError(
                            f"MCP server exited with code {self.process.returncode}\n"
                            f"Stderr: {stderr_output[-1000:]}"
                        )
                    time.sleep(0.1)
                    continue
                line = line.strip()
                if not line:
                    continue
                try:
                    msg = json.loads(line)
                    if msg.get("method"):
                        # It's a notification from server, skip
                        continue
                    if "result" in msg or "error" in msg:
                        if request_id is not None and msg.get("id") != request_id:
                            continue
                        response_line = msg
                        break
                except json.JSONDecodeError:
                    continue

            if response_line is None:
                if self.process.poll() is not None:
                    stderr_output = self.process.stderr.read()
                    raise RuntimeError(
                        f"MCP server exited with code {self.process.returncode}\n"
                        f"Stderr: {stderr_output[-1000:]}"
                    )
                raise TimeoutError(f"MCP request timed out after {timeout}s")

            if "error" in response_line:
                err = response_line["error"]
                raise RuntimeError(f"MCP error: {err.get('message', str(err))}")

            return response_line.get("result", {})

    def _send_notification(self, method: str, params: dict):
        """发送 JSON-RPC 通知（无需响应）"""
        notif = {"jsonrpc": "2.0", "method": method, "params": params}
        line = json.dumps(notif, ensure_ascii=False) + "\n"
        with self._lock:
            try:
                self.process.stdin.write(line)
                self.process.stdin.flush()
            except (BrokenPipeError, OSError):
                pass

    def call_tool(self, tool_name: str, arguments: dict) -> str:
        """调用 MCP 工具，返回结果文本"""
        req = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments},
        }
        result = self._send_request(req)
        # Extract text from content
        content = result.get("content", [])
        texts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                texts.append(item.get("text", ""))
        return "\n".join(texts)

    def list_tools(self) -> list:
        """列出所有可用的 MCP 工具"""
        req = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "tools/list",
            "params": {},
        }
        result = self._send_request(req)
        return result.get("tools", [])

    def stop(self):
        """停止 MCP 服务器"""
        if self.process and self.process.poll() is None:
            self.process.stdin.close()
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        self._stdout_reader = None

    # ─── 便捷方法 ──────────────────────────────────────

    def doc_list(self) -> str:
        """列出 WPS 中打开的文档"""
        return self.call_tool("document", {"action": "list"})

    def doc_open(self, filepath: str) -> str:
        """打开文档"""
        return self.call_tool("document", {"action": "open", "filepath": filepath})

    def doc_create(self, filepath: str = None) -> str:
        """创建新文档"""
        args = {"action": "create"}
        if filepath:
            args["filepath"] = filepath
        return self.call_tool("document", args)

    def doc_save(self, doc_index: int = 0) -> str:
        return self.call_tool("document", {"action": "save", "doc_index": doc_index})

    def read_full_text(self, doc_index: int = 0) -> str:
        """读取文档全文"""
        return self.call_tool("content", {"action": "full_text", "doc_index": doc_index})

    def read_paragraphs(self, from_para: int, to_para: int, doc_index: int = 0) -> str:
        """读取指定段落范围"""
        return self.call_tool("content", {
            "action": "paragraphs",
            "from_para": from_para,
            "to_para": to_para,
            "doc_index": doc_index,
        })

    def read_selection(self, doc_index: int = 0) -> str:
        """读取当前选中文本"""
        return self.call_tool("content", {"action": "selection", "doc_index": doc_index})

    def read_structure(self, doc_index: int = 0) -> str:
        """读取文档结构"""
        return self.call_tool("content", {"action": "document_structure", "doc_index": doc_index})

    def read_semantic(self, doc_index: int = 0) -> str:
        """读取语义结构"""
        return self.call_tool("content", {"action": "semantic_structure", "doc_index": doc_index})

    def insert_text(self, text: str, position: str = "end", doc_index: int = 0) -> str:
        """插入文本"""
        return self.call_tool("content", {
            "action": "insert_text",
            "text": text,
            "position": position,
            "doc_index": doc_index,
        })

    def replace_range(self, start_pos: int, end_pos: int, new_text: str, doc_index: int = 0) -> str:
        """替换指定范围文本"""
        return self.call_tool("content", {
            "action": "replace_range",
            "start_pos": start_pos,
            "end_pos": end_pos,
            "new_text": new_text,
            "doc_index": doc_index,
        })

    def set_font(self, para_index: int, name: str = None, size: float = None,
                  bold: bool = None, doc_index: int = 0) -> str:
        """设置字体"""
        args = {"action": "set_font", "para_index": para_index, "doc_index": doc_index}
        if name:
            args["name"] = name
        if size:
            args["size"] = size
        if bold is not None:
            args["bold"] = bold
        return self.call_tool("format", args)

    def ai_format(self, action: str, doc_index: int = 0, **kwargs) -> str:
        """AI 智能排版"""
        args = {"action": action, "doc_index": doc_index, **kwargs}
        return self.call_tool("ai_format", args)

    # ─── 网文写作专用 ────────────────────────────────

    def get_writing_context(self, doc_index: int = 0) -> dict:
        """获取当前写作上下文：文档完整结构和内容摘要"""
        structure = self.read_structure(doc_index)
        full_text = self.read_full_text(doc_index)
        return {
            "structure": structure,
            "full_text": full_text[:5000],  # 限长
            "text_length": len(full_text),
        }

    def fill_table_cell(self, table_index: int, row: int, col: int,
                         text: str, doc_index: int = 0) -> str:
        """填写表格单元格"""
        return self.call_tool("table", {
            "action": "set_cell_text",
            "table_index": table_index,
            "row": row,
            "col": col,
            "text": text,
            "doc_index": doc_index,
        })

    def read_table(self, table_index: int, doc_index: int = 0) -> str:
        """读取表格内容"""
        return self.call_tool("table", {
            "action": "read",
            "table_index": table_index,
            "doc_index": doc_index,
        })


# ─── 全局单例 ────────────────────────────────────────

_bridge_instance = None

def get_bridge() -> WPSMCPBridge:
    global _bridge_instance
    if _bridge_instance is None:
        _bridge_instance = WPSMCPBridge()
    return _bridge_instance


# ─── CLI 测试入口 ─────────────────────────────────────

if __name__ == "__main__":
    bridge = WPSMCPBridge()
    print("Starting WPS Agent MCP Bridge...")
    bridge.start()
    print("Bridge started!")

    # 测试：列出工具
    tools = bridge.list_tools()
    print(f"\nAvailable tools: {len(tools)}")
    for t in tools[:5]:
        print(f"  - {t.get('name', '?')}")

    # 测试：列出文档
    try:
        docs = bridge.doc_list()
        print(f"\nOpen documents:\n{docs[:500]}")
    except Exception as e:
        print(f"\nDocument list failed (WPS may not be open): {e}")

    bridge.stop()
    print("\nBridge stopped.")
