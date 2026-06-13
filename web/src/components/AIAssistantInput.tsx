import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { SmartRecommendation } from "./prompts/SmartRecommendation";
import { usePromptLibrary } from "../hooks/usePromptLibrary";
import { getSmartRecommendations } from "../utils/sceneDetection";
import type { PromptTemplate } from "../types/prompts";
import { Button } from "./ui/button";

type AIAssistantInputProps = {
  onSend: (message: string) => void;
  placeholder?: string;
};

export function AIAssistantInput({ onSend, placeholder = "输入您的写作需求..." }: AIAssistantInputProps) {
  const [input, setInput] = useState("");
  const [showRecommendation, setShowRecommendation] = useState(false);
  const { allTemplates, useTemplate } = usePromptLibrary();

  // 当用户输入超过5个字符时，显示智能推荐
  useEffect(() => {
    if (input.length >= 5) {
      setShowRecommendation(true);
    } else {
      setShowRecommendation(false);
    }
  }, [input]);

  const recommendations = getSmartRecommendations(input, allTemplates);

  const handleSelectTemplate = (template: PromptTemplate) => {
    // 将模板内容填充到输入框
    setInput(template.content);
    setShowRecommendation(false);
  };

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
      setShowRecommendation(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-assistant-input-container">
      {showRecommendation && recommendations.scene !== "unknown" && (
        <SmartRecommendation
          scene={recommendations.scene}
          sceneDescription={recommendations.sceneDescription}
          recommendedTemplates={recommendations.recommendedTemplates}
          mostUsedTemplate={recommendations.mostUsedTemplate}
          favoriteTemplates={recommendations.favoriteTemplates}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      <div className="ai-assistant-input-box">
        <textarea
          className="ai-assistant-textarea"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={4}
        />
        <div className="ai-assistant-input-actions">
          <span className="input-hint">
            {input.length >= 5 ? "检测到写作场景，查看智能推荐 ↑" : "Shift+Enter 换行"}
          </span>
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send size={16} />
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
