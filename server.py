# -*- coding: utf-8 -*-
"""
WPS Novel Writing System v5
Professional UI · File-queue AI chat · Auto prompt generation · WPS sync
"""
import hashlib, json, sys, os, re, time, threading, uuid
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import portalocker

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, r"D:\OH-WorkSpace\wps-agent")
from wps_mcp_bridge import WPSMCPBridge
from prompt_system import (
    API_CHAT_TOKEN_LIMIT,
    DUPLICATE_CACHE_TTL_SECONDS,
    FAST_CONTEXT_SECTION_LIMIT,
    SECTION_QUERY_HINTS,
    STAGE_PRIORITIES,
    build_chat_payload,
    build_stage_prompt,
    estimate_tokens,
    get_prompt_policy,
    is_direct_prose_request,
)
from plotpilot_fusion import (
    analyze_quality,
    get_fusion_manifest,
    get_prompt_plaza,
    render_prompt_node,
)

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

bridge = WPSMCPBridge()
PROJECT_DIR = Path(__file__).parent
_bridge_ready = False
_bridge_starting = False
_bridge_resetting = False
_bridge_document_ready = False
_bridge_error = None
_bridge_lock = threading.Lock()

def get_web_dir(project_dir=PROJECT_DIR):
    web_dir = Path(project_dir) / "web"
    dist_dir = web_dir / "dist"
    return str(dist_dir if dist_dir.exists() else web_dir)

WEB_DIR = get_web_dir()
CHAT_DIR = Path(__file__).parent / "output" / "chat_queue"
LLM_CONFIG_FILE = Path(__file__).parent / "llm_config.json"
CONTEXT_CACHE_TTL = 20
CONTEXT_SECTION_LIMIT = 600
DOCUMENT_TEXT_CACHE_KEY = "__document_text__"
VALID_STAGE_IDS = {"cover", "worldbuilding", "characters", "plot", "chapters"}
CONTEXT_MODE_SETTINGS = {
    "fast": {"section_limit": FAST_CONTEXT_SECTION_LIMIT, "chars_per_section": 420},
    "standard": {"section_limit": None, "chars_per_section": CONTEXT_SECTION_LIMIT},
    "deep": {"section_limit": None, "chars_per_section": 750},
}
GENERATION_MODE_FALLBACKS = {
    "deep": ["deep", "standard", "fast"],
    "standard": ["standard", "fast"],
    "fast": ["fast"],
}
GENERATION_CACHE_TTL = DUPLICATE_CACHE_TTL_SECONDS
CHAT_CACHE_TTL = DUPLICATE_CACHE_TTL_SECONDS
CHAT_CONTEXT_MODE = "fast"
LLM_FAILURE_COOLDOWN_SECONDS = 60
LLM_TIMEOUT_SECONDS = float(os.environ.get("NOVEL_LLM_TIMEOUT_SECONDS", "20"))
WPS_STATUS_TIMEOUT_SECONDS = 2
WPS_READ_TIMEOUT_SECONDS = 3
WPS_WRITE_TIMEOUT_SECONDS = 8
MODEL_ROUTE_KEYS = ("planner", "writer", "reviewer", "assistant")
MAX_CONTEXT_CACHE_SIZE = 100
MAX_GENERATION_CACHE_SIZE = 50
MAX_CHAT_CACHE_SIZE = 50
_context_cache = {}
_generation_cache = {}
_chat_cache = {}
_generation_request_cache = {}
_chat_request_cache = {}
_request_cache_lock = threading.RLock()
_context_cache_lock = threading.RLock()
_inflight_request_events = {}
_llm_failure_until = 0
_llm_failure_lock = threading.RLock()
_file_operation_lock = threading.RLock()

def bridge_is_ready():
    return _bridge_ready and bridge.process is not None and bridge.process.poll() is None

def start_bridge_background():
    global _bridge_starting
    with _bridge_lock:
        if bridge_is_ready() or _bridge_starting or _bridge_resetting:
            return
        _bridge_starting = True

    def target():
        global _bridge_ready, _bridge_starting, _bridge_error
        try:
            bridge.start()
            _bridge_ready = True
            _bridge_error = None
            print("Bridge connected", flush=True)
        except Exception as e:
            _bridge_ready = False
            _bridge_error = str(e)
            print(f"Bridge: {e}", flush=True)
        finally:
            with _bridge_lock:
                _bridge_starting = False

    threading.Thread(target=target, daemon=True, name="wps-bridge-start").start()

def bridge_status_payload():
    return {
        "ready": bridge_is_ready(),
        "starting": _bridge_starting,
        "resetting": _bridge_resetting,
        "document_ready": _bridge_document_ready,
        "error": _bridge_error,
        "diagnosis": bridge.diagnose(),
    }

def reset_bridge_after_timeout():
    global _bridge_ready, _bridge_document_ready, _bridge_error, _bridge_resetting
    with _bridge_lock:
        _bridge_ready = False
        _bridge_document_ready = False
        _bridge_error = "WPS bridge request timed out; reconnecting"
        if _bridge_resetting:
            return
        _bridge_resetting = True

    def target():
        global _bridge_error, _bridge_resetting
        try:
            bridge.stop()
        except Exception as error:
            with _bridge_lock:
                _bridge_error = f"WPS bridge reset failed: {error}"
        finally:
            with _bridge_lock:
                _bridge_resetting = False
            start_bridge_background()

    threading.Thread(target=target, daemon=True, name="wps-bridge-reset").start()

def empty_document_state():
    return {
        "sections": {
            sid: {"has_content": False, "chars": 0}
            for sid in ["cover", "worldbuilding", "characters", "plot", "chapters"]
        },
        "next_action": "cover",
        "prompt": "WPS bridge 正在后台连接，界面可先使用；连接后再读取文档内容。",
        "bridge": bridge_status_payload(),
    }

def ensure_chat_dir():
    """Ensure the file queue directory exists before reading or writing."""
    CHAT_DIR.mkdir(parents=True, exist_ok=True)

