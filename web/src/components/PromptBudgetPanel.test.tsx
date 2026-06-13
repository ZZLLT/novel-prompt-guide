import { render, screen } from "@testing-library/react";
import { PromptBudgetPanel } from "./PromptBudgetPanel";
import type { PromptBudget, PromptPolicy } from "../api/types";

const policy: PromptPolicy = {
  stage: "chapters",
  label: "章节写作",
  context_budget_chars: 1100,
  chat_budget_chars: 900,
  cost_guard: {
    api_chat_token_limit: 1200,
    fast_context_sections: 2,
    duplicate_cache_ttl_seconds: 12,
  },
  priority_sections: ["plot", "characters"],
  outputs: ["章节目标"],
};

const fastBudget: PromptBudget = {
  chars: 580,
  raw_chars: 2200,
  saved_chars: 1620,
  estimated_tokens: 341,
  raw_estimated_tokens: 1294,
  sections: ["plot", "characters"],
  layers: [
    { id: "stable_rules", label: "固定规则", chars: 42, estimated_tokens: 25, reason: "稳定前缀" },
    { id: "plot_memory", label: "剧情记忆", chars: 260, estimated_tokens: 153, reason: "当前阶段优先" },
    { id: "character_memory", label: "角色记忆", chars: 220, estimated_tokens: 130, reason: "关系线索" },
  ],
  recall: [
    {
      section: "characters",
      label: "人物设计",
      reason: "命中：女主、对白、关系",
      matched_terms: ["女主", "对白", "关系"],
    },
  ],
  context_budget_chars: 650,
  mode: "fast",
};

describe("PromptBudgetPanel", () => {
  it("shows the actual generation budget returned by the backend", () => {
    render(<PromptBudgetPanel budget={fastBudget} policy={policy} />);

    expect(screen.getByText("API 消耗守卫")).toBeInTheDocument();
    expect(screen.getByText(/生成\s+650/)).toBeInTheDocument();
    expect(screen.getByText(/上限\s+1200/)).toBeInTheDocument();
    expect(screen.getByText(/复用\s+12s/)).toBeInTheDocument();
    expect(screen.getByText(/快速\s+2段/)).toBeInTheDocument();
    expect(screen.getByText("上下文分层")).toBeInTheDocument();
    expect(screen.getByText(/固定规则\s+25 tok/)).toBeInTheDocument();
    expect(screen.getByText(/剧情记忆\s+153 tok/)).toBeInTheDocument();
    expect(screen.getByText("召回原因")).toBeInTheDocument();
    expect(screen.getByText(/人物设计：命中：女主、对白、关系/)).toBeInTheDocument();
    expect(screen.queryByText("1100")).not.toBeInTheDocument();
    expect(document.querySelector(".budget-grid")).not.toBeInTheDocument();
  });
});
