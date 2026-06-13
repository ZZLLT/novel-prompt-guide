import { useState } from "react";
import { X, Film, Sparkles } from "lucide-react";
import type { SceneCard, SceneType, SceneStatus } from "../../types/scene";
import { SCENE_TYPES, SCENE_STATUS, SCENE_MOODS, SCENE_PURPOSES } from "../../types/scene";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type SceneCardEditorProps = {
  scene?: SceneCard;
  onSave: (scene: Omit<SceneCard, "id" | "createdAt" | "updatedAt" | "order">) => void;
  onClose: () => void;
  availableCharacters?: Array<{ id: string; name: string }>;
};

export function SceneCardEditor({ scene, onSave, onClose, availableCharacters = [] }: SceneCardEditorProps) {
  const [formData, setFormData] = useState<Omit<SceneCard, "id" | "createdAt" | "updatedAt" | "order">>({
    title: scene?.title || "",
    type: scene?.type || "scene",
    status: scene?.status || "draft",
    summary: scene?.summary || "",
    content: scene?.content || "",
    notes: scene?.notes || "",
    wordCount: scene?.wordCount || 0,
    targetWordCount: scene?.targetWordCount,
    characters: scene?.characters || [],
    locations: scene?.locations || [],
    plotlines: scene?.plotlines || [],
    previousScene: scene?.previousScene,
    nextScene: scene?.nextScene,
    purpose: scene?.purpose || "",
    conflict: scene?.conflict || "",
    mood: scene?.mood,
    tags: scene?.tags || [],
  });

  const [newLocation, setNewLocation] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("请输入场景标题");
      return;
    }
    // 计算字数
    const wordCount = formData.content.length;
    onSave({ ...formData, wordCount });
    onClose();
  };

  const addLocation = () => {
    if (newLocation && !formData.locations.includes(newLocation)) {
      setFormData({ ...formData, locations: [...formData.locations, newLocation] });
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setFormData({ ...formData, locations: formData.locations.filter((l) => l !== location) });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const toggleCharacter = (characterId: string) => {
    if (formData.characters.includes(characterId)) {
      setFormData({ ...formData, characters: formData.characters.filter((id) => id !== characterId) });
    } else {
      setFormData({ ...formData, characters: [...formData.characters, characterId] });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="character-editor-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-header-title">
            <Film size={20} />
            <h2>{scene ? "编辑场景" : "创建场景"}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="character-editor-form">
          <div className="modal-body">
            {/* 基础信息 */}
            <section className="form-section">
              <h3 className="form-section-title">基础信息</h3>

              <div className="form-field">
                <Label className="form-label">场景标题 *</Label>
                <Input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：主角登场 / 第一章：命运之夜"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <Label className="form-label">类型</Label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as SceneType })}
                  >
                    {Object.entries(SCENE_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <Label className="form-label">状态</Label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SceneStatus })}
                  >
                    {Object.entries(SCENE_STATUS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {value.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <Label className="form-label">场景概要</Label>
                <textarea
                  className="form-textarea"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="简要描述这个场景发生了什么"
                  rows={3}
                />
              </div>
            </section>

            {/* 内容 */}
            <section className="form-section">
              <h3 className="form-section-title">场景内容</h3>

              <div className="form-field">
                <Label className="form-label">正文内容</Label>
                <textarea
                  className="form-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="场景的详细内容..."
                  rows={10}
                />
                <span className="form-helper">
                  当前字数：{formData.content.length}
                  {formData.targetWordCount && ` / 目标：${formData.targetWordCount}`}
                </span>
              </div>

              <div className="form-field">
                <Label className="form-label">目标字数（可选）</Label>
                <Input
                  type="number"
                  value={formData.targetWordCount || ""}
                  onChange={(e) => setFormData({ ...formData, targetWordCount: e.target.valueAsNumber || undefined })}
                  placeholder="设置目标字数"
                />
              </div>
            </section>

            {/* 目的和冲突 */}
            <section className="form-section">
              <h3 className="form-section-title">目的与冲突</h3>

              <div className="form-field">
                <Label className="form-label">场景目的</Label>
                <select
                  className="form-select"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                >
                  <option value="">选择目的</option>
                  {SCENE_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <Label className="form-label">主要冲突</Label>
                <Input
                  type="text"
                  value={formData.conflict}
                  onChange={(e) => setFormData({ ...formData, conflict: e.target.value })}
                  placeholder="例如：主角与反派的对峙"
                />
              </div>

              <div className="form-field">
                <Label className="form-label">情绪基调</Label>
                <select
                  className="form-select"
                  value={formData.mood || ""}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value || undefined })}
                >
                  <option value="">选择情绪基调</option>
                  {SCENE_MOODS.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* 关联 */}
            <section className="form-section">
              <h3 className="form-section-title">关联信息</h3>

              {availableCharacters.length > 0 && (
                <div className="form-field">
                  <Label className="form-label">涉及角色</Label>
                  <div className="character-select-grid">
                    {availableCharacters.map((char) => (
                      <label key={char.id} className="character-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.characters.includes(char.id)}
                          onChange={() => toggleCharacter(char.id)}
                        />
                        <span>{char.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-field">
                <Label className="form-label">涉及地点</Label>
                {formData.locations.length > 0 && (
                  <div className="list-chips">
                    {formData.locations.map((location) => (
                      <span key={location} className="list-chip">
                        {location}
                        <button type="button" onClick={() => removeLocation(location)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-with-button">
                  <Input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="添加地点"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLocation();
                      }
                    }}
                  />
                  <Button type="button" onClick={addLocation}>
                    添加
                  </Button>
                </div>
              </div>
            </section>

            {/* 其他信息 */}
            <section className="form-section">
              <h3 className="form-section-title">其他信息</h3>

              <div className="form-field">
                <Label className="form-label">笔记</Label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="备注、想法、注意事项"
                  rows={3}
                />
              </div>

              <div className="form-field">
                <Label className="form-label">标签</Label>
                {formData.tags.length > 0 && (
                  <div className="list-chips">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="list-chip">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-with-button">
                  <Input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加标签"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>
                    添加
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <footer className="modal-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">
              <Sparkles size={16} />
              保存场景
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