def parse_json_body(handler):
    """Parse a JSON request body and write a 400 JSON response on failure."""
    cl = int(handler.headers.get("Content-Length", 0))
    if not cl:
        return {}
    raw = handler.rfile.read(cl)
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as e:
        handler._json({"error": "invalid_json", "detail": str(e)}, status=400)
        return None

# ══════════════════════════════════════════════════════
# LLM Integration
# ══════════════════════════════════════════════════════
_llm_available = None

def env_flag(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}

def normalize_llm_endpoint(endpoint):
    value = str(endpoint or "https://api.openai.com/v1").strip().rstrip("/")
    for suffix in ("/chat/completions", "/models"):
        if value.endswith(suffix):
            value = value[: -len(suffix)]
            break
    return value.rstrip("/") or "https://api.openai.com/v1"

def normalize_model_routes(value, default_model):
    default = str(default_model or "gpt-4o-mini").strip() or "gpt-4o-mini"
    routes = value if isinstance(value, dict) else {}
    return {
        role: str(routes.get(role) or default).strip() or default
        for role in MODEL_ROUTE_KEYS
    }

def default_model_role_for_stage(stage):
    if stage == "chapters":
        return "writer"
    return "planner"

def normalize_model_role(role, stage="worldbuilding"):
    candidate = str(role or "").strip()
    if candidate in MODEL_ROUTE_KEYS:
        return candidate
    return default_model_role_for_stage(stage)

def select_model_for_role(config, model_role=None, stage="worldbuilding"):
    role = normalize_model_role(model_role, stage)
    routes = normalize_model_routes(config.get("model_routes"), config.get("model", "gpt-4o-mini"))
    return routes.get(role) or config.get("model", "gpt-4o-mini")

def load_local_llm_config(include_key=False):
    default_model = os.environ.get("NOVEL_LLM_MODEL", "gpt-4o-mini")
    defaults = {
        "endpoint": normalize_llm_endpoint(os.environ.get("NOVEL_LLM_ENDPOINT", "https://api.openai.com/v1")),
        "model": default_model,
        "temperature": float(os.environ.get("NOVEL_LLM_TEMPERATURE", "0.3")),
        "max_tokens": int(os.environ.get("NOVEL_LLM_MAX_TOKENS", "4096")),
        "api_enabled": env_flag("NOVEL_LLM_API_ENABLED", False),
        "model_routes": normalize_model_routes(
            {
                "planner": os.environ.get("NOVEL_LLM_PLANNER_MODEL", default_model),
                "writer": os.environ.get("NOVEL_LLM_WRITER_MODEL", default_model),
                "reviewer": os.environ.get("NOVEL_LLM_REVIEWER_MODEL", default_model),
                "assistant": os.environ.get("NOVEL_LLM_ASSISTANT_MODEL", default_model),
            },
            default_model,
        ),
    }
    api_key = os.environ.get("NOVEL_LLM_API_KEY") or os.environ.get("OPENAI_API_KEY") or os.environ.get("LLM_API_KEY")
    if LLM_CONFIG_FILE.exists():
        try:
            saved = json.loads(LLM_CONFIG_FILE.read_text(encoding="utf-8"))
            defaults.update({k: saved[k] for k in ["endpoint", "model", "temperature", "max_tokens", "api_enabled"] if k in saved})
            defaults["endpoint"] = normalize_llm_endpoint(defaults["endpoint"])
            defaults["model_routes"] = normalize_model_routes(saved.get("model_routes"), defaults["model"])
            api_key = saved.get("api_key") or api_key
        except Exception:
            pass
    defaults["model_routes"] = normalize_model_routes(defaults.get("model_routes"), defaults["model"])
    payload = {
        **defaults,
        "api_key_set": bool(api_key),
    }
    if include_key:
        payload["api_key"] = api_key or ""
    return payload

def save_local_llm_config(body):
    current = load_local_llm_config(include_key=True)
    endpoint = normalize_llm_endpoint(body.get("endpoint") or current["endpoint"])
    model = str(body.get("model") or current["model"]).strip()
    model_routes = normalize_model_routes(body.get("model_routes"), model) if "model_routes" in body else normalize_model_routes(None, model)
    if body.get("clear_api_key"):
        api_key = ""
    elif "api_key" in body:
        api_key = str(body.get("api_key") or "").strip()
    else:
        api_key = str(current.get("api_key") or "").strip()
    try:
        temperature = float(body.get("temperature", current["temperature"]))
    except (TypeError, ValueError):
        temperature = current["temperature"]
    try:
        max_tokens = int(body.get("max_tokens", current["max_tokens"]))
    except (TypeError, ValueError):
        max_tokens = current["max_tokens"]
    config = {
        "endpoint": endpoint,
        "model": model,
        "model_routes": model_routes,
        "temperature": max(0, min(2, temperature)),
        "max_tokens": max(256, min(16000, max_tokens)),
        "api_enabled": bool(body.get("api_enabled", current.get("api_enabled", False))) and bool(api_key),
    }
    if api_key:
        config["api_key"] = api_key
    LLM_CONFIG_FILE.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    global _llm_available, _llm_failure_until
    _llm_available = None
    with _llm_failure_lock:
        _llm_failure_until = 0
    return public_llm_config(config)

def public_llm_config(config=None):
    source = config or load_local_llm_config(include_key=True)
    return {
        "endpoint": source.get("endpoint", ""),
        "model": source.get("model", ""),
        "model_routes": normalize_model_routes(source.get("model_routes"), source.get("model", "")),
        "api_key_set": bool(source.get("api_key") or source.get("api_key_set")),
        "api_enabled": bool(source.get("api_enabled")) and bool(source.get("api_key") or source.get("api_key_set")),
        "temperature": source.get("temperature", 0.3),
        "max_tokens": source.get("max_tokens", 4096),
    }

