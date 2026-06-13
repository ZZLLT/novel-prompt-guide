# WPS Bridge Timeout Bugfix Handoff

更新时间：2026-06-07

## 本次只修复的 bug

真实功能 smoke 测试时发现：

- `/api/sections` 和 `/api/doc/read?section=plot` 在 WPS 文档状态异常或未就绪时会卡到超时。
- 某次 WPS MCP 调用超时后，后台 daemon 线程可能继续卡在 bridge 调用里并持有 bridge 锁。
- 后续 `/api/chat/send`、`/api/write` 会被这个未释放的 bridge 锁拖住，表现为 AI 助手或 WPS 写入接口长时间无响应。

## 根因

`read_timeout()` 只是在调用线程侧超时返回 `None`，但被它启动的后台线程仍可能停在 `WPSMCPBridge.call_tool()` / pipe read 中。

同时 `read_section()` 原本只检查 bridge 进程是否存在，没有检查当前 WPS 文档是否 ready；当 `_bridge_document_ready=False` 时仍会继续读段落，导致接口等待 WPS COM/MCP。

## 已修改文件

- `server.py`
  - 新增 WPS 超时常量：
    - `WPS_STATUS_TIMEOUT_SECONDS = 2`
    - `WPS_READ_TIMEOUT_SECONDS = 3`
    - `WPS_WRITE_TIMEOUT_SECONDS = 8`
  - 新增 `reset_bridge_after_timeout()`：WPS MCP 请求超时时标记 bridge/document 不可用，停止旧 bridge，并后台重连。
  - `read_timeout()` 新增 `on_timeout` 回调。
  - `read_section()` 在 bridge ready 之外新增 `_bridge_document_ready` 判断，未就绪时立即返回空字符串。
  - `read_section()`、`_status()`、`write_to_wps()` 接入超时回调。
  - `write_to_wps()` 新增 WPS 文档未就绪保护和写入超时错误。

- `tests/test_server_api.py`
  - 新增 `test_read_timeout_invokes_timeout_callback_for_stuck_wps_calls`
  - 新增 `test_status_resets_bridge_after_document_probe_timeout`

- `tests/test_context_speed.py`
  - 新增 `test_read_section_returns_immediately_when_document_not_ready`
  - 新增 `test_write_to_wps_resets_bridge_when_insert_times_out`
  - 适配现有 WPS 写入缓存测试，使其显式模拟文档 ready。

## 验证结果

已执行并通过：

```powershell
python -m pytest tests -q
# 61 passed

python -m py_compile server.py prompt_system.py wps_mcp_bridge.py main.py wps_assistant.py wps_build.py wps_build_v2.py
# passed

npm test -- --run
# 59 passed

npm run build
# passed
```

真实 smoke 结果保存在：

- `D:\OH-WorkSpace\novel-prompt-guide\output\function_smoke_results.json`

本次 smoke 覆盖：

- `/api/status`
- `/api/llm/config`
- `/api/llm/models`
- `/api/state`
- `/api/prompt/policy?stage=chapters`
- `/api/sections`
- `/api/doc/read?section=plot`
- `/api/generate`
- `/api/chat/send`
- `/api/write`
- WPS readback marker
- WPS save as docx

全部通过。

## 当前服务状态

最后确认：

- 本地服务：`http://127.0.0.1:5890/`
- WPS bridge：已连接
- LLM：已启用
- 模型列表可获取：`deepseek-v4-flash`、`deepseek-v4-pro`

## 给下一个接力账号的建议

本次按用户要求只修这个 bug，后续不要从这里继续顺手修其他问题，除非用户重新要求。

后续可继续检查但尚未修复/未深入处理的方向：

- UI 中左侧状态有时短暂显示 `OFFLINE / QUEUE`，需要确认是否只是状态刷新时序。
- `/api/generate` 是排队生成 prompt，不是真实直接调用 LLM；如果用户期望“生成按钮直接出结果”，需要单独设计。
- Chrome 真实页面已打开并确认 API 窗口、人物关系窗口渲染，但没有做完整控制台日志采集，因为当前环境没有 Playwright 包，截图服务不能访问 loopback。
