import type { GenerationModeId } from "../api/types";
import type { GenerationMode } from "../data/generationModes";
import type { ComponentType } from "react";
import { Gauge, Layers3, TimerReset } from "lucide-react";

const modeIcons: Record<GenerationModeId, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  fast: TimerReset,
  standard: Gauge,
  deep: Layers3,
};

export function GenerationModePanel({
  modes,
  selectedMode,
  onSelectMode,
}: {
  modes: GenerationMode[];
  selectedMode: GenerationModeId;
  onSelectMode: (mode: GenerationMode) => void;
}) {
  return (
    <section className="generation-mode-panel" aria-label="生成模式">
      <div className="mode-panel-header">
        <div>
          <span>API MODE</span>
          <h3>生成模式</h3>
        </div>
        <strong>{modes.find((mode) => mode.id === selectedMode)?.badge}</strong>
      </div>

      <div className="mode-grid">
        {modes.map((mode) => {
          const Icon = modeIcons[mode.id];
          const active = mode.id === selectedMode;
          return (
            <article className={active ? "mode-card active" : "mode-card"} key={mode.id}>
              <div className="mode-card-top">
                <Icon aria-hidden={true} size={18} />
                <div>
                  <h4>{mode.label}</h4>
                  <span>{mode.badge}</span>
                </div>
              </div>
              <p>{mode.focus}</p>
              <dl>
                <div>
                  <dt>读取</dt>
                  <dd>{mode.latency}</dd>
                </div>
                <div>
                  <dt>预算</dt>
                  <dd>{mode.budget}</dd>
                </div>
              </dl>
              <button type="button" aria-current={active} onClick={() => onSelectMode(mode)}>
                {mode.buttonLabel}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
