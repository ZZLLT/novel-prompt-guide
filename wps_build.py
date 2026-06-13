# -*- coding: utf-8 -*-
"""
WPS 写作工作台：在 WPS 中直接操作网文写作全流程
通过 COM 接口控制 WPS，创建格式化的工作文档
"""
import win32com.client
from win32com.client import constants as wdConst
import os, sys
from datetime import datetime

# 连接 WPS
wps = win32com.client.Dispatch("KWPS.Application")
wps.Visible = True
wps.Activate()

# 创建新文档
doc = wps.Documents.Add()

# ═══════════════════════════════════════════
# 页面设置
# ═══════════════════════════════════════════
page_setup = doc.PageSetup
page_setup.TopMargin = wps.CentimetersToPoints(2.54)
page_setup.BottomMargin = wps.CentimetersToPoints(2.54)
page_setup.LeftMargin = wps.CentimetersToPoints(3.18)
page_setup.RightMargin = wps.CentimetersToPoints(3.18)

# 获取文档 Range
rng = doc.Range()

# ═══════════════════════════════════════════
# 辅助函数
# ═══════════════════════════════════════════

def insert_heading(text, level=1, font_name="黑体"):
    """插入标题并设置格式"""
    para = doc.Paragraphs.Add()
    para.Range.Text = text
    para.Range.Font.Name = font_name
    para.Range.Font.Bold = True
    if level == 1:
        para.Range.Font.Size = 18
    elif level == 2:
        para.Range.Font.Size = 15
    elif level == 3:
        para.Range.Font.Size = 13
    para.Range.Font.ColorIndex = 1  # 黑色
    para.Range.InsertParagraphAfter()
    # 设置标题样式
    try:
        para.set_Style(getattr(wdConst, f"wdStyleHeading{level}"))
    except:
        pass
    return para

def insert_body(text, font_name="等线", font_size=12, bold=False):
    """插入正文段落"""
    para = doc.Paragraphs.Add()
    para.Range.Text = text
    para.Range.Font.Name = font_name
    para.Range.Font.Size = font_size
    para.Range.Font.Bold = bold
    para.Range.Font.ColorIndex = 1
    para.Range.InsertParagraphAfter()
    return para

def insert_field_label(text, font_name="微软雅黑", font_size=11):
    """插入灰色引导字段标签"""
    para = doc.Paragraphs.Add()
    para.Range.Text = text
    para.Range.Font.Name = font_name
    para.Range.Font.Size = font_size
    para.Range.Font.Bold = False
    para.Range.Font.ColorIndex = 8  # 灰色
    para.Range.Italic = True
    para.Range.InsertParagraphAfter()
    return para

def insert_divider():
    """插入分隔线"""
    para = doc.Paragraphs.Add()
    para.Range.Text = "─" * 40
    para.Range.Font.ColorIndex = 8
    para.Range.InsertParagraphAfter()

def insert_prompt_box(text):
    """插入提示词区域（蓝色标注）"""
    para = doc.Paragraphs.Add()
    para.Range.Text = text
    para.Range.Font.Name = "等线"
    para.Range.Font.Size = 10
    para.Range.Font.ColorIndex = 5  # 蓝色
    para.Range.Font.Bold = False
    para.Range.Italic = False
    para.Range.InsertParagraphAfter()

# ═══════════════════════════════════════════
# 封面
# ═══════════════════════════════════════════

# 空行
for _ in range(4):
    doc.Paragraphs.Add()

# 书名
title_para = doc.Paragraphs.Add()
title_para.Range.Text = "《作品名称》"
title_para.Range.Font.Name = "黑体"
title_para.Range.Font.Size = 26
title_para.Range.Font.Bold = True
title_para.Range.Font.ColorIndex = 1
title_para.Alignment = 1  # 居中
title_para.Range.InsertParagraphAfter()

# 副标题
subtitle_para = doc.Paragraphs.Add()
subtitle_para.Range.Text = "网文AI写作工作台"
subtitle_para.Range.Font.Name = "微软雅黑"
subtitle_para.Range.Font.Size = 14
subtitle_para.Range.Font.ColorIndex = 8
subtitle_para.Alignment = 1
subtitle_para.Range.InsertParagraphAfter()

# 空行
doc.Paragraphs.Add()

