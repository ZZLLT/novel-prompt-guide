export type StageId = "cover" | "worldbuilding" | "characters" | "plot" | "chapters";
export type GenerationModeId = "fast" | "standard" | "deep";

export type AgentStatus = "idle" | "queued" | "working" | "waiting" | "done" | "blocked";
export type ModelRole = "planner" | "writer" | "reviewer" | "assistant";
export type ModelRoutes = Record<ModelRole, string>;

export type ApiStatus = {
  connected: boolean;
  llm: boolean;
  document?: Record<string, unknown> | null;
};

export type LlmConfig = {
  endpoint: string;
  model: string;
  model_routes: ModelRoutes;
  api_key_set: boolean;
  api_enabled: boolean;
  temperature: number;
  max_tokens: number;
};

export type LlmConfigInput = {
  endpoint: string;
  model: string;
  model_routes?: ModelRoutes;
  api_key?: string;
  api_enabled: boolean;
  clear_api_key?: boolean;
  temperature: number;
  max_tokens: number;
};

export type LlmModel = {
  id: string;
};

export type LlmModelsResponse = {
  models: LlmModel[];
  error?: string;
};

export type SectionState = {
  has_content: boolean;
  chars: number;
};

export type DocumentState = {
  sections: Partial<Record<StageId, SectionState>>;
  next_action: StageId | "cover" | null;
  prompt: string | null;
};

export type SectionsResponse = Partial<Record<StageId, string>>;

export type PromptBudget = {
  chars: number;
  raw_chars: number;
  saved_chars: number;
  estimated_tokens: number;
  raw_estimated_tokens: number;
  sections: string[];
  layers?: PromptBudgetLayer[];
  recall?: PromptRecall[];
  context_budget_chars?: number;
  mode?: GenerationModeId | string;
};

export type PromptRecall = {
  section: string;
  label: string;
  reason: string;
  matched_terms: string[];
};

export type PromptBudgetLayer = {
  id: string;
  label: string;
  chars: number;
  estimated_tokens: number;
  reason: string;
};

export type PromptModePolicy = {
  label: string;
  context_budget_chars: number;
  strategy: string;
};

export type PromptPolicy = {
  stage: string;
  label: string;
  context_budget_chars: number;
  chat_budget_chars: number;
  cost_guard?: {
    api_chat_token_limit: number;
    fast_context_sections: number;
    duplicate_cache_ttl_seconds: number;
  };
  context_layers?: Array<{ id: string; label: string; reason: string }>;
  priority_sections: string[];
  outputs: string[];
  modes?: Record<string, PromptModePolicy>;
};

export type GenerateResponse = {
  msg_id?: string;
  prompt?: string;
  status?: "queued" | "reused" | "blocked" | string;
  mode?: GenerationModeId | string;
  budget?: PromptBudget;
  guard?: "token_limit" | "auto_downgraded";
  api_token_estimate?: number;
};

export type ChatSendResponse =
  | { msg_id: string; response: string; mode: "llm"; model?: string; model_role?: ModelRole; budget?: PromptBudget }
  | { msg_id: string; status: "queued" | "reused"; model?: string; model_role?: ModelRole; budget?: PromptBudget; guard?: "token_limit"; api_token_estimate?: number };

export type ChatPollResponse = {
  response: null | {
    reply_to: string;
    timestamp: number;
    response: string;
    actions?: unknown[];
  };
  pending_count: number;
};

export type WriteResponse = {
  success: boolean;
  error?: string;
};