def local_llm_enabled(config=None):
    source = config or load_local_llm_config(include_key=True)
    return bool(source.get("api_enabled") and source.get("api_key"))

def legacy_llm_enabled():
    return env_flag("NOVEL_LLM_ALLOW_LEGACY", False)

def fetch_llm_models(endpoint, api_key=""):
    import httpx
    base_url = normalize_llm_endpoint(endpoint)
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        with httpx.Client(timeout=LLM_TIMEOUT_SECONDS, trust_env=False) as client:
            resp = client.get(f"{base_url}/models", headers=headers)
    except Exception as error:
        return {"models": [], "error": f"模型列表获取失败：{error}"}
    if resp.status_code != 200:
        return {"models": [], "error": f"模型列表获取失败：{resp.status_code}"}
    try:
        data = resp.json()
    except Exception as error:
        return {"models": [], "error": f"模型列表解析失败：{error}"}
    if isinstance(data, dict):
        raw_models = data.get("data", [])
    elif isinstance(data, list):
        raw_models = data
    else:
        raw_models = []
    models = []
    for item in raw_models:
        if isinstance(item, str):
            model_id = item
        elif isinstance(item, dict):
            model_id = item.get("id") or item.get("name") or item.get("model")
        else:
            model_id = None
        if model_id:
            models.append({"id": str(model_id)})
    deduped = sorted({model["id"] for model in models})
    return {"models": [{"id": model_id} for model_id in deduped]}