# 项目信息
info_items = [
    f"📖 类型：__________",
    f"✍️ 风格：__________",
    f"📅 日期：{datetime.now().strftime('%Y年%m月%d日')}",
    f"💡 核心理念：__________",
]
for item in info_items:
    p = doc.Paragraphs.Add()
    p.Range.Text = item
    p.Range.Font.Name = "等线"
    p.Range.Font.Size = 12
    p.Alignment = 1
    p.Range.InsertParagraphAfter()

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)  # 7 = wdPageBreak

# ═══════════════════════════════════════════
# 使用说明
# ═══════════════════════════════════════════

insert_heading("📖 使用说明", 1)
insert_body("本文档是你的网文写作工作台。以下各节对应写作的五个阶段：")
insert_body("  ① 世界观构建 → ② 人物设计 → ③ 剧情大纲 → ④ 章节写作 → ⑤ 润色修改")
insert_body("")
insert_body("操作方式：")

insert_body("🔹 模式A（自己写）：直接在各节的【填写区】输入你的想法。")
insert_body("🔹 模式B（AI辅助）：选中各节末尾的「AI提示词」，复制发送给AI，")
insert_body("   然后将AI返回的内容粘贴到对应的【填写区】。")

insert_divider()

insert_body("快捷键提示：", bold=True)
insert_body("  Ctrl+Shift+N → 下一节 | Ctrl+Enter → 分页")
insert_body("  选中文字后右键 → 可以对不同部分设置不同颜色标记")

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)

# ═══════════════════════════════════════════
# 第一阶段：世界观构建
# ═══════════════════════════════════════════

insert_heading("🌍 第一阶段：世界观构建", 1)

insert_body("目标：定义小说世界的基本规则、力量体系、社会结构和历史背景。")
insert_body("完成后，你的世界就有了支撑故事运转的骨架。")
insert_body("")

# 1.1 世界背景
insert_heading("1.1 世界背景", 2)

insert_field_label("【引导问题】请逐一思考并填写：")

field_items = [
    "❶ 世界类型：这是一个什么样的世界？\n   参考：古代王朝 / 未来星际 / 现代都市+异能 / 异世界大陆 / 末日废土 / 灵气复苏...",
    "❷ 时代背景：故事发生在什么时代？\n   参考：架空王朝 / 公元2045年 / 洪荒上古 / 近未来2100年...",
    "❸ 世界规模：故事发生在多大范围内？\n   参考：一座城市 / 一片大陆 / 多个位面 / 整个宇宙...",
    "❹ 核心冲突：世界面临的最大矛盾是什么？\n   参考：王朝更迭 / 外星入侵 / 灵气复苏 / 系统降临 / 资源枯竭...",
    "❺ 世界特色：这个世界最吸引人的3个独特设定是什么？",
]
for item in field_items:
    insert_field_label(item)
    insert_body("")
    insert_body("【填写区】")
    for _ in range(3):
        insert_body("")
    insert_divider()

insert_body("")
insert_body("📋 复制以下内容发给AI，获取详细设定：", bold=True)
insert_body("")

worldbuilding_prompt = """
【AI提示词 - 世界背景】
你是一位专业的网络小说世界观架构师。请根据以下框架，构建一个逻辑自洽、细节丰富的世界：

小说类型：都市
核心理念：__________（请填写）

请详细描述：
1. 世界类型和基本特征（至少5个具体细节）
2. 时代背景和社会氛围（至少3个标志性事件）
3. 世界规模和空间布局
4. 这个世界面临的核心矛盾
5. 3个让世界与众不同的独特设定

要求：每个设定都要能服务于后续故事，不要架空到与主线无关。
"""
insert_prompt_box(worldbuilding_prompt)

insert_body("")
insert_body("【AI返回内容-粘贴区】", bold=True)
for _ in range(5):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

# 1.2 力量体系
insert_heading("1.2 力量体系", 2)

insert_field_label("【引导问题】")
insert_field_label("❶ 力量来源：这个世界的力量从哪里来？")
insert_field_label("   参考：灵气修炼 / 基因觉醒 / 科技改造 / 系统赋予 / 血脉传承 / 契约...")
insert_field_label("❷ 等级体系：列出完整的等级划分（5-10级），每级附简短说明")
insert_field_label("   格式：Lv1 觉醒者 - 初步感知力量 → Lv2 ... → Lv10 ...")
insert_field_label("❸ 提升方式：如何获取和提升力量？")
insert_field_label("❹ 限制与代价：越强的力量有什么代价或限制？")

