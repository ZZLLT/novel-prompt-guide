"""
剧情大纲引导模块
"""
import yaml
from pathlib import Path
from config import TEMPLATES_DIR, NOVEL_GENRES


class PlotGuide:
    """剧情大纲引导器"""

    def __init__(self):
        template_path = TEMPLATES_DIR / "plot.yaml"
        with open(template_path, "r", encoding="utf-8") as f:
            self.template = yaml.safe_load(f)
        self.data = {}

    def get_questions(self) -> list:
        return self.template["questions"]

    def collect_answer(self, question_id: str, answer: str):
        self.data[question_id] = answer

    def generate_single_prompt(self, question_id: str, context: dict = None) -> str:
        q = next((q for q in self.template["questions"] if q["id"] == question_id), None)
        if not q:
            return ""
        system = self.template["system_prompt"]
        ctx_text = self._build_context(context or {})

        return f"""{system}

{ctx_text}

{q['text']}"""

    def generate_full_prompt(self, context: dict = None) -> str:
        system = self.template["system_prompt"]
        ctx_text = self._build_context(context or {})

        sections = []
        for q in self.template["questions"]:
            sections.append(f"\n## {q['label']}\n{q['text']}")

        return f"""{system}

{ctx_text}

请逐一规划以下各部分。每部分回答完毕后用分隔线（---）分开。

{' '.join(sections)}
"""

    def generate_compile_prompt(self, context: dict = None) -> str:
        template = self.template["compile_prompt"]
        ctx = context or {}
        title = ctx.get("title", "未命名")
        genre = ctx.get("genre", "未设定")

        plot_data = self._format_plot_data()
        return template.format(title=title, genre=genre, plot_data=plot_data)

    def _build_context(self, context: dict) -> str:
        lines = []
        if context.get("title"):
            lines.append(f"小说名称：《{context['title']}》")
        if context.get("genre"):
            gi = NOVEL_GENRES.get(context["genre"], {})
            lines.append(f"小说类型：{gi.get('name', context['genre'])}")
        if context.get("worldbuilding_summary"):
            lines.append(f"\n【已有世界观概要】\n{context['worldbuilding_summary']}")
        if context.get("characters_summary"):
            lines.append(f"\n【已有角色概要】\n{context['characters_summary']}")
        if context.get("style"):
            lines.append(f"写作风格：{context['style']}")
        return "\n".join(lines) if lines else "（请基于已有的世界观和角色来规划剧情）"

    def _format_plot_data(self) -> str:
        parts = []
        for q in self.template["questions"]:
            val = self.data.get(q["id"], "")
            if val:
                parts.append(f"### {q['label']}\n{val}")
        return "\n\n".join(parts)

    def to_dict(self) -> dict:
        return self.data

    def from_dict(self, d: dict):
        self.data = d
