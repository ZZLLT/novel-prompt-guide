import { TrendingUp, Target, BookOpen, Users, Film, GitBranch, Award, Calendar } from "lucide-react";
import type { CharacterCard } from "../../types/character";
import type { SceneCard } from "../../types/scene";
import type { Plotline } from "../../types/plotline";

type ProgressDashboardProps = {
  characters: CharacterCard[];
  scenes: SceneCard[];
  plotlines: Plotline[];
};

export function ProgressDashboard({ characters, scenes, plotlines }: ProgressDashboardProps) {
  // 计算统计数据
  const totalWords = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
  const completedScenes = scenes.filter((s) => s.status === "completed").length;
  const sceneCompletionRate = scenes.length > 0 ? Math.round((completedScenes / scenes.length) * 100) : 0;

  const completedPlotlines = plotlines.filter((p) => p.status === "completed").length;
  const plotlineCompletionRate = plotlines.length > 0 ? Math.round((completedPlotlines / plotlines.length) * 100) : 0;

  const mainPlotlines = plotlines.filter((p) => p.type === "main");
  const subPlotlines = plotlines.filter((p) => p.type === "subplot");
  const characterArcs = plotlines.filter((p) => p.type === "character-arc");

  const overallProgress = plotlines.length > 0
    ? Math.round(plotlines.reduce((sum, p) => sum + p.progress, 0) / plotlines.length)
    : 0;

  // 场景状态分布
  const scenesByStatus = {
    draft: scenes.filter((s) => s.status === "draft").length,
    inProgress: scenes.filter((s) => s.status === "in-progress").length,
    completed: scenes.filter((s) => s.status === "completed").length,
    needsRevision: scenes.filter((s) => s.status === "needs-revision").length,
  };

  // 剧情线状态分布
  const plotlinesByStatus = {
    setup: plotlines.filter((p) => p.status === "setup").length,
    development: plotlines.filter((p) => p.status === "development").length,
    climax: plotlines.filter((p) => p.status === "climax").length,
    resolution: plotlines.filter((p) => p.status === "resolution").length,
    completed: plotlines.filter((p) => p.status === "completed").length,
  };

  // 角色角色分布
  const charactersByRole = {
    protagonist: characters.filter((c) => c.role === "protagonist").length,
    supporting: characters.filter((c) => c.role === "supporting").length,
    antagonist: characters.filter((c) => c.role === "antagonist").length,
    minor: characters.filter((c) => c.role === "minor").length,
  };

  return (
    <div className="progress-dashboard">
      {/* 概览卡片 */}
      <div className="dashboard-overview">
        <div className="overview-card">
          <div className="overview-card-icon" style={{ background: "#dbeafe" }}>
            <BookOpen size={24} color="#3b82f6" />
          </div>
          <div className="overview-card-content">
            <div className="overview-card-label">总字数</div>
            <div className="overview-card-value">{totalWords.toLocaleString()}</div>
            <div className="overview-card-sublabel">
              {scenes.length} 个场景
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card-icon" style={{ background: "#fef3c7" }}>
            <Film size={24} color="#f59e0b" />
          </div>
          <div className="overview-card-content">
            <div className="overview-card-label">场景进度</div>
            <div className="overview-card-value">{sceneCompletionRate}%</div>
            <div className="overview-card-sublabel">
              {completedScenes}/{scenes.length} 已完成
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card-icon" style={{ background: "#fce7f3" }}>
            <GitBranch size={24} color="#ec4899" />
          </div>
          <div className="overview-card-content">
            <div className="overview-card-label">剧情线进度</div>
            <div className="overview-card-value">{plotlineCompletionRate}%</div>
            <div className="overview-card-sublabel">
              {completedPlotlines}/{plotlines.length} 已完结
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card-icon" style={{ background: "#dcfce7" }}>
            <Users size={24} color="#10b981" />
          </div>
          <div className="overview-card-content">
            <div className="overview-card-label">角色总数</div>
            <div className="overview-card-value">{characters.length}</div>
            <div className="overview-card-sublabel">
              {charactersByRole.protagonist} 主角 · {charactersByRole.supporting} 配角
            </div>
          </div>
        </div>
      </div>

      {/* 总体进度 */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">
          <Target size={18} />
          总体进度
        </h3>
        <div className="progress-card">
          <div className="progress-card-header">
            <span>剧情线整体进度</span>
            <strong>{overallProgress}%</strong>
          </div>
          <div className="progress-bar-large">
            <div
              className="progress-bar-large-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="progress-card-stats">
            <div className="stat-item">
              主线 <strong>{mainPlotlines.length}</strong>
            </div>
            <div className="stat-item">
              支线 <strong>{subPlotlines.length}</strong>
            </div>
            <div className="stat-item">
              角色线 <strong>{characterArcs.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 场景状态分布 */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">
          <Film size={18} />
          场景状态分布
        </h3>
        <div className="status-grid">
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">✏️</span>
              <span className="status-label">草稿</span>
            </div>
            <div className="status-card-value">{scenesByStatus.draft}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">⏳</span>
              <span className="status-label">进行中</span>
            </div>
            <div className="status-card-value">{scenesByStatus.inProgress}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">✅</span>
              <span className="status-label">已完成</span>
            </div>
            <div className="status-card-value">{scenesByStatus.completed}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">🔄</span>
              <span className="status-label">待修改</span>
            </div>
            <div className="status-card-value">{scenesByStatus.needsRevision}</div>
          </div>
        </div>
      </div>

      {/* 剧情线状态分布 */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">
          <GitBranch size={18} />
          剧情线状态分布
        </h3>
        <div className="status-grid">
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">🌱</span>
              <span className="status-label">铺垫</span>
            </div>
            <div className="status-card-value">{plotlinesByStatus.setup}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">📈</span>
              <span className="status-label">发展</span>
            </div>
            <div className="status-card-value">{plotlinesByStatus.development}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">🔥</span>
              <span className="status-label">高潮</span>
            </div>
            <div className="status-card-value">{plotlinesByStatus.climax}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">🎯</span>
              <span className="status-label">收尾</span>
            </div>
            <div className="status-card-value">{plotlinesByStatus.resolution}</div>
          </div>
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-icon">✅</span>
              <span className="status-label">完结</span>
            </div>
            <div className="status-card-value">{plotlinesByStatus.completed}</div>
          </div>
        </div>
      </div>

      {/* 剧情线详细进度 */}
      {plotlines.length > 0 && (
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">
            <TrendingUp size={18} />
            剧情线详细进度
          </h3>
          <div className="plotlines-progress-list">
            {plotlines.map((plotline) => (
              <div key={plotline.id} className="plotline-progress-item">
                <div className="plotline-progress-header">
                  <div
                    className="plotline-color-dot"
                    style={{ backgroundColor: plotline.color }}
                  />
                  <span className="plotline-progress-title">{plotline.title}</span>
                  <span className="plotline-progress-value">{plotline.progress}%</span>
                </div>
                <div className="progress-bar-small">
                  <div
                    className="progress-bar-small-fill"
                    style={{
                      width: `${plotline.progress}%`,
                      backgroundColor: plotline.color,
                    }}
                  />
                </div>
                <div className="plotline-progress-meta">
                  <span className="meta-badge">{plotline.type === "main" ? "⭐ 主线" : plotline.type === "subplot" ? "✨ 支线" : "👤 角色线"}</span>
                  <span className="meta-text">
                    {plotline.keyPoints.filter((kp) => kp.completed).length}/{plotline.keyPoints.length} 节点完成
                  </span>
                  <span className="meta-text">{plotline.scenes.length} 个场景</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成就徽章 */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">
          <Award size={18} />
          创作成就
        </h3>
        <div className="achievements-grid">
          {totalWords >= 10000 && (
            <div className="achievement-badge">
              <div className="achievement-icon">📖</div>
              <div className="achievement-label">万字作家</div>
            </div>
          )}
          {totalWords >= 50000 && (
            <div className="achievement-badge">
              <div className="achievement-icon">✍️</div>
              <div className="achievement-label">五万字突破</div>
            </div>
          )}
          {totalWords >= 100000 && (
            <div className="achievement-badge">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-label">十万字大作</div>
            </div>
          )}
          {completedScenes >= 10 && (
            <div className="achievement-badge">
              <div className="achievement-icon">🎬</div>
              <div className="achievement-label">十场景达成</div>
            </div>
          )}
          {characters.length >= 5 && (
            <div className="achievement-badge">
              <div className="achievement-icon">👥</div>
              <div className="achievement-label">角色丰富</div>
            </div>
          )}
          {plotlines.length >= 3 && (
            <div className="achievement-badge">
              <div className="achievement-icon">📈</div>
              <div className="achievement-label">剧情交织</div>
            </div>
          )}
          {completedPlotlines >= 1 && (
            <div className="achievement-badge">
              <div className="achievement-icon">🎯</div>
              <div className="achievement-label">剧情线完结</div>
            </div>
          )}
          {sceneCompletionRate === 100 && scenes.length > 0 && (
            <div className="achievement-badge">
              <div className="achievement-icon">⭐</div>
              <div className="achievement-label">全场景完成</div>
            </div>
          )}
        </div>
      </div>

      {/* 快速统计 */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">
          <Calendar size={18} />
          快速统计
        </h3>
        <div className="quick-stats">
          <div className="quick-stat-row">
            <span className="quick-stat-label">平均场景字数</span>
            <span className="quick-stat-value">
              {scenes.length > 0 ? Math.round(totalWords / scenes.length).toLocaleString() : 0} 字
            </span>
          </div>
          <div className="quick-stat-row">
            <span className="quick-stat-label">最长场景</span>
            <span className="quick-stat-value">
              {scenes.length > 0
                ? Math.max(...scenes.map((s) => s.wordCount)).toLocaleString()
                : 0} 字
            </span>
          </div>
          <div className="quick-stat-row">
            <span className="quick-stat-label">角色关系总数</span>
            <span className="quick-stat-value">
              {characters.reduce((sum, c) => sum + c.relationships.length, 0)}
            </span>
          </div>
          <div className="quick-stat-row">
            <span className="quick-stat-label">剧情线关键节点</span>
            <span className="quick-stat-value">
              {plotlines.reduce((sum, p) => sum + p.keyPoints.length, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
