import { useState } from "react";
import { X, Copy, Send } from "lucide-react";
import type { PromptTemplate } from "../../types/prompts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type PromptUseDialogProps = {
  template: PromptTemplate | null;
  onClose: () => void;
  onUse: (filledContent: string) => void;
};

export function PromptUseDialog({ template, onClose, onUse }: PromptUseDialogProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});

  if (!template) return null;

  const handleVariableChange = (variable: string, value: string) => {
    setVariables((prev) => ({ ...prev, [variable]: value }));
  };

  const fillTemplate = () => {
    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return content;
  };

  const handleCopy = () => {
    const filled = fillTemplate();
    navigator.clipboard.writeText(filled);
    alert("已复制到剪贴板");
  };

  const handleUse = () => {
    const filled = fillTemplate();
    onUse(filled);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{template.title}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          <p className="modal-description">{template.description}</p>

          {template.variables.length > 0 && (
            <div className="prompt-variables-form">
              <h3 className="form-section-title">填充变量</h3>
              {template.variables.map((variable) => (
                <div key={variable} className="form-field">
                  <Label className="form-label">{variable}</Label>
                  <Input
                    type="text"
                    placeholder={`请输入${variable}`}
                    value={variables[variable] || ""}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="prompt-preview-section">
            <h3 className="form-section-title">预览</h3>
            <pre className="prompt-preview">{fillTemplate()}</pre>
          </div>
        </div>

        <footer className="modal-footer">
          <Button variant="outline" onClick={handleCopy}>
            <Copy size={16} />
            复制
          </Button>
          <Button onClick={handleUse}>
            <Send size={16} />
            发送到AI助手
          </Button>
        </footer>
      </div>
    </div>
  );
}
