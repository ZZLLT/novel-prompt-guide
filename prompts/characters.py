"""
人物设计引导模块
"""
import yaml
from pathlib import Path
from config import TEMPLATES_DIR, NOVEL_GENRES


class CharacterGuide:
    """人物设计引导器"""

    def __init__(self):
        template_path = TEMPLATES_DIR / "characters.yaml"
        with open(template_path, "r", encoding="utf-8") as f:
            self.template = yaml.safe_load(f)
        self.data = {}
        self.characters_list = []

    def get_questions(self) -> list:
        return self.template["questions"]

    def collect_answer(self, question_id: str, answer: str):
        self.data[question_id] = answer

    def add_character(self, char_data: dict):
        """添加一个完整的角色数据"""
        self.characters_list.append(char_data)

    def generate_single_prompt(self, question_id: str, context: dict = None) -> str:
        """为单个角色维度生成提示词"""
        q = next((q for q in self.template["questions"] if q["id"] == question_id), None)
        if not q:
            return ""

        system = self.template["system_prompt"]
        context_text = self._build_context(context or {})

        return f"""{system}

{context_text}

{q['text']}"""

    def generate_full_prompt(self, context: dict = None) -> str:
        """一次性生成所有人物设计的提示词"""
        system = self.template["system_prompt"]
        context_text = self._build_context(context or {})

        sections = []
        for q in self.template["questions"]:
            sections.append(f"\n## {q['label']}\n{q['text']}")

        return f"""{system}

{context_text}

请逐一设计以下角色。每个人物设计完毕后用分隔线（---）分开。

{' '.join(sections)}
"""

    def generate_compile_prompt(self, context: dict = None) -> str:
        """生成人物设定整合提示词"""
        template = self.template["compile_prompt"]
        ctx = context or {}
        title = ctx.get("title", "未命名")
        genre = ctx.get("genre", "未设定")

        char_data = "\n\n".join(
            f"### {c.get('name', '未知角色')}\n{c.get('raw_data', '')}"
            for c in self.characters_list
        ) if self.characters_list else self._format_char_data()

        return template.format(title=title, genre=genre, char_data=char_data)

    def _build_context(self, context: dict) -> str:
        """构建上下文信息"""
        lines = []
        if context.get("title"):
            lines.append(f"小说名称：《{context['title']}》")
        if context.get("genre"):
            gi = NOVEL_GENRES.get(context["genre"], {})
            lines.append(f"小说类型：{gi.get('name', context['genre'])}")
        if context.get("worldbuilding_summary"):
            lines.append(f"世界观概要：\n{context['worldbuilding_summary']}")
        if context.get("style"):
            lines.append(f"写作风格：{context['style']}")
        return "\n".join(lines) if lines else "（无额外上下文）"

    def _format_char_data(self) -> str:
        parts = []
        for q in self.template["questions"]:
            val = self.data.get(q["id"], "")
            if val:
                parts.append(f"### {q['label']}\n{val}")
        return "\n\n".join(parts)

    def to_dict(self) -> dict:
        return {
            "data": self.data,
            "characters_list": self.characters_list,
        }

    def from_dict(self, d: dict):
        self.data = d.get("data", {})
        self.characters_list = d.get("characters_list", [])
