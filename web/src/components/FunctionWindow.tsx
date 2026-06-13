import { X } from "lucide-react";
import { ReactNode } from "react";

export function FunctionWindow({
  title,
  onClose,
  children,
  width = "800px",
  eyebrow,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  eyebrow?: string;
}) {
  return (
    <div className="startup-guide-backdrop" onClick={onClose}>
      <div
        className="function-window"
        style={{ width, maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="function-window-header">
          <div>
            {eyebrow && <span className="function-window-eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={`关闭${title}`}>
            <X size={16} />
          </button>
        </header>
        <div className="function-window-body">
          {children}
        </div>
      </div>
    </div>
  );
}
