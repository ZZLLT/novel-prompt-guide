import { useState, useEffect, useCallback } from "react";
import type { PromptTemplate, PromptCategory, PromptHistory } from "../types/prompts";
import { DEFAULT_PROMPT_TEMPLATES } from "../data/defaultPrompts";

const STORAGE_KEY_TEMPLATES = "prompt-templates";
const STORAGE_KEY_HISTORY = "prompt-history";

export function usePromptLibrary() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 初始化：从localStorage加载或使用默认模板
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load templates:", error);
        setTemplates(DEFAULT_PROMPT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_PROMPT_TEMPLATES);
    }

    const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    }
  }, []);

  // 保存到localStorage
  const saveTemplates = useCallback((newTemplates: PromptTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates));
  }, []);

  const saveHistory = useCallback((newHistory: PromptHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
  }, []);

  // 过滤模板
  const filteredTemplates = templates.filter((template) => {
    // 分类筛选
    if (selectedCategory !== "all" && template.category !== selectedCategory) {
      return false;
    }

    // 收藏筛选
    if (showFavoritesOnly && !template.favorite) {
      return false;
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // 添加模板
  const addTemplate = useCallback(
    (template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">) => {
      const newTemplate: PromptTemplate = {
        ...template,
        id: `custom-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      };
      saveTemplates([...templates, newTemplate]);
    },
    [templates, saveTemplates]
  );

  // 更新模板
  const updateTemplate = useCallback(
    (id: string, updates: Partial<PromptTemplate>) => {
      const newTemplates = templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      );
      saveTemplates(newTemplates);
    },
    [templates, saveTemplates]
  );

  // 删除模板
  const deleteTemplate = useCallback(
    (id: string) => {
      saveTemplates(templates.filter((t) => t.id !== id));
    },
    [templates, saveTemplates]
  );

  // 切换收藏
  const toggleFavorite = useCallback(
    (id: string) => {
      const template = templates.find((t) => t.id === id);
      if (template) {
        updateTemplate(id, { favorite: !template.favorite });
      }
    },
    [templates, updateTemplate]
  );

  // 使用模板（增加使用次数）
  const useTemplate = useCallback(
    (id: string, filledContent: string) => {
      const template = templates.find((t) => t.id === id);
      if (template) {
        updateTemplate(id, { usageCount: template.usageCount + 1 });

        // 添加到历史记录
        const newHistoryItem: PromptHistory = {
          id: `history-${Date.now()}`,
          templateId: id,
          content: filledContent,
          timestamp: Date.now(),
        };
        saveHistory([newHistoryItem, ...history].slice(0, 50)); // 最多保存50条
      }
    },
    [templates, history, updateTemplate, saveHistory]
  );

  // 导出模板
  const exportTemplates = useCallback(() => {
    const data = JSON.stringify(templates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-templates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [templates]);

  // 导入模板
  const importTemplates = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as PromptTemplate[];
          // 合并导入的模板，避免ID冲突
          const newTemplates = imported.map((t) => ({
            ...t,
            id: `imported-${Date.now()}-${Math.random()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          saveTemplates([...templates, ...newTemplates]);
        } catch (error) {
          console.error("Failed to import templates:", error);
          alert("导入失败，请检查文件格式");
        }
      };
      reader.readAsText(file);
    },
    [templates, saveTemplates]
  );

  // 重置为默认模板
  const resetToDefault = useCallback(() => {
    if (confirm("确定要重置为默认模板吗？当前的自定义模板将会丢失。")) {
      saveTemplates(DEFAULT_PROMPT_TEMPLATES);
    }
  }, [saveTemplates]);

  return {
    templates: filteredTemplates,
    allTemplates: templates,
    history,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite,
    useTemplate,
    exportTemplates,
    importTemplates,
    resetToDefault,
  };
}
