# -*- coding: utf-8 -*-
"""快速演示：走一遍完整流程，所有输出保存到文件"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
sys.stdout.reconfigure(encoding="utf-8")

from session import NovelSession
from prompts import WorldbuildingGuide, CharacterGuide, PlotGuide, ChapterGuide, EditingGuide
from wps import WPSAdapter
from config import OUTPUT_DIR

s = NovelSession()
s.title = "逆鳞"
s.genre = "都市"
s.style = "爽文快节奏"
s.save()

out = OUTPUT_DIR / s.session_id
out.mkdir(parents=True, exist_ok=True)

def save(name, text):
    (out / name).write_text(text, encoding="utf-8")
    return out / name

print("=" * 60)
print("  演示：《逆鳞》 | 都市 | 爽文快节奏")
print("=" * 60)

# ---- 世界观 ----
print("\n[阶段1] 世界观构建")
wb = WorldbuildingGuide()
wb.data["genre"] = "ds"
wb.data["title"] = "逆鳞"
questions = wb.get_questions()
for q in questions:
    print(f"  维度: {q['label']}")

p1 = save("01_世界观_完整提示词.txt", wb.generate_full_prompt())
print(f"  -> {p1.name} ({len(wb.generate_full_prompt())} chars)")

# 单维度示例
p1b = save("01_世界观_世界背景_单独提示词.txt",
           wb.generate_single_prompt(questions[0]["id"]))
print(f"  -> {p1b.name} (单个维度也可以独立生成)")

# 填入模拟数据
for q in questions:
    wb.collect_answer(q["id"], f"[{q['label']}] AI生成内容（此处应为实际返回）")
s.worldbuilding = wb.to_dict()
p1c = save("01_世界观_整合文档提示词.txt", wb.generate_compile_prompt())
print(f"  -> {p1c.name}")

# ---- 人物 ----
print("\n[阶段2] 人物设计")
chars = CharacterGuide()
ctx = {"title": "逆鳞", "genre": "ds", "worldbuilding_summary": "现代都市，灵气复苏..."}
for q in chars.get_questions():
    print(f"  维度: {q['label']}")
p2 = save("02_人物_主角设计提示词.txt",
          chars.generate_single_prompt("protagonist", ctx))
print(f"  -> {p2.name}")
for q in chars.get_questions():
    chars.collect_answer(q["id"], f"[{q['label']}] AI生成内容")
s.characters = chars.to_dict()
s.save()

# ---- 剧情 ----
print("\n[阶段3] 剧情大纲")
plot = PlotGuide()
ctx2 = {**ctx, "characters_summary": "林渊，26岁，SSS级觉醒者..."}
p3 = save("03_剧情_完整提示词.txt", plot.generate_full_prompt(ctx2))
print(f"  -> {p3.name} ({len(plot.generate_full_prompt(ctx2))} chars)")
p3b = save("03_剧情_分卷规划提示词.txt",
           plot.generate_single_prompt("volumes", ctx2))
print(f"  -> {p3b.name}")

# ---- 章节 ----
print("\n[阶段4] 章节写作")
chapters = ChapterGuide()
ctx3 = {**ctx2, "plot_summary": "第一卷：觉醒之日..."}

p4a = save("04_章节_第1章_写作提示词.txt",
           chapters.generate_single_chapter_prompt(
               {"index": 1, "title": "工地上的觉醒",
                "outline": "主角濒死觉醒，开头紧张，结尾埋悬念。",
                "word_target": "3000"}, ctx3))
print(f"  -> {p4a.name}")

p4b = save("04_章节_第2-11章_批量大纲.txt",
           chapters.generate_batch_outline_prompt(2, 10, ctx3))
print(f"  -> {p4b.name}")

p4c = save("04_章节_第2章_续写提示词.txt",
           chapters.generate_continue_prompt(
               "第1章结尾：林渊睁眼，世界变成了流动的光纹...",
               "第2章：敌对公司杀手逼近，林渊躲避追杀同时隐藏SSS级觉醒。",
               ctx3))
print(f"  -> {p4c.name}")

# ---- 润色 ----
print("\n[阶段5] 润色修改")
editing = EditingGuide()
p5a = save("05_润色_一致性检查提示词.txt",
           editing.generate_check_prompt("consistency", "[章节正文...]", ctx))
print(f"  -> {p5a.name}")
p5b = save("05_润色_文笔润色提示词.txt",
           editing.generate_check_prompt("style_polish", "[章节正文...]", ctx))
print(f"  -> {p5b.name}")

# ---- WPS导出 ----
print("\n[WPS导出]")
adapter = WPSAdapter()
doc = adapter.create_novel_document("逆鳞", "都市", {
    "worldbuilding": "世界观内容...",
    "characters": "人物设定...",
    "plot": "剧情大纲...",
    "chapters": [{"content": "第1章..."}],
})
md = adapter.export_to_markdown(doc)
txt = adapter.export_to_text(doc)
inst = adapter.save_instructions(adapter.build_wps_build_instructions(doc))
print(f"  Markdown: {md}")
print(f"  纯文本:   {txt}")
print(f"  构建指令: {inst}")

# ---- 汇总 ----
print("\n" + "=" * 60)
print(f"  完成！生成 {len(list(out.glob('*.txt')))} 个提示词文件")
print(f"  目录: {out}")
print("=" * 60)
