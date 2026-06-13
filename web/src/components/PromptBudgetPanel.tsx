import type { PromptBudget, PromptPolicy } from "../api/types";

const sectionLabels: Record<string, string> = {
  cover: "封面",
  worldbuilding: "世界观",
  characters: "人物",
  plot: "剧情",
  chapters: "章节",
};

export function PromptBudgetPanel({
  budget,
  policy,
}: {
  budget: PromptBudget | null;
  policy: PromptPolicy;
}) {
  const usedSections = budget?.sections.length ? budget.sections : policy.priority_sections;
  const generateBudget = budget?.context_budget_chars ?? policy.context_budget_chars;
  const savedTokens = budget ? Math.max(0, budget.raw_estimated_tokens - budget.estimated_tokens) : 0;
  const guard = policy.cost_guard;
  const layers = budget?.layers?.length
    ? budget.layers
    : (policy.context_layers ?? []).slice(0, 3).map((layer) => ({
      ...layer,
      chars: 0,
      estimated_tokens: 0,
    }));
  const recall = budget?.recall?.slice(0, 2) ?? [];

  return (
    <section className="prompt-budget-panel-compact" aria-label="Token 预算">
      <div className="prompt-budget-strip">
        <span>API 消耗守卫</span>
        <strong>生成 {generateBudget}字</strong>
        <strong>聊天 {policy.chat_budget_chars}字</strong>
        {guard ? (
          <>
            <strong>上限 {guard.api_chat_token_limit}</strong>
            <strong>复用 {guard.duplicate_cache_ttl_seconds}s</strong>
            <strong>快速 {guard.fast_context_sections}段</strong>
          </>
        ) : null}
        <strong>已省 {savedTokens} tok</strong>
        <p title={usedSections.map((section) => sectionLabels[section] ?? section).join(" -> ")}>
          <b>只传阶段相关上下文</b>{usedSections.map((section) => sectionLabels[section] ?? section).join(" -> ")}
        </p>
      </div>
      {layers.length ? (
        <div className="budget-layer-strip" aria-label="上下文分层">
          <span>上下文分层</span>
          {layers.map((layer) => (
            <strong key={layer.id} title={layer.reason}>
              {layer.label} {layer.estimated_tokens} tok
            </strong>
          ))}
        </div>
      ) : null}
      {recall.length ? (
        <div className="budget-recall-strip" aria-label="召回原因">
          <span>召回原因</span>
          {recall.map((item) => (
            <strong key={item.section} title={item.matched_terms.join(" / ") || item.reason}>
              {item.label}：{item.reason}
            </strong>
          ))}
        </div>
      ) : null}
    </section>
  );
}
