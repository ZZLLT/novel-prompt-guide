import { useState } from "react";
import { Plus, Search, Download, Upload, Edit, Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import type { Plotline, PlotlineType } from "../../types/plotline";
import { PLOTLINE_TYPES, PLOTLINE_STATUS, PLOTLINE_COLORS } from "../../types/plotline";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type PlotlineManagerProps = {
  plotlines: Plotline[];
  scenes: Array<{ id: string; title: string }>;
  characters: Array<{ id: string; name: string }>;
  onAdd: (plotline: Omit<Plotline, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (id: string, updates: Partial<Plotline>) => void;
  onDelete: (id: string) => void;
  onToggleKeyPoint: (plotlineId: string, keyPointId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export function PlotlineManager({
  plotlines,
  scenes,
  characters,
  onAdd,
  onUpdate,
  onDelete,
  onToggleKeyPoint,
  onExport,
  onImport,
}: PlotlineManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlotline, setEditingPlotline] = useState<Plotline | null>(null);
  const [expandedPlotlines, setExpandedPlotlines] = useState<Set<string>>(new Set());

  // 编辑器状态
  const [formData, setFormData] = useState({
    title: "",
    type: "main" as PlotlineType,
    description: "",
    status: "setup" as Plotline["status"],
    color: PLOTLINE_COLORS[0],
    characters: [] as string[],
    tags: [] as string[],
    scenes: [] as Plotline["scenes"],
    keyPoints: [] as Plotline["keyPoints"],
    progress: 0,
  });

  const [newTag, setNewTag] = useState("");
  const [newKeyPoint, setNewKeyPoint] = useState({ title: "", description: "" });

  // 筛选剧情线
  const filteredPlotlines = plotlines.filter((plotline) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        plotline.title.toLowerCase().includes(query) ||
        plotline.description.toLowerCase().includes(query) ||
        plotline.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleEdit = (plotline: Plotline) => {
    setEditingPlotline(plotline);
    setFormData({
      title: plotline.title,
      type: plotline.type,
      description: plotline.description,
      status: plotline.status,
      color: plotline.color,
      characters: plotline.characters,
      tags: plotline.tags,
      scenes: plotline.scenes,
      keyPoints: plotline.keyPoints,
      progress: plotline.progress,
    });
    setShowEditor(true);
  };

  const handleAdd = () => {
    setEditingPlotline(null);
    setFormData({
      title: "",
      type: "main",
      description: "",
      status: "setup",
      color: PLOTLINE_COLORS[0],
      characters: [],
      tags: [],
      scenes: [],
      keyPoints: [],
      progress: 0,
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert("请输入剧情线标题");
      return;
    }

    if (editingPlotline) {
      onUpdate(editingPlotline.id, formData);
    } else {
      onAdd(formData);
    }

    setShowEditor(false);
    setEditingPlotline(null);
  };

  const handleDelete = (plotline: Plotline) => {
    if (confirm(`确定要删除剧情线「${plotline.title}」吗？`)) {
      onDelete(plotline.id);
    }
  };

  const toggleExpand = (plotlineId: string) => {
    const newExpanded = new Set(expandedPlotlines);
    if (newExpanded.has(plotlineId)) {
      newExpanded.delete(plotlineId);
    } else {
      newExpanded.add(plotlineId);
    }
    setExpandedPlotlines(newExpanded);
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

  const addKeyPoint = () => {
    if (newKeyPoint.title.trim()) {
      setFormData({
        ...formData,
        keyPoints: [
          ...formData.keyPoints,
          {
            id: `keypoint-${Date.now()}`,
            title: newKeyPoint.title,
            description: newKeyPoint.description,
            completed: false,
          }
        ]
      });
      setNewKeyPoint({ title: "", description: "" });
    }
  };

  const removeKeyPoint = (keyPointId: string) => {
    setFormData({
      ...formData,
      keyPoints: formData.keyPoints.filter((kp) => kp.id !== keyPointId)
    });
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

  const toggleCharacter = (characterId: string) => {
    if (formData.characters.includes(characterId)) {
      setFormData({ ...formData, characters: formData.characters.filter((id) => id !== characterId) });
    } else {
      setFormData({ ...formData, characters: [...formData.characters, characterId] });
    }
  };

  // 统计
  const stats = {
    total: plotlines.length,
    main: plotlines.filter((p) => p.type === "main").length,
    subplot: plotlines.filter((p) => p.type === "subplot").length,
    characterArc: plotlines.filter((p) => p.type === "character-arc").length,
    completed: plotlines.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="plotline-manager">
      {/* 工具栏 */}
      <div className="plotline-toolbar">
        <div className="plotline-search">
          <Search size={18} className="search-icon" />
          <Input
            type="search"
            placeholder="搜索剧情线..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="plotline-stats">
          <span className="stat-item">
            共 <strong>{stats.total}</strong> 条
          </span>
          <span className="stat-item">
            主线 <strong>{stats.main}</strong>
          </span>
          <span className="stat-item">
            支线 <strong>{stats.subplot}</strong>
          </span>
          <span className="stat-item">
            完结 <strong>{stats.completed}</strong>
          </span>
        </div>

        <div className="plotline-actions">
          <Button variant="default" onClick={handleAdd}>
            <Plus size={16} />
            创建剧情线
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

      {/* 剧情线列表 */}
      <div className="plotline-list">
        {filteredPlotlines.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">
              {searchQuery ? "没有找到匹配的剧情线" : "还没有创建剧情线"}
            </p>
            <p className="empty-state-desc">
              {searchQuery ? "尝试其他搜索词" : '点击上方"创建剧情线"按钮开始'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAdd}>
                <Plus size={16} />
                创建第一条剧情线
              </Button>
            )}
          </div>
        ) : (
          filteredPlotlines.map((plotline) => {
            const isExpanded = expandedPlotlines.has(plotline.id);
            const completedKeyPoints = plotline.keyPoints.filter((kp) => kp.completed).length;

            return (
              <article key={plotline.id} className="plotline-card">
                <div className="plotline-card-header">
                  <button
                    type="button"
                    className="plotline-expand-btn"
                    onClick={() => toggleExpand(plotline.id)}
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>

                  <div
                    className="plotline-color-indicator"
                    style={{ backgroundColor: plotline.color }}
                  />

                  <div className="plotline-card-title-group">
                    <div className="plotline-card-badges">
                      <span className="plotline-type-badge">
                        {PLOTLINE_TYPES[plotline.type].icon} {PLOTLINE_TYPES[plotline.type].label}
                      </span>
                      <span
                        className="plotline-status-badge"
                        style={{ color: PLOTLINE_STATUS[plotline.status].color }}
                      >
                        {PLOTLINE_STATUS[plotline.status].icon} {PLOTLINE_STATUS[plotline.status].label}
                      </span>
                    </div>
                    <h3 className="plotline-card-title">{plotline.title}</h3>
                  </div>

                  <div className="plotline-card-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${plotline.progress}%`, backgroundColor: plotline.color }}
                      />
                    </div>
                    <span className="progress-text">{plotline.progress}%</span>
                  </div>

                  <div className="plotline-card-actions">
                    <button type="button" onClick={() => handleEdit(plotline)}>
                      <Edit size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(plotline)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="plotline-card-body">
                    {plotline.description && (
                      <p className="plotline-description">{plotline.description}</p>
                    )}

                    {plotline.keyPoints.length > 0 && (
                      <div className="plotline-keypoints">
                        <h4 className="keypoints-title">
                          关键节点 ({completedKeyPoints}/{plotline.keyPoints.length})
                        </h4>
                        <ul className="keypoints-list">
                          {plotline.keyPoints.map((kp) => (
                            <li
                              key={kp.id}
                              className={`keypoint-item ${kp.completed ? "is-completed" : ""}`}
                            >
                              <button
                                type="button"
                                className="keypoint-checkbox"
                                onClick={() => onToggleKeyPoint(plotline.id, kp.id)}
                              >
                                {kp.completed ? (
                                  <CheckCircle2 size={18} color={plotline.color} />
                                ) : (
                                  <Circle size={18} />
                                )}
                              </button>
                              <div className="keypoint-content">
                                <strong>{kp.title}</strong>
                                {kp.description && <p>{kp.description}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plotline.scenes.length > 0 && (
                      <div className="plotline-scenes">
                        <h4 className="scenes-title">关联场景 ({plotline.scenes.length})</h4>
                        <div className="scenes-chips">
                          {plotline.scenes.map((s) => {
                            const scene = scenes.find((sc) => sc.id === s.sceneId);
                            return scene ? (
                              <span key={s.sceneId} className="scene-chip">
                                {scene.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {plotline.characters.length > 0 && (
                      <div className="plotline-characters">
                        <h4 className="characters-title">涉及角色 ({plotline.characters.length})</h4>
                        <div className="characters-chips">
                          {plotline.characters.map((charId) => {
                            const character = characters.find((c) => c.id === charId);
                            return character ? (
                              <span key={charId} className="character-chip">
                                {character.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* 编辑器弹窗 */}
      {showEditor && (
        <div className="modal-backdrop" onClick={() => setShowEditor(false)}>
          <div className="character-editor-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editingPlotline ? "编辑剧情线" : "创建剧情线"}</h2>
              <button type="button" onClick={() => setShowEditor(false)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              <section className="form-section">
                <h3 className="form-section-title">基础信息</h3>

                <div className="form-field">
                  <Label>标题 *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：主角的复仇之路"
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <Label>类型</Label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as PlotlineType })}
                    >
                      {Object.entries(PLOTLINE_TYPES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.icon} {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <Label>状态</Label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Plotline["status"] })}
                    >
                      {Object.entries(PLOTLINE_STATUS).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.icon} {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <Label>颜色</Label>
                    <div className="color-picker">
                      {PLOTLINE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-option ${formData.color === color ? "is-active" : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-field">
                  <Label>描述</Label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="剧情线的整体描述"
                    rows={3}
                  />
                </div>
              </section>

              <section className="form-section">
                <h3 className="form-section-title">关键节点</h3>

                {formData.keyPoints.length > 0 && (
                  <ul className="keypoints-list">
                    {formData.keyPoints.map((kp) => (
                      <li key={kp.id} className="keypoint-item">
                        <div className="keypoint-content">
                          <strong>{kp.title}</strong>
                          {kp.description && <p>{kp.description}</p>}
                        </div>
                        <button type="button" onClick={() => removeKeyPoint(kp.id)}>
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="form-field">
                  <Label>添加关键节点</Label>
                  <Input
                    value={newKeyPoint.title}
                    onChange={(e) => setNewKeyPoint({ ...newKeyPoint, title: e.target.value })}
                    placeholder="节点标题"
                  />
                  <Input
                    value={newKeyPoint.description}
                    onChange={(e) => setNewKeyPoint({ ...newKeyPoint, description: e.target.value })}
                    placeholder="节点描述（可选）"
                    style={{ marginTop: "8px" }}
                  />
                  <Button type="button" onClick={addKeyPoint} style={{ marginTop: "8px" }}>
                    添加节点
                  </Button>
                </div>
              </section>

              {characters.length > 0 && (
                <section className="form-section">
                  <h3 className="form-section-title">涉及角色</h3>
                  <div className="character-select-grid">
                    {characters.map((char) => (
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
                </section>
              )}

              <section className="form-section">
                <h3 className="form-section-title">标签</h3>
                {formData.tags.length > 0 && (
                  <div className="list-chips">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="list-chip">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-with-button">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加标签"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>添加</Button>
                </div>
              </section>
            </div>

            <footer className="modal-footer">
              <Button variant="outline" onClick={() => setShowEditor(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
