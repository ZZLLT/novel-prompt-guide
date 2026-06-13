import { Star, Copy, Edit, Trash2, TrendingUp } from "lucide-react";
import type { PromptTemplate } from "../../types/prompts";
import { PROMPT_CATEGORIES } from "../../types/prompts";

type PromptCardProps = {
  template: PromptTemplate;
  onUse: (template: PromptTemplate) => void;
  onEdit: (template: PromptTemplate) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

export function PromptCard({
  template,
  onUse,
  onEdit,
  onDelete,
  onToggleFavorite,
}: PromptCardProps) {
  const categoryInfo = PROMPT_CATEGORIES[template.category];

  return (
    <article className="prompt-card">
      <div className="prompt-card-header">
        <div className="prompt-card-category">
          <span className="prompt-category-icon">{categoryInfo.icon}</span>
          <span className="prompt-category-label">{categoryInfo.label}</span>
        </div>
        <button
          type="button"
          className={`prompt-favorite-btn ${template.favorite ? "is-favorite" : ""}`}
          onClick={() => onToggleFavorite(template.id)}
          aria-label={template.favorite ? "取消收藏" : "收藏"}
        >
          <Star size={16} fill={template.favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="prompt-card-body">
        <h3 className="prompt-card-title">{template.title}</h3>
        <p className="prompt-card-description">{template.description}</p>

        {template.tags.length > 0 && (
          <div className="prompt-card-tags">
            {template.tags.map((tag) => (
              <span key={tag} className="prompt-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {template.variables.length > 0 && (
          <div className="prompt-card-variables">
            <span className="prompt-variables-label">变量：</span>
            {template.variables.map((variable) => (
              <code key={variable} className="prompt-variable">
                {`{{${variable}}}`}
              </code>
            ))}
          </div>
        )}

        <div className="prompt-card-meta">
          <span className="prompt-meta-item">
            <TrendingUp size={14} />
            使用 {template.usageCount} 次
          </span>
        </div>
      </div>

      <div className="prompt-card-actions">
        <button
          type="button"
          className="prompt-action-btn prompt-action-use"
          onClick={() => onUse(template)}
        >
          <Copy size={16} />
          使用
        </button>
        <button
          type="button"
          className="prompt-action-btn prompt-action-edit"
          onClick={() => onEdit(template)}
        >
          <Edit size={16} />
          编辑
        </button>
        {template.id.startsWith("custom-") && (
          <button
            type="button"
            className="prompt-action-btn prompt-action-delete"
            onClick={() => {
              if (confirm(`确定要删除"${template.title}"吗？`)) {
                onDelete(template.id);
              }
            }}
          >
            <Trash2 size={16} />
            删除
          </button>
        )}
      </div>
    </article>
  );
}
