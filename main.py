#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════╗
║     📖 网文AI写作引导程序 v1.0              ║
║     Novel Prompt Guide                      ║
║                                              ║
║  用AI写网络小说的全套引导工具                ║
║  包含：世界观→人物→大纲→章节→润色           ║
║  支持WPS文档集成                             ║
╚══════════════════════════════════════════════╝
"""
import sys
import os
import json
from pathlib import Path
from datetime import datetime

# 添加项目根目录到 path
sys.path.insert(0, str(Path(__file__).parent))

from config import NOVEL_GENRES, WRITING_STYLES, OUTPUT_DIR, list_sessions
from session import NovelSession
from prompts import (
    WorldbuildingGuide,
    CharacterGuide,
    PlotGuide,
    ChapterGuide,
    EditingGuide,
)
from wps import WPSAdapter

# 颜色常量（ANSI）
C = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m",
}


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def print_banner():
    print(f"""
{C['cyan']}{C['bold']}╔══════════════════════════════════════════════╗
║     📖 网文AI写作引导程序 v1.0              ║
║     Novel Prompt Guide                      ║
╚══════════════════════════════════════════════╝{C['reset']}
""")


def print_section(title: str):
    print(f"\n{C['yellow']}{C['bold']}{'='*50}{C['reset']}")
    print(f"{C['yellow']}{C['bold']}  {title}{C['reset']}")
    print(f"{C['yellow']}{C['bold']}{'='*50}{C['reset']}\n")


def input_multiline(prompt: str) -> str:
    """支持多行输入"""
    print(f"{C['green']}{prompt}{C['reset']}")
    print(f"{C['dim']}（输入内容，单独一行输入 END 结束）{C['reset']}")
    lines = []
    while True:
        try:
            line = input()
        except (EOFError, KeyboardInterrupt):
            break
        if line.strip().upper() == "END":
            break
        lines.append(line)
    return "\n".join(lines)


def input_with_default(prompt: str, default: str = "") -> str:
    """带默认值的输入"""
    if default:
        result = input(f"{C['green']}{prompt} [{default}]: {C['reset']}")
        return result if result.strip() else default
    return input(f"{C['green']}{prompt}: {C['reset']}")


def select_from_list(options: list, prompt: str = "请选择") -> int:
    """从列表中选择"""
    print(f"\n{C['green']}{prompt}:{C['reset']}")
    for i, opt in enumerate(options, 1):
        if isinstance(opt, tuple):
            print(f"  {C['bold']}{i}{C['reset']}. {opt[1]} {C['dim']}({opt[2]}){C['reset']}")
        elif isinstance(opt, dict):
            print(f"  {C['bold']}{i}{C['reset']}. {opt.get('name', opt.get('label', str(opt)))} {C['dim']}- {opt.get('desc', '')}{C['reset']}")
        else:
            print(f"  {C['bold']}{i}{C['reset']}. {opt}")
    print()
    while True:
        try:
            choice = input(f"{C['green']}输入编号 (1-{len(options)}): {C['reset']}")
            idx = int(choice) - 1
            if 0 <= idx < len(options):
                return idx
        except (ValueError, IndexError):
            pass
        print(f"{C['red']}无效选择，请重试{C['reset']}")


def confirm(prompt: str) -> bool:
    """确认操作"""
    result = input(f"{C['yellow']}{prompt} (y/n): {C['reset']}").strip().lower()
    return result in ("y", "yes", "是")


# ═══════════════════════════════════════════
# 主菜单
# ═══════════════════════════════════════════

def main_menu():
    """主菜单"""
    while True:
        clear_screen()
        print_banner()
        print(f"{C['bold']}🖊️  用AI写出你的故事{C['reset']}\n")
        print(f"  {C['bold']}1{C['reset']}. 📝 新建写作项目")
        print(f"  {C['bold']}2{C['reset']}. 📂 继续已有项目")
        print(f"  {C['bold']}3{C['reset']}. 🗑️  删除项目")
        print(f"  {C['bold']}4{C['reset']}. 📤 导出为WPS文档")
        print(f"  {C['bold']}5{C['reset']}. 📋 查看提示词模板")
        print(f"  {C['bold']}6{C['reset']}. 📖 使用说明")
        print(f"  {C['bold']}0{C['reset']}. 🚪 退出")
        print()

        choice = input(f"{C['green']}请选择: {C['reset']}").strip()

        if choice == "1":
            create_project()
        elif choice == "2":
            load_project()
        elif choice == "3":
            delete_project()
        elif choice == "4":
            export_to_wps()
        elif choice == "5":
            browse_templates()
        elif choice == "6":
            show_help()
        elif choice == "0":
            print(f"\n{C['cyan']}再见，期待你的大作！📖{C['reset']}\n")
            break
        else:
            print(f"{C['red']}无效选择{C['reset']}")
            input("按回车继续...")


# ═══════════════════════════════════════════
# 创建新项目
# ═══════════════════════════════════════════

def create_project():
    clear_screen()
    print_section("📝 创建新写作项目")

    session = NovelSession()

    # 输入书名
    title = input_with_default("书名叫什么", "未命名作品")
    session.title = title

    # 选择类型
    genre_options = [(k, v["name"], v["desc"]) for k, v in NOVEL_GENRES.items()]
    idx = select_from_list(genre_options, "选择小说类型")
    genre_key = genre_options[idx][0]
    session.genre = NOVEL_GENRES[genre_key]["name"]

    # 选择写作风格
    idx = select_from_list(WRITING_STYLES, "选择写作风格")
    session.style = WRITING_STYLES[idx]["name"]

    session.save()
    print(f"\n{C['green']}✅ 项目创建成功！{C['reset']}")
    print(f"   {session.summary()}")
    input(f"\n{C['dim']}按回车进入写作工作台...{C['reset']}")

    # 进入工作台
    project_workbench(session)


# ═══════════════════════════════════════════
# 项目工作台（核心）
# ═══════════════════════════════════════════

def project_workbench(session: NovelSession):
    """项目工作台：管理整个写作流程"""
    while True:
        clear_screen()
        print_banner()
        print(f"{C['bold']}{C['cyan']}📖 《{session.title}》工作台{C['reset']}\n")
        print(session.summary())
        print()

        # 根据当前阶段显示可用操作
        stages = [
            ("1", "🌍", "世界观构建", "worldbuilding", "定义世界的基本规则和背景"),
            ("2", "👤", "人物设计", "characters", "塑造有血有肉的角色"),
            ("3", "📋", "剧情大纲", "plot", "规划故事的起承转合"),
            ("4", "✍️", "章节写作", "chapters", "逐章创作正文内容"),
            ("5", "🔧", "润色修改", "editing", "检查和提升文本质量"),
        ]

        for num, icon, name, stage, desc in stages:
            status = "✅" if session.stage == stage or _is_stage_done(session, stage) else "  "
            marker = " ◀ 当前" if session.stage == stage else ""
            print(f"  {C['bold']}{num}{C['reset']}. {icon} {name} {status}{C['dim']} - {desc}{C['reset']}{marker}")

        print()
        print(f"  {C['bold']}S{C['reset']}. 💾 保存进度")
        print(f"  {C['bold']}E{C['reset']}. 📤 导出到WPS")
        print(f"  {C['bold']}V{C['reset']}. 📄 查看已生成内容")
        print(f"  {C['bold']}B{C['reset']}. 🔙 返回主菜单")
        print()

        choice = input(f"{C['green']}选择操作: {C['reset']}").strip().lower()

        if choice == "1":
            worldbuilding_workflow(session)
        elif choice == "2":
            characters_workflow(session)
        elif choice == "3":
            plot_workflow(session)
        elif choice == "4":
            chapters_workflow(session)
        elif choice == "5":
            editing_workflow(session)
        elif choice == "s":
            session.save()
            print(f"{C['green']}✅ 已保存{C['reset']}")
            input("按回车继续...")
        elif choice == "e":
            export_to_wps_for_session(session)
        elif choice == "v":
            view_content(session)
        elif choice == "b":
            session.save()
            break
        else:
            print(f"{C['red']}无效选择{C['reset']}")
            input("按回车继续...")


def _is_stage_done(session, stage: str) -> bool:
    """检查某阶段是否已完成"""
    checks = {
        "worldbuilding": bool(session.worldbuilding),
        "characters": bool(session.characters),
        "plot": bool(session.plot),
        "chapters": bool(session.chapters),
        "editing": bool(session.editing_notes),
    }
    return checks.get(stage, False)


# ═══════════════════════════════════════════
# 世界观构建工作流
# ═══════════════════════════════════════════

def worldbuilding_workflow(session: NovelSession):
    guide = WorldbuildingGuide()
    if session.worldbuilding:
        guide.from_dict(session.worldbuilding)
    guide.data["genre"] = session.genre
    guide.data["title"] = session.title

    questions = guide.get_questions()

    while True:
        clear_screen()
        print_section(f"🌍 世界观构建 - 《{session.title}》")

        for i, q in enumerate(questions, 1):
            done = "✅" if q["id"] in guide.data and guide.data[q["id"]] else "⬜"
            print(f"  {done} {i}. {q['label']}")

        print()
        print(f"  {C['bold']}A{C['reset']}. 🚀 一键生成全部世界观提示词")
        print(f"  {C['bold']}C{C['reset']}. 📋 生成整合文档提示词")
        print(f"  {C['bold']}B{C['reset']}. 🔙 返回工作台")
        print()

        choice = input(f"{C['green']}选择操作: {C['reset']}").strip().lower()

        if choice == "a":
            prompt = guide.generate_full_prompt()
            _display_and_save_prompt(prompt, "世界观构建-完整提示词",
                                      session, "worldbuilding_full_prompt.txt")
            input("按回车继续...")

        elif choice == "c":
            prompt = guide.generate_compile_prompt()
            _display_and_save_prompt(prompt, "世界观整合提示词",
                                      session, "worldbuilding_compile_prompt.txt")
            input("按回车继续...")

        elif choice == "b":
            session.worldbuilding = guide.to_dict()
            session.set_stage("worldbuilding")
            session.save()
            break

        else:
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(questions):
                    q = questions[idx]
                    print(f"\n{C['cyan']}{q['label']}{C['reset']}")
                    print(f"{C['dim']}{q['text'][:200]}...{C['reset']}")
                    print()

                    if q["id"] in guide.data and guide.data[q["id"]]:
                        print(f"{C['yellow']}已有内容：{C['reset']}")
                        print(guide.data[q["id"]][:300])
                        if confirm("是否重新设定？"):
                            answer = input_multiline("请输入新的设定内容")
                            guide.collect_answer(q["id"], answer)
                    else:
                        sub = input(f"{C['green']}选择操作: [1]自己设定 [2]生成AI提示词 [3]跳过: {C['reset']}")
                        if sub == "1":
                            answer = input_multiline("请输入设定内容")
                            guide.collect_answer(q["id"], answer)
                            session.worldbuilding = guide.to_dict()
                            session.save()
                        elif sub == "2":
                            prompt = guide.generate_single_prompt(q["id"])
                            _display_and_save_prompt(
                                prompt,
                                f"世界观-{q['label']}",
                                session,
                                f"worldbuilding_{q['id']}_prompt.txt"
                            )
                            if confirm("是否现在填入AI返回的内容？"):
                                answer = input_multiline("请粘贴AI的回答")
                                guide.collect_answer(q["id"], answer)
                                session.worldbuilding = guide.to_dict()
                                session.save()
                    input("按回车继续...")
            except (ValueError, IndexError):
                print(f"{C['red']}无效选择{C['reset']}")
                input("按回车继续...")


# ═══════════════════════════════════════════
# 人物设计工作流
# ═══════════════════════════════════════════

def characters_workflow(session: NovelSession):
    guide = CharacterGuide()
    if session.characters:
        guide.from_dict({"data": session.characters.get("data", {}),
                          "characters_list": session.characters.get("characters_list", [])})

    questions = guide.get_questions()
    context = {
        "title": session.title,
        "genre": session.genre,
        "style": session.style,
        "worldbuilding_summary": _summarize_worldbuilding(session),
    }

    while True:
        clear_screen()
        print_section(f"👤 人物设计 - 《{session.title}》")

        for i, q in enumerate(questions, 1):
            done = "✅" if q["id"] in guide.data and guide.data[q["id"]] else "⬜"
            print(f"  {done} {i}. {q['label']}")

        print()
        print(f"  {C['bold']}A{C['reset']}. 🚀 一键生成全部人物提示词")
        print(f"  {C['bold']}C{C['reset']}. 📋 生成人物档案整合提示词")
        print(f"  {C['bold']}B{C['reset']}. 🔙 返回工作台")
        print()

        choice = input(f"{C['green']}选择操作: {C['reset']}").strip().lower()

        if choice == "a":
            prompt = guide.generate_full_prompt(context)
            _display_and_save_prompt(prompt, "人物设计-完整提示词",
                                      session, "characters_full_prompt.txt")
            input("按回车继续...")

        elif choice == "c":
            prompt = guide.generate_compile_prompt(context)
            _display_and_save_prompt(prompt, "人物档案整合提示词",
                                      session, "characters_compile_prompt.txt")
            input("按回车继续...")

        elif choice == "b":
            session.characters = guide.to_dict()
            if guide.data:
                session.set_stage("characters")
            session.save()
            break

        else:
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(questions):
                    q = questions[idx]
                    print(f"\n{C['cyan']}{q['label']}{C['reset']}")
                    print(f"{C['dim']}{q['text'][:200]}...{C['reset']}\n")

                    prompt = guide.generate_single_prompt(q["id"], context)
                    _display_and_save_prompt(
                        prompt,
                        f"人物-{q['label']}",
                        session,
                        f"characters_{q['id']}_prompt.txt"
                    )

                    if confirm("是否填入AI返回的内容？"):
                        answer = input_multiline("请粘贴AI的回答")
                        guide.collect_answer(q["id"], answer)
                        session.characters = guide.to_dict()
                        session.save()

                    input("按回车继续...")
            except (ValueError, IndexError):
                print(f"{C['red']}无效选择{C['reset']}")
                input("按回车继续...")


# ═══════════════════════════════════════════
# 剧情大纲工作流
# ═══════════════════════════════════════════

def plot_workflow(session: NovelSession):
    guide = PlotGuide()
    if session.plot:
        guide.from_dict(session.plot)

    questions = guide.get_questions()
    context = {
        "title": session.title,
        "genre": session.genre,
        "style": session.style,
        "worldbuilding_summary": _summarize_worldbuilding(session),
        "characters_summary": _summarize_characters(session),
    }

    while True:
        clear_screen()
        print_section(f"📋 剧情大纲 - 《{session.title}》")

        for i, q in enumerate(questions, 1):
            done = "✅" if q["id"] in guide.data and guide.data[q["id"]] else "⬜"
            print(f"  {done} {i}. {q['label']}")

        print()
        print(f"  {C['bold']}A{C['reset']}. 🚀 一键生成全部剧情提示词")
        print(f"  {C['bold']}C{C['reset']}. 📋 生成剧情大纲整合提示词")
        print(f"  {C['bold']}B{C['reset']}. 🔙 返回工作台")
        print()

        choice = input(f"{C['green']}选择操作: {C['reset']}").strip().lower()

        if choice == "a":
            prompt = guide.generate_full_prompt(context)
            _display_and_save_prompt(prompt, "剧情大纲-完整提示词",
                                      session, "plot_full_prompt.txt")
            input("按回车继续...")

        elif choice == "c":
            prompt = guide.generate_compile_prompt(context)
            _display_and_save_prompt(prompt, "剧情大纲整合提示词",
                                      session, "plot_compile_prompt.txt")
            input("按回车继续...")

        elif choice == "b":
            session.plot = guide.to_dict()
            if guide.data:
                session.set_stage("plot")
            session.save()
            break

        else:
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(questions):
                    q = questions[idx]
                    print(f"\n{C['cyan']}{q['label']}{C['reset']}")
                    print(f"{C['dim']}{q['text'][:200]}...{C['reset']}\n")

                    prompt = guide.generate_single_prompt(q["id"], context)
                    _display_and_save_prompt(
                        prompt, f"剧情-{q['label']}", session,
                        f"plot_{q['id']}_prompt.txt"
                    )

                    if confirm("是否填入AI返回的内容？"):
                        answer = input_multiline("请粘贴AI的回答")
                        guide.collect_answer(q["id"], answer)
                        session.plot = guide.to_dict()
                        session.save()

                    input("按回车继续...")
            except (ValueError, IndexError):
                print(f"{C['red']}无效选择{C['reset']}")
                input("按回车继续...")


# ═══════════════════════════════════════════
# 章节写作工作流
# ═══════════════════════════════════════════

def chapters_workflow(session: NovelSession):
    guide = ChapterGuide()
    if session.chapters:
        guide.from_dict(session.chapters)

    context = {
        "title": session.title,
        "genre": session.genre,
        "worldbuilding_summary": _summarize_worldbuilding(session),
        "characters_summary": _summarize_characters(session),
        "plot_summary": _summarize_plot(session),
    }

    while True:
        clear_screen()
        print_section(f"✍️ 章节写作 - 《{session.title}》")

        print(f"  已规划章节: {len(guide.chapters)} 章\n")

        if guide.chapters:
            for ch in guide.chapters[-5:]:
                print(f"  第{ch.get('index', '?')}章: {ch.get('title', '未命名')}")
            if len(guide.chapters) > 5:
                print(f"  ... 共 {len(guide.chapters)} 章")

        print()
        print(f"  {C['bold']}1{C['reset']}. 📝 写新章节（按大纲）")
        print(f"  {C['bold']}2{C['reset']}. 🔗 续写章节")
        print(f"  {C['bold']}3{C['reset']}. 🎬 特定场景写作")
        print(f"  {C['bold']}4{C['reset']}. 📦 批量生成章节大纲（10章）")
        print(f"  {C['bold']}5{C['reset']}. 📋 查看已写章节")
        print(f"  {C['bold']}B{C['reset']}. 🔙 返回工作台")
        print()

        choice = input(f"{C['green']}选择操作: {C['reset']}").strip().lower()

        if choice == "1":
            # 按大纲写新章节
            print(f"\n{C['cyan']}📝 按大纲写新章节{C['reset']}\n")
            ch_title = input_with_default("章节标题")
            ch_outline = input_multiline("本章大纲/要点")
            ch_target = input_with_default("目标字数", "3000")
            ch_index = len(guide.chapters) + 1

            chapter_info = {
                "index": ch_index,
                "title": ch_title,
                "outline": ch_outline,
                "word_target": ch_target,
            }
            prompt = guide.generate_single_chapter_prompt(chapter_info, context)
            _display_and_save_prompt(
                prompt, f"第{ch_index}章写作提示词",
                session, f"chapter_{ch_index:03d}_prompt.txt"
            )

            if confirm("是否填入写完的内容？"):
                content = input_multiline("请粘贴章节正文")
                chapter_info["content"] = content
                guide.add_chapter(chapter_info)
                session.chapters = guide.to_dict()
                session.set_stage("chapters")
                session.save()
                print(f"{C['green']}✅ 第{ch_index}章已保存{C['reset']}")
            input("按回车继续...")

        elif choice == "2":
            # 续写
            print(f"\n{C['cyan']}🔗 续写章节{C['reset']}\n")
            if guide.chapters:
                last = guide.chapters[-1]
                print(f"  上一章: 第{last.get('index', '?')}章 {last.get('title', '')}")
                print(f"  结尾内容: {last.get('content', '')[-200:] if last.get('content') else '(无)'}")
            prev_summary = input_multiline("前情提要（或使用上一章结尾）")
            direction = input_multiline("续写方向")
            prompt = guide.generate_continue_prompt(prev_summary, direction, context)
            _display_and_save_prompt(
                prompt, "续写章节提示词", session,
                f"chapter_{len(guide.chapters)+1:03d}_continue_prompt.txt"
            )
            input("按回车继续...")

        elif choice == "3":
            # 特定场景
            print(f"\n{C['cyan']}🎬 特定场景写作{C['reset']}\n")
            from config import CHAPTER_TYPES
            idx = select_from_list(CHAPTER_TYPES, "选择场景类型")
            scene_type = CHAPTER_TYPES[idx]
            scene_name = input_with_default("场景名称")
            scene_desc = input_multiline("场景描述（发生了什么）")
            scene_chars = input_with_default("参与角色")
            scene_mood = input_with_default("情感基调", "紧张")
            scene_words = input_with_default("字数", "2000")

            ch_index = len(guide.chapters) + 1
            chapter_info = {
                "index": ch_index,
                "title": scene_name,
                "type": scene_type["name"],
                "description": scene_desc,
                "characters": scene_chars,
                "mood": scene_mood,
                "word_target": scene_words,
            }
            prompt = guide.generate_single_chapter_prompt(chapter_info, context)
            _display_and_save_prompt(
                prompt, f"场景-{scene_name}", session,
                f"chapter_{ch_index:03d}_scene_prompt.txt"
            )
            input("按回车继续...")

        elif choice == "4":
            # 批量生成章节大纲
            start = len(guide.chapters) + 1
            prompt = guide.generate_batch_outline_prompt(start, 10, context)
            _display_and_save_prompt(
                prompt, "批量章节大纲生成", session,
                "batch_chapter_outline_prompt.txt"
            )
            input("按回车继续...")

        elif choice == "5":
            view_chapters(guide)
            input("按回车继续...")

        elif choice == "b":
            session.chapters = guide.to_dict()
            if guide.chapters:
                session.set_stage("chapters")
            session.save()
            break


def view_chapters(guide: ChapterGuide):
    """查看已写章节"""
    clear_screen()
    print_section("📋 已写章节列表")
    if not guide.chapters:
        print("  暂无章节")
        return
    for ch in guide.chapters:
        print(f"\n  {C['bold']}第{ch.get('index', '?')}章: {ch.get('title', '未命名')}{C['reset']}")
        if ch.get("content"):
            print(f"  {ch['content'][:150]}...")
        else:
            print(f"  {C['dim']}(有提示词，待填入内容){C['reset']}")


# ═══════════════════════════════════════════
# 润色修改工作流
# ═══════════════════════════════════════════

def editing_workflow(session: NovelSession):
    guide = EditingGuide()
    if session.editing_notes:
        guide.from_dict(session.editing_notes)

    questions = guide.get_questions()
    context = {
        "title": session.title,
        "genre": session.genre,
    }

    while True:
        clear_screen()
        print_section(f"🔧 润色修改 - 《{session.title}》")

        for i, q in enumerate(questions, 1):
            print(f"  {C['bold']}{i}{C['reset']}. {q['label']}")

        print()
        print(f"  {C['bold']}B{C['reset']}. 🔙 返回工作台")
        print()

        choice = input(f"{C['green']}选择操作: {C['reset']}").strip().lower()

        if choice == "b":
            session.editing_notes = guide.to_dict()
            session.save()
            break

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(questions):
                q = questions[idx]
                print(f"\n{C['cyan']}{q['label']}{C['reset']}")
                print(f"{C['dim']}{q['text'][:200]}...{C['reset']}\n")

                print(f"{C['yellow']}请粘贴需要检查/润色的章节内容：{C['reset']}")
                content = input_multiline("章节内容")
                if not content.strip():
                    print(f"{C['red']}内容不能为空{C['reset']}")
                    input("按回车继续...")
                    continue

                prompt = guide.generate_check_prompt(q["id"], content, context)
                _display_and_save_prompt(
                    prompt, f"润色-{q['label']}", session,
                    f"editing_{q['id']}_prompt.txt"
                )

                guide.add_note(q["id"], f"检查类型: {q['label']}", f"内容长度: {len(content)}字")
                session.editing_notes = guide.to_dict()
                session.save()

                input("按回车继续...")
        except (ValueError, IndexError):
            print(f"{C['red']}无效选择{C['reset']}")
            input("按回车继续...")


# ═══════════════════════════════════════════
# 辅助函数
# ═══════════════════════════════════════════

def _display_and_save_prompt(prompt: str, label: str, session: NovelSession, filename: str):
    """显示提示词并保存到文件"""
    output_path = OUTPUT_DIR / session.session_id
    output_path.mkdir(parents=True, exist_ok=True)
    filepath = output_path / filename

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(prompt)

    print(f"\n{C['yellow']}{'='*50}{C['reset']}")
    print(f"{C['bold']}📋 {label}{C['reset']}")
    print(f"{C['yellow']}{'='*50}{C['reset']}")
    print(f"\n{prompt[:2000]}")
    if len(prompt) > 2000:
        print(f"\n{C['dim']}... (共 {len(prompt)} 字符，已截断显示){C['reset']}")
    print(f"\n{C['green']}💾 已保存到: {filepath}{C['reset']}")


def _summarize_worldbuilding(session: NovelSession) -> str:
    """提取世界观概要"""
    wb = session.worldbuilding
    if not wb:
        return "（世界观尚未构建）"
    parts = []
    for k, v in wb.items():
        if isinstance(v, str) and len(v) > 10:
            parts.append(v[:300])
    return "\n".join(parts[:3]) if parts else "（设定不完整）"


def _summarize_characters(session: NovelSession) -> str:
    """提取人物概要"""
    chars = session.characters
    if not chars:
        return "（人物尚未设计）"
    data = chars.get("data", {})
    parts = []
    for k, v in data.items():
        if isinstance(v, str) and len(v) > 10:
            parts.append(v[:200])
    return "\n".join(parts[:3]) if parts else "（设定不完整）"


def _summarize_plot(session: NovelSession) -> str:
    """提取剧情概要"""
    plot = session.plot
    if not plot:
        return "（剧情尚未规划）"
    parts = []
    for k, v in plot.items():
        if isinstance(v, str) and len(v) > 10:
            parts.append(v[:300])
    return "\n".join(parts[:3]) if parts else "（规划不完整）"


# ═══════════════════════════════════════════
# 其他菜单功能
# ═══════════════════════════════════════════

def load_project():
    """加载已有项目"""
    clear_screen()
    print_section("📂 继续已有项目")

    sessions = list_sessions()
    if not sessions:
        print(f"{C['yellow']}  没有找到已有项目{C['reset']}")
        input("按回车返回...")
        return

    for i, s in enumerate(sessions, 1):
        print(f"  {C['bold']}{i}{C['reset']}. 📖 {s['title']} {C['dim']}({s['genre']}) - {s['updated'][:16]}{C['reset']}")

    print()
    choice = input(f"{C['green']}选择项目编号 (0=返回): {C['reset']}").strip()
    try:
        idx = int(choice) - 1
        if idx < 0:
            return
        session = NovelSession(session_id=sessions[idx]["id"])
        print(f"\n{C['green']}✅ 已加载: 《{session.title}》{C['reset']}")
        input("按回车进入工作台...")
        project_workbench(session)
    except (ValueError, IndexError):
        print(f"{C['red']}无效选择{C['reset']}")
        input("按回车返回...")


def delete_project():
    """删除项目"""
    clear_screen()
    print_section("🗑️ 删除项目")

    sessions = list_sessions()
    if not sessions:
        print(f"{C['yellow']}  没有可删除的项目{C['reset']}")
        input("按回车返回...")
        return

    for i, s in enumerate(sessions, 1):
        print(f"  {C['bold']}{i}{C['reset']}. {s['title']} ({s['genre']})")

    print()
    choice = input(f"{C['red']}选择要删除的项目编号 (0=返回): {C['reset']}").strip()
    try:
        idx = int(choice) - 1
        if idx < 0:
            return
        s = sessions[idx]
        if confirm(f"确认删除 《{s['title']}》？此操作不可恢复！"):
            path = Path("output/sessions") / f"{s['id']}.json"
            if path.exists():
                path.unlink()
            print(f"{C['green']}✅ 已删除{C['reset']}")
    except (ValueError, IndexError):
        print(f"{C['red']}无效选择{C['reset']}")
    input("按回车返回...")


def export_to_wps():
    """从主菜单导出"""
    clear_screen()
    print_section("📤 导出为WPS文档")

    sessions = list_sessions()
    if not sessions:
        print(f"{C['yellow']}  没有可导出的项目{C['reset']}")
        input("按回车返回...")
        return

    for i, s in enumerate(sessions, 1):
        print(f"  {C['bold']}{i}{C['reset']}. {s['title']}")

    print()
    choice = input(f"{C['green']}选择项目 (0=返回): {C['reset']}").strip()
    try:
        idx = int(choice) - 1
        if idx < 0:
            return
        session = NovelSession(session_id=sessions[idx]["id"])
        export_to_wps_for_session(session)
    except (ValueError, IndexError):
        print(f"{C['red']}无效选择{C['reset']}")
    input("按回车返回...")


def export_to_wps_for_session(session: NovelSession):
    """为指定会话导出到WPS"""
    clear_screen()
    print_section(f"📤 导出《{session.title}》到WPS")

    adapter = WPSAdapter()

    # 收集内容
    content_parts = {
        "worldbuilding": _format_wb_for_export(session),
        "characters": _format_chars_for_export(session),
        "plot": _format_plot_for_export(session),
        "chapters": _format_chapters_for_export(session),
    }

    doc = adapter.create_novel_document(session.title, session.genre, content_parts)

    # 导出为 Markdown
    md_path = adapter.export_to_markdown(doc)
    print(f"\n{C['green']}✅ Markdown文档已生成:{C['reset']}")
    print(f"   {md_path}")

    # 导出为纯文本
    txt_path = adapter.export_to_text(doc)
    print(f"\n{C['green']}✅ 纯文本文档已生成:{C['reset']}")
    print(f"   {txt_path}")

    # 生成 WPS 构建指令
    instructions = adapter.build_wps_build_instructions(doc)
    inst_path = adapter.save_instructions(instructions)
    print(f"\n{C['green']}✅ WPS构建指令已生成:{C['reset']}")
    print(f"   {inst_path}")

    # 生成提示词库
    prompt_lib_path = adapter.generate_prompt_library({
        "title": session.title,
        "worldbuilding": {"full_prompt": "（请从output目录查看具体提示词文件）"},
        "characters": {"full_prompt": "（请从output目录查看具体提示词文件）"},
    })
    print(f"\n{C['green']}✅ 提示词库已生成:{C['reset']}")
    print(f"   {prompt_lib_path}")

    print(f"\n{C['cyan']}提示：可以用WPS打开Markdown文件，或根据构建指令使用MCP工具自动创建文档{C['reset']}")

    input("\n按回车返回...")


def _format_wb_for_export(session) -> str:
    wb = session.worldbuilding
    if not wb:
        return ""
    lines = []
    labels = {
        "background": "🌌 世界背景",
        "power_system": "⚡ 力量体系",
        "social": "🏛️ 社会结构",
        "geography": "🗺️ 地理版图",
        "history": "📜 历史神话",
    }
    for k, v in wb.items():
        if isinstance(v, str) and v.strip():
            lines.append(f"## {labels.get(k, k)}\n\n{v}")
    return "\n\n".join(lines)


def _format_chars_for_export(session) -> str:
    chars = session.characters
    if not chars:
        return ""
    data = chars.get("data", {})
    lines = []
    labels = {
        "protagonist": "⭐ 主角",
        "female_lead": "🌸 女主角/重要女性角色",
        "antagonist": "💀 反派/对手",
        "supporting": "🤝 配角群像",
        "relationships": "🕸️ 人物关系网",
    }
    for k, v in data.items():
        if isinstance(v, str) and v.strip():
            lines.append(f"## {labels.get(k, k)}\n\n{v}")
    return "\n\n".join(lines)


def _format_plot_for_export(session) -> str:
    plot = session.plot
    if not plot:
        return ""
    lines = []
    labels = {
        "mainline": "🎯 主线剧情",
        "volumes": "📚 分卷规划",
        "hooks": "🪝 爽点与钩子",
        "subplots": "🔀 支线与伏笔",
        "pacing": "📊 节奏控制",
    }
    for k, v in plot.items():
        if isinstance(v, str) and v.strip():
            lines.append(f"## {labels.get(k, k)}\n\n{v}")
    return "\n\n".join(lines)


def _format_chapters_for_export(session) -> list:
    return session.chapters.get("chapters", [])


def browse_templates():
    """浏览提示词模板"""
    clear_screen()
    print_section("📋 提示词模板总览")
    print("""
