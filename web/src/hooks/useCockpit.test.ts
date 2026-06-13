import { act, renderHook } from "@testing-library/react";
import { generatePrompt, pollChat, sendChat } from "../api/client";
import { useCockpit } from "./useCockpit";

vi.mock("../api/client", () => ({
  generatePrompt: vi.fn(),
  getDocumentState: vi.fn(),
  getStatus: vi.fn(),
  pollChat: vi.fn(),
  readDocSection: vi.fn(),
  sendChat: vi.fn(),
  writeToWps: vi.fn(),
}));

const budget = {
  chars: 900,
  raw_chars: 1800,
  saved_chars: 900,
  estimated_tokens: 520,
  raw_estimated_tokens: 1100,
  sections: ["plot"],
};

describe("useCockpit", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a token guard message when chat is queued instead of calling the API", async () => {
    vi.mocked(sendChat).mockResolvedValue({
      msg_id: "guarded",
      status: "queued",
      guard: "token_limit",
      api_token_estimate: 1500,
      budget,
    });
    vi.mocked(pollChat).mockResolvedValue({ response: null, pending_count: 1 });

    const { result } = renderHook(() => useCockpit());

    act(() => {
      result.current.setChatInput("检查第一章钩子");
    });
    await act(async () => {
      await result.current.actions.sendInstruction();
    });

    expect(result.current.chatMessages.some((message) => message.text.includes("超过 API 即时调用上限"))).toBe(true);
    expect(result.current.agents.some((agent) => agent.output === "Token 守卫已拦截直接 API 调用。")).toBe(true);
  });

  it("marks generation as blocked when the backend refuses an oversized prompt", async () => {
    vi.mocked(generatePrompt).mockResolvedValue({
      status: "blocked",
      guard: "token_limit",
      api_token_estimate: 1800,
      mode: "fast",
      budget,
    });

    const { result } = renderHook(() => useCockpit());

    await act(async () => {
      await result.current.actions.generate();
    });

    expect(result.current.promptPreview).toContain("生成提示超过 API 上限");
    expect(result.current.agents.some((agent) => agent.status === "blocked" && agent.output?.includes("1800 tok"))).toBe(true);
  });

  it("deduplicates in-flight chat instructions before they reach the API", async () => {
    let resolveChat: (value: Awaited<ReturnType<typeof sendChat>>) => void = () => undefined;
    vi.mocked(sendChat).mockReturnValue(
      new Promise((resolve) => {
        resolveChat = resolve;
      }) as ReturnType<typeof sendChat>,
    );
    vi.mocked(pollChat).mockResolvedValue({ response: null, pending_count: 0 });

    const { result } = renderHook(() => useCockpit());

    act(() => {
      result.current.setChatInput("检查第一章伏笔");
    });
    await act(async () => {
      const first = result.current.actions.sendInstruction();
      const second = result.current.actions.sendInstruction();
      resolveChat({ msg_id: "dedupe", response: "ok", mode: "llm", budget });
      await Promise.all([first, second]);
    });

    expect(sendChat).toHaveBeenCalledTimes(1);
  });
});