insert_body("")
insert_body("【填写区】")
for _ in range(8):
    insert_body("")

insert_body("")
insert_body("📋 AI提示词：", bold=True)
power_prompt = """
【AI提示词 - 力量体系】
请设计一个完整的都市异能力量体系：

要求：
1. 力量来源的创新性解释（不要套用灵气/斗气，给出一个新机制）
2. 完整的等级划分（5-10级），每级写清楚：名称、标志性能力、代表角色示例
3. 修炼/提升方式的详细机制
4. 力量体系的平衡设计：克制关系、使用限制、副作用
5. 这个体系如何创造「爽点」：主角在这个体系中的特殊优势
"""
insert_prompt_box(power_prompt)

insert_body("")
insert_body("【AI返回内容-粘贴区】", bold=True)
for _ in range(5):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

# 1.3 社会结构
insert_heading("1.3 社会结构", 2)

insert_field_label("【引导问题】")
insert_field_label("❶ 势力分布：列出至少3个主要势力")
insert_field_label("   每个势力说明：名称 / 宗旨 / 代表人物 / 与主角关系")
insert_field_label("❷ 社会阶层：社会如何分层？")
insert_field_label("❸ 经济体系：货币、资源的流动方式")
insert_field_label("❹ 文化禁忌：有哪些规则绝对不能打破？")

insert_body("")
insert_body("【填写区】")
for _ in range(8):
    insert_body("")

insert_body("")
insert_body("📋 AI提示词 - 社会结构", bold=True)
insert_prompt_box("""【AI提示词 - 社会结构】
请设计这个世界的社会组织架构：
1. 至少5个势力组织（觉醒者协会、地下组织、政府机构、财阀、雇佣兵团...）
2. 每个势力：名称、宗旨、实力层级、与主角的利害关系
3. 社会阶层的划分依据
4. 主要的资源和经济运作方式
5. 社会隐藏规则：普通人不知道但觉醒者必须遵守的规则
""")
insert_body("【AI返回内容-粘贴区】", bold=True)
for _ in range(5):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

# 1.4 & 1.5 地理 + 历史
insert_heading("1.4 地理版图", 2)
insert_field_label("【引导问题】")
insert_field_label("❶ 主要区域：故事发生的主要地点（城市/区域/秘境）")
insert_field_label("❷ 关键地点：最重要的3-5个地点及各自的意义")
insert_field_label("❸ 特色场所：1-2个有独特规则或氛围的场景")
insert_body("【填写区】")
for _ in range(6):
    insert_body("")
insert_body("📋 AI提示词 - 地理版图", bold=True)
insert_prompt_box("""【AI提示词 - 地理版图】
请设计故事的主要舞台：
1. 核心城市/区域的详细设定
2. 5个关键地点（觉醒局总部、地下交易市场、主角的安全屋、训练基地、最终决战地）
3. 有什么独特的空间规则或秘境？
4. 地区的势力分布图（哪个区域是谁的地盘）
""")
insert_body("【AI返回-粘贴区】", bold=True)
for _ in range(4):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

insert_heading("1.5 历史与秘密", 2)
insert_field_label("❶ 3个改变世界格局的「大事件」")
insert_field_label("❷ 世界隐藏的真相（读者慢慢才能知道的）")
insert_field_label("❸ 神话传说的真相")
insert_body("【填写区】")
for _ in range(6):
    insert_body("")
insert_body("📋 AI提示词 - 历史秘密", bold=True)
insert_prompt_box("""【AI提示词 - 历史与秘密】
请构建这个世界的历史暗线：
1. 什么叫「灵涌事件」？发生在什么时候？谁策划的？
2. 觉醒者的起源真相
3. 至少1个官方历史是谎言、真实被掩盖的事件
4. 主角的能力和这些秘密有什么关系？
""")
insert_body("【AI返回-粘贴区】", bold=True)
for _ in range(4):
    insert_body("")

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)

# ═══════════════════════════════════════════
# 第二阶段：人物设计
# ═══════════════════════════════════════════

