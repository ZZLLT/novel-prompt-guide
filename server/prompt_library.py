"""
提示词库 - 专业网文AI写作提示词集合
"""
import os
import re
from typing import Dict, List, Optional
from pathlib import Path


class PromptLibrary:
    """提示词库管理器"""

    def __init__(self, prompts_dir: str = "C:\\Users\\31601\\Desktop\\分类提取"):
        self.prompts_dir = prompts_dir
        self.prompts: Dict[str, List[Dict]] = {}
        self._load_all_prompts()

    def _load_all_prompts(self):
        """加载所有提示词文件"""
        if not os.path.exists(self.prompts_dir):
            print(f"提示词目录不存在: {self.prompts_dir}")
            return

        for file_path in Path(self.prompts_dir).glob("*.md"):
            category = file_path.stem
            prompts = self._parse_prompt_file(file_path)
            if prompts:
                self.prompts[category] = prompts
                print(f"加载 {category}: {len(prompts)} 个提示词")

    def _parse_prompt_file(self, file_path: Path) -> List[Dict]:
        """解析单个提示词文件"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            prompts = []
            # 分割每个提示词块
            blocks = re.split(r"\n---\n", content)

            for block in blocks:
                if not block.strip() or block.startswith("#"):
                    continue

                # 提取标题
                title_match = re.search(r"##\s+(.+?)\s+\(ID:", block)
                if not title_match:
                    continue

                title = title_match.group(1).strip()

                # 提取元数据
                author_match = re.search(r"-\s+作者:\s+(.+?)\s+\|", block)
                usage_match = re.search(r"使用:\s+(\d+)", block)
                token_match = re.search(r"Token:\s+(\d+)", block)
                desc_match = re.search(r"-\s+描述:\s+(.+?)$", block, re.MULTILINE)

                # 提取提示词内容
                prompt_match = re.search(r"```\n(.*?)\n```", block, re.DOTALL)
                if not prompt_match:
                    continue

                prompt_content = prompt_match.group(1).strip()

                prompts.append({
                    "title": title,
                    "author": author_match.group(1) if author_match else "未知",
                    "usage": int(usage_match.group(1)) if usage_match else 0,
                    "tokens": int(token_match.group(1)) if token_match else 0,
                    "description": desc_match.group(1).strip() if desc_match else "",
                    "content": prompt_content
                })

            return prompts

        except Exception as e:
            print(f"解析文件 {file_path} 失败: {e}")
            return []

    def get_categories(self) -> List[str]:
        """获取所有分类"""
        return list(self.prompts.keys())

    def get_prompts_by_category(self, category: str) -> List[Dict]:
        """根据分类获取提示词列表"""
        return self.prompts.get(category, [])

    def search_prompts(self, keyword: str) -> List[Dict]:
        """搜索提示词"""
        results = []
        for category, prompts in self.prompts.items():
            for prompt in prompts:
                if (keyword.lower() in prompt["title"].lower() or
                    keyword.lower() in prompt["description"].lower()):
                    results.append({
                        **prompt,
                        "category": category
                    })
        return results

    def get_prompt_by_title(self, title: str) -> Optional[Dict]:
        """根据标题获取提示词"""
        for category, prompts in self.prompts.items():
            for prompt in prompts:
                if prompt["title"] == title:
                    return {**prompt, "category": category}
        return None

    def get_top_prompts(self, limit: int = 10) -> List[Dict]:
        """获取使用最多的提示词"""
        all_prompts = []
        for category, prompts in self.prompts.items():
            for prompt in prompts:
                all_prompts.append({**prompt, "category": category})

        all_prompts.sort(key=lambda x: x["usage"], reverse=True)
        return all_prompts[:limit]

    def get_prompt_for_task(self, task_type: str, context: Dict = None) -> Optional[str]:
        """
        根据任务类型智能选择最合适的提示词

        task_type:
        - character: 角色生成
        - scene: 场景生成
        - outline: 大纲生成
        - continue: 续写
        - polish: 润色
        - expand: 扩写
        - title: 书名生成
        - summary: 简介生成
        - worldview: 世界观生成
        """
        task_mapping = {
            "character": "人设生成器",
            "scene": ["细纲生成", "黄金开篇生成"],
            "outline": ["大纲相关", "脑洞生成器"],
            "continue": "续写",
            "polish": "润色",
            "expand": "扩写",
            "title": "书名生成器",
            "summary": "简介生成器",
            "worldview": "世界观生成器",
            "inspiration": "灵感风暴",
            "review": "审稿AI编辑"
        }

        category = task_mapping.get(task_type)
        if not category:
            return None

        # 支持多个分类
        if isinstance(category, list):
            for cat in category:
                prompts = self.get_prompts_by_category(cat)
                if prompts:
                    # 返回使用最多的
                    prompts.sort(key=lambda x: x["usage"], reverse=True)
                    return prompts[0]["content"]
        else:
            prompts = self.get_prompts_by_category(category)
            if prompts:
                # 返回使用最多的
                prompts.sort(key=lambda x: x["usage"], reverse=True)
                return prompts[0]["content"]

        return None

    def get_statistics(self) -> Dict:
        """获取统计信息"""
        total_prompts = sum(len(prompts) for prompts in self.prompts.values())
        total_usage = sum(
            prompt["usage"]
            for prompts in self.prompts.values()
            for prompt in prompts
        )

        return {
            "total_categories": len(self.prompts),
            "total_prompts": total_prompts,
            "total_usage": total_usage,
            "categories": {
                category: len(prompts)
                for category, prompts in self.prompts.items()
            }
        }


# 全局实例
prompt_library = PromptLibrary()