本程序包含以下提示词模板（位于 templates/ 目录）：

1. worldbuilding.yaml - 世界观构建
   包含5个维度：世界背景、力量体系、社会结构、地理版图、历史神话

2. characters.yaml - 人物设计
   包含5个维度：主角、女主、反派、配角、人物关系

3. plot.yaml - 剧情大纲
   包含5个维度：主线剧情、分卷规划、爽点钩子、支线伏笔、节奏控制

4. chapters.yaml - 章节写作
   包含4种模式：按大纲写、续写、特定场景、批量大纲

5. editing.yaml - 润色修改
   包含5种检查：一致性检查、文笔润色、钩子检查、对话优化、节奏分析

每个模板都包含 system_prompt（AI角色设定）和 questions（引导问题），
可以通过修改 YAML 文件来自定义。
""")
    input("按回车返回...")


def show_help():
    """显示使用说明"""
    clear_screen()
    print_section("📖 使用说明")
    print("""
【网文AI写作引导程序】是一套帮你用AI写网络小说的完整工具链。

🔹 工作流程：
  世界观构建 → 人物设计 → 剧情大纲 → 章节写作 → 润色修改

🔹 使用方式：
  1. 创建新项目：设定书名、类型和写作风格
  2. 在每个阶段，程序会提供引导问题
  3. 你可以自己填写，也可以生成AI提示词让AI来写
  4. 生成的提示词自动保存，可以直接复制给AI使用
  5. 完成后可以导出为WPS文档

