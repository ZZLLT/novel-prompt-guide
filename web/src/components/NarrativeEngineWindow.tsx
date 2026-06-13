import {
  narrativeDagCards,
  narrativeEnginePipeline,
  narrativeGovernanceCards,
  narrativeStateCards,
  type NarrativeEngineCard,
} from "../data/narrativeEngine";

function NarrativeEngineCardGrid({ cards }: { cards: NarrativeEngineCard[] }) {
  return (
    <div className="function-detail-grid">
      {cards.map((card) => (
        <article key={card.title}>
          <span>{card.label}</span>
          <strong>{card.title}</strong>
          <p>{card.detail}</p>
          <em>{card.tokenPolicy}</em>
        </article>
      ))}
    </div>
  );
}

export function NarrativeEngineWindow() {
  return (
    <div className="function-detail-stack narrative-engine-window">
      <p className="function-window-summary">
        把长篇小说当成一套可追踪的叙事状态系统：每章只推进必要节点、沉淀结构化状态、用审计窗口决定是否让 AI 继续。
      </p>

      <NarrativeEngineCardGrid cards={narrativeStateCards} />

      <div className="function-detail-grid function-detail-grid-wide">
        <article>
          <span>Pipeline</span>
          <strong>自动推进流水线</strong>
          <p>{narrativeEnginePipeline.join(" -> ")}</p>
          <em>默认只展示流程；任何 AI 调用都必须由窗口底部输入框显式提交。</em>
        </article>
        <article>
          <span>Dispatch</span>
          <strong>单写者状态沉淀</strong>
          <p>章节摘要、知识三元组、人物关系变化和伏笔债务统一排队写入，避免并发更新把状态弄乱。</p>
          <em>先记录 delta，再决定是否同步 WPS 或交给 AI 审查。</em>
        </article>
      </div>

      <NarrativeEngineCardGrid cards={narrativeDagCards} />
      <NarrativeEngineCardGrid cards={narrativeGovernanceCards} />
    </div>
  );
}
