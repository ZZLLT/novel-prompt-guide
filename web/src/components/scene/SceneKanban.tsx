import { useState } from "react";
import { Plus, Search, Download, Upload, ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import type { SceneCard, SceneStatus } from "../../types/scene";
import { SCENE_STATUS, SCENE_TYPES } from "../../types/scene";
import { SceneCardEditor } from "./SceneCardEditor";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type SceneKanbanProps = {
  scenes: SceneCard[];
  onAdd: (scene: Omit<SceneCard, "id" | "createdAt" | "updatedAt" | "order">) => void;
  onUpdate: (id: string, updates: Partial<SceneCard>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onSelect: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  selectedId?: string | null;
  availableCharacters?: Array<{ id: string; name: string }>;
};

export function SceneKanban({
  scenes,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
  onSelect,
  onExport,
  onImport,
  selectedId,
  availableCharacters = [],
}: SceneKanbanProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingScene, setEditingScene] = useState<SceneCard | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // 筛选场景
  const filteredScenes = scenes.filter((scene) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        scene.title.toLowerCase().includes(query) ||
        scene.summary.toLowerCase().includes(query) ||
        scene.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // 按状态分组
  const scenesByStatus: Record<SceneStatus, SceneCard[]> = {
    draft: filteredScenes.filter((s) => s.status === "draft"),
    "in-progress": filteredScenes.filter((s) => s.status === "in-progress"),
    completed: filteredScenes.filter((s) => s.status === "completed"),
    "needs-revision": filteredScenes.filter((s) => s.status === "needs-revision"),
  };

  const handleEdit = (scene: SceneCard) => {
    setEditingScene(scene);
    setShowEditor(true);
  };

  const handleAdd = () => {
    setEditingScene(null);
    setShowEditor(true);
  };

  const handleSave = (scene: Omit<SceneCard, "id" | "createdAt" | "updatedAt" | "order">) => {
    if (editingScene) {
      onUpdate(editingScene.id, scene);
    } else {
      onAdd(scene);
    }
    setShowEditor(false);
    setEditingScene(null);
  };

  const handleDelete = (scene: SceneCard) => {
    if (confirm(`确定要删除场景「${scene.title}」吗？`)) {
      onDelete(scene.id);
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

  // 计算统计
  const totalScenes = scenes.length;
  const totalWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);
  const completedScenes = scenes.filter((s) => s.status === "completed").length;
  const completionRate = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  return (
    <div className="scene-kanban">
      {/* 工具栏 */}
      <div className="scene-kanban-toolbar">
        <div className="scene-kanban-search">
          <Search size={18} className="search-icon" />
          <Input
            type="search"
            placeholder="搜索场景..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="scene-kanban-stats">
          <span className="stat-item">
            <strong>{totalScenes}</strong> 个场景
          </span>
          <span className="stat-item">
            <strong>{totalWords.toLocaleString()}</strong> 字
          </span>
          <span className="stat-item">
            完成度 <strong>{completionRate}%</strong>
          </span>
        </div>

        <div className="scene-kanban-actions">
          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "kanban" ? "is-active" : ""}
              onClick={() => setViewMode("kanban")}
            >
              看板
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
            >
              列表
            </button>
          </div>

          <Button variant="default" onClick={handleAdd}>
            <Plus size={16} />
            创建场景
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

      {/* 看板视图 */}
      {viewMode === "kanban" && (
        <div className="scene-kanban-board">
          {(Object.entries(SCENE_STATUS) as Array<[SceneStatus, typeof SCENE_STATUS[SceneStatus]]>).map(
            ([status, config]) => (
              <div key={status} className="scene-kanban-column">
                <div className="scene-kanban-column-header">
                  <span className="column-icon">{config.icon}</span>
                  <h3>{config.label}</h3>
                  <span className="column-count">{scenesByStatus[status].length}</span>
                </div>

                <div className="scene-kanban-column-body">
                  {scenesByStatus[status].length === 0 ? (
                    <div className="scene-kanban-empty">
                      <p>暂无{config.label}场景</p>
                    </div>
                  ) : (
                    scenesByStatus[status].map((scene) => (
                      <article
                        key={scene.id}
                        className={`scene-kanban-card ${selectedId === scene.id ? "is-selected" : ""}`}
                        onClick={() => onSelect(scene.id)}
                      >
                        <div className="scene-card-header">
                          <span className="scene-type-badge">{SCENE_TYPES[scene.type].icon}</span>
                          <div className="scene-card-actions">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(scene);
                              }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(scene);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="scene-card-title">{scene.title}</h4>

                        {scene.summary && (
                          <p className="scene-card-summary">{scene.summary}</p>
                        )}

                        <div className="scene-card-meta">
                          <span className="meta-item">{scene.wordCount} 字</span>
                          {scene.characters.length > 0 && (
                            <span className="meta-item">{scene.characters.length} 个角色</span>
                          )}
                        </div>

                        {scene.mood && (
                          <div className="scene-card-mood">
                            {scene.mood}
                          </div>
                        )}

                        {scene.tags.length > 0 && (
                          <div className="scene-card-tags">
                            {scene.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="tag-chip">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === "list" && (
        <div className="scene-list">
          {filteredScenes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">
                {searchQuery ? "没有找到匹配的场景" : "还没有创建场景"}
              </p>
              <p className="empty-state-desc">
                {searchQuery ? "尝试其他搜索词" : '点击上方"创建场景"按钮开始'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAdd}>
                  <Plus size={16} />
                  创建第一个场景
                </Button>
              )}
            </div>
          ) : (
            <table className="scene-table">
              <thead>
                <tr>
                  <th>顺序</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>字数</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenes.map((scene, index) => (
                  <tr
                    key={scene.id}
                    className={selectedId === scene.id ? "is-selected" : ""}
                    onClick={() => onSelect(scene.id)}
                  >
                    <td>
                      <div className="order-controls">
                        <span>{index + 1}</span>
                        <div className="order-buttons">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMove(scene.id, "up");
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={index === filteredScenes.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMove(scene.id, "down");
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{scene.title}</strong>
                    </td>
                    <td>
                      <span className="type-badge">
                        {SCENE_TYPES[scene.type].icon} {SCENE_TYPES[scene.type].label}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ color: SCENE_STATUS[scene.status].color }}
                      >
                        {SCENE_STATUS[scene.status].icon} {SCENE_STATUS[scene.status].label}
                      </span>
                    </td>
                    <td>{scene.wordCount.toLocaleString()}</td>
                    <td>{scene.characters.length}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(scene);
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(scene);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 编辑器弹窗 */}
      {showEditor && (
        <SceneCardEditor
          scene={editingScene || undefined}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingScene(null);
          }}
          availableCharacters={availableCharacters}
        />
      )}
    </div>
  );
}
