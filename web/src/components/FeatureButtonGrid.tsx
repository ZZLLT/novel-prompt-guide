import type { ComponentType } from "react";

export interface FeatureButton {
  icon: ComponentType<{ size?: number }>;
  title: string;
  description: string;
  onClick: () => void;
}

export function FeatureButtonGrid({ features }: { features: FeatureButton[] }) {
  return (
    <div className="workspace-features-panel">
      <div className="features-grid">
        {features.map((feature, index) => (
          <button type="button" className="feature-btn" key={index} onClick={feature.onClick}>
            <div className="feature-btn-icon">
              <feature.icon size={20} />
            </div>
            <div className="feature-btn-content">
              <div className="feature-btn-title">{feature.title}</div>
              <div className="feature-btn-desc">{feature.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
