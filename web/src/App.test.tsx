import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fetchLlmModels, getLlmConfig, pollChat, readDocSection, saveLlmConfig, sendChat, writeToWps } from "./api/client";
import App from "./App";

vi.mock("./api/client", () => ({
  fetchLlmModels: vi.fn(),
  generatePrompt: vi.fn(),
  getDocumentState: vi.fn(),
  getLlmConfig: vi.fn(),
  getStatus: vi.fn(),
  pollChat: vi.fn(),
  readDocSection: vi.fn(),
  saveLlmConfig: vi.fn(),
  sendChat: vi.fn(),
  writeToWps: vi.fn(),
}));

const defaultInnerWidth = window.innerWidth;
const defaultInnerHeight = window.innerHeight;

describe("Novel writing workspace", () => {
  async function openWorkspaceSettings(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "打开工作台设置" }));
    return screen.getByRole("dialog", { name: "工作台设置窗口" });
  }

  async function openApiSettings(user: ReturnType<typeof userEvent.setup>) {
    const settingsWindow = await openWorkspaceSettings(user);
    await user.click(within(settingsWindow).getByRole("button", { name: "打开API设置" }));
    return screen.findByRole("dialog", { name: "API设置窗口" });
  }

  async function showFunctionWindowGroup(
    user: ReturnType<typeof userEvent.setup>,
    group: "规划" | "成稿" | "故事维护",
  ) {
    await user.click(screen.getByRole("button", { name: `查看${group}功能窗口` }));
  }

  function openWithoutInitialSetup() {
    window.history.pushState({}, "", "/?setup=closed");
  }

  beforeEach(() => {
    vi.mocked(sendChat).mockResolvedValue({
      msg_id: "window-ai",
      response: "已收到窗口指令。",
      mode: "llm",
    });
    vi.mocked(getLlmConfig).mockResolvedValue({
      endpoint: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      api_key_set: false,
      api_enabled: false,
      temperature: 0.3,
      max_tokens: 4096,
      model_routes: {
        planner: "gpt-4o-mini",
        writer: "gpt-4o-mini",
        reviewer: "gpt-4o-mini",
        assistant: "gpt-4o-mini",
      },
    });
    vi.mocked(saveLlmConfig).mockResolvedValue({
      endpoint: "https://api.example.com/v1",
      model: "story-model",
      api_key_set: true,
      api_enabled: true,
      temperature: 0.4,
      max_tokens: 2048,
      model_routes: {
        planner: "reasoner-model",
        writer: "writer-model",
        reviewer: "critic-model",
        assistant: "fast-model",
      },
    });
    vi.mocked(fetchLlmModels).mockResolvedValue({
      models: [
        { id: "reasoner-model" },
        { id: "writer-model" },
        { id: "critic-model" },
        { id: "fast-model" },
      ],
    });
    vi.mocked(pollChat).mockResolvedValue({
      response: null,
      pending_count: 0,
    });
    vi.mocked(readDocSection).mockResolvedValue({ text: "WPS 当前片段" });
    vi.mocked(writeToWps).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: defaultInnerWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: defaultInnerHeight });
    window.history.pushState({}, "", "/");
  });

  it("renders the workspace OS shell with focused workspaces and an AI drawer", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed");
    render(<App />);

    expect(screen.getByText("长篇小说工作台")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "小说工作区导航" });
    expect(within(nav).getByRole("button", { name: /写作/ })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: /剧情线/ })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /人物关系/ })).toBeInTheDocument();

    const workspace = screen.getByRole("region", { name: "主工作区" });
    expect(workspace).toHaveTextContent("写作工作区");
    expect(screen.getByRole("complementary", { name: "AI 助手窗口" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: "工作台状态栏" })).toHaveTextContent("WPS");

    await user.click(within(nav).getByRole("button", { name: /人物关系/ }));
    expect(workspace).toHaveTextContent("人物关系工作区");
    expect(within(workspace).getByRole("button", { name: "打开人物关系窗" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "收起 AI 助手" }));
    expect(screen.queryByRole("complementary", { name: "AI 助手窗口" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "打开 AI 助手" }));
    expect(screen.getByRole("complementary", { name: "AI 助手窗口" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("collapses the project rail for a focused writing workspace", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed");
    const { container } = render(<App />);

    expect(screen.getByRole("region", { name: "项目设定" })).toBeInTheDocument();

    const settingsWindow = await openWorkspaceSettings(user);
    await user.click(within(settingsWindow).getByRole("button", { name: "收起项目导航" }));

    expect(container.querySelector(".workspace-os")).toHaveClass("rail-collapsed");
    expect(screen.queryByRole("region", { name: "项目设定" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "小说工作区导航" })).toBeInTheDocument();

    await user.click(within(settingsWindow).getByRole("button", { name: "展开项目导航" }));

    expect(container.querySelector(".workspace-os")).not.toHaveClass("rail-collapsed");
    expect(screen.getByRole("region", { name: "项目设定" })).toBeInTheDocument();
  });

  it("keeps workspace chrome state in the URL for direct handoff links", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed&workspace=relationships&rail=collapsed&assistant=closed");
    const { container } = render(<App />);

    expect(container.querySelector(".workspace-os")).toHaveClass("rail-collapsed");
    expect(screen.queryByRole("complementary", { name: "AI 助手窗口" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "主工作区" })).toHaveTextContent("人物关系工作区");

    await user.click(within(screen.getByRole("navigation", { name: "小说工作区导航" })).getByRole("button", { name: /剧情线/ }));
    const settingsWindow = await openWorkspaceSettings(user);
    await user.click(within(settingsWindow).getByRole("button", { name: "展开项目导航" }));
    await user.click(within(settingsWindow).getByRole("button", { name: "打开 AI 助手" }));

    const params = new URLSearchParams(window.location.search);
    expect(params.get("setup")).toBe("closed");
    expect(params.get("workspace")).toBe("plot");
    expect(params.get("rail")).toBe("open");
    expect(params.get("assistant")).toBe("open");
  });

  it("shows a compact workflow guide that follows the active workspace", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed");
    render(<App />);

    const flow = screen.getByRole("region", { name: "工作区流程" });
    expect(flow).toHaveTextContent("填上下文");
    expect(flow).toHaveTextContent("生成提示词");
    expect(flow).toHaveTextContent("写入 WPS");

    await user.click(within(screen.getByRole("navigation", { name: "小说工作区导航" })).getByRole("button", { name: /人物关系/ }));

    expect(flow).toHaveTextContent("打开图谱");
    expect(flow).toHaveTextContent("调整关系");
    expect(flow).toHaveTextContent("AI 建议入图");
  });

  it("opens the relationship graph from the workflow guide without an API call", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed&workspace=relationships&assistant=closed");
    render(<App />);

    const flow = screen.getByRole("region", { name: "工作区流程" });
    await user.click(within(flow).getByRole("button", { name: "打开图谱" }));

    expect(screen.getByRole("dialog", { name: "人物关系窗口" })).toBeInTheDocument();
    expect(sendChat).not.toHaveBeenCalled();
  });

  it("focuses the AI relationship advice box from the workflow guide without an API call", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed&workspace=relationships&assistant=closed");
    render(<App />);

    const flow = screen.getByRole("region", { name: "工作区流程" });
    await user.click(within(flow).getByRole("button", { name: "AI 建议入图" }));

    const relationshipWindow = screen.getByRole("dialog", { name: "人物关系窗口" });
    const adviceBox = within(relationshipWindow).getByLabelText("AI 关系建议");
    await waitFor(() => expect(adviceBox).toHaveFocus());
    expect(sendChat).not.toHaveBeenCalled();
  });

  it("focuses the relationship line editor from the workflow guide without an API call", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed&workspace=relationships&assistant=closed");
    render(<App />);

    const flow = screen.getByRole("region", { name: "工作区流程" });
    await user.click(within(flow).getByRole("button", { name: "调整关系" }));

    const relationshipWindow = screen.getByRole("dialog", { name: "人物关系窗口" });
    const statusInput = within(relationshipWindow).getByLabelText("relationship status");
    await waitFor(() => expect(statusInput).toHaveFocus());
    expect(sendChat).not.toHaveBeenCalled();
  });

  it("does not submit relationship line changes when Enter is pressed after workflow focus", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed&workspace=relationships&assistant=closed");
    render(<App />);

    const flow = screen.getByRole("region", { name: "工作区流程" });
    await user.click(within(flow).getByRole("button", { name: "调整关系" }));

    const relationshipWindow = screen.getByRole("dialog", { name: "人物关系窗口" });
    const statusInput = within(relationshipWindow).getByLabelText("relationship status");
    await waitFor(() => expect(statusInput).toHaveFocus());
    await user.keyboard("{Enter}");

    expect(sendChat).not.toHaveBeenCalled();
  });

  it("opens with an initial novel setup guide and applies it to the cockpit", async () => {
    const user = userEvent.setup();
    render(<App />);

    const guide = screen.getByRole("dialog", { name: "小说初设引导" });
    await user.click(within(guide).getByRole("tab", { name: "全部填写" }));
    await user.type(within(guide).getByLabelText("书名"), "星门债主");
    await user.type(within(guide).getByLabelText("类型"), "都市异能");
    await user.type(within(guide).getByLabelText("一句话设定"), "欠债少年靠修复异能契约逆转城市秩序。");
    await user.click(within(guide).getByRole("button", { name: "保存小说初设" }));

    expect(screen.queryByRole("dialog", { name: "小说初设引导" })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("星门债主")).toBeInTheDocument();
    expect((screen.getByLabelText("调度指令") as HTMLTextAreaElement).value).toContain("星门债主");
  });

  it("smoke-tests a random novel template without hidden API calls", async () => {
    const user = userEvent.setup();
    const template = {
      title: "雾港第七封遗书",
      genre: "悬疑奇幻",
      style: "冷峻群像 / 证据链推进 / 慢热反转",
      protagonist: "林照夜，退职档案员，想找回妹妹失踪前寄出的第七封信",
      premise: "退职档案员在雾港整理遗书档案时，发现每一封遗书都会改写一个活人的记忆。",
      coreConflict: "主角想保留真相，雾港议会却依靠篡改遗书维持城市秩序。",
      worldRule: "每次打开遗书，读信人必须遗忘一个与死者有关的真实细节。",
      firstVolumeGoal: "第一卷结束时，主角找齐七封遗书，却发现自己就是第一个被改写的人。",
    };

    render(<App />);

    const guide = screen.getByRole("dialog", { name: "小说初设引导" });
    await user.click(within(guide).getByRole("tab", { name: "全部填写" }));
    fireEvent.change(within(guide).getByLabelText("书名"), { target: { value: template.title } });
    fireEvent.change(within(guide).getByLabelText("类型"), { target: { value: template.genre } });
    fireEvent.change(within(guide).getByLabelText("文风"), { target: { value: template.style } });
    fireEvent.change(within(guide).getByLabelText("主角"), { target: { value: template.protagonist } });
    fireEvent.change(within(guide).getByLabelText("一句话设定"), { target: { value: template.premise } });
    fireEvent.change(within(guide).getByLabelText("核心冲突"), { target: { value: template.coreConflict } });
    fireEvent.change(within(guide).getByLabelText("特殊规则"), { target: { value: template.worldRule } });
    fireEvent.change(within(guide).getByLabelText("第一卷目标"), { target: { value: template.firstVolumeGoal } });
    await user.click(within(guide).getByRole("button", { name: "保存小说初设" }));

    expect(sendChat).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue(template.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(template.genre)).toBeInTheDocument();
    expect((screen.getByLabelText("调度指令") as HTMLTextAreaElement).value).toContain(template.firstVolumeGoal);

    await user.click(screen.getByRole("button", { name: "发送给 Agent" }));
    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining(template.title), "cover", "planner");
    });

    await user.click(screen.getByRole("button", { name: "打开人物关系窗" }));
    const relationshipWindow = screen.getByRole("dialog", { name: "人物关系窗口" });
    fireEvent.change(within(relationshipWindow).getByLabelText("AI 关系建议"), {
      target: { value: "把导师保护主角的动机改成隐瞒第七封遗书。" },
    });
    await user.click(within(relationshipWindow).getByRole("button", { name: "提交 AI 建议" }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("第七封遗书"), "plot", "planner");
    });
    expect(within(relationshipWindow).getByText("把导师保护主角的动机改成隐瞒第七封遗书。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开场景卡片窗口" }));
    const sceneWindow = screen.getByRole("dialog", { name: "场景卡片窗口" });
    fireEvent.change(within(sceneWindow).getByLabelText("场景卡片窗口 AI 指令"), {
      target: { value: "给雾港档案馆开场补三条可直接写进正文的证据线。" },
    });
    await user.click(within(sceneWindow).getByRole("button", { name: "发送场景卡片窗口指令" }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("雾港档案馆"), "plot", "planner");
    });
    expect(sendChat).toHaveBeenCalledTimes(3);
  });

  it("opens API settings and saves a replacement API", async () => {
    const user = userEvent.setup();
    render(<App />);

    const apiWindow = await openApiSettings(user);

    expect(within(apiWindow).getByText("LLM 控制台")).toBeInTheDocument();
    expect(within(apiWindow).getByText("配置档案")).toBeInTheDocument();
    expect(within(apiWindow).getByText("当前激活模型")).toBeInTheDocument();

    fireEvent.change(within(apiWindow).getByLabelText("API地址"), { target: { value: "https://api.example.com/v1" } });
    fireEvent.change(within(apiWindow).getByLabelText("默认模型"), { target: { value: "story-model" } });
    fireEvent.change(within(apiWindow).getByLabelText("API密钥"), { target: { value: "secret-key" } });
    await user.click(within(apiWindow).getByLabelText("启用即时API"));
    await user.click(within(apiWindow).getByRole("button", { name: "保存API设置" }));

    await waitFor(() => {
      expect(saveLlmConfig).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: "https://api.example.com/v1",
        model: "story-model",
        api_key: "secret-key",
        api_enabled: true,
      }));
    });
    expect(await within(apiWindow).findByText("已保存，即时 API 已启用")).toBeInTheDocument();
  });

  it("loads remote model options and saves multi-model collaboration routes", async () => {
    const user = userEvent.setup();
    render(<App />);

    const apiWindow = await openApiSettings(user);

    await user.clear(within(apiWindow).getByLabelText("API地址"));
    await user.type(within(apiWindow).getByLabelText("API地址"), "https://api.example.com/v1/chat/completions");
    await user.type(within(apiWindow).getByLabelText("API密钥"), "draft-key");
    await user.click(within(apiWindow).getByRole("button", { name: "获取模型列表" }));

    await waitFor(() => {
      expect(fetchLlmModels).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: "https://api.example.com/v1/chat/completions",
        api_key: "draft-key",
      }));
    });
    expect(await within(apiWindow).findByText("已获取 4 个模型，已选择 reasoner-model")).toBeInTheDocument();
    expect(within(apiWindow).getByLabelText("默认模型")).toHaveValue("reasoner-model");

    fireEvent.change(within(apiWindow).getByLabelText("默认模型"), { target: { value: "reasoner-model" } });
    fireEvent.change(within(apiWindow).getByLabelText("规划模型"), { target: { value: "reasoner-model" } });
    fireEvent.change(within(apiWindow).getByLabelText("写作模型"), { target: { value: "writer-model" } });
    fireEvent.change(within(apiWindow).getByLabelText("审校模型"), { target: { value: "critic-model" } });
    fireEvent.change(within(apiWindow).getByLabelText("助手模型"), { target: { value: "fast-model" } });
    await user.click(within(apiWindow).getByRole("button", { name: "保存API设置" }));

    await waitFor(() => {
      expect(saveLlmConfig).toHaveBeenCalledWith(expect.objectContaining({
        model: "reasoner-model",
        model_routes: {
          planner: "reasoner-model",
          writer: "writer-model",
          reviewer: "critic-model",
          assistant: "fast-model",
        },
      }));
    });
  });

  it("keeps API settings stable when model fetching returns an error shape", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchLlmModels).mockResolvedValueOnce({
      models: undefined as unknown as [],
      error: "模型列表解析失败：invalid json",
    });
    render(<App />);

    const apiWindow = await openApiSettings(user);
    await user.click(within(apiWindow).getByRole("button", { name: "获取模型列表" }));

    expect(await within(apiWindow).findByText("模型列表解析失败：invalid json")).toBeInTheDocument();
  });

  it("sanitizes API endpoint, model, and numeric limits before saving", async () => {
    const user = userEvent.setup();
    render(<App />);

    const apiWindow = await openApiSettings(user);

    await user.clear(within(apiWindow).getByLabelText("API地址"));
    await user.type(within(apiWindow).getByLabelText("API地址"), "  https://api.example.com/v1  ");
    await user.clear(within(apiWindow).getByLabelText("默认模型"));
    await user.type(within(apiWindow).getByLabelText("默认模型"), "  story-model  ");
    fireEvent.change(within(apiWindow).getByLabelText("API温度"), { target: { value: "3" } });
    fireEvent.change(within(apiWindow).getByLabelText("API最大输出"), { target: { value: "20000" } });
    await user.click(within(apiWindow).getByRole("button", { name: "保存API设置" }));

    await waitFor(() => {
      expect(saveLlmConfig).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: "https://api.example.com/v1",
        model: "story-model",
        model_routes: {
          planner: "story-model",
          writer: "story-model",
          reviewer: "story-model",
          assistant: "story-model",
        },
        temperature: 2,
        max_tokens: 16000,
      }));
    });
  });

  it("shows agent workflow states", () => {
    render(<App />);

    const assistant = screen.getByRole("region", { name: "AI助手" });
    expect(within(assistant).getByText("AI 控制台")).toBeInTheDocument();
    expect(within(assistant).getByText("当前任务模型")).toBeInTheDocument();
    expect(within(assistant).getByText("提示词广场")).toBeInTheDocument();
    expect(screen.getByText("主笔 Agent")).toBeInTheDocument();
    expect(screen.getByText("思考中")).toBeInTheDocument();
    expect(screen.getByText("已完成")).toBeInTheDocument();
    expect(screen.getByText("等待用户")).toBeInTheDocument();
    expect(screen.getByText("阻塞")).toBeInTheDocument();
  });

  it("asks the AI assistant for prompts and next optimization options", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValueOnce({
      msg_id: "assistant-1",
      response: "提示词：请强化第一章悬念。\n下一步优化选项：1. 补目标 2. 补阻力 3. 补钩子",
      mode: "llm",
    });
    render(<App />);

    const assistant = screen.getByRole("region", { name: "AI助手" });
    await user.type(within(assistant).getByLabelText("AI助手提问"), "帮我看下一步应该优化什么");
    await user.click(within(assistant).getByRole("button", { name: "询问AI助手" }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("下一步优化选项"), "worldbuilding", "assistant");
    });
    expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("帮我看下一步应该优化什么"), "worldbuilding", "assistant");
    expect(await within(assistant).findByText(/提示词：请强化第一章悬念/)).toBeInTheDocument();
    expect(within(assistant).getByText(/下一步优化选项/)).toBeInTheDocument();
  });

  it("fills AI assistant shortcuts without hidden API calls", async () => {
    const user = userEvent.setup();
    render(<App />);

    const assistant = screen.getByRole("region", { name: "AI助手" });
    const input = within(assistant).getByLabelText("AI助手提问");

    await user.click(within(assistant).getByRole("button", { name: "生成提示词选项" }));
    expect((input as HTMLTextAreaElement).value).toContain("提示词");
    expect(sendChat).not.toHaveBeenCalled();

    await user.click(within(assistant).getByRole("button", { name: "获取下一步优化" }));
    expect((input as HTMLTextAreaElement).value).toContain("下一步");
    expect(sendChat).not.toHaveBeenCalled();
  });

  it("keeps the AI assistant busy while a queued answer is pending", async () => {
    const user = userEvent.setup();
    let resolvePoll: ((value: Awaited<ReturnType<typeof pollChat>>) => void) | undefined;
    vi.mocked(sendChat).mockResolvedValueOnce({
      msg_id: "assistant-queued",
      status: "queued",
    });
    vi.mocked(pollChat).mockImplementationOnce(() => new Promise((resolve) => {
      resolvePoll = resolve;
    }));
    render(<App />);

    const assistant = screen.getByRole("region", { name: "AI助手" });
    const input = within(assistant).getByLabelText("AI助手提问");
    const askButton = within(assistant).getByRole("button", { name: "询问AI助手" });

    await user.type(input, "先检查提示词");
    await user.click(askButton);

    expect(await within(assistant).findByText("已入队")).toBeInTheDocument();
    expect(askButton).toBeDisabled();

    await user.type(input, "排队期间准备第二个问题");
    expect(askButton).toBeDisabled();

    resolvePoll?.({ response: null, pending_count: 1 });
    await waitFor(() => {
      expect(askButton).toBeEnabled();
    });
  });

  it("switches the active writing stage", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /人物设计/ }));

    expect(screen.getAllByText("角色导演").length).toBeGreaterThan(0);
    expect(screen.getByText("人物弧光")).toBeInTheDocument();
  });

  it("loads a stage quick command into the agent dispatcher", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "设计力量体系" }));

    expect(screen.getByLabelText("调度指令")).toHaveValue("设计力量体系");
  });

  it("shows a richer creative playbook for the active stage", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?setup=closed");
    render(<App />);

    expect(screen.getAllByText("创作蓝图").length).toBeGreaterThan(0);
    expect(screen.getByText("读者承诺")).toBeInTheDocument();
    expect(screen.getByText("章节节拍")).toBeInTheDocument();
    expect(screen.getAllByText("多 Agent 接力").length).toBeGreaterThan(0);
    expect(screen.getAllByText("世界观设计师").length).toBeGreaterThan(0);

    window.history.pushState({}, "", "/");
  });

  it("shows prompt budget and compression strategy", () => {
    render(<App />);

    expect(screen.getByRole("region", { name: "提示词广场" })).toBeInTheDocument();
    expect(screen.getByText("生成类")).toBeInTheDocument();
    expect(screen.getByText("变量")).toBeInTheDocument();
    expect(screen.getByText("版本")).toBeInTheDocument();
    expect(screen.getByText("质量守门")).toBeInTheDocument();
    expect(screen.getByText("世界观五维契约")).toBeInTheDocument();
    expect(screen.getByText("宏观节奏诊断")).toBeInTheDocument();
    expect(screen.getByText("API 消耗守卫")).toBeInTheDocument();
    expect(screen.getByText(/聊天\s+900字/)).toBeInTheDocument();
    expect(screen.getByText("上限 1200")).toBeInTheDocument();
    expect(screen.getByText("复用 12s")).toBeInTheDocument();
    expect(screen.getByText("只传阶段相关上下文")).toBeInTheDocument();
  });

  it("prevents duplicate WPS writes while a write is pending", async () => {
    const user = userEvent.setup();
    let finishWrite: ((value: { success: boolean }) => void) | undefined;
    vi.mocked(writeToWps).mockImplementationOnce(() => new Promise((resolve) => {
      finishWrite = resolve;
    }));
    render(<App />);

    const writeButton = screen.getByRole("button", { name: "写入 WPS" });
    await user.click(writeButton);

    expect(screen.getByRole("button", { name: "写入中" })).toBeDisabled();
    expect(screen.getByText("正在写入 WPS")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "写入中" }));
    expect(writeToWps).toHaveBeenCalledTimes(1);

    finishWrite?.({ success: true });
    expect(await screen.findByText(/已写入 WPS：世界观构建/)).toBeInTheDocument();
  });

  it("opens dedicated windows for cockpit functions", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });
    expect(budgetWindow).toBeInTheDocument();
    expect(within(budgetWindow).getByText("Token 分层预算")).toBeInTheDocument();
    expect(within(budgetWindow).getByText("重复请求防护")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭功能窗口" }));
    await user.click(screen.getByRole("button", { name: "打开生成模式窗口" }));
    const modeWindow = screen.getByRole("dialog", { name: "生成模式窗口" });
    expect(modeWindow).toBeInTheDocument();
    expect(within(modeWindow).getByText("速度 / 质量切换")).toBeInTheDocument();
    expect(within(modeWindow).getByText("API 调用策略")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭功能窗口" }));
    await showFunctionWindowGroup(user, "成稿");
    await user.click(screen.getByRole("button", { name: "打开创作蓝图窗口" }));
    const playbookWindow = screen.getByRole("dialog", { name: "创作蓝图窗口" });
    expect(playbookWindow).toBeInTheDocument();
    expect(within(playbookWindow).getByText("阶段作用")).toBeInTheDocument();
    expect(within(playbookWindow).getByText("接力分工")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭功能窗口" }));
    await user.click(screen.getByRole("button", { name: "打开文档窗口" }));
    const documentWindow = screen.getByRole("dialog", { name: "文档工作台窗口" });
    expect(documentWindow).toBeInTheDocument();
    expect(within(documentWindow).getByText("Prompt 预览区")).toBeInTheDocument();
    expect(within(documentWindow).getByText("WPS 同步区")).toBeInTheDocument();
  });

  it("keeps several function windows open and lets each window move", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    await user.click(screen.getByRole("button", { name: "打开生成模式窗口" }));
    await showFunctionWindowGroup(user, "成稿");
    await user.click(screen.getByRole("button", { name: "打开流水线窗口" }));

    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });
    expect(screen.getByRole("dialog", { name: "生成模式窗口" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "创作流水线窗口" })).toBeInTheDocument();

    const dragHandle = within(budgetWindow).getByLabelText("拖动预算控制窗口");
    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: 168, clientY: 146 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: 168, clientY: 146 });

    expect(budgetWindow).toHaveStyle({ transform: "translate(48px, 26px)" });
  });

  it("opens a token-safe function window workgroup without calling AI", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开人物线工作组" }));

    expect(screen.getByRole("dialog", { name: "人物档案窗口" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "伏笔账本窗口" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "连续性审计窗口" })).toBeInTheDocument();
    expect(screen.getByText(/已打开 3 个窗口/)).toBeInTheDocument();
    expect(sendChat).not.toHaveBeenCalled();
  });

  it("keeps a window dock available after the first function window opens", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const dock = screen.getByRole("navigation", { name: "功能窗口快捷栏" });

    await user.click(within(dock).getByRole("button", { name: "从快捷栏打开人物档案窗口" }));

    expect(screen.getByRole("dialog", { name: "预算控制窗口" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "人物档案窗口" })).toBeInTheDocument();
  });

  it("keeps function windows recoverable when dragged toward screen edges", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });
    const dragHandle = within(budgetWindow).getByLabelText("拖动预算控制窗口");

    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });
    expect(budgetWindow).toHaveStyle({ transform: "translate(-6px, -118px)" });

    fireEvent.pointerDown(dragHandle, { pointerId: 2, clientX: 120, clientY: 120 });
    fireEvent.pointerMove(dragHandle, { pointerId: 2, clientX: 4000, clientY: 4000 });
    fireEvent.pointerUp(dragHandle, { pointerId: 2, clientX: 4000, clientY: 4000 });
    expect(budgetWindow).toHaveStyle({ transform: "translate(126px, 238px)" });
  });

  it("keeps function windows recoverable after edge resize", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });
    const dragHandle = within(budgetWindow).getByLabelText("拖动预算控制窗口");
    const resizeHandle = within(budgetWindow).getByLabelText("调整预算控制窗口大小");

    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });

    fireEvent.pointerDown(resizeHandle, { pointerId: 2, clientX: 400, clientY: 400 });
    fireEvent.pointerMove(resizeHandle, { pointerId: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(resizeHandle, { pointerId: 2, clientX: 100, clientY: 100 });

    expect(budgetWindow).toHaveStyle({
      width: "560px",
      height: "320px",
      transform: "translate(-6px, -118px)",
    });
  });

  it("uses rendered width when clamping wide function windows", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
    openWithoutInitialSetup();
    render(<App />);

    await showFunctionWindowGroup(user, "成稿");
    await user.click(screen.getByRole("button", { name: "打开创作流水线窗口" }));
    const workflowWindow = screen.getByRole("dialog", { name: "创作流水线窗口" });
    const dragHandle = within(workflowWindow).getByLabelText("拖动创作流水线窗口");

    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });

    expect(workflowWindow).toHaveStyle({ transform: "translate(94px, -16px)" });
  });

  it("ignores non-left pointer starts on function window resize handles", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });
    const resizeHandle = within(budgetWindow).getByLabelText("调整预算控制窗口大小");

    fireEvent.pointerDown(resizeHandle, { button: 2, pointerId: 1, clientX: 400, clientY: 400 });
    fireEvent.pointerMove(resizeHandle, { button: 2, pointerId: 1, clientX: 460, clientY: 432 });
    fireEvent.pointerUp(resizeHandle, { button: 2, pointerId: 1, clientX: 460, clientY: 432 });

    expect(budgetWindow).toHaveStyle({ width: "860px", height: "380px" });
  });

  it("lets function windows resize like floating mini windows", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });

    const resizeHandle = within(budgetWindow).getByLabelText("调整预算控制窗口大小");
    fireEvent.pointerDown(resizeHandle, { pointerId: 1, clientX: 400, clientY: 400 });
    fireEvent.pointerMove(resizeHandle, { pointerId: 1, clientX: 460, clientY: 432 });
    fireEvent.pointerUp(resizeHandle, { pointerId: 1, clientX: 460, clientY: 432 });

    expect(budgetWindow).toHaveStyle({ width: "920px", height: "412px" });
  });

  it("sends a short AI instruction directly from a function window", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开预算窗口" }));
    const budgetWindow = screen.getByRole("dialog", { name: "预算控制窗口" });

    await user.type(within(budgetWindow).getByLabelText("预算控制窗口 AI 指令"), "压缩人物上下文");
    await user.click(within(budgetWindow).getByRole("button", { name: "发送预算控制窗口指令" }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("压缩人物上下文"), "worldbuilding", "planner");
    });
    expect(within(budgetWindow).getByText("已发送")).toBeInTheDocument();
    expect(screen.getAllByText("已收到窗口指令。").length).toBeGreaterThan(0);
  });

  it("opens a workflow window with token-safe agent ideas", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    expect(screen.getByText("创作流水线")).toBeInTheDocument();

    await showFunctionWindowGroup(user, "成稿");
    await user.click(screen.getByRole("button", { name: "打开创作流水线窗口" }));

    const workflowWindow = screen.getByRole("dialog", { name: "创作流水线窗口" });
    expect(workflowWindow).toBeInTheDocument();
    expect(within(workflowWindow).getByText("十阶段写作管线")).toBeInTheDocument();
    expect(within(workflowWindow).getByText("真相文件")).toBeInTheDocument();
    expect(within(workflowWindow).getByText("人工审核门")).toBeInTheDocument();
    expect(within(workflowWindow).getByText("多模型路由")).toBeInTheDocument();
    expect(within(workflowWindow).getByText(/Radar -> Planner -> Composer/)).toBeInTheDocument();
    expect(within(workflowWindow).getAllByText(/33维审计/).length).toBeGreaterThan(0);
  });

  it("opens a narrative engine window inspired by long-form plot kernels without calling AI", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await showFunctionWindowGroup(user, "成稿");
    await user.click(screen.getByRole("button", { name: "打开叙事引擎窗口" }));

    const engineWindow = screen.getByRole("dialog", { name: "叙事引擎窗口" });
    expect(engineWindow).toBeInTheDocument();
    expect(within(engineWindow).getByText("叙事状态快照")).toBeInTheDocument();
    expect(within(engineWindow).getByText("故事线 DAG")).toBeInTheDocument();
    expect(within(engineWindow).getByText("伏笔注册表")).toBeInTheDocument();
    expect(within(engineWindow).getByText("质量治理闭环")).toBeInTheDocument();
    expect(within(engineWindow).getByText("张力心电图")).toBeInTheDocument();
    expect(sendChat).not.toHaveBeenCalled();
  });

  it("opens continuity, character dossier, and context pack windows with direct AI actions", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await showFunctionWindowGroup(user, "故事维护");
    await user.click(screen.getByRole("button", { name: "打开连续性审计窗口" }));
    const auditWindow = screen.getByRole("dialog", { name: "连续性审计窗口" });
    expect(within(auditWindow).getByText("知识顺序审计")).toBeInTheDocument();
    expect(within(auditWindow).getByText("伏笔账本")).toBeInTheDocument();
    expect(within(auditWindow).getByText("矛盾触发器")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开人物档案窗口" }));
    const characterWindow = screen.getByRole("dialog", { name: "人物档案窗口" });
    expect(within(characterWindow).getByText("人物目标卡")).toBeInTheDocument();
    expect(within(characterWindow).getByText("关系状态卡")).toBeInTheDocument();
    expect(within(characterWindow).getByText("秘密与代价")).toBeInTheDocument();

    await showFunctionWindowGroup(user, "规划");
    await user.click(screen.getByRole("button", { name: "打开上下文包窗口" }));
    const contextWindow = screen.getByRole("dialog", { name: "上下文包窗口" });
    expect(within(contextWindow).getByText("短上下文包")).toBeInTheDocument();
    expect(within(contextWindow).getByText("只传增量")).toBeInTheDocument();

    fireEvent.change(within(auditWindow).getByLabelText("连续性审计窗口 AI 指令"), {
      target: { value: "检查主角是否提前知道禁区规则" },
    });
    await user.click(within(auditWindow).getByRole("button", { name: "发送连续性审计窗口指令" }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("检查主角是否提前知道禁区规则"), "worldbuilding", "reviewer");
    });
  });

  it("opens hook ledger and chapter planner windows for novel document work", async () => {
    const user = userEvent.setup();
    openWithoutInitialSetup();
    render(<App />);

    await showFunctionWindowGroup(user, "故事维护");
    await user.click(screen.getByRole("button", { name: "打开伏笔账本窗口" }));
    const hookWindow = screen.getByRole("dialog", { name: "伏笔账本窗口" });
    expect(within(hookWindow).getByText("埋设记录")).toBeInTheDocument();
    expect(within(hookWindow).getByText("误导解释")).toBeInTheDocument();
    expect(within(hookWindow).getByText("回收窗口")).toBeInTheDocument();

    await showFunctionWindowGroup(user, "规划");
    await user.click(screen.getByRole("button", { name: "打开章节规划窗口" }));
    const plannerWindow = screen.getByRole("dialog", { name: "章节规划窗口" });
    expect(within(plannerWindow).getByText("章节目标")).toBeInTheDocument();
    expect(within(plannerWindow).getByText("场景节拍")).toBeInTheDocument();
    expect(within(plannerWindow).getByText("章末钩子")).toBeInTheDocument();

    await user.type(within(hookWindow).getByLabelText("伏笔账本窗口 AI 指令"), "整理第一卷未回收伏笔");
    await user.click(within(hookWindow).getByRole("button", { name: "发送伏笔账本窗口指令" }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("整理第一卷未回收伏笔"), "worldbuilding", "planner");
    });
  });

  it("can open a cockpit function window from a direct link", () => {
    window.history.pushState({}, "", "/?feature=budget");

    render(<App />);

    expect(screen.getByRole("dialog", { name: "预算控制窗口" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("can open API settings from a direct link", async () => {
    window.history.pushState({}, "", "/?api=open&setup=closed");

    render(<App />);

    expect(await screen.findByRole("dialog", { name: "API设置窗口" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("can open workspace settings from a direct link", () => {
    window.history.pushState({}, "", "/?settings=open&setup=closed");

    render(<App />);

    expect(screen.getByRole("dialog", { name: "工作台设置窗口" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开API设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新链路" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("can open the workflow window from a direct link", () => {
    window.history.pushState({}, "", "/?feature=workflow");

    render(<App />);

    expect(screen.getByRole("dialog", { name: "创作流水线窗口" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("opens a zoomable and draggable character relationship window", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("故事流程图")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开人物关系窗" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开人物关系窗" }));

    expect(screen.getByRole("dialog", { name: "人物关系窗口" })).toBeInTheDocument();
    expect(screen.getByText("关系演变日志")).toBeInTheDocument();
    expect(document.querySelectorAll(".relationship-window path[data-edge-id]").length).toBeGreaterThanOrEqual(3);

    await user.click(screen.getByRole("button", { name: "放大任务线" }));

    expect(screen.getByText("120%")).toBeInTheDocument();

    const canvas = screen.getByLabelText("可拖拽人物关系画布");
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 170, clientY: 145 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 170, clientY: 145 });

    expect(document.querySelector(".relationship-canvas-inner")).toHaveStyle({
      transform: "translate(50px, 25px) scale(1.2)",
    });
  });

  it("can open the character relationship window from a direct link", () => {
    window.history.pushState({}, "", "/?relations=open");

    render(<App />);

    expect(screen.getByRole("dialog", { name: "人物关系窗口" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("shows a story flow map with relationship causes and future shifts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开人物关系窗" }));

    expect(screen.getByText("因果链")).toBeInTheDocument();
    expect(screen.getByText("回收点")).toBeInTheDocument();
    expect(screen.getByText("下一章落点")).toBeInTheDocument();
    expect(screen.getAllByText("主要剧情引导").length).toBeGreaterThan(0);
    expect(screen.getAllByText("变化原因").length).toBeGreaterThan(0);
    expect(screen.getAllByText("后续变化").length).toBeGreaterThan(0);
    expect(screen.getByText("关系演变日志")).toBeInTheDocument();
    expect(screen.getByText("强 64")).toBeInTheDocument();
    expect(screen.getAllByText("首现 第1章").length).toBeGreaterThan(0);
    expect(screen.getAllByText("主角").length).toBeGreaterThan(0);
    expect(screen.getAllByText("女主").length).toBeGreaterThan(0);
    expect(screen.getAllByText("互相试探").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".relationship-lines path[data-edge-id]").length).toBeGreaterThanOrEqual(3);
    expect(document.querySelector('[data-edge-id="hero-heroine"]')).toBeInTheDocument();
  });

  it("shows scene cards linked to plot lines and reader hooks", () => {
    render(<App />);

    expect(screen.getByText("场景卡片")).toBeInTheDocument();
    expect(screen.getAllByText("S01 禁区入口").length).toBeGreaterThan(0);
    expect(screen.getAllByText("目标").length).toBeGreaterThan(0);
    expect(screen.getAllByText("冲突").length).toBeGreaterThan(0);
    expect(screen.getAllByText("钩子").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/主线/).length).toBeGreaterThan(0);
  });

  it("opens dedicated windows for scene cards and relationship timeline", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开场景卡片窗口" }));
    const sceneWindow = screen.getByRole("dialog", { name: "场景卡片窗口" });
    expect(sceneWindow).toBeInTheDocument();
    expect(within(sceneWindow).getAllByText("场景作用").length).toBeGreaterThan(0);
    expect(within(sceneWindow).getAllByText("读者钩子").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "关闭故事功能窗口" }));
    await user.click(screen.getByRole("button", { name: "打开关系时间线窗口" }));
    const timelineWindow = screen.getByRole("dialog", { name: "关系时间线窗口" });
    expect(timelineWindow).toBeInTheDocument();
    expect(within(timelineWindow).getAllByText("变化原因").length).toBeGreaterThan(0);
    expect(within(timelineWindow).getAllByText("后续关系变化").length).toBeGreaterThan(0);
  });

  it("can open a story function window from a direct link", () => {
    window.history.pushState({}, "", "/?storyWindow=scenes");

    render(<App />);

    expect(screen.getByRole("dialog", { name: "场景卡片窗口" })).toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("shows a relationship timeline that connects scenes to evolving edges", () => {
    render(<App />);

    expect(screen.getByText("关系时间线")).toBeInTheDocument();
    expect(screen.getAllByText(/S01 禁区入口/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("变化原因").length).toBeGreaterThan(0);
    expect(screen.getAllByText("后续变化").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/互相试探/).length).toBeGreaterThan(0);
  });

  it("shows generation modes and queues the fast mode command", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getAllByText("生成模式").length).toBeGreaterThan(0);
    expect(screen.getByText("快速")).toBeInTheDocument();
    expect(screen.getByText("标准")).toBeInTheDocument();
    expect(screen.getByText("深度")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "快速生成" }));

    expect((screen.getByLabelText("调度指令") as HTMLTextAreaElement).value).toContain("优先速度");
  });

  it("loads a playbook seed into the agent dispatcher", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "调用素材：世界观风险清单" }));

    expect(screen.getByLabelText("调度指令")).toHaveValue(
      "请让世界观设计师生成世界观风险清单，逐条检查力量体系、势力版图、隐藏真相和升级代价是否能支撑长篇连载。",
    );
  });
});
