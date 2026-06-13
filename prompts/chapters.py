"""
章节写作引导模块
"""
import yaml
from pathlib import Path
from config import TEMPLATES_DIR, NOVEL_GENRES, CHAPTER_TYPES


class ChapterGuide:
    """章节写作引导器"""

    def __init__(self):
        template_path = TEMPLATES_DIR / "chapters.yaml"
        with open(template_path, "r", encoding="utf-8") as f:
            self.template = yaml.safe_load(f)
        self.chapters = []

    def get_questions(self) -> list:
        return self.template["questions"]

    def get_chapter_types(self) -> list:
        return CHAPTER_TYPES

    def add_chapter(self, chapter_data: dict):
        """添加一个章节"""
        chapter_data.setdefault("index", len(self.chapters) + 1)
        self.chapters.append(chapter_data)

    def remove_chapter(self, index: int):
        if 0 <= index < len(self.chapters):
            self.chapters.pop(index)

    def generate_outline_prompt(self, question_id: str, chapter_info: dict) -> str:
        """生成章节大纲提示词"""
        q = next((q for q in self.template["questions"] if q["id"] == question_id), None)
        if not q:
            return ""
        system = self.template["system_prompt"]

        info_text = "\n".join(f"{k}: {v}" for k, v in chapter_info.items())

        return f"""{system}

{info_text}

{q['text']}"""

    def generate_single_chapter_prompt(self, chapter: dict, context: dict = None) -> str:
        """为单个章节生成写作提示词"""
        system = self.template["system_prompt"]
        ctx_text = self._build_context(context or {})

        chapter_text = self._format_chapter_info(chapter)

        return f"""{system}

{ctx_text}

请撰写以下章节：

{chapter_text}

写作要求：
- 字数控制在2000-4000字
- 开头要有吸引力，第一段就要让读者进入状态
- 结尾要有钩子或悬念
- 对话和动作描写兼顾
- 保持人物性格和世界设定的一致性
"""

    def generate_continue_prompt(self, prev_summary: str, direction: str,
                                  context: dict = None) -> str:
        """生成续写提示词"""
        system = self.template["system_prompt"]
        ctx_text = self._build_context(context or {})

        return f"""{system}

{ctx_text}

【前情提要】
{prev_summary}

【续写方向】
{direction}

请续写下一章内容。注意与前文保持连贯，人物性格、能力设定、世界观保持一致。
"""

    def generate_batch_outline_prompt(self, start_chapter: int, count: int = 10,
                                       context: dict = None) -> str:
        """批量生成章节大纲提示词"""
        system = self.template["system_prompt"]
        ctx_text = self._build_context(context or {})

        return f"""{system}

{ctx_text}

请为接下来的{count}章（第{start_chapter}章到第{start_chapter + count - 1}章）生成详细的章节大纲。

每章大纲包含：
1. 章节标题（要吸引人）
2. 一句话概括本章内容
3. 本章的核心冲突/看点
4. 主要出场角色
5. 章节结尾钩子
6. 情感走向（上升/下降/转折）

请确保每章之间有清晰的逻辑递进。
"""

    def generate_compile_prompt(self, context: dict = None) -> str:
        template = self.template["compile_prompt"]
        ctx = context or {}
        title = ctx.get("title", "未命名")
        genre = ctx.get("genre", "未设定")

        chapters_data = "\n\n".join(
            self._format_chapter_info(c) for c in self.chapters
        )

        return template.format(title=title, genre=genre, chapters_data=chapters_data)

    def _build_context(self, context: dict) -> str:
        lines = []
        if context.get("title"):
            lines.append(f"小说名称：《{context['title']}》")
        if context.get("genre"):
            gi = NOVEL_GENRES.get(context["genre"], {})
            lines.append(f"小说类型：{gi.get('name', context['genre'])}")
        if context.get("worldbuilding_summary"):
            lines.append(f"\n【世界观】\n{context['worldbuilding_summary'][:500]}")
        if context.get("characters_summary"):
            lines.append(f"\n【主要角色】\n{context['characters_summary'][:500]}")
        if context.get("plot_summary"):
            lines.append(f"\n【剧情大纲】\n{context['plot_summary'][:500]}")
        return "\n".join(lines) if lines else ""

    def _format_chapter_info(self, chapter: dict) -> str:
        lines = [f"第{chapter.get('index', '?')}章：{chapter.get('title', '未命名')}"]
        for k, v in chapter.items():
            if k not in ("index", "title", "content"):
                lines.append(f"  {k}: {v}")
        if chapter.get("content"):
            lines.append(f"\n  [正文]\n  {chapter['content'][:300]}...")
        return "\n".join(lines)

    def to_dict(self) -> dict:
        return {"chapters": self.chapters}

    def from_dict(self, d: dict):
        self.chapters = d.get("chapters", [])
