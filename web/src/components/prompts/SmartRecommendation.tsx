import { Lightbulb, Sparkles, TrendingUp, Star } from "lucide-react";
import type { PromptTemplate } from "../../types/prompts";
import type { WritingScene } from "../../utils/sceneDetection";
import { SCENE_KEYWORDS } from "../../utils/sceneDetection";

type SmartRecommendationProps = {
  scene: WritingScene;
  sceneDescription: string;
  recommendedTemplates: PromptTemplate[];
  mostUsedTemplate: PromptTemplate | null;
  favoriteTemplates: PromptTemplate[];
  onSelectTemplate: (template: PromptTemplate) => void;
};

export function SmartRecommendation({
  scene,
  sceneDescription,
  recommendedTemplates,
  mostUsedTemplate,
  favoriteTemplates,
  onSelectTemplate,
}: SmartRecommendationProps) {
  const sceneData = SCENE_KEYWORDS.find((s) => s.scene === scene);

  if (scene === "unknown") {
    return null;
  }

  return (
    <div className="smart-recommendation">
      <div className="recommendation-header">
        <Lightbulb size={18} />
        <h4>智能推荐</h4>
      </div>

      <div className="recommendation-scene">
        <span className="scene-badge">
          <Sparkles size={14} />
          {sceneDescription}
        </span>
      </div>

      {recommendedTemplates.length > 0 && (
        <div className="recommendation-section">
          <h5 className="recommendation-title">场景推荐</h5>
          <div className="recommendation-list">
            {recommendedTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="recommendation-item"
                onClick={() => onSelectTemplate(template)}
              >
                <span className="recommendation-item-title">{template.title}</span>
                <span className="recommendation-item-desc">{template.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mostUsedTemplate && (
        <div className="recommendation-section">
          <h5 className="recommendation-title">
            <TrendingUp size={14} />
            最常用
          </h5>
          <button
            type="button"
            className="recommendation-item"
            onClick={() => onSelectTemplate(mostUsedTemplate)}
          >
            <span className="recommendation-item-title">{mostUsedTemplate.title}</span>
            <span className="recommendation-item-meta">
              已使用 {mostUsedTemplate.usageCount} 次
            </span>
          </button>
        </div>
      )}

      {favoriteTemplates.length > 0 && (
        <div className="recommendation-section">
          <h5 className="recommendation-title">
            <Star size={14} />
            我的收藏
          </h5>
          <div className="recommendation-list">
            {favoriteTemplates.slice(0, 3).map((template) => (
              <button
                key={template.id}
                type="button"
                className="recommendation-item recommendation-item-compact"
                onClick={() => onSelectTemplate(template)}
              >
                <span className="recommendation-item-title">{template.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sceneData && (
        <div className="recommendation-tips">
          <p className="tips-title">写作提示</p>
          <ul className="tips-list">
            {getSceneTips(scene).map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getSceneTips(scene: WritingScene): string[] {
  const tipsMap: Record<WritingScene, string[]> = {
    opening: [
      "开篇即入场景，避免大段背景",
      "用动作或对话开场",
      "暗示核心冲突",
      "制造悬念",
    ],
    climax: [
      "情绪饱满，节奏快速",
      "对话和动作结合",
      "推向情绪顶点",
      "留有余韵",
    ],
    character: [
      "通过行动展现性格",
      "给角色独特语言风格",
      "设计标志性细节",
      "明确欲望和恐惧",
    ],
    dialogue: [
      "符合角色性格",
      "用语气展现情绪",
      "穿插动作描写",
      "对话要有张力",
    ],
    scene: [
      "调动多种感官",
      "环境与情绪呼应",
      "避免静态堆砌",
      "描写要有目的",
    ],
    continue: [
      "承接前文保持连贯",
      "推进情节不原地踏步",
      "保持性格一致",
      "埋设伏笔",
    ],
    outline: [
      "明确起承转合",
      "每章都有推进",
      "设计冲突和解决",
      "留下悬念",
    ],
    worldbuilding: [
      "逻辑自洽规则清晰",
      "有层次和进阶",
      "与故事冲突相关",
      "留扩展空间",
    ],
    transition: [
      "转折合理但意外",
      "有铺垫和伏笔",
      "改变故事走向",
      "引发新问题",
    ],
    ending: [
      "关键时刻戛然而止",
      "制造期待和好奇",
      "暗示新冲突",
      "避免强行悬念",
    ],
    unknown: [],
  };

  return tipsMap[scene] || [];
}
