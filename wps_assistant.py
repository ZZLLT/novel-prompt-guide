# -*- coding: utf-8 -*-
"""
WPS 网文写作实时交互系统
- 读取用户在 WPS 中填写的内容
- 分析写作进度和需求
- 生成 AI 提示词
- 将结果写回 WPS 文档
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from wps_mcp_bridge import WPSMCPBridge


class WPSWritingAssistant:
    """WPS 网文写作助手"""

    def __init__(self):
        self.bridge = WPSMCPBridge()
        self.doc_index = 1  # WPS MCP 文档索引从 1 开始

    def connect(self):
        """启动并连接"""
        self.bridge.start()
        # 检查文档
        docs_raw = self.bridge.doc_list()
        docs = json.loads(docs_raw) if isinstance(docs_raw, str) else docs_raw
        if docs.get("success"):
            doc_list = docs.get("documents", [])
            if doc_list:
                self.doc_index = doc_list[0].get("index", 1)
                return {
                    "connected": True,
                    "document": doc_list[0],
                    "tables": doc_list[0].get("table_count", 0),
                }
        return {"connected": False, "error": "No document open in WPS"}

    # ═══════════════════════════════════════════
    # 文档读取
    # ═══════════════════════════════════════════

    def get_full_text(self) -> str:
        """获取文档全文"""
        return self.bridge.read_full_text(self.doc_index)

    def get_structure(self) -> dict:
        """获取文档结构"""
        raw = self.bridge.read_structure(self.doc_index)
        try:
            return json.loads(raw) if isinstance(raw, str) else raw
        except:
            return {"raw": str(raw)[:500]}

    def get_semantic_structure(self) -> dict:
        """获取语义结构（识别章节、人物、设定等）"""
        raw = self.bridge.read_semantic(self.doc_index)
        try:
            return json.loads(raw) if isinstance(raw, str) else raw
        except:
            return {"raw": str(raw)[:500]}

    def get_paragraphs(self, from_para: int, to_para: int) -> str:
        """获取指定段落"""
        return self.bridge.read_paragraphs(from_para, to_para, self.doc_index)

    def get_table_content(self, table_index: int) -> str:
        """读取表格内容"""
        return self.bridge.read_table(table_index, self.doc_index)

    # ═══════════════════════════════════════════
    # 文档写入
    # ═══════════════════════════════════════════

    def insert_after(self, text: str, para_index: int) -> str:
        """在指定段落之后插入文本"""
        return self.bridge.call_tool("content", {
            "action": "insert_text",
            "text": text,
            "position": f"after_paragraph:{para_index}",
            "doc_index": self.doc_index,
        })

    def write_at_position(self, text: str, position: str = "end"):
        """在指定位置写入"""
        return self.bridge.insert_text(text, position, self.doc_index)

    def fill_table(self, table_index: int, row: int, col: int, text: str):
        """填写表格"""
        return self.bridge.fill_table_cell(table_index, row, col, text, self.doc_index)

    def set_paragraph_format(self, para_index: int, bold: bool = None,
                              size: float = None, alignment: str = None):
        """设置段落格式"""
        args = {"action": "set_font", "para_index": para_index, "doc_index": self.doc_index}
        if bold is not None:
            args["bold"] = bold
        if size:
            args["size"] = size
        if alignment:
            args["alignment"] = alignment
        return self.bridge.call_tool("format", args)

    # ═══════════════════════════════════════════
    # AI 功能
    # ═══════════════════════════════════════════

    def ai_analyze_document(self) -> str:
        """AI 分析文档结构"""
        return self.bridge.ai_format("analyze", self.doc_index)

    def ai_summarize(self) -> str:
        """AI 总结文档"""
        return self.bridge.ai_format("summarize_document", self.doc_index)

    def ai_generate_content(self, instructions: str) -> str:
        """AI 生成内容"""
        return self.bridge.ai_format("generate_content", self.doc_index,
                                      instructions=instructions)

    # ═══════════════════════════════════════════
    # 写作进度分析
    # ═══════════════════════════════════════════

    def analyze_progress(self) -> dict:
        """分析写作进度：看哪些表格已经填写，哪些还是空的"""
        full_text = self.get_full_text()
        structure = self.get_structure()

        # 统计已填写的表格单元格 vs 空单元格
        # 检查关键区域是否有内容
        progress = {
            "total_chars": len(full_text),
            "sections": {},
        }

        # 通过 WPS MCP 读取所有表格来判断进度
        docs_raw = self.bridge.doc_list()
        try:
            docs = json.loads(docs_raw)
            total_tables = docs.get("documents", [{}])[0].get("table_count", 0)
        except:
            total_tables = 0

        progress["total_tables"] = total_tables
        progress["has_content"] = len(full_text.strip()) > 100

        return progress

    def find_empty_sections(self) -> list:
        """找出文档中尚未填写的区域"""
        # 读取语义结构，识别哪些角色/设定还没填
        semantic = self.get_semantic_structure()
        empty_sections = []

        # 简单策略：检查是否有大量连续的空白段落
        full_text = self.get_full_text()
        paragraphs = full_text.split("\n")
        empty_runs = []
        current_empty_start = None
        for i, p in enumerate(paragraphs):
            if not p.strip():
                if current_empty_start is None:
                    current_empty_start = i
            else:
                if current_empty_start is not None and i - current_empty_start > 2:
                    empty_runs.append((current_empty_start + 1, i, i - current_empty_start))
                current_empty_start = None

        return empty_runs

    # ═══════════════════════════════════════════
    # 高级：内容感知填表
    # ═══════════════════════════════════════════

    def fill_worldbuilding_table(self, data: dict):
        """
        填写世界观表格
        data: {"世界类型": "现代都市+异能", "时代背景": "2030年", ...}
        """
        # 世界观基本设定表 是第3张表（封面后：使用指南第1张，进度第2张，世界观第3张）
        # 通过读取文档结构来确定
        structure = self.get_structure()
        # 简化：尝试使用 table_index=3（第三个表格）
        mapping = {
            "世界类型": (2, 2), "时代背景": (3, 2), "世界规模": (4, 2),
            "核心冲突": (5, 2), "科技水平": (6, 2),
            "独特规则(1)": (7, 2), "独特规则(2)": (8, 2),
        }
        for key, (row, col) in mapping.items():
            if key in data:
                try:
                    self.fill_table(3, row, col, data[key])
                except Exception as e:
                    print(f"  Fill failed for {key}: {e}")

    def fill_power_table(self, levels: list):
        """
        填写力量体系等级表
        levels: [{"等级":"Lv.1","名称":"觉醒者","能力":"感知灵气",...}, ...]
        """
        for i, lv in enumerate(levels):
            row = i + 2  # 表头是第1行
            try:
                self.fill_table(4, row, 2, lv.get("名称", ""))
                self.fill_table(4, row, 3, lv.get("能力", ""))
            except Exception as e:
                print(f"  Power level {i+1}: {e}")


# ─── 交互式循环 ───────────────────────────────────────

def interactive_loop():
    """交互式写作循环：读取 → 分析 → 建议 → 写入"""
    assistant = WPSWritingAssistant()
    status = assistant.connect()

    if not status["connected"]:
        print("Error: Please open the writing workstation document in WPS first.")
        return

    print(f"\n{'='*60}")
    print(f"  WPS 网文写作助手已连接")
    print(f"  文档: {status['document'].get('name', 'Unknown')}")
    print(f"  段落: {status['document'].get('paragraph_count', 0)}")
    print(f"  表格: {status['document'].get('table_count', 0)}")
    print(f"{'='*60}\n")

    # 读取当前状态
    print("正在分析文档内容...")
    progress = assistant.analyze_progress()
    print(f"  总字符数: {progress['total_chars']}")
    print(f"  表格数: {progress['total_tables']}")

    empty = assistant.find_empty_sections()
    print(f"  发现 {len(empty)} 个空白区域\n")

    # 分析当前阶段
    print("文档内容预览（前500字）：")
    full_text = assistant.get_full_text()
    print(full_text[:500])
    print("...\n")

    # 基于内容分析给出建议
    print("=" * 60)
    print("  📊 写作状态分析")
    print("=" * 60)

    # 检查封面是否填写
    if "作品名称" in full_text:
        if "______________" in full_text[:2000]:
            print("\n  ⚠️  封面信息尚未填写")
            print("     → 建议先在封面填入：书名、类型、风格、核心创意")
        else:
            print("\n  ✅ 封面信息已填写")

    # 检查世界观
    if "世界类型" in full_text:
        wb_section = full_text.split("世界类型")[1][:200] if "世界类型" in full_text else ""
        if wb_section.strip():
            print("  ✅ 世界观部分已开始填写")
        else:
            print("  ⚠️  世界观基本设定表尚未填写")
            print("     → 建议从这里开始：定义世界类型、时代背景、核心冲突")

    print("\n  💡 下一步建议：")
    print("     1. 填写封面信息")
    print("     2. 完成世界观基本设定表")
    print("     3. 设计力量体系等级")
    print("     4. 使用 AI 提示词生成详细设定")

    return assistant


if __name__ == "__main__":
    assistant = interactive_loop()
    if assistant:
        input("\n按回车退出...")
