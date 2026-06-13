"""
AI路由 - 处理所有AI相关的API请求
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

import ai_service
from command_parser import parser, executor

router = APIRouter(prefix="/api/ai", tags=["ai"])

# ===== 请求模型 =====

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Dict[str, Any]

class GenerateCharacterRequest(BaseModel):
    prompt: str

class GenerateSceneRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None

class GeneratePlotlineRequest(BaseModel):
    prompt: str

class ExpandContentRequest(BaseModel):
    content: str
    targetLength: int
    context: Optional[Dict[str, Any]] = None

class RewriteContentRequest(BaseModel):
    content: str
    instruction: str
    context: Optional[Dict[str, Any]] = None

class SummarizeContentRequest(BaseModel):
    content: str
    targetLength: int

class AnalyzeConsistencyRequest(BaseModel):
    entities: List[Dict[str, Any]]

class CommandRequest(BaseModel):
    command: str
    context: Dict[str, Any]

# ===== 对话端点 =====

@router.post("/chat")
async def ai_chat(request: ChatRequest):
    """普通对话"""
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        response = await ai_service.chat(messages, request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def ai_chat_stream(request: ChatRequest):
    """流式对话"""
    async def generate():
        try:
            messages = [{"role": m.role, "content": m.content} for m in request.messages]
            async for chunk in ai_service.chat_stream(messages, request.context):
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

# ===== 生成端点 =====

@router.post("/generate/character")
async def ai_generate_character(request: GenerateCharacterRequest):
    """生成角色"""
    try:
        character = await ai_service.generate_character(request.prompt)
        return {"character": character}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/scene")
async def ai_generate_scene(request: GenerateSceneRequest):
    """生成场景"""
    try:
        scene = await ai_service.generate_scene(request.prompt, request.context)
        return {"scene": scene}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/plotline")
async def ai_generate_plotline(request: GeneratePlotlineRequest):
    """生成剧情线"""
    try:
        plotline = await ai_service.generate_plotline(request.prompt)
        return {"plotline": plotline}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== 修改端点 =====

@router.post("/modify/expand")
async def ai_expand_content(request: ExpandContentRequest):
    """扩写内容"""
    try:
        result = await ai_service.expand_content(request.content, request.targetLength, request.context)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/modify/rewrite")
async def ai_rewrite_content(request: RewriteContentRequest):
    """改写内容"""
    try:
        result = await ai_service.rewrite_content(request.content, request.instruction, request.context)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/modify/summarize")
async def ai_summarize_content(request: SummarizeContentRequest):
    """压缩内容"""
    try:
        result = await ai_service.summarize_content(request.content, request.targetLength)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== 分析端点 =====

@router.post("/analyze/consistency")
async def ai_analyze_consistency(request: AnalyzeConsistencyRequest):
    """分析一致性"""
    try:
        result = await ai_service.analyze_consistency(request.entities)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== 命令端点 =====

@router.post("/command")
async def ai_command(request: CommandRequest):
    """执行AI智能命令"""
    try:
        # 1. 解析命令
        action, params, original_command = parser.parse(request.command)

        # 2. 如果识别出命令，执行
        if action:
            result = await executor.execute(action, params, request.context, ai_service)
            return result

        # 3. 未识别的命令，作为普通对话处理
        messages = [{"role": "user", "content": original_command}]
        response = await ai_service.chat(messages, request.context)
        return {
            "success": True,
            "message": response,
            "data": {"type": "text", "content": response},
            "action_type": "chat"
        }
    except Exception as e:
        return {
            "success": False,
            "message": "命令执行失败",
            "error": str(e),
            "action_type": "error"
        }