insert_heading("👤 第二阶段：人物设计", 1)

insert_body("目标：塑造有血有肉的角色。主角要有成长弧线，反派要有动机，配角要有存在感。")

# 主角
insert_heading("2.1 主角", 2)
char_fields = [
    "【基本信息】姓名 / 年龄 / 性别 / 外貌标志特征",
    "【身份背景】出身 / 成长关键事件 / 公开身份+隐藏身份",
    "【性格】核心性格关键词 / 3个优点+表现 / 2个缺陷+影响 / 口头禅",
    "【能力】核心能力/金手指 / 限制和代价 / 当前等级+成长路径",
    "【动机】终极目标 / 驱动力量 / 底线和价值观",
    "【成长弧线】开篇状态 → 中期转变 → 结局形态",
]
for cf in char_fields:
    insert_field_label(cf)
    insert_body("")
insert_body("【填写区】")
for _ in range(10):
    insert_body("")

insert_body("📋 AI提示词 - 主角设计", bold=True)
insert_prompt_box("""【AI提示词 - 主角设计】
请设计一位都市异能小说的主角，包含：
1. 完整的人设档案（基本信息/外貌/身份/性格/能力/动机）
2. 金手指的详细机制（来源、能力、限制、代价、成长）
3. 为什么读者会喜欢这个角色？
4. 他的性格缺陷如何影响剧情？
5. 给3个具体场景：展示他的性格、展示他的能力、展示他的成长
""")
insert_body("【AI返回-粘贴区】", bold=True)
for _ in range(6):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

# 重要角色
insert_heading("2.2 重要角色", 2)
insert_field_label("【女主/重要女性】姓名 / 性格 / 与主角关系 / 角色弧线")
insert_body("")
insert_field_label("【反派】姓名 / 动机(不要纯恶) / 能力 / 与主角冲突根源 / 魅力点")
insert_body("")
insert_field_label("【导师】姓名 / 教会主角什么 / 结局")
insert_body("")
insert_field_label("【伙伴A】定位 / 特点 / 作用")
insert_body("")
insert_field_label("【伙伴B】定位 / 特点 / 作用")
insert_body("")
insert_field_label("【搞笑担当】特点 / 经典台词思路")
insert_body("")

insert_body("【填写区】")
for _ in range(8):
    insert_body("")

insert_body("📋 AI提示词 - 角色群像", bold=True)
insert_prompt_box("""【AI提示词 - 角色群像设计】
请设计以下角色（每个人物150-300字）：
1. 女主角：不要花瓶，要有独立目标和能力
2. 主要反派：给出他行为的内在逻辑（他为什么认为自己是正确的？）
3. 导师角色：传授什么？命运如何？
4. 2个伙伴：各有独特技能和性格缺陷
5. 1个搞笑角色：缓解紧张但不喧宾夺主
6. 1个亦敌亦友的角色
""")
insert_body("【AI返回-粘贴区】", bold=True)
for _ in range(6):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

# 人物关系
insert_heading("2.3 人物关系网", 2)
insert_field_label("以主角为中心，画出关系图（文字描述即可）")
insert_field_label("标注：亲密程度(1-10) / 信任度(1-10) / 关系性质")
insert_field_label("潜在冲突点（至少3个）")
insert_body("【填写区】")
for _ in range(6):
    insert_body("")

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)

# ═══════════════════════════════════════════
# 第三阶段：剧情大纲
# ═══════════════════════════════════════════

insert_heading("📋 第三阶段：剧情大纲", 1)

insert_body("目标：规划完整的故事情节和节奏。")

insert_heading("3.1 主线剧情", 2)
insert_field_label("【一句话概括】这是一个关于______的故事，主角______，最终______。")
insert_field_label("【三幕结构】")
insert_field_label("  第一幕（开篇）→ 触发事件：")
insert_field_label("  第二幕（对抗）→ 核心挑战：")
insert_field_label("  第三幕（结局）→ 最终解决：")
insert_field_label("【核心冲突】外在冲突 / 内在冲突 / 人际冲突")
insert_body("【填写区】")
for _ in range(8):
    insert_body("")

