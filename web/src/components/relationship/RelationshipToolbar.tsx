import { Users, GitBranch, ZoomIn, ZoomOut, Maximize, Download, Info } from "lucide-react";
import { useState } from "react";

type RelationshipToolbarProps = {
  actorCount: number;
  relationshipCount: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleLegend?: () => void;
};

export function RelationshipToolbar({
  actorCount,
  relationshipCount,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleLegend,
}: RelationshipToolbarProps) {
  return (
    <div className="relationship-toolbar">
      <div className="relationship-toolbar-left">
        <div className="relationship-toolbar-title">
          <Users size={16} />
          关系总览
        </div>
        <div className="relationship-toolbar-stats">
          <div className="relationship-toolbar-stat">
            <Users size={14} />
            <span>人物</span>
            <strong>{actorCount}</strong>
          </div>
          <div className="relationship-toolbar-stat">
            <GitBranch size={14} />
            <span>关系</span>
            <strong>{relationshipCount}</strong>
          </div>
        </div>
      </div>
      <div className="relationship-toolbar-right">
        <button
          type="button"
          className="relationship-toolbar-button"
          onClick={onZoomIn}
          title="放大"
          aria-label="放大视图"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          className="relationship-toolbar-button"
          onClick={onZoomOut}
          title="缩小"
          aria-label="缩小视图"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          className="relationship-toolbar-button"
          onClick={onFitView}
          title="适应画布"
          aria-label="适应画布大小"
        >
          <Maximize size={16} />
        </button>
        <button
          type="button"
          className="relationship-toolbar-button"
          onClick={onToggleLegend}
          title="图例"
          aria-label="显示/隐藏图例"
        >
          <Info size={16} />
        </button>
      </div>
    </div>
  );
}
