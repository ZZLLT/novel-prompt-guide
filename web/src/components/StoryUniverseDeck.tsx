import type { ApiStatus, DocumentState, StageId } from "../api/types";
import { stageOrder, stages } from "../data/stages";

export function StoryUniverseDeck({
  currentStage,
  documentState,
  onSelectStage,
  stageNavLabel = "故事阶段",
  status,
}: {
  currentStage: StageId;
  documentState: DocumentState | null;
  onSelectStage: (stage: StageId) => void;
  stageNavLabel?: string;
  status: ApiStatus | null;
}) {
  return (
    <div className="universe-deck">
      <div className="ship-status">
        <div>
          <span>WPS 链路</span>
          <strong>{status?.connected ? "ONLINE" : "OFFLINE"}</strong>
        </div>
        <div>
          <span>LLM 核心</span>
          <strong>{status?.llm ? "READY" : "QUEUE"}</strong>
        </div>
      </div>

      <nav className="stage-map" aria-label={stageNavLabel}>
        {stageOrder.map((stageId) => {
          const stage = stages[stageId];
          const section = documentState?.sections?.[stageId];
          return (
            <button
              type="button"
              key={stageId}
              className={stageId === currentStage ? "stage-node active" : "stage-node"}
              onClick={() => onSelectStage(stageId)}
            >
              <span className="stage-callsign">{stage.callsign}</span>
              <span>{stage.label}</span>
              <em>{section?.has_content ? `${section.chars} 字` : "待注入"}</em>
            </button>
          );
        })}
      </nav>

      <div className="codex-snapshot">
        <h3>故事宇宙</h3>
        <p>世界观、人物弧光、伏笔和章节目标会汇入这里，成为 Agent 的长期记忆。</p>
        <ul>
          <li>世界规则：{documentState?.sections?.worldbuilding?.chars ?? 0} 字</li>
          <li>人物档案：{documentState?.sections?.characters?.chars ?? 0} 字</li>
          <li>剧情线路：{documentState?.sections?.plot?.chars ?? 0} 字</li>
        </ul>
      </div>
    </div>
  );
}
