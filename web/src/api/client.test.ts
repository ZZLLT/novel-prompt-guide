import { ApiError, fetchLlmModels, generatePrompt, getPromptPolicy, writeToWps } from "./client";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws ApiError when backend returns an error payload", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ error: "unknown stage" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await expect(generatePrompt("editing")).rejects.toBeInstanceOf(ApiError);
  });

  it("posts JSON bodies for write requests", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await writeToWps("hello", "end");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/write",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "hello", position: "end" }),
      }),
    );
  });

  it("requests prompt policy for a stage", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          stage: "chapters",
          label: "章节写作",
          context_budget_chars: 1100,
          chat_budget_chars: 900,
          priority_sections: ["plot"],
          outputs: ["章节目标"],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await getPromptPolicy("chapters");

    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/policy?stage=chapters", undefined);
  });

  it("posts the selected generation mode for prompt requests", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ status: "queued" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await generatePrompt("chapters", "fast");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "chapters", mode: "fast" }),
      }),
    );
  });

  it("posts draft endpoint and key when fetching remote model options", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ models: [{ id: "writer-model" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    await fetchLlmModels({ endpoint: "https://api.example.com/v1", api_key: "draft-key" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/llm/models",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "https://api.example.com/v1", api_key: "draft-key" }),
      }),
    );
  });
});