insert_body("📋 AI提示词 - 主线剧情", bold=True)
insert_prompt_box("""【AI提示词 - 主线剧情设计】
请根据已有的世界观和人物，设计完整的主线剧情：
1. 一句话故事梗概
2. 三幕式结构展开
3. 至少5个重要剧情转折点
4. 最终结局的3种可能方向（选最优的）
5. 这个故事想传达的核心价值观
""")
insert_body("【AI返回-粘贴区】", bold=True)
for _ in range(6):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

insert_heading("3.2 分卷规划", 2)
insert_field_label("请为每卷填写：卷名 / 核心目标 / 主要冲突 / 关键事件(3-5个) / 结尾钩子 / 预估字数")
for i in range(1, 6):
    insert_field_label(f"第{i}卷：")
    insert_body("")

insert_body("📋 AI提示词 - 分卷规划", bold=True)
insert_prompt_box("""【AI提示词 - 分卷规划】
请将小说分为3-5卷，每卷规划：
1. 卷名（要吸引人）
2. 本卷一句话概述
3. 主角本卷的成长目标
4. 5个关键事件
5. 卷末钩子
6. 预估字数
7. 爽点分布：高潮在哪里？打脸爽点在哪里？
""")
insert_body("【AI返回-粘贴区】", bold=True)
for _ in range(6):
    insert_body("")
doc.Paragraphs.Add().Range.InsertBreak(7)

insert_heading("3.3 爽点与钩子", 2)
insert_field_label("开局钩子（前3章怎么抓住读者？）")
insert_field_label("爽点类型清单（打脸/扮猪吃虎/机缘/身份揭露/以弱胜强...）")
insert_field_label("章末钩子策略（至少5种具体方式）")
insert_field_label("重大反转（至少3个读者想不到的转折）")
insert_body("【填写区】")
for _ in range(6):
    insert_body("")

insert_heading("3.4 支线与伏笔", 2)
insert_field_label("支线1：主题 / 涉及人物 / 与主线关系")
insert_field_label("支线2：主题 / 涉及人物 / 与主线关系")
insert_field_label("支线3：主题 / 涉及人物 / 与主线关系")
insert_field_label("伏笔清单（至少5个）：内容 / 埋在哪里 / 在哪里揭 / 影响力")
insert_body("【填写区】")
for _ in range(6):
    insert_body("")

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)

# ═══════════════════════════════════════════
# 第四阶段：章节写作
# ═══════════════════════════════════════════

insert_heading("✍️ 第四阶段：章节写作", 1)

insert_body("目标：逐章创作正文。下面是一个章节模板，每写一章就复制一份。")

insert_heading("4.1 章节模板", 2)
insert_field_label("第___章：________________（标题要吸引人）")
insert_field_label("")
insert_field_label("【本章大纲】")
insert_field_label("  - 本章目标：")
insert_field_label("  - 核心冲突/看点：")
insert_field_label("  - 出场角色：")
insert_field_label("  - 与前章衔接：")
insert_field_label("")
insert_field_label("【正文】")
insert_body("")
insert_body("（在此处书写或粘贴正文）")
for _ in range(8):
    insert_body("")
insert_body("")
insert_field_label("【自查清单】")
insert_field_label("  □ 开头是否够吸引？ □ 结尾有没有钩子？")
insert_field_label("  □ 爽点到位了吗？ □ 人物性格一致吗？")
insert_field_label("  □ 设定有矛盾吗？ □ 字数达标了吗？")

insert_divider()

insert_body("")
insert_body("📋 AI提示词 - 章节写作", bold=True)
insert_prompt_box("""【AI提示词 - 章节写作】
你是一位专业的网络小说写手。请根据以下信息撰写一章内容：

[将上面填好的章节大纲粘贴到此处]

写作要求：
- 字数：2000-4000字
- 开头第一段就要抓住读者
- 对话生动，动作描写有画面感
- 结尾必须有钩子或悬念
- 保持与前文的连贯性
- 人物性格和世界设定不能出错
""")

# 批量大纲区
insert_heading("4.2 批量章节大纲", 2)
insert_field_label("用AI批量生成后续10章的大纲：")
insert_body("")
insert_prompt_box("""【AI提示词 - 批量章节大纲】
请为接下来的10章（第X章到第Y章）生成详细的章节大纲。
每章大纲包含：
1. 章节标题 2. 一句话概括 3. 核心看点
4. 主要出场角色 5. 结尾钩子 6. 本章情感走向
确保每章之间有清晰的逻辑递进。
""")
insert_body("【AI返回的批量大纲-粘贴区】")
for _ in range(12):
    insert_body("")

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)

