type RelationshipLegendProps = {
  visible: boolean;
};

export function RelationshipLegend({ visible }: RelationshipLegendProps) {
  if (!visible) return null;

  return (
    <div className="relationship-legend">
      <div className="relationship-legend-header">图例</div>

      <div className="relationship-legend-section">
        <div className="relationship-legend-section-title">人物角色</div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-color" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} />
          <span>主角（Lead）</span>
        </div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-color" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }} />
          <span>盟友（Ally）</span>
        </div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-color" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} />
          <span>对手（Force）</span>
        </div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-color" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }} />
          <span>反派（Shadow）</span>
        </div>
      </div>

      <div className="relationship-legend-section">
        <div className="relationship-legend-section-title">关系类型</div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-line" style={{ background: '#06b6d4' }} />
          <span>冷静关系</span>
        </div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-line" style={{ background: '#f59e0b' }} />
          <span>温暖关系</span>
        </div>
        <div className="relationship-legend-item">
          <div className="relationship-legend-line" style={{ background: '#ec4899' }} />
          <span>紧张关系</span>
        </div>
      </div>

      <div className="relationship-legend-section">
        <div className="relationship-legend-section-title">关系强度</div>
        <div className="relationship-legend-item">
          <span>线条粗细表示关系强度</span>
        </div>
        <div className="relationship-legend-item">
          <span>动画表示强关系（{'>'}70）</span>
        </div>
      </div>
    </div>
  );
}
