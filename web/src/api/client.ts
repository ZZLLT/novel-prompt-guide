import type {
  ApiStatus,
  ChatPollResponse,
  ChatSendResponse,
  DocumentState,
  GenerateResponse,
  GenerationModeId,
  LlmConfig,
  LlmConfigInput,
  LlmModelsResponse,
  ModelRole,
  PromptPolicy,
  SectionsResponse,
  StageId,
  WriteResponse,
} from "./types";

type ApiErrorPayload = {
  error?: string;
  error_code?: string;
  success?: boolean;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload?.error_code;
    this.payload = payload;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError("后端返回了不可解析的 JSON。", response.status, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await parseJson<T & ApiErrorPayload>(response);

  if (!response.ok) {
    throw new ApiError(payload.error || `请求失败：${response.status}`, response.status, payload);
  }
  if (payload.error || payload.success === false) {
    throw new ApiError(payload.error || "请求未成功。", response.status, payload);
  }

  return payload as T;
}

function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getStatus(): Promise<ApiStatus> {
  return requestJson<ApiStatus>("/api/status");
}

export function getLlmConfig(): Promise<LlmConfig> {
  return requestJson<LlmConfig>("/api/llm/config");
}

export function fetchLlmModels(config: { endpoint: string; api_key?: string }): Promise<LlmModelsResponse> {
  return postJson<LlmModelsResponse>("/api/llm/models", config);
}

export function saveLlmConfig(config: LlmConfigInput): Promise<LlmConfig> {
  return postJson<LlmConfig>("/api/llm/config", config);
}

export function getDocumentState(): Promise<DocumentState> {
  return requestJson<DocumentState>("/api/state");
}

export function getSections(): Promise<SectionsResponse> {
  return requestJson<SectionsResponse>("/api/sections");
}

export function getPromptPolicy(stage: StageId): Promise<PromptPolicy> {
  const params = new URLSearchParams({ stage });
  return requestJson<PromptPolicy>(`/api/prompt/policy?${params.toString()}`);
}

export function readDocSection(section: StageId): Promise<{ text: string }> {
  const params = new URLSearchParams({ section });
  return requestJson<{ text: string }>(`/api/doc/read?${params.toString()}`);
}

export function writeToWps(text: string, position = "end"): Promise<WriteResponse> {
  return postJson<WriteResponse>("/api/write", { text, position });
}

export function generatePrompt(stage: string, mode: GenerationModeId = "standard"): Promise<GenerateResponse> {
  return postJson<GenerateResponse>("/api/generate", { stage, mode });
}

export function sendChat(message: string, stage: StageId, modelRole?: ModelRole): Promise<ChatSendResponse> {
  return postJson<ChatSendResponse>("/api/chat/send", { message, stage, ...(modelRole ? { model_role: modelRole } : {}) });
}

export function pollChat(msgId: string): Promise<ChatPollResponse> {
  const params = new URLSearchParams({ msg_id: msgId });
  return requestJson<ChatPollResponse>(`/api/chat/poll?${params.toString()}`);
}
