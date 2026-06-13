"""
Novel Prompt Guide - 后端服务器
FastAPI + AI集成
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os

from ai_routes import router as ai_router
from ai_service import init_ai_client

# 创建FastAPI应用
app = FastAPI(
    title="Novel Prompt Guide API",
    description="网文创作助手 - AI接管系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5890", "http://localhost:5890"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册AI路由
app.include_router(ai_router)

# ===== 配置模型 =====

class LlmConfigInput(BaseModel):
    endpoint: str
    model: str
    model_routes: Optional[Dict[str, str]] = None
    api_key: Optional[str] = None
    api_enabled: bool = False
    clear_api_key: bool = False
    temperature: float = 0.3
    max_tokens: int = 4096

class LlmConfigOutput(BaseModel):
    endpoint: str
    model: str
    model_routes: Dict[str, str]
    api_key_set: bool
    api_enabled: bool
    temperature: float
    max_tokens: int

# 全局配置存储
_config: Dict[str, Any] = {
    "endpoint": "https://api.openai.com/v1",
    "model": "gpt-4o-mini",
    "model_routes": {
        "planner": "gpt-4o-mini",
        "writer": "gpt-4o-mini",
        "reviewer": "gpt-4o-mini",
        "assistant": "gpt-4o-mini"
    },
    "api_key": os.getenv("OPENAI_API_KEY"),
    "api_enabled": bool(os.getenv("OPENAI_API_KEY")),
    "temperature": 0.3,
    "max_tokens": 4096
}

# ===== 启动事件 =====

@app.on_event("startup")
async def startup_event():
    """启动时初始化AI客户端"""
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

    if api_key:
        try:
            init_ai_client(api_key, base_url)
            print(f"✅ AI客户端已初始化")
            print(f"   Base URL: {base_url}")
            print(f"   Model: {_config['model']}")
        except Exception as e:
            print(f"⚠️ AI客户端初始化失败: {e}")
    else:
        print("⚠️ 未设置OPENAI_API_KEY环境变量，AI功能将不可用")
        print("   请设置环境变量或通过API配置界面设置")

# ===== 基础端点 =====

@app.get("/")
async def root():
    """根端点"""
    return {
        "message": "Novel Prompt Guide API",
        "version": "1.0.0",
        "ai_enabled": bool(_config.get("api_key"))
    }

@app.get("/api/health")
async def health():
    """健康检查"""
    return {
        "status": "healthy",
        "ai_enabled": bool(_config.get("api_key"))
    }

# ===== LLM配置端点 =====

@app.get("/api/llm/config")
async def get_llm_config() -> LlmConfigOutput:
    """获取LLM配置"""
    return LlmConfigOutput(
        endpoint=_config["endpoint"],
        model=_config["model"],
        model_routes=_config["model_routes"],
        api_key_set=bool(_config.get("api_key")),
        api_enabled=_config["api_enabled"],
        temperature=_config["temperature"],
        max_tokens=_config["max_tokens"]
    )

@app.post("/api/llm/config")
async def save_llm_config(config: LlmConfigInput) -> LlmConfigOutput:
    """保存LLM配置"""
    # 更新配置
    _config["endpoint"] = config.endpoint
    _config["model"] = config.model
    _config["model_routes"] = config.model_routes or _config["model_routes"]
    _config["temperature"] = config.temperature
    _config["max_tokens"] = config.max_tokens
    _config["api_enabled"] = config.api_enabled

    # 更新API密钥
    if config.clear_api_key:
        _config["api_key"] = None
    elif config.api_key:
        _config["api_key"] = config.api_key

    # 重新初始化AI客户端
    if _config.get("api_key"):
        try:
            init_ai_client(_config["api_key"], _config["endpoint"])
            print("✅ AI客户端已重新初始化")
        except Exception as e:
            print(f"⚠️ AI客户端初始化失败: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize AI client: {str(e)}")

    return LlmConfigOutput(
        endpoint=_config["endpoint"],
        model=_config["model"],
        model_routes=_config["model_routes"],
        api_key_set=bool(_config.get("api_key")),
        api_enabled=_config["api_enabled"],
        temperature=_config["temperature"],
        max_tokens=_config["max_tokens"]
    )

@app.post("/api/llm/models/fetch")
async def fetch_llm_models(request: Dict[str, Optional[str]]):
    """获取可用模型列表"""
    # 这里简化处理，返回常用模型
    # 实际应该调用API获取
    models = [
        {"id": "gpt-4o"},
        {"id": "gpt-4o-mini"},
        {"id": "gpt-4-turbo"},
        {"id": "gpt-3.5-turbo"},
    ]

    # 如果是自定义endpoint，可能有不同的模型
    endpoint = request.get("endpoint", "")
    if "deepseek" in endpoint:
        models = [
            {"id": "deepseek-chat"},
            {"id": "deepseek-coder"},
        ]
    elif "localhost" in endpoint or "127.0.0.1" in endpoint:
        models = [
            {"id": "local-model"},
        ]

    return {"models": models, "error": None}

# ===== 测试端点 =====

@app.get("/api/test")
async def test_ai():
    """测试AI功能"""
    if not _config.get("api_key"):
        raise HTTPException(status_code=400, detail="API key not configured")

    try:
        from ai_service import chat
        response = await chat(
            [{"role": "user", "content": "你好，请用一句话介绍你自己"}],
            {"workspace": "test"}
        )
        return {"success": True, "response": response}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("🚀 启动 Novel Prompt Guide API 服务器...")
    print("📝 文档地址: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)
