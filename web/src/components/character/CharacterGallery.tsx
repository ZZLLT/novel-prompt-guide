import { useState } from "react";
import { User, Edit, Trash2, Plus, Search, Download, Upload } from "lucide-react";
import type { CharacterCard, CharacterRole } from "../../types/character";
import { CHARACTER_ROLES } from "../../types/character";
import { CharacterCardEditor } from "./CharacterCardEditor";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type CharacterGalleryProps = {
  characters: CharacterCard[];
  onAdd: (character: Omit<CharacterCard, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (id: string, updates: Partial<CharacterCard>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  selectedId?: string | null;
};

export function CharacterGallery({
  characters,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
  onExport,
  onImport,
  selectedId,
}: CharacterGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<CharacterRole | "all">("all");
  const [editingCharacter, setEditingCharacter] = useState<CharacterCard | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // 筛选角色
  const filteredCharacters = characters.filter((char) => {
    // 角色类型筛选
    if (roleFilter !== "all" && char.role !== roleFilter) {
      return false;
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        char.name.toLowerCase().includes(query) ||
        char.background.toLowerCase().includes(query) ||
        char.traits.some((trait) => trait.toLowerCase().includes(query)) ||
        char.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleEdit = (character: CharacterCard) => {
    setEditingCharacter(character);
    setShowEditor(true);
  };

  const handleAdd = () => {
    setEditingCharacter(null);
    setShowEditor(true);
  };

  const handleSave = (character: Omit<CharacterCard, "id" | "createdAt" | "updatedAt">) => {
    if (editingCharacter) {
      onUpdate(editingCharacter.id, character);
    } else {
      onAdd(character);
    }
    setShowEditor(false);
    setEditingCharacter(null);
  };

  const handleDelete = (character: CharacterCard) => {
    if (confirm(`确定要删除角色"${character.name}"吗？`)) {
      onDelete(character.id);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImport(file);
      }
    };
    input.click();
  };

  // 按角色类型分组统计
  const roleStats = {
    all: characters.length,
    protagonist: characters.filter((c) => c.role === "protagonist").length,
    supporting: characters.filter((c) => c.role === "supporting").length,
    antagonist: characters.filter((c) => c.role === "antagonist").length,
    minor: characters.filter((c) => c.role === "minor").length,
  };

  return (
    <div className="character-gallery">
      {/* 工具栏 */}
      <div className="character-gallery-toolbar">
        <div className="character-gallery-search">
          <Search size={18} className="search-icon" />
          <Input
            type="search"
            placeholder="搜索角色..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="character-gallery-actions">
          <Button variant="default" onClick={handleAdd}>
            <Plus size={16} />
            创建角色
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload size={16} />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={16} />
            导出
          </Button>
        </div>
      </div>

      {/* 角色类型筛选 */}
      <div className="character-role-filters">
        <button
          type="button"
          className={`role-filter-btn ${roleFilter === "all" ? "is-active" : ""}`}
          onClick={() => setRoleFilter("all")}
        >
          📚 全部 ({roleStats.all})
        </button>
        {Object.entries(CHARACTER_ROLES).map(([key, value]) => (
          <button
            key={key}
            type="button"
            className={`role-filter-btn ${roleFilter === key ? "is-active" : ""}`}
            onClick={() => setRoleFilter(key as CharacterRole)}
          >
            {value.icon} {value.label} ({roleStats[key as keyof typeof roleStats]})
          </button>
        ))}
      </div>

      {/* 角色卡片网格 */}
      {filteredCharacters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={60} />
          </div>
          <p className="empty-state-title">
            {searchQuery ? "没有找到匹配的角色" : "还没有创建角色"}
          </p>
          <p className="empty-state-desc">
            {searchQuery ? "尝试其他搜索词" : '点击上方"创建角色"按钮开始'}
          </p>
          {!searchQuery && (
            <Button onClick={handleAdd}>
              <Plus size={16} />
              创建第一个角色
            </Button>
          )}
        </div>
      ) : (
        <div className="character-cards-grid">
          {filteredCharacters.map((character) => (
            <article
              key={character.id}
              className={`character-card ${selectedId === character.id ? "is-selected" : ""}`}
              onClick={() => onSelect(character.id)}
            >
              <div className="character-card-header">
                <div className="character-card-role">
                  <span className="role-icon">{CHARACTER_ROLES[character.role].icon}</span>
                  <span className="role-label">{CHARACTER_ROLES[character.role].label}</span>
                </div>
                <div className="character-card-actions">
                  <button
                    type="button"
                    className="character-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(character);
                    }}
                    aria-label="编辑角色"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    className="character-action-btn character-action-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(character);
                    }}
                    aria-label="删除角色"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="character-card-body">
                <div className="character-card-avatar">
                  {character.avatar ? (
                    <img src={character.avatar} alt={character.name} />
                  ) : (
                    <User size={40} />
                  )}
                </div>

                <h3 className="character-card-name">{character.name}</h3>

                {character.occupation && (
                  <p className="character-card-occupation">{character.occupation}</p>
                )}

                {character.traits.length > 0 && (
                  <div className="character-card-traits">
                    {character.traits.slice(0, 4).map((trait) => (
                      <span key={trait} className="trait-badge">
                        {trait}
                      </span>
                    ))}
                    {character.traits.length > 4 && (
                      <span className="trait-badge trait-more">
                        +{character.traits.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {character.motivation && (
                  <div className="character-card-info">
                    <span className="info-label">动机：</span>
                    <span className="info-value">{character.motivation}</span>
                  </div>
                )}

                {character.relationships.length > 0 && (
                  <div className="character-card-meta">
                    <span className="meta-item">
                      {character.relationships.length} 个关系
                    </span>
                  </div>
                )}

                {character.tags.length > 0 && (
                  <div className="character-card-tags">
                    {character.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 编辑器弹窗 */}
      {showEditor && (
        <CharacterCardEditor
          character={editingCharacter || undefined}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingCharacter(null);
          }}
        />
      )}
    </div>
  );
}
