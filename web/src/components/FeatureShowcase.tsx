import type { ComponentType } from "react";

export interface FeatureItem {
  icon: ComponentType<{ size?: number }>;
  title: string;
  description: string;
  tags: string[];
  onClick?: () => void;
}

export interface FeatureGroup {
  icon: ComponentType<{ size?: number }>;
  title: string;
  items: FeatureItem[];
}

export function FeatureShowcase({ groups }: { groups: FeatureGroup[] }) {
  return (
    <>
      {groups.map((group, index) => (
        <div className="feature-group" key={index}>
          <div className="feature-group-header">
            <div className="feature-group-icon">
              <group.icon size={16} />
            </div>
            <h3 className="feature-group-title">{group.title}</h3>
            <span className="feature-group-count">{group.items.length} 项</span>
          </div>
          <div className="feature-showcase">
            {group.items.map((item, itemIndex) => (
              <div
                className="feature-card"
                key={itemIndex}
                onClick={item.onClick}
                style={item.onClick ? { cursor: "pointer" } : undefined}
              >
                <div className="feature-card-icon">
                  <item.icon size={24} />
                </div>
                <h4 className="feature-card-title">{item.title}</h4>
                <p className="feature-card-description">{item.description}</p>
                <div className="feature-card-tags">
                  {item.tags.map((tag, tagIndex) => (
                    <span className="feature-tag" key={tagIndex}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