🔹 两种工作模式：
  【模式A：自己设定】
  自己根据引导问题填写内容，程序帮你组织和管理

  【模式B：AI辅助】
  程序生成高质量的提示词，复制给AI（如ChatGPT/Claude等），
  然后将AI的回答填入程序，逐步构建完整作品

🔹 WPS集成：
  导出功能会生成：
  - Markdown文件（可直接用WPS打开）
  - 纯文本文件（可粘贴到WPS）
  - WPS构建指令（可用MCP自动化创建文档）

🔹 文件位置：
  - 项目数据：output/sessions/
  - 生成的提示词：output/<项目ID>/
  - 导出的文档：output/

🔹 提示词模板：
  所有提示词模板在 templates/ 目录下，
  是YAML格式，可以根据需要修改定制。
""")
    input("按回车返回...")


def view_content(session: NovelSession):
    """查看已生成的全部内容"""
    clear_screen()
    print_section(f"📄 《{session.title}》内容总览")

    # 世界观
    print(f"\n{C['bold']}🌍 世界观构建{C['reset']}")
    if session.worldbuilding:
        for k, v in session.worldbuilding.items():
            if isinstance(v, str) and v.strip():
                print(f"  ✅ {k}: {v[:100]}...")
    else:
        print(f"  {C['dim']}(未开始){C['reset']}")

    # 人物
    print(f"\n{C['bold']}👤 人物设计{C['reset']}")
    if session.characters:
        data = session.characters.get("data", {})
        for k, v in data.items():
            if isinstance(v, str) and v.strip():
                print(f"  ✅ {k}: {v[:100]}...")
    else:
        print(f"  {C['dim']}(未开始){C['reset']}")

    # 剧情
    print(f"\n{C['bold']}📋 剧情大纲{C['reset']}")
    if session.plot:
        for k, v in session.plot.items():
            if isinstance(v, str) and v.strip():
                print(f"  ✅ {k}: {v[:100]}...")
    else:
        print(f"  {C['dim']}(未开始){C['reset']}")

    # 章节
    print(f"\n{C['bold']}✍️ 章节{C['reset']}")
    chapters = session.chapters.get("chapters", [])
    if chapters:
        for ch in chapters[-10:]:
            print(f"  第{ch.get('index', '?')}章: {ch.get('title', '未命名')} {'✅有内容' if ch.get('content') else '📋仅有大纲'}")
    else:
        print(f"  {C['dim']}(未开始){C['reset']}")

    input("\n按回车返回...")


# ═══════════════════════════════════════════
# 入口
# ═══════════════════════════════════════════

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print(f"\n\n{C['cyan']}再见！{C['reset']}\n")
    except Exception as e:
        print(f"\n{C['red']}出错: {e}{C['reset']}")
        import traceback
        traceback.print_exc()
        input("按回车退出...")
