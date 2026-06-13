"""
润色修改引导模块
"""
import yaml
from pathlib import Path
from config import TEMPLATES_DIR, NOVEL_GENRES


class EditingGuide:
    """润色修改引导器"""

    def __init__(self):
        template_path = TEMPLATES_DIR / "editing.yaml"
        with open(template_path, "r", encoding="utf-8") as f:
            self.template = yaml.safe_load(f)
        self.notes = []
        self.edits = []

    def get_questions(self) -> list:
        return self.template["questions"]

    def generate_check_prompt(self, question_id: str, content: str,
                               context: dict = None) -> str:
        """生成检查/润色提示词"""
        q = next((q for q in self.template["questions"] if q["id"] == question_id), None)
        if not q:
            return ""
        system = self.template["system_prompt"]
        ctx_text = self._build_context(context or {})

        prompt_text = q["text"].replace("{content}", content)

        return f"""{system}

{ctx_text}

{prompt_text}"""

    def generate_compile_prompt(self, context: dict = None) -> str:
        template = self.template["compile_prompt"]
        ctx = context or {}
        title = ctx.get("title", "未命名")

        editing_data = "\n\n".join(
            f"### {note.get('type', '')}: {note.get('chapter', '')}\n{note.get('content', '')}"
            for note in self.notes
        )

        return template.format(title=title, editing_data=editing_data)

    def add_note(self, note_type: str, chapter: str, content: str):
        self.notes.append({
            "type": note_type,
            "chapter": chapter,
            "content": content,
        })

    def _build_context(self, context: dict) -> str:
        lines = []
        if context.get("title"):
            lines.append(f"小说名称：《{context['title']}》")
        if context.get("genre"):
            gi = NOVEL_GENRES.get(context["genre"], {})
            lines.append(f"小说类型：{gi.get('name', context['genre'])}")
        return "\n".join(lines) if lines else ""

    def to_dict(self) -> dict:
        return {"notes": self.notes, "edits": self.edits}

    def from_dict(self, d: dict):
        self.notes = d.get("notes", [])
        self.edits = d.get("edits", [])
