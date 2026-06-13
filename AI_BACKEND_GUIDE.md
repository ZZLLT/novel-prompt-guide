# 🤖 AI后端服务使用指南

## 📋 概述

AI后端服务为前端提供真实的AI功能，包括对话、生成、修改、分析等。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r server/requirements.txt
```

### 2. 配置API密钥

**方法1：环境变量（推荐）**
```bash
# Windows CMD
set OPENAI_API_KEY=your_api_key_here
set OPENAI_BASE_URL=https://api.openai.com/v1

# Windows PowerShell
$env:OPENAI_API_KEY="your_api_key_here"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"

# Linux/Mac
export OPENAI_API_KEY=your_api_key_here
export OPENAI_BASE_URL=https://api.openai.com/v1
```

**方法2：通过Web界面配置**
- 启动服务器后
- 访问前端 http://127.0.0.1:5890
- 点击"API设置"
- 填写API密钥和端点

### 3. 启动服务器

**Windows:**
```bash
start-server.bat
```

**手动启动:**
```bash
cd server
python main.py
```

服务器将在 http://127.0.0.1:8000 启动

---

## 📡 API端点

### 基础端点

#### GET /
根端点，返回服务信息

#### GET /api/health
健康检查

#### GET /api/test
测试AI功能

---

### LLM配置

#### GET /api/llm/config
获取当前LLM配置

**响应:**
```json
{
  "endpoint": "https://api.openai.com/v1",
  "model": "gpt-4o-mini",
  "model_routes": {
    "planner": "gpt-4o-mini",
    "writer": "gpt-4o-mini",
    "reviewer": "gpt-4o-mini",
    "assistant": "gpt-4o-mini"
  },
  "api_key_set": true,
  "api_enabled": true,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

#### POST /api/llm/config
保存LLM配置

**请求:**
```json
{
  "endpoint": "https://api.openai.com/v1",
  "model": "gpt-4o-mini",
  "api_key": "sk-...",
  "api_enabled": true,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

#### POST /api/llm/models/fetch
获取可用模型列表

---

### AI对话

#### POST /api/ai/chat
普通对话

**请求:**
```json
{
  "messages": [
    {"role": "user", "content": "创建一个冷酷的反派角色"}
  ],
  "context": {
    "workspace": "characters",
    "summary": {
      "characterCount": 3,
      "sceneCount": 5,
      "plotlineCount": 2,
      "totalWords": 12000
    }
  }
}
```

**响应:**
```json
{
  "response": "我来为你创建一个冷酷的反派角色..."
}
```

#### POST /api/ai/chat/stream
流式对话（SSE）

**响应格式:**
```
data: {"delta": "我"}
data: {"delta": "来"}
data: {"delta": "为"}
data: [DONE]
```

---

### AI生成

#### POST /api/ai/generate/character
生成角色

**请求:**
```json
{
  "prompt": "创建一个冷酷的反派角色，名字叫暗影，擅长暗杀"
}
```

**响应:**
```json
{
  "character": {
    "id": "char-12345",
    "name": "暗影",
    "role": "antagonist",
    "age": 35,
    "gender": "男",
    "appearance": "身材高大，总是穿着黑色斗篷...",
    "traits": ["冷酷", "狡诈", "自信"],
    "background": "出身于暗杀者家族...",
    "motivation": "获取至高无上的权力",
    "fear": "被背叛",
    "skills": ["暗杀", "隐身", "毒术"],
    "weaknesses": ["过于自信", "不信任任何人"],
    "relationships": [],
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
}
```

#### POST /api/ai/generate/scene
生成场景

**请求:**
```json
{
  "prompt": "主角第一次与反派正面交锋的场景",
  "context": {
    "characters": [
      {"id": "char-1", "name": "林风"},
      {"id": "char-2", "name": "暗影"}
    ],
    "plotlines": [
      {"id": "plot-1", "title": "复仇之路"}
    ]
  }
}
```

**响应:**
```json
{
  "scene": {
    "id": "scene-12345",
    "title": "黑夜对决",
    "type": "scene",
    "status": "draft",
    "summary": "林风终于找到了杀父仇人暗影...",
    "content": "月光如水，洒在破败的古庙之上...",
    "notes": "",
    "mood": "tense",
    "purpose": "confrontation",
    "wordCount": 1850,
    "characters": ["char-1", "char-2"],
    "locations": [],
    "plotlines": ["plot-1"],
    "order": 0,
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
}
```

#### POST /api/ai/generate/plotline
生成剧情线

**请求:**
```json
{
  "prompt": "主角的复仇剧情线"
}
```

**响应:**
```json
{
  "plotline": {
    "id": "plot-12345",
    "title": "复仇之路",
    "type": "main",
    "description": "主角为报父仇，踏上了漫长的复仇之路...",
    "status": "setup",
    "keyPoints": [
      {
        "title": "得知真相",
        "description": "主角发现父亲是被暗影所杀",
        "completed": false
      },
      {
        "title": "苦练武功",
        "description": "主角拜师学艺，提升实力",
        "completed": false
      },
      {
        "title": "初次交锋",
        "description": "主角与暗影第一次正面对决",
        "completed": false
      },
      {
        "title": "获得神器",
        "description": "主角得到可以克制暗影的神器",
        "completed": false
      },
      {
        "title": "终极对决",
        "description": "主角与暗影展开生死决战",
        "completed": false
      }
    ],
    "characters": [],
    "scenes": [],
    "progress": 0,
    "color": "#e74c3c",
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
}
```

---

### AI修改

#### POST /api/ai/modify/expand
扩写内容

**请求:**
```json
{
  "content": "林风走进房间，看到了师父。",
  "targetLength": 500,
  "context": {}
}
```

**响应:**
```json
{
  "result": "夜幕降临，林风踏着沉重的步伐，缓缓走进那间熟悉的房间。房间内弥漫着淡淡的檀香，烛光摇曳，在墙上投下斑驳的影子。他的目光越过层层暖黄的光晕，落在那个盘膝而坐的身影上——师父。..."
}
```

#### POST /api/ai/modify/rewrite
改写内容

**请求:**
```json
{
  "content": "林风很生气地说：我一定要报仇！",
  "instruction": "改得更有张力和情感",
  "context": {}
}
```

**响应:**
```json
{
  "result": "林风双拳紧握，指甲深深嵌入掌心。他的声音如同从胸腔深处挤出，每个字都带着刻骨的恨意：'我发誓，这血海深仇，必将十倍奉还！'"
}
```

#### POST /api/ai/modify/summarize
压缩内容

**请求:**
```json
{
  "content": "很长的一段文字...",
  "targetLength": 200
}
```

**响应:**
```json
{
  "result": "压缩后的内容..."
}
```

---

### AI分析

#### POST /api/ai/analyze/consistency
分析一致性

**请求:**
```json
{
  "entities": [
    {
      "type": "character",
      "id": "char-1",
      "name": "林风",
      "traits": ["勇敢", "冲动"]
    },
    {
      "type": "scene",
      "id": "scene-1",
      "title": "第一章",
      "content": "林风面对强敌，却表现得异常冷静..."
    }
  ]
}
```

**响应:**
```json
{
  "score": 75,
  "issues": [
    {
      "type": "character_inconsistency",
      "severity": "medium",
      "description": "角色'林风'被设定为'冲动'，但在场景'第一章'中表现得'异常冷静'，前后矛盾",
      "entities": ["char-1", "scene-1"]
    }
  ]
}
```

---

### AI命令

#### POST /api/ai/command
执行AI命令

**请求:**
```json
{
  "command": "创建一个名叫李明的主角",
  "context": {
    "workspace": "characters"
  }
}
```

**响应:**
```json
{
  "success": true,
  "message": "已创建角色：李明",
  "data": {
    "type": "character",
    "entity": { /* 角色数据 */ }
  }
}
```

---

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENAI_API_KEY` | OpenAI API密钥 | 无 |
| `OPENAI_BASE_URL` | API端点地址 | `https://api.openai.com/v1` |

### 支持的模型

**OpenAI:**
- gpt-4o
- gpt-4o-mini (推荐，性价比高)
- gpt-4-turbo
- gpt-3.5-turbo

**兼容API:**
- DeepSeek (deepseek-chat, deepseek-coder)
- 本地模型 (通过OpenAI兼容接口)

---

## 🐛 故障排除

### 问题1：启动失败
```
错误：ModuleNotFoundError: No module named 'fastapi'
解决：pip install -r server/requirements.txt
```

### 问题2：AI功能不可用
```
错误：API key not configured
解决：设置OPENAI_API_KEY环境变量或通过Web界面配置
```

### 问题3：连接超时
```
错误：Connection timeout
解决：
1. 检查网络连接
2. 如果在国内，可能需要代理
3. 可以使用国内兼容API（如DeepSeek）
```

### 问题4：CORS错误
```
错误：Access to fetch blocked by CORS policy
解决：确保前端运行在 http://127.0.0.1:5890
```

---

## 📊 性能优化

### 1. 使用流式响应
对话时使用 `/api/ai/chat/stream` 而不是 `/api/ai/chat`，获得更好的用户体验。

### 2. 调整模型参数
- `temperature`: 0.5-0.7 (创意性) vs 0.3-0.5 (准确性)
- `max_tokens`: 根据需求调整，避免浪费

### 3. 批量处理
生成多个内容时，可以并行请求提高效率。

---

## 🔐 安全建议

1. **不要提交API密钥到Git**
   - 已添加到 .gitignore
   - 使用环境变量

2. **生产环境使用HTTPS**
   - 当前为开发环境HTTP
   - 部署时配置SSL证书

3. **限制CORS来源**
   - 当前允许localhost
   - 生产环境限制具体域名

---

## 📖 API文档

启动服务器后，访问：
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

---

## 🎯 下一步

1. ✅ 后端已完成，可以测试
2. 前端已集成，可以直接使用
3. 建议：先用小模型测试（gpt-4o-mini）
4. 体验完整的AI创作流程

---

**创建时间：** 2026-06-13  
**版本：** 1.0.0  
**状态：** ✅ 可用
