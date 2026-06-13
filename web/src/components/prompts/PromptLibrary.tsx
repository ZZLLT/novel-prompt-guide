import { useState } from "react";
import { Search, Plus, Download, Upload, RefreshCw, Star, Filter } from "lucide-react";
import { usePromptLibrary } from "../../hooks/usePromptLibrary";
import { PromptCard } from "./PromptCard";
import { PromptUseDialog } from "./PromptUseDialog";
import type { PromptTemplate, PromptCategory } from "../../types/prompts";
import { PROMPT_CATEGORIES } from "../../types/prompts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type PromptLibraryProps = {
  onSendToAssistant?: (content: string) => void;
};

export function PromptLibrary({ onSendToAssistant }: PromptLibraryProps) {
  const {
    templates,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    toggleFavorite,
    useTemplate,
    exportTemplates,
    importTemplates,
    resetToDefault,
    deleteTemplate,
  } = usePromptLibrary();

  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const handleUse = (template: PromptTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseConfirm = (filledContent: string) => {
    if (selectedTemplate) {
      useTemplate(selectedTemplate.id, filledContent);
      if (onSendToAssistant) {
        onSendToAssistant(filledContent);
      }
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importTemplates(file);
      }
    };
    input.click();
  };

  const categories: Array<{ key: PromptCategory | "all"; label: string; icon: string }> = [
    { key: "all", label: "全部", icon: "📚" },
    ...Object.entries(PROMPT_CATEGORIES).map(([key, value]) => ({
      key: key as PromptCategory,
      label: value.label,
      icon: value.icon,
    })),
  ];

  return (
    <div className="prompt-library">
      {/* 工具栏 */}
      <div className="prompt-library-toolbar">
        <div className="prompt-library-search">
          <Search size={18} className="search-icon" />
          <Input
            type="search"
            placeholder="搜索提示词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="prompt-library-actions">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star size={16} fill={showFavoritesOnly ? "currentColor" : "none"} />
            {showFavoritesOnly ? "显示全部" : "仅收藏"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload size={16} />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={exportTemplates}>
            <Download size={16} />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RefreshCw size={16} />
            重置
          </Button>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="prompt-library-categories">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`prompt-category-btn ${selectedCategory === cat.key ? "is-active" : ""}`}
            onClick={() => setSelectedCategory(cat.key as PromptCategory | "all")}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="prompt-library-stats">
        <span>共 {templates.length} 个提示词</span>
        {searchQuery && <span>搜索结果: {templates.length} 个</span>}
      </div>

      {/* 提示词卡片网格 */}
      <div className="prompt-library-grid">
        {templates.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">没有找到提示词</p>
            <p className="empty-state-desc">
              {searchQuery ? "尝试其他搜索词" : "选择其他分类"}
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <PromptCard
              key={template.id}
              template={template}
              onUse={handleUse}
              onEdit={() => {
                // TODO: 实现编辑功能
                alert("编辑功能即将推出");
              }}
              onDelete={deleteTemplate}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      {/* 使用对话框 */}
      <PromptUseDialog
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onUse={handleUseConfirm}
      />
    </div>
  );
}