# ═══════════════════════════════════════════
# 第五阶段：润色修改
# ═══════════════════════════════════════════

insert_heading("🔧 第五阶段：润色修改", 1)

insert_body("目标：检查和提升已完成章节的质量。")

editing_items = [
    ("5.1 设定一致性检查", """【AI提示词 - 一致性检查】
请检查以下章节：
1. 人物能力是否前后矛盾？
2. 世界观设定是否冲突？
3. 人物性格是否一致？
4. 情节逻辑有无漏洞？
请列出所有问题并给出修改建议。

[将需要检查的章节粘贴在下方]"""),
    ("5.2 文笔润色", """【AI提示词 - 文笔润色】
请润色以下内容（保持原意和风格）：
- 提升画面感
- 优化节奏（长短句交替）
- 精简冗余表达
- 增加情感张力
- 标注主要修改处

[将需要润色的内容粘贴在下方]"""),
    ("5.3 钩子与爽点检查", """【AI提示词 - 钩子检查】
请检查以下内容的钩子和爽点：
1. 开头第一段够不够抓人？
2. 章末钩子有力吗？
3. 本章爽点在哪里？铺垫够不够？
4. 有没有水字数的段落？
5. 节奏有没有拖沓的地方？

[将需要检查的章节粘贴在下方]"""),
    ("5.4 对话优化", """【AI提示词 - 对话优化】
请优化以下对话：
1. 每句话是否符合说话人性格？
2. 对话是否推进了剧情？
3. 有没有废话？
4. 潜台词丰富吗？
5. 是否所有人说话方式都一样？

[将需要优化的对话部分粘贴在下方]"""),
]

for title, prompt in editing_items:
    insert_heading(title, 2)
    insert_body("")
    insert_prompt_box(prompt)
    insert_body("")
    insert_body("【AI返回-粘贴区】")
    for _ in range(5):
        insert_body("")
    insert_divider()

# 分页
doc.Paragraphs.Add().Range.InsertBreak(7)

# ═══════════════════════════════════════════
# 附录
# ═══════════════════════════════════════════

insert_heading("📎 附录：写作备忘", 1)

insert_heading("写作进度追踪", 2)
insert_body("□ 世界观构建完成")
insert_body("□ 人物设计完成")
insert_body("□ 剧情大纲完成")
insert_body("□ 第1-10章完成")
insert_body("□ 第11-20章完成")
insert_body("□ 第___章完成")
insert_body("□ 润色完成")
insert_body("□ 定稿")

insert_heading("日常写作清单", 2)
insert_body("□ 今日目标字数：____ 字")
insert_body("□ 实际完成：____ 字")
insert_body("□ 是否有新伏笔？位置：第___章")
insert_body("□ 是否有新角色？名称：_____")
insert_body("□ 需要回头修改的：")

# ═══════════════════════════════════════════
# 保存
# ═══════════════════════════════════════════

doc_path = os.path.join(
    os.path.expanduser("~"), "Desktop",
    f"网文写作工作台_{datetime.now().strftime('%Y%m%d_%H%M')}.docx"
)
doc.SaveAs(doc_path)

print(f"\n{'='*60}")
print(f"  ✅ WPS写作工作台已创建!")
print(f"  📄 保存位置: {doc_path}")
print(f"{'='*60}")
print(f"\n文档包含:")
print(f"  📖 封面 + 使用说明")
print(f"  🌍 世界观构建（5个子维度 + AI提示词）")
print(f"  👤 人物设计（主角/配角/关系网 + AI提示词）")
print(f"  📋 剧情大纲（主线/分卷/爽点/伏笔 + AI提示词）")
print(f"  ✍️ 章节写作（章节模板 + AI提示词）")
print(f"  🔧 润色修改（4种检查工具 + AI提示词）")
print(f"  📎 附录（进度追踪 + 日常清单）")
print(f"\n每个小节都有:")
print(f"  💭 引导问题（帮你理清思路）")
print(f"  ✏️ 填写区（直接在里面写）")
print(f"  📋 AI提示词（选中复制给AI，再把回答粘回来）")
