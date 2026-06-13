"""
世界观构建引导模块
引导用户逐步构建网文世界观，生成结构化提示词
"""
import yaml
from pathlib import Path
from config import TEMPLATES_DIR, NOVEL_GENRES


class WorldbuildingGuide:
    """世界观构建引导器"""

    def __init__(self):
        template_path = TEMPLATES_DIR / "worldbuilding.yaml"
        with open(template_path, "r", encoding="utf-8") as f:
            self.template = yaml.safe_load(f)
        self.data = {}

    def get_genre_options(self) -> list:
        """获取类型选项列表"""
        return [(k, v["name"], v["desc"]) for k, v in NOVEL_GENRES.items()]

    def get_questions(self) -> list:
        """获取引导问题列表"""
        return self.template["questions"]

    def collect_answer(self, question_id: str, answer: str):
        """收集用户回答"""
        self.data[question_id] = answer

    def generate_single_prompt(self, question_id: str) -> str:
        """为单个维度生成AI提示词"""
        q = next((q for q in self.template["questions"] if q["id"] == question_id), None)
        if not q:
            return ""
        system = self.template["system_prompt"]
        genre_info = NOVEL_GENRES.get(self.data.get("genre", ""), {})
        genre_name = genre_info.get("name", "未知类型")

        prompt = f"""{system}

当前小说类型：{genre_name}
已有设定：
{self._format_existing_data()}

{q['text']}"""
        return prompt

    def generate_compile_prompt(self) -> str:
        """生成整合全部世界观设定的提示词"""
        template = self.template["compile_prompt"]
        world_data = self._format_world_data()
        genre_info = NOVEL_GENRES.get(self.data.get("genre", ""), {})
        title = self.data.get("title", "未命名")

        return template.format(
            title=title,
            genre=genre_info.get("name", "未设定"),
            world_data=world_data
        )

    def generate_full_prompt(self) -> str:
        """一次性生成所有世界观构建的提示词（一次性发给AI）"""
        system = self.template["system_prompt"]
        genre_info = NOVEL_GENRES.get(self.data.get("genre", ""), {})
        genre_name = genre_info.get("name", "未知类型")

        sections = []
        for q in self.template["questions"]:
            sections.append(f"\n## {q['label']}\n{q['text']}")

        full_prompt = f"""{system}

小说类型：{genre_name}
小说名称：《{self.data.get('title', '未命名')}》

请逐一回答以下各部分的问题，构建完整的世界观。每部分回答完毕后用分隔线分开。

{' '.join(sections)}
"""
        return full_prompt

    def _format_existing_data(self) -> str:
        """格式化已有设定数据"""
        if not self.data:
            return "（尚无设定，这是第一步）"
        lines = []
        for q in self.template["questions"]:
            val = self.data.get(q["id"], "")
            if val:
                lines.append(f"【{q['label']}】{val[:200]}...")
            else:
                lines.append(f"【{q['label']}】（待设定）")
        return "\n".join(lines)

    def _format_world_data(self) -> str:
        """格式化全部世界观数据"""
        parts = []
        for q in self.template["questions"]:
            val = self.data.get(q["id"], "")
            if val:
                parts.append(f"### {q['label']}\n{val}")
        return "\n\n".join(parts)

    def to_dict(self) -> dict:
        return self.data

    def from_dict(self, data: dict):
        self.data = data
