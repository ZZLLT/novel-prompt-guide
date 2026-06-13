"""
网文AI写作引导程序 - 全局配置
"""
import os
import json
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent
OUTPUT_DIR = ROOT_DIR / "output"
SESSION_DIR = OUTPUT_DIR / "sessions"
TEMPLATES_DIR = ROOT_DIR / "templates"

# 确保目录存在
for d in [OUTPUT_DIR, SESSION_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# 网文类型定义
NOVEL_GENRES = {
    "xh":    {"name": "玄幻", "desc": "东方幻想世界，修炼、宗门、秘境", "tags": ["修炼", "宗门", "秘境", "上古"]},
    "ds":    {"name": "都市", "desc": "现代都市背景，职场、异能、重生", "tags": ["职场", "异能", "重生", "逆袭"]},
    "kh":    {"name": "科幻", "desc": "未来科技、星际文明、人工智能", "tags": ["星际", "AI", "基因", "末世"]},
    "ls":    {"name": "历史", "desc": "历史架空或真实朝代背景", "tags": ["穿越", "权谋", "争霸", "科举"]},
    "xy":    {"name": "悬疑", "desc": "推理、恐怖、惊悚、探案", "tags": ["推理", "恐怖", "探案", "反转"]},
    "yq":    {"name": "言情", "desc": "情感主线驱动的故事", "tags": ["甜宠", "虐恋", "先婚后爱", "追妻"]},
    "wxl":   {"name": "无限流", "desc": "副本轮回、任务系统、多元世界", "tags": ["副本", "轮回", "任务", "进化"]},
    "yx":    {"name": "游戏", "desc": "网游、电竞、虚拟现实", "tags": ["网游", "电竞", "VR", "公会"]},
    "wx":    {"name": "武侠", "desc": "传统武侠、江湖恩怨", "tags": ["江湖", "门派", "秘籍", "侠义"]},
    "xh2":   {"name": "仙侠", "desc": "修仙问道、飞升渡劫", "tags": ["修仙", "渡劫", "飞升", "法宝"]},
    "ly":    {"name": "灵异", "desc": "鬼怪、道士、阴阳眼", "tags": ["鬼怪", "道士", "阴阳", "禁忌"]},
    "qt":    {"name": "其他", "desc": "不在以上分类中", "tags": []},
}

# 主角人设维度
CHARACTER_DIMENSIONS = [
    {
        "id": "identity",
        "label": "身份背景",
        "questions": [
            "主角的出身是什么？（平民/世家/孤儿/穿越者/重生者）",
            "主角当前的社会地位如何？",
            "有什么不为人知的秘密身份？"
        ]
    },
    {
        "id": "personality",
        "label": "性格特质",
        "questions": [
            "主角的核心性格是什么？（冷静/热血/腹黑/善良/冷酷）",
            "主角有什么性格缺陷或心理阴影？",
            "主角的行事准则和底线是什么？"
        ]
    },
    {
        "id": "ability",
        "label": "能力体系",
        "questions": [
            "主角的核心能力/金手指是什么？",
            "这个能力有什么限制或代价？",
            "能力的成长路径是怎样的？"
        ]
    },
    {
        "id": "goal",
        "label": "目标动机",
        "questions": [
            "主角的终极目标是什么？",
            "是什么驱动主角不断前进？",
            "目标是否会随着剧情发展而改变？"
        ]
    },
    {
        "id": "relationship",
        "label": "人际关系",
        "questions": [
            "主角有哪些重要的人际关系？",
            "有没有命中注定的对手？",
            "感情线如何安排？"
        ]
    }
]

# 章节类型
CHAPTER_TYPES = [
    {"id": "daily",   "name": "日常章节", "desc": "推进日常剧情、角色互动、世界观展示"},
    {"id": "battle",  "name": "战斗章节", "desc": "战斗场景、能力展示、危机处理"},
    {"id": "climax",  "name": "高潮章节", "desc": "剧情转折、关键揭示、情感爆发"},
    {"id": "setup",   "name": "铺垫章节", "desc": "埋设伏笔、悬念设置、前因后果"},
    {"id": "trans",   "name": "过渡章节", "desc": "场景切换、时间跳跃、信息整理"},
]

# 写作风格
WRITING_STYLES = [
    {"id": "fast",      "name": "爽文快节奏", "desc": "节奏快、爽点密集、章章有钩子"},
    {"id": "slow",      "name": "慢热铺陈",   "desc": "细节丰富、伏笔深远、稳步推进"},
    {"id": "balanced",  "name": "张弛有度",   "desc": "快慢结合、高潮与日常交替"},
    {"id": "literary",  "name": "偏文艺",     "desc": "语言优美、意境深远、重氛围"},
    {"id": "hardcore",  "name": "硬核设定",   "desc": "逻辑严密、设定考究、系统完备"},
]

# WPS配置
WPS_CONFIG = {
    "default_font_name": "等线",
    "default_font_size": 12,
    "title_font_name": "黑体",
    "title_font_size": 22,
    "heading_font_name": "黑体",
    "heading1_font_size": 18,
    "heading2_font_size": 15,
    "body_font_name": "等线",
    "body_font_size": 12,
    "page_margin_top": 2.54,
    "page_margin_bottom": 2.54,
    "page_margin_left": 3.18,
    "page_margin_right": 3.18,
}


def save_session(session_id: str, data: dict) -> str:
    """保存会话"""
    path = SESSION_DIR / f"{session_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return str(path)


def load_session(session_id: str) -> dict | None:
    """加载会话"""
    path = SESSION_DIR / f"{session_id}.json"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_sessions() -> list:
    """列出所有会话"""
    sessions = []
    for f in sorted(SESSION_DIR.glob("*.json"), key=os.path.getmtime, reverse=True):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            sessions.append({
                "id": f.stem,
                "title": data.get("title", "未命名"),
                "genre": data.get("genre", "未设定"),
                "stage": data.get("stage", "new"),
                "updated": data.get("updated_at", "未知"),
            })
        except Exception:
            continue
    return sessions
