"""
会话管理：创建、保存、加载写作项目
"""
import json
import uuid
from datetime import datetime
from config import save_session, load_session, list_sessions


class NovelSession:
    """网文写作会话"""

    def __init__(self, session_id: str = None):
        if session_id:
            data = load_session(session_id)
            if data:
                self._load_from_dict(data)
                return
        # 新会话
        self.session_id = str(uuid.uuid4())[:8]
        self.title = "未命名作品"
        self.genre = ""
        self.style = ""
        self.stage = "new"
        self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at
        # 各阶段数据
        self.worldbuilding = {}
        self.characters = []
        self.plot = {}
        self.chapters = []
        self.editing_notes = []

    def _load_from_dict(self, data: dict):
        self.session_id = data.get("session_id", "")
        self.title = data.get("title", "未命名作品")
        self.genre = data.get("genre", "")
        self.style = data.get("style", "")
        self.stage = data.get("stage", "new")
        self.created_at = data.get("created_at", "")
        self.updated_at = data.get("updated_at", "")
        self.worldbuilding = data.get("worldbuilding", {})
        self.characters = data.get("characters", [])
        self.plot = data.get("plot", {})
        self.chapters = data.get("chapters", [])
        self.editing_notes = data.get("editing_notes", [])

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "title": self.title,
            "genre": self.genre,
            "style": self.style,
            "stage": self.stage,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "worldbuilding": self.worldbuilding,
            "characters": self.characters,
            "plot": self.plot,
            "chapters": self.chapters,
            "editing_notes": self.editing_notes,
        }

    def save(self):
        self.updated_at = datetime.now().isoformat()
        save_session(self.session_id, self.to_dict())

    def set_stage(self, stage: str):
        self.stage = stage
        self.save()

    def summary(self) -> str:
        lines = [
            f"📖 《{self.title}》",
            f"   类型: {self.genre or '未设定'}",
            f"   风格: {self.style or '未设定'}",
            f"   阶段: {self._stage_label()}",
            f"   人物: {len(self.characters)} 个",
            f"   章节: {len(self.chapters)} 章",
            f"   ID: {self.session_id}",
        ]
        return "\n".join(lines)

    def _stage_label(self) -> str:
        labels = {
            "new": "🔰 新建",
            "worldbuilding": "🌍 世界观构建",
            "characters": "👤 人物设计",
            "plot": "📋 剧情大纲",
            "chapters": "✍️ 章节写作",
            "editing": "🔧 润色修改",
            "done": "✅ 完成",
        }
        return labels.get(self.stage, self.stage)
