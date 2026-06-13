"""
WPS集成适配器
负责将生成的文档内容输出为WPS可编辑的格式，
以及生成WPS操作的指令序列
"""
import json
import os
from pathlib import Path
from datetime import datetime
from config import WPS_CONFIG, OUTPUT_DIR


class WPSAdapter:
    """WPS文档适配器"""

    def __init__(self):
        self.documents = {}

    def create_novel_document(self, title: str, genre: str,
                               content_parts: dict) -> dict:
        """
        生成网文文档结构
        content_parts: {
            "worldbuilding": str,
            "characters": str,
            "plot": str,
            "chapters": list[str],
        }
        返回文档结构描述
        """
        doc = {
            "title": title,
            "genre": genre,
            "created_at": datetime.now().isoformat(),
            "config": WPS_CONFIG,
            "sections": [],
        }

        # 封面
        doc["sections"].append({
            "type": "cover",
            "title": f"《{title}》",
            "subtitle": f"类型：{genre}",
            "info": f"由AI写作引导程序生成\n{datetime.now().strftime('%Y年%m月%d日')}",
        })

        # 目录占位
        doc["sections"].append({
            "type": "toc",
            "title": "目录",
        })

        # 世界观设定
        if content_parts.get("worldbuilding"):
            doc["sections"].append({
                "type": "chapter",
                "heading_level": 1,
                "title": "第一部分：世界观设定",
                "content": content_parts["worldbuilding"],
            })

        # 人物设定
        if content_parts.get("characters"):
            doc["sections"].append({
                "type": "chapter",
                "heading_level": 1,
                "title": "第二部分：人物设定",
                "content": content_parts["characters"],
            })

        # 剧情大纲
        if content_parts.get("plot"):
            doc["sections"].append({
                "type": "chapter",
                "heading_level": 1,
                "title": "第三部分：剧情大纲",
                "content": content_parts["plot"],
            })

        # 章节正文
        if content_parts.get("chapters"):
            doc["sections"].append({
                "type": "chapter",
                "heading_level": 1,
                "title": "第四部分：正文",
                "content": "",
            })
            for i, ch in enumerate(content_parts["chapters"]):
                doc["sections"].append({
                    "type": "chapter",
                    "heading_level": 2,
                    "title": f"第{i+1}章",
                    "content": ch if isinstance(ch, str) else ch.get("content", ""),
                })

        self.documents[title] = doc
        return doc

    def export_to_markdown(self, doc: dict, output_path: str = None) -> str:
        """导出为Markdown格式（方便导入WPS）"""
        if not output_path:
            output_path = OUTPUT_DIR / f"{doc['title']}_设定集.md"

        lines = []
        lines.append(f"# 《{doc['title']}》")
        lines.append(f"> 类型：{doc['genre']}")
        lines.append(f"> 生成时间：{doc['created_at']}")
        lines.append("")

        for section in doc["sections"]:
            if section["type"] == "cover":
                continue
            elif section["type"] == "toc":
                lines.append("## 目录")
                lines.append("（在WPS中可通过「引用→目录」自动生成）")
                lines.append("")
            elif section["type"] == "chapter":
                prefix = "#" * section.get("heading_level", 1)
                lines.append(f"{prefix} {section['title']}")
                lines.append("")
                if section.get("content"):
                    lines.append(section["content"])
                    lines.append("")

        content = "\n".join(lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return str(output_path)

    def export_to_text(self, doc: dict, output_path: str = None) -> str:
        """导出为纯文本（可直接粘贴到WPS）"""
        if not output_path:
            output_path = OUTPUT_DIR / f"{doc['title']}_纯文本.txt"

        lines = []
        lines.append(f"《{doc['title']}》")
        lines.append(f"类型：{doc['genre']}")
        lines.append("=" * 50)
        lines.append("")

        for section in doc["sections"]:
            if section["type"] in ("cover", "toc"):
                continue
            lines.append(section["title"])
            lines.append("-" * 30)
            if section.get("content"):
                lines.append(section["content"])
                lines.append("")

        content = "\n".join(lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return str(output_path)

    def build_wps_build_instructions(self, doc: dict) -> dict:
        """
        生成WPS MCP可用的文档构建指令
        返回一个结构化的指令列表，供MCP wps-agent批量执行
        """
        instructions = {
            "document_title": doc["title"],
            "config": doc["config"],
            "steps": [],
        }

        for section in doc["sections"]:
            if section["type"] == "cover":
                instructions["steps"].append({
                    "action": "create_cover",
                    "title": section["title"],
                    "subtitle": section.get("subtitle", ""),
                })
            elif section["type"] == "toc":
                instructions["steps"].append({
                    "action": "insert_toc",
                })
            elif section["type"] == "chapter":
                instructions["steps"].append({
                    "action": "insert_heading_and_text",
                    "level": section.get("heading_level", 1),
                    "title": section["title"],
                    "content": section.get("content", ""),
                })

        return instructions

    def save_instructions(self, instructions: dict, output_path: str = None) -> str:
        """保存WPS构建指令为JSON"""
        if not output_path:
            output_path = OUTPUT_DIR / f"{instructions['document_title']}_WPS指令.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(instructions, f, ensure_ascii=False, indent=2)
        return str(output_path)

    def generate_prompt_library(self, session_data: dict) -> str:
        """
        生成完整的提示词库文件
        将整个写作会话中所有生成的提示词导出为一个文件
        """
        output_path = OUTPUT_DIR / f"{session_data.get('title', '作品')}_提示词库.md"

        lines = [
            f"# {session_data.get('title', '作品')} 提示词库",
            f"> 此文件包含本作品所有阶段使用的AI提示词",
            f"> 可以直接复制给AI使用",
            "",
            "---",
            "",
        ]

        # 世界观提示词
        if session_data.get("worldbuilding"):
            lines.append("## 世界观构建提示词")
            lines.append("")
            lines.append("```")
            lines.append(session_data["worldbuilding"].get("full_prompt", ""))
            lines.append("```")
            lines.append("")

        # 人物设计提示词
        if session_data.get("characters"):
            lines.append("## 人物设计提示词")
            lines.append("")
            lines.append("```")
            lines.append(session_data["characters"].get("full_prompt", ""))
            lines.append("```")
            lines.append("")

        # 各章节提示词
        if session_data.get("chapters_prompts"):
            for i, cp in enumerate(session_data["chapters_prompts"]):
                lines.append(f"## 第{i+1}章写作提示词")
                lines.append("")
                lines.append("```")
                lines.append(cp)
                lines.append("```")
                lines.append("")

        content = "\n".join(lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return str(output_path)


# 便捷函数：用于直接输出给MCP工具的文档构建指令
def prepare_wps_document(title: str, genre: str, sections: list[dict]) -> dict:
    """
    快速准备WPS文档结构
    sections: [{"heading": "标题", "level": 1, "content": "内容"}, ...]
    """
    adapter = WPSAdapter()
    doc = {
        "title": title,
        "genre": genre,
        "created_at": datetime.now().isoformat(),
        "config": WPS_CONFIG,
        "sections": [],
    }
    for s in sections:
        doc["sections"].append({
            "type": "chapter",
            "heading_level": s.get("level", 1),
            "title": s["heading"],
            "content": s.get("content", ""),
        })
    return adapter.build_wps_build_instructions(doc)