def chat_with_local_llm(system_prompt, user_prompt, model_role=None, stage="worldbuilding", config=None):
    global _llm_failure_until
    with _llm_failure_lock:
        if time.time() < _llm_failure_until:
            return None
    config = config or load_local_llm_config(include_key=True)
    api_key = config.get("api_key")
    if not local_llm_enabled(config):
        return None
    selected_model = select_model_for_role(config, model_role, stage)
    try:
        import httpx
        url = f"{config['endpoint'].rstrip('/')}/chat/completions"
        with httpx.Client(timeout=LLM_TIMEOUT_SECONDS, trust_env=False) as client:
            resp = client.post(
                url,
                json={
                    "model": selected_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": config["temperature"],
                    "max_tokens": config["max_tokens"],
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
        if resp.status_code != 200:
            with _llm_failure_lock:
                _llm_failure_until = time.time() + LLM_FAILURE_COOLDOWN_SECONDS
            return None
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        with _llm_failure_lock:
            _llm_failure_until = time.time() + LLM_FAILURE_COOLDOWN_SECONDS
        return None

def check_llm():
    global _llm_available
    if _llm_available is not None:
        return _llm_available
    if local_llm_enabled():
        _llm_available = True
        return _llm_available
    if not legacy_llm_enabled():
        _llm_available = False
        return _llm_available
    try:
        from intelligence.llm_client import chat, _get_api_key
        key = _get_api_key()
        _llm_available = bool(key)
    except (ImportError, AttributeError, Exception):
        # Module not found, function not found, or key unavailable
        _llm_available = False
    return _llm_available

# ══════════════════════════════════════════════════════
# Chat Queue System
# ══════════════════════════════════════════════════════
def enqueue_user_message(msg, stage, context):
    """Write user message to queue for AI to pick up"""
    ensure_chat_dir()
    entry = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": time.time(),
        "stage": stage,
        "message": msg,
        "context": context,
        "status": "pending"
    }
    with _file_operation_lock:
        with open(CHAT_DIR / "in.jsonl", "a", encoding="utf-8") as f:
            portalocker.lock(f, portalocker.LOCK_EX)
            try:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            finally:
                portalocker.unlock(f)
    return entry["id"]

def check_ai_response(msg_id):
    """Check if AI has responded to a message"""
    out_file = CHAT_DIR / "out.jsonl"
    if not out_file.exists():
        return None
    with open(out_file, "r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                if entry.get("reply_to") == msg_id:
                    return entry
            except (json.JSONDecodeError, KeyError):
                # Skip malformed JSON lines or entries without expected keys
                continue
    return None

def get_pending_messages():
    """Get all pending user messages for AI to process"""
    in_file = CHAT_DIR / "in.jsonl"
    if not in_file.exists():
        return []
    messages = []
    with open(in_file, "r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                if entry.get("status") == "pending":
                    messages.append(entry)
            except (json.JSONDecodeError, KeyError):
                # Skip malformed JSON lines or entries without expected keys
                continue
    return messages

def mark_processed(msg_id):
    """Mark a message as processed by AI"""
    in_file = CHAT_DIR / "in.jsonl"
    if not in_file.exists():
        return
    with _file_operation_lock:
        lines = []
        with open(in_file, "r+", encoding="utf-8") as f:
            portalocker.lock(f, portalocker.LOCK_EX)
            try:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        if entry.get("id") == msg_id:
                            entry["status"] = "processed"
                        lines.append(json.dumps(entry, ensure_ascii=False))
                    except (json.JSONDecodeError, KeyError):
                        # Preserve malformed lines as-is to avoid data loss
                        lines.append(line.strip())
                f.seek(0)
                f.truncate()
                f.write("\n".join(lines) + "\n")
            finally:
                portalocker.unlock(f)

def post_ai_response(reply_to, response_text, actions=None):
    """Post AI response to output queue"""
    ensure_chat_dir()
    entry = {
        "reply_to": reply_to,
        "timestamp": time.time(),
        "response": response_text,
        "actions": actions or []
    }
    with _file_operation_lock:
        with open(CHAT_DIR / "out.jsonl", "a", encoding="utf-8") as f:
            portalocker.lock(f, portalocker.LOCK_EX)
            try:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            finally:
                portalocker.unlock(f)

# ══════════════════════════════════════════════════════
# Document Operations
# ══════════════════════════════════════════════════════
def read_timeout(func, timeout=10, on_timeout=None):
    result = [None]
    def target():
        try:
            result[0] = func()
        except Exception as e:
            # Log the error but don't propagate to avoid thread crashes
            print(f"[ERROR] read_timeout worker exception: {type(e).__name__}: {e}", file=sys.stderr)
    t = threading.Thread(target=target, daemon=True, name="wps-read-timeout")
    t.start()
    t.join(timeout)
    if t.is_alive():
        if on_timeout:
            try:
                on_timeout()
            except Exception:
                pass
        return None
    return result[0]

def parse_wps_text_result(raw):
    if not raw:
        return ""
    payload = raw
    if isinstance(raw, str):
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return raw
    if isinstance(payload, dict):
        if payload.get("success") is False:
            return ""
        return str(payload.get("text") or payload.get("full_text") or "")
    return str(payload)

def read_document_text():
    cached = _context_cache.get(DOCUMENT_TEXT_CACHE_KEY)
    now = time.time()
    if cached and now - cached["timestamp"] <= CONTEXT_CACHE_TTL:
        return cached["text"]
    if not bridge_is_ready():
        start_bridge_background()
        return ""
    if not _bridge_document_ready:
        return ""
    raw = read_timeout(
        lambda: bridge.read_full_text(1),
        WPS_READ_TIMEOUT_SECONDS,
        on_timeout=reset_bridge_after_timeout,
    )
    text = parse_wps_text_result(raw).replace("\r\n", "\n").replace("\r", "\n")
    if text.strip():
        _context_cache[DOCUMENT_TEXT_CACHE_KEY] = {"timestamp": now, "text": text}
    return text

def split_document_paragraphs(text):
    return [para.strip() for para in re.split(r"\n+", text or "") if para.strip()]

def read_section(section_id):
    text = read_document_text()
    if not text.strip():
        return ""
    if section_id in {"all", "full"}:
        return text
    mapping = {
        "cover": (1,35), "worldbuilding": (60,250),
        "characters": (280,480), "plot": (500,680),
        "chapters": (700,880), "editing": (900,1000),
    }
    rng = mapping.get(section_id, (1,50))
    paragraphs = split_document_paragraphs(text)
    selected = paragraphs[rng[0] - 1:rng[1]]
    if selected:
        return "\n".join(selected)
    if paragraphs and len(paragraphs) <= 40:
        return text
    return ""

def read_all_sections():
    sections = {}
    for sid in ["cover","worldbuilding","characters","plot","chapters"]:
        text = read_section(sid)
        if text.strip():
            sections[sid] = text[:600]
    return sections

def clear_context_cache():
    with _context_cache_lock:
        _context_cache.clear()

def _evict_lru_from_cache(cache, max_size):
    """Evict oldest entries from cache if it exceeds max_size (caller must hold lock)"""
    if len(cache) <= max_size:
        return
    # Sort by timestamp and keep only the newest max_size entries
    sorted_items = sorted(cache.items(), key=lambda item: item[1].get("timestamp", 0), reverse=True)
    cache.clear()
    for key, value in sorted_items[:max_size]:
        cache[key] = value

def clear_generation_cache():
    with _request_cache_lock:
        _generation_cache.clear()
        _generation_request_cache.clear()
        _inflight_request_events.clear()

def clear_chat_cache():
    with _request_cache_lock:
        _chat_cache.clear()
        _chat_request_cache.clear()
        _inflight_request_events.clear()

def read_cached_section(section_id):
    with _context_cache_lock:
        cached = _context_cache.get(section_id)
        now = time.time()
        if cached and now - cached["timestamp"] <= CONTEXT_CACHE_TTL:
            return cached["text"]

    text = read_section(section_id)
    if not text.strip():
        return text

    with _context_cache_lock:
        _context_cache[section_id] = {"timestamp": now, "text": text}
        _evict_lru_from_cache(_context_cache, MAX_CONTEXT_CACHE_SIZE)
    return text

def rank_sections_for_query(priorities, query=""):
    if not query:
        return list(priorities)
    indexed = {section_id: index for index, section_id in enumerate(priorities)}

    def score(section_id):
        hints = SECTION_QUERY_HINTS.get(section_id, ())
        hit_count = sum(1 for hint in hints if hint and hint in query)
        return (-hit_count, indexed[section_id])

    return sorted(priorities, key=score)

def read_context_sections(stage, max_chars_per_section=None, mode="standard", query=""):
    sections = {}
    settings = CONTEXT_MODE_SETTINGS.get(mode, CONTEXT_MODE_SETTINGS["standard"])
    section_limit = settings["section_limit"]
    chars_per_section = max_chars_per_section or settings["chars_per_section"]
    priorities = rank_sections_for_query(STAGE_PRIORITIES.get(stage, STAGE_PRIORITIES["worldbuilding"]), query)
    if section_limit:
        priorities = priorities[:section_limit]
    for sid in priorities:
        text = read_cached_section(sid)
        if text.strip():
            sections[sid] = text[:chars_per_section]
    return sections

def write_to_wps(text, position="end"):
    if not bridge_is_ready():
        start_bridge_background()
        raise RuntimeError("WPS bridge is not connected yet")
    if not _bridge_document_ready:
        raise RuntimeError("WPS document is not ready yet")
    result = read_timeout(
        lambda: bridge.insert_text(text, position, 1),
        WPS_WRITE_TIMEOUT_SECONDS,
        on_timeout=reset_bridge_after_timeout,
    )
    if not result:
        raise RuntimeError("WPS write timed out")
    result_payload = result
    if isinstance(result, str):
        try:
            result_payload = json.loads(result)
        except json.JSONDecodeError:
            result_payload = None
    if isinstance(result_payload, dict) and result_payload.get("success") is False:
        raise RuntimeError(result_payload.get("error") or "WPS write failed")
    clear_context_cache()
    clear_generation_cache()
    clear_chat_cache()
    return result

def generation_signature(stage, mode, prompt_bundle):
    payload = {
        "stage": stage,
        "mode": mode,
        "prompt": prompt_bundle.get("prompt", ""),
        "context": prompt_bundle.get("context", ""),
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()

def request_signature(kind, payload):
    raw = json.dumps({"kind": kind, **payload}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()

def get_recent_request(cache, signature, ttl):
    with _request_cache_lock:
        cached = cache.get(signature)
        if not cached:
            return None
        if time.time() - cached["timestamp"] > ttl:
            cache.pop(signature, None)
            return None
        return cached["payload"]

def begin_request(cache, signature, ttl, wait_seconds=30):
    with _request_cache_lock:
        cached = get_recent_request(cache, signature, ttl)
        if cached:
            return cached, False
        event = _inflight_request_events.get(signature)
        if event is None:
            event = threading.Event()
            _inflight_request_events[signature] = event
            return None, True
    event.wait(wait_seconds)
    return get_recent_request(cache, signature, ttl), False

def remember_request(cache, signature, payload):
    with _request_cache_lock:
        cache[signature] = {"timestamp": time.time(), "payload": payload}
        event = _inflight_request_events.pop(signature, None)
        if event:
            event.set()

def release_request(signature):
    with _request_cache_lock:
        event = _inflight_request_events.pop(signature, None)
        if event:
            event.set()

def reused_payload(payload):
    response = dict(payload)
    if response.get("status") == "queued":
        response["status"] = "reused"
    return response

def get_recent_generation(signature):
    with _request_cache_lock:
        cached = _generation_cache.get(signature)
        if not cached:
            return None
        if time.time() - cached["timestamp"] > GENERATION_CACHE_TTL:
            _generation_cache.pop(signature, None)
            return None
        return cached

def remember_generation(signature, msg_id):
    with _request_cache_lock:
        _generation_cache[signature] = {"timestamp": time.time(), "msg_id": msg_id}
        _evict_lru_from_cache(_generation_cache, MAX_GENERATION_CACHE_SIZE)

def estimate_chat_api_tokens(prompt_payload):
    return estimate_tokens(prompt_payload.get("system", "")) + estimate_tokens(prompt_payload.get("user", ""))

def can_call_chat_llm(prompt_payload):
    return estimate_chat_api_tokens(prompt_payload) <= API_CHAT_TOKEN_LIMIT

def generation_mode_candidates(mode):
    return GENERATION_MODE_FALLBACKS.get(mode, GENERATION_MODE_FALLBACKS["standard"])

def estimate_generation_api_tokens(prompt_bundle):
    return estimate_tokens(prompt_bundle.get("prompt", ""))

def build_guarded_generation_bundle(stage, requested_mode):
    candidates = generation_mode_candidates(requested_mode)
    last_bundle = None
    last_estimate = 0
    for mode in candidates:
        sections = read_context_sections(stage, mode=mode)
        bundle = build_stage_prompt(stage, sections, mode=mode)
        token_estimate = estimate_generation_api_tokens(bundle)
        bundle["api_token_estimate"] = token_estimate
        if token_estimate <= API_CHAT_TOKEN_LIMIT:
            guard = "auto_downgraded" if mode != candidates[0] else None
            return bundle, token_estimate, guard
        last_bundle = bundle
        last_estimate = token_estimate
    return last_bundle, last_estimate, "token_limit"

def clean_direct_writer_response(text):
    cleaned = str(text or "").strip()
    if not cleaned:
        return cleaned
    cleaned = cleaned.replace("\r\n", "\n")
    cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", cleaned).strip()
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    meta_markers = ("判断：", "判断:", "建议：", "建议:", "可执行下一步：", "可执行下一步:")
    meta_heading = re.compile(r"\*{0,2}\s*(判断|建议|可执行下一步)\s*\*{0,2}\s*[:：]?")

    def has_meta(segment):
        return any(marker in segment for marker in meta_markers) or bool(meta_heading.search(segment))

    parts = [part.strip() for part in re.split(r"(?:^|\n)\s*-{3,}\s*(?:\n|$)", cleaned) if part.strip()]
    if len(parts) >= 2 and any(has_meta(part) for part in parts[:-1]):
        cleaned = parts[-1].strip()
    elif len(parts) == 2 and has_meta(parts[0]):
        cleaned = parts[1].strip()
    cleaned = re.sub(
        r"^(?:以下(?:是)?|下面(?:是)?|这是)?(?:可直接写入的)?(?:小说)?正文(?:片段|内容)?[:：]\s*",
        "",
        cleaned,
    ).strip()
    lines = cleaned.splitlines()
    while lines and (not lines[0].strip() or any(lines[0].strip().startswith(marker) for marker in meta_markers) or meta_heading.fullmatch(lines[0].strip())):
        lines.pop(0)
    return "\n".join(lines).strip()

def chat_signature(stage, message, prompt_payload, model_role=None, selected_model=""):
    payload = {
        "stage": stage,
        "message": message,
        "model_role": model_role or "",
        "selected_model": selected_model or "",
        "system": prompt_payload.get("system", ""),
        "user": prompt_payload.get("user", ""),
        "context": prompt_payload.get("context", ""),
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()

def get_recent_chat(signature):
    with _request_cache_lock:
        cached = _chat_cache.get(signature)
        if not cached:
            return None
        if time.time() - cached["timestamp"] > CHAT_CACHE_TTL:
            _chat_cache.pop(signature, None)
            return None
        return cached

def remember_chat(signature, payload):
    with _request_cache_lock:
        _chat_cache[signature] = {"timestamp": time.time(), **payload}
        _evict_lru_from_cache(_chat_cache, MAX_CHAT_CACHE_SIZE)

# ══════════════════════════════════════════════════════
# Auto Prompt Generation
# ══════════════════════════════════════════════════════
def analyze_document_state():
    """Analyze WPS document and determine what's needed"""
    sections = read_all_sections()
    state = {"sections": {}, "next_action": None, "prompt": None}

    for sid in ["cover","worldbuilding","characters","plot","chapters"]:
        text = sections.get(sid, "")
        state["sections"][sid] = {
            "has_content": len(text) > 30,
            "chars": len(text)
        }

    # Determine next action
    if not state["sections"]["cover"]["has_content"]:
        state["next_action"] = "cover"
        state["prompt"] = "请先在WPS文档封面填写作品名称、类型和写作风格。"
    elif not state["sections"]["worldbuilding"]["has_content"]:
        state["next_action"] = "worldbuilding"
        state["prompt"] = generate_worldbuilding_prompt(sections)
    elif not state["sections"]["characters"]["has_content"]:
        state["next_action"] = "characters"
        state["prompt"] = generate_character_prompt(sections)
    elif not state["sections"]["plot"]["has_content"]:
        state["next_action"] = "plot"
        state["prompt"] = generate_plot_prompt(sections)
    elif not state["sections"]["chapters"]["has_content"]:
        state["next_action"] = "chapters"
        state["prompt"] = generate_chapter_prompt(sections)

    return state

def generate_worldbuilding_prompt(ctx):
    cover_text = ctx.get("cover", "")
    return f"""根据以下创作方向，构建完整的世界观设定：

【创作方向】
{cover_text[:300] if cover_text else "（请在封面填写基本信息）"}

请按以下结构展开：
1. 世界类型、时代背景、世界规模（150字）
2. 核心冲突：世界面临的根本矛盾，以及为什么这个矛盾能打动读者（200字）
3. 力量体系：力量来源、等级划分（至少8级）、升级机制、代价限制（300字）
4. 势力版图：5-7个主要组织，每个包含名称、宗旨、实力、与主角关系（300字）
5. 隐藏真相：普通人不知道的世界秘密（150字）

要求：设定具体可操作，每个条目都能直接用于写作。"""

def generate_character_prompt(ctx):
    wb = ctx.get("worldbuilding", "")
    cover = ctx.get("cover", "")
    return f"""根据以下世界观和创作方向，设计小说主角：

【世界观】
{wb[:400] if wb else "（世界观待构建）"}

【创作方向】
{cover[:200] if cover else ""}

请设计：
1. 主角完整档案：姓名含义、年龄、外貌标志（100字）
2. 身份背景：出身、3个成长关键事件、公开/隐藏身份（150字）
3. 性格系统：核心性格（2词）、3优点3缺陷、行为习惯、口头禅（150字）
4. 金手指设计（核心！）：能力名称、来源、详细机制、3个限制、代价、成长路径（300字）
5. 成长弧线：开篇状态→中期转变→结局形态（100字）
6. 读者吸引力：为什么读者会喜欢这个角色？（3个理由，50字）

然后为以下角色各写100字设定：女主角、主要反派、导师、2个伙伴、搞笑角色"""

def generate_plot_prompt(ctx):
    chars = ctx.get("characters", "")
    wb = ctx.get("worldbuilding", "")
    return f"""根据已有设定，设计完整剧情：

【世界观】
{wb[:300] if wb else ""}

【角色】
{chars[:300] if chars else ""}

请规划：
1. 一句话故事梗概
2. 三幕式结构：开篇→触发事件→第一转折→对抗→中点→最低谷→最终对决→结局（每幕300字）
3. 5个关键剧情转折点（标注大致章节位置）
4. 第一卷详细规划：卷名、核心目标、5-7个关键事件、卷末钩子
5. 前3章钩子设计：每章如何抓住读者？
6. 爽点分布图：8种爽点类型在故事中的具体体现"""

def generate_chapter_prompt(ctx):
    plot = ctx.get("plot", "")
    chars = ctx.get("characters", "")
    return f"""根据以下大纲和设定，撰写第一章正文：

【剧情大纲】
{plot[:500] if plot else "（大纲待规划）"}

【角色设定】
{chars[:300] if chars else ""}

写作要求：
- 字数：2500-3500字
- 第一段就要抓住读者（悬念/冲突/画面）
- 对话生动体现性格，动作描写有节奏感
- 心理描写控制在全文字数15%以内
- 结尾必须有钩子
- 语言要流畅自然，符合网文阅读习惯"""

# ══════════════════════════════════════════════════════
# HTTP API
# ══════════════════════════════════════════════════════
class APIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def log_message(self, f, *a): pass

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200); self.end_headers()

    def do_GET(self):
        p = urlparse(self.path); q = parse_qs(p.query)

        if p.path == "/api/status":
            self._json(self._status())
        elif p.path == "/api/llm/config":
            self._json(public_llm_config())
        elif p.path == "/api/state":
            self._json(analyze_document_state() if bridge_is_ready() and _bridge_document_ready else empty_document_state())
        elif p.path == "/api/sections":
            self._json(read_all_sections())
        elif p.path == "/api/prompt/policy":
            stage = q.get("stage", ["worldbuilding"])[0]
            self._json(get_prompt_policy(stage))
        elif p.path == "/api/prompts/plaza":
            self._json(get_prompt_plaza())
        elif p.path == "/api/plotpilot/fusion":
            self._json(get_fusion_manifest())
        elif p.path == "/api/chat/poll":
            msg_id = q.get("msg_id", [""])[0]
            resp = check_ai_response(msg_id) if msg_id else None
            # Also check for any new responses
            self._json({"response": resp, "pending_count": len(get_pending_messages())})
        elif p.path == "/api/doc/read":
            sid = q.get("section", [None])[0]
            self._json({"text": read_section(sid) if sid else read_document_text()})
        elif not p.path.startswith("/api/"):
            super().do_GET()
        else:
            self._json({"error":"unknown"}, status=404)

    def do_POST(self):
        p = urlparse(self.path)
        body = parse_json_body(self)
        if body is None:
            return

        if p.path == "/api/chat/send":
            MAX_MESSAGE_LENGTH = 10000
            msg = body.get("message", "")
            if not isinstance(msg, str):
                self._json({"error": "message must be a string"}, status=400)
                return
            if not msg.strip():
                self._json({"error": "message is required and must be non-empty"}, status=400)
                return
            if len(msg) > MAX_MESSAGE_LENGTH:
                self._json({"error": f"message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters"}, status=400)
                return
            stage = body.get("stage", "worldbuilding")
            if not isinstance(stage, str):
                self._json({"error": "stage must be a string"}, status=400)
                return
            model_role = normalize_model_role(body.get("model_role"), stage)
            llm_config = load_local_llm_config(include_key=True)
            selected_model = select_model_for_role(llm_config, model_role, stage)
            ctx = read_context_sections(stage, mode=CHAT_CONTEXT_MODE, query=msg)
            prompt_payload = build_chat_payload(msg, stage, ctx, model_role=model_role)
            ctx_text = prompt_payload["context"]
            signature = chat_signature(stage, msg, prompt_payload, model_role, selected_model)
            request_key = request_signature(
                "chat",
                {"stage": stage, "message": msg, "mode": CHAT_CONTEXT_MODE, "model_role": model_role, "model": selected_model, "signature": signature},
            )
            recent_request, owns_request = begin_request(_chat_request_cache, request_key, CHAT_CACHE_TTL)
            if recent_request:
                self._json(reused_payload(recent_request))
                return
            if not owns_request:
                self._json({"error": "request_in_progress"}, status=409)
                return
            recent = get_recent_chat(signature)
            if recent:
                if recent.get("response"):
                    response = {
                        "msg_id": recent["msg_id"],
                        "response": recent["response"],
                        "mode": recent.get("mode", "llm"),
                        "model": recent.get("model", selected_model),
                        "model_role": recent.get("model_role", model_role),
                        "budget": prompt_payload["budget"],
                    }
                    remember_request(_chat_request_cache, request_key, response)
                    self._json(response)
                    return
                response = {"msg_id": recent["msg_id"], "status": "reused", "budget": prompt_payload["budget"]}
                if recent.get("guard"):
                    response["guard"] = recent["guard"]
                if recent.get("api_token_estimate"):
                    response["api_token_estimate"] = recent["api_token_estimate"]
                remember_request(_chat_request_cache, request_key, response)
                self._json(response)
                return
            
            # Try LLM first if available
            llm_available = check_llm()
            api_token_estimate = estimate_chat_api_tokens(prompt_payload)
            token_guard = None if api_token_estimate <= API_CHAT_TOKEN_LIMIT else "token_limit"
            if llm_available and not token_guard:
                try:
                    system = "你是专业的网文写作AI助手。请根据WPS文档中的内容，帮助用户完成小说创作。回复要具体、可操作。用中文。"
                    user_msg = f"【WPS写作工作台当前内容】\n{ctx_text[:2000]}\n\n【用户消息】\n{msg}"
                    system = prompt_payload["system"]
                    user_msg = prompt_payload["user"]
                    result = chat_with_local_llm(system, user_msg, model_role=model_role, stage=stage, config=llm_config)
                    if result is None and legacy_llm_enabled():
                        from intelligence.llm_client import chat
                        result = chat(system, user_msg)
                    if result and is_direct_prose_request(msg, stage, model_role):
                        result = clean_direct_writer_response(result)
                    if result:
                        msg_id = str(uuid.uuid4())[:8]
                        remember_chat(signature, {"msg_id": msg_id, "response": result, "mode": "llm", "model": selected_model, "model_role": model_role})
                        response = {
                            "msg_id": msg_id,
                            "response": result,
                            "mode": "llm",
                            "model": selected_model,
                            "model_role": model_role,
                            "budget": prompt_payload["budget"],
                        }
                        remember_request(_chat_request_cache, request_key, response)
                        self._json(response)
                        return
                except Exception as e:
                    pass
            
            # Fallback: queue for file-based AI
            try:
                msg_id = enqueue_user_message(msg, stage, ctx_text)
            except Exception:
                release_request(request_key)
                raise
            cache_payload = {"msg_id": msg_id, "model": selected_model, "model_role": model_role}
            if token_guard:
                cache_payload["guard"] = token_guard
                cache_payload["api_token_estimate"] = api_token_estimate
            remember_chat(signature, cache_payload)
            response = {"msg_id": msg_id, "status": "queued", "model": selected_model, "model_role": model_role, "budget": prompt_payload["budget"]}
            if token_guard:
                response["guard"] = token_guard
                response["api_token_estimate"] = api_token_estimate
            remember_request(_chat_request_cache, request_key, response)
            self._json(response)

        elif p.path == "/api/llm/config":
            self._json(save_local_llm_config(body))

        elif p.path == "/api/llm/models":
            current = load_local_llm_config(include_key=True)
            endpoint = body.get("endpoint") or current.get("endpoint")
            api_key = str(body.get("api_key") or current.get("api_key") or "").strip()

            if not endpoint or not isinstance(endpoint, str):
                self._json({"error": "endpoint is required and must be a string", "models": []})
                return

            # Basic URL validation
            try:
                parsed = urlparse(endpoint)
                if not parsed.scheme or not parsed.netloc:
                    self._json({"error": "endpoint must be a valid URL", "models": []})
                    return
            except Exception:
                self._json({"error": "endpoint must be a valid URL", "models": []})
                return

            self._json(fetch_llm_models(endpoint, api_key))

        elif p.path == "/api/prompts/render":
            node_id = body.get("node_id", "")
            variables = body.get("variables")
            if not isinstance(node_id, str):
                self._json({"error": "node_id must be a string"}, status=400)
                return
            if variables is not None and not isinstance(variables, dict):
                self._json({"error": "variables must be an object"}, status=400)
                return
            self._json(render_prompt_node(node_id, variables or {}))

        elif p.path == "/api/quality/analyze":
            MAX_ANALYZE_TEXT_LENGTH = 50000
            text = body.get("text", "")
            chapter_goal = body.get("chapter_goal", "")
            scene_type = body.get("scene_type", "auto")

            if not isinstance(text, str):
                self._json({"error": "text must be a string"}, status=400)
                return
            if len(text) > MAX_ANALYZE_TEXT_LENGTH:
                self._json({"error": f"text exceeds maximum length of {MAX_ANALYZE_TEXT_LENGTH} characters"}, status=400)
                return
            if not isinstance(chapter_goal, str):
                self._json({"error": "chapter_goal must be a string"}, status=400)
                return
            if not isinstance(scene_type, str):
                self._json({"error": "scene_type must be a string"}, status=400)
                return

            self._json(analyze_quality(text, chapter_goal=chapter_goal, scene_type=scene_type))

        elif p.path == "/api/generate":
            stage = body.get("stage", "worldbuilding")
            mode = body.get("mode", "standard")
            if not isinstance(stage, str):
                self._json({"error": "stage must be a string"}, status=400)
                return
            if not isinstance(mode, str):
                self._json({"error": "mode must be a string"}, status=400)
                return
            if stage not in VALID_STAGE_IDS:
                self._json({"error": "unknown stage"}, status=400)
                return
            if mode not in ["standard", "fast", "deep"]:
                self._json({"error": "mode must be 'standard', 'fast', or 'deep'"}, status=400)
                return
            prompt_bundle, api_token_estimate, token_guard = build_guarded_generation_bundle(stage, mode)
            request_key = request_signature(
                "generate",
                {
                    "stage": stage,
                    "mode": mode,
                    "effective_mode": prompt_bundle["mode"] if prompt_bundle else mode,
                    "prompt": prompt_bundle.get("prompt") if prompt_bundle else "",
                    "context": prompt_bundle.get("context") if prompt_bundle else "",
                    "guard": token_guard or "",
                },
            )
            recent_request, owns_request = begin_request(_generation_request_cache, request_key, GENERATION_CACHE_TTL)
            if recent_request:
                self._json(reused_payload(recent_request))
                return
            if not owns_request:
                self._json({"error": "request_in_progress"}, status=409)
                return
            if token_guard == "token_limit":
                response = {
                    "status": "blocked",
                    "guard": "token_limit",
                    "api_token_estimate": api_token_estimate,
                    "mode": prompt_bundle["mode"] if prompt_bundle else mode,
                    "budget": prompt_bundle.get("budget") if prompt_bundle else None,
                }
                remember_request(_generation_request_cache, request_key, response)
                self._json(response)
                return
            prompt = prompt_bundle["prompt"]
            if prompt:
                signature = generation_signature(stage, prompt_bundle["mode"], prompt_bundle)
                recent = get_recent_generation(signature)
                if recent:
                    response = {
                        "msg_id": recent["msg_id"],
                        "prompt": prompt,
                        "status": "reused",
                        "mode": prompt_bundle["mode"],
                        "budget": prompt_bundle["budget"],
                        "api_token_estimate": api_token_estimate,
                    }
                    if token_guard:
                        response["guard"] = token_guard
                    remember_request(_generation_request_cache, request_key, response)
                    self._json(response)
                    return
                try:
                    msg_id = enqueue_user_message(prompt, stage, prompt_bundle["context"])
                except Exception:
                    release_request(request_key)
                    raise
                remember_generation(signature, msg_id)
                response = {
                    "msg_id": msg_id,
                    "prompt": prompt,
                    "status": "queued",
                    "mode": prompt_bundle["mode"],
                    "budget": prompt_bundle["budget"],
                    "api_token_estimate": api_token_estimate,
                }
                if token_guard:
                    response["guard"] = token_guard
                remember_request(_generation_request_cache, request_key, response)
                self._json(response)
            else:
                release_request(request_key)
                self._json({"error": "unknown stage"})

        elif p.path == "/api/write":
            MAX_WRITE_LENGTH = 100000
            write_text = body.get("text")
            if not isinstance(write_text, str) or not write_text.strip():
                self._json({"success": False, "error": "text is required and must be non-empty"}, status=400)
                return
            if len(write_text) > MAX_WRITE_LENGTH:
                self._json({"success": False, "error": f"text exceeds maximum length of {MAX_WRITE_LENGTH} characters"}, status=400)
                return
            position = body.get("position", "end")
            if position not in ["start", "end", "cursor"]:
                self._json({"success": False, "error": "position must be 'start', 'end', or 'cursor'"}, status=400)
                return
            try:
                r = write_to_wps(write_text, position)
                self._json({"success": True})
            except Exception as e:
                self._json({"success": False, "error": str(e)}, status=500)

        else:
            self._json({"error":"unknown"}, status=404)

    def _json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _status(self):
        global _bridge_ready, _bridge_document_ready, _bridge_error
        if not bridge_is_ready():
            _bridge_document_ready = False
            start_bridge_background()
            return {"connected":False, "llm":check_llm(), "bridge":bridge_status_payload()}
        try:
            raw_docs = read_timeout(
                lambda: bridge.doc_list(),
                WPS_STATUS_TIMEOUT_SECONDS,
                on_timeout=reset_bridge_after_timeout,
            )
            if not raw_docs:
                _bridge_document_ready = False
                return {"connected":False, "llm":check_llm(), "bridge":bridge_status_payload()}
            docs = json.loads(raw_docs)
            _bridge_document_ready = bool(docs.get("success", False))
            info = docs.get("documents",[{}])[0] if docs.get("documents") else None
            return {"connected":docs.get("success",False), "document":info, "llm":check_llm(), "bridge":bridge_status_payload()}
        except Exception as e:
            _bridge_ready = False
            _bridge_document_ready = False
            _bridge_error = str(e)
            start_bridge_background()
            return {"connected":False, "llm":check_llm(), "bridge":bridge_status_payload()}

# ══════════════════════════════════════════════════════
def main():
    print("WPS Writing System v5 starting...", flush=True)
    start_bridge_background()
    print("Open http://127.0.0.1:5890/ in your browser", flush=True)
    ThreadingHTTPServer(("127.0.0.1",5890), APIHandler).serve_forever()

if __name__ == "__main__":
    main()
