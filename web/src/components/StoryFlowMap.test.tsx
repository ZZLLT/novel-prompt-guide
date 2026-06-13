import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sendChat } from "../api/client";
import { StoryFlowMap } from "./StoryFlowMap";

vi.mock("../api/client", () => ({
  sendChat: vi.fn(),
}));

const defaultInnerWidth = window.innerWidth;
const defaultInnerHeight = window.innerHeight;

function element<T extends Element = HTMLElement>(container: HTMLElement, selector: string): T {
  const found = container.querySelector(selector);
  if (!found) throw new Error(`Missing selector: ${selector}`);
  return found as T;
}

async function openRelationshipWindow(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
  await user.click(element<HTMLButtonElement>(container, ".relationship-launch-panel button"));
  return element<HTMLElement>(container, ".relationship-window");
}

describe("StoryFlowMap relationship suggestions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: defaultInnerWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: defaultInnerHeight });
  });

  it("submits an AI suggestion for the selected relationship and pins it on the graph", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValue({
      msg_id: "ai-suggestion-1",
      status: "queued",
      budget: {
        chars: 120,
        raw_chars: 240,
        saved_chars: 120,
        estimated_tokens: 70,
        raw_estimated_tokens: 140,
        sections: ["plot"],
      },
    });

    const { container } = render(<StoryFlowMap />);
    await openRelationshipWindow(user, container);

    await user.type(element<HTMLTextAreaElement>(container, ".relationship-suggestion-panel textarea"), "Let the heroine publicly back the hero.");
    await user.click(element<HTMLButtonElement>(container, ".relationship-suggestion-panel button"));

    expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("Let the heroine publicly back the hero."), "plot");
    await waitFor(() => expect(container.querySelector(".suggestion-queued")).toBeInTheDocument());
    expect(container.querySelector('[data-suggestion-edge-id="hero-heroine"]')).toBeInTheDocument();
  });

  it("applies plot relationship changes by adding actors, changing lines, and submitting a short AI check", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValue({
      msg_id: "relationship-change-1",
      status: "queued",
    });

    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    fireEvent.change(within(relationshipWindow).getByLabelText("plot relationship change"), {
      target: {
        value:
          "add actor: Informant\nrelationship: Hero->Informant\nstatus: short trade\ncause: Informant gives the forbidden-zone map\nnext: Hero must pay with a secret",
      },
    });
    await user.click(within(relationshipWindow).getByRole("button", { name: "apply plot relationship change" }));

    expect(within(relationshipWindow).getByText("Informant")).toBeInTheDocument();
    expect(within(relationshipWindow).getAllByText("short trade").length).toBeGreaterThan(0);
    expect(relationshipWindow.querySelector('[data-actor-id="dynamic-informant"]')).toBeInTheDocument();
    expect(relationshipWindow.querySelector('[data-edge-id="dynamic-hero-informant"]')).toBeInTheDocument();
    expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("Informant gives the forbidden-zone map"), "plot");
    expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("only evaluate this relationship change"), "plot");
    await waitFor(() => expect(relationshipWindow.querySelector(".change-applied")).toBeInTheDocument());
  });

  it("removes actors and their relationship lines when the plot change says they exit", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValue({ msg_id: "relationship-change-2", status: "queued" });

    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);
    expect(relationshipWindow.querySelector('[data-actor-id="mentor"]')).toBeInTheDocument();

    fireEvent.change(within(relationshipWindow).getByLabelText("plot relationship change"), {
      target: {
        value: "remove actor: mentor\nremove relationship: mentor->hero\ncause: mentor exits to hide the truth\nnext: hero loses the guarantor",
      },
    });
    await user.click(within(relationshipWindow).getByRole("button", { name: "apply plot relationship change" }));

    expect(relationshipWindow.querySelector('[data-actor-id="mentor"]')).not.toBeInTheDocument();
    expect(relationshipWindow.querySelector('[data-edge-id="mentor-hero"]')).not.toBeInTheDocument();
    await waitFor(() => expect(relationshipWindow.querySelector(".change-applied")).toBeInTheDocument());
  });

  it("lets actor nodes drag and redraws their connected relationship lines", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);
    const heroNode = element<HTMLElement>(relationshipWindow, '[data-actor-id="hero"]');
    const heroHeroineLine = element<SVGPathElement>(relationshipWindow, 'path[data-edge-id="hero-heroine"]');
    const beforePath = heroHeroineLine.getAttribute("d");

    // New fixed layout: hero starts at (380, 230) for lead lane
    fireEvent.pointerDown(heroNode, { pointerId: 5, clientX: 120, clientY: 90 });
    fireEvent.pointerMove(heroNode, { pointerId: 5, clientX: 168, clientY: 126 });
    fireEvent.pointerUp(heroNode, { pointerId: 5, clientX: 168, clientY: 126 });

    // After dragging 48px right and 36px down: (380+48, 230+36) = (428, 266)
    expect(heroNode).toHaveAttribute("data-actor-x", "428");
    expect(heroNode).toHaveAttribute("data-actor-y", "266");
    expect(heroHeroineLine.getAttribute("d")).not.toBe(beforePath);
  });

  it("opens an actor information panel when clicking a character", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    await user.click(element<HTMLElement>(relationshipWindow, '[data-actor-id="hero"]'));

    const profile = within(relationshipWindow).getByLabelText("actor profile panel");
    expect(within(profile).getByText("主角")).toBeInTheDocument();
    expect(within(profile).getByText("3")).toBeInTheDocument();
    expect(within(profile).getByText(/互相试探|明暗对抗|带条件扶持/)).toBeInTheDocument();
  });

  it("shows readable relationship cards directly on each relationship line", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    const heroHeroineCard = element<HTMLElement>(relationshipWindow, '[data-edge-summary-id="hero-heroine"]');

    expect(heroHeroineCard).toHaveTextContent("主角 -> 女主");
    expect(heroHeroineCard).toHaveTextContent("互相试探");
    expect(heroHeroineCard).toHaveTextContent("强 64");
    expect(heroHeroineCard).toHaveTextContent("后续");
  });

  it("keeps relationship cards compact and lets the task line canvas zoom", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);
    const heroHeroineCard = element<HTMLElement>(relationshipWindow, '[data-edge-summary-id="hero-heroine"]');
    const canvasInner = element<HTMLElement>(relationshipWindow, ".relationship-canvas-inner");
    const heroHeroineCardTop = Number.parseFloat(heroHeroineCard.style.top);
    const heroHeroineMidY = Number.parseFloat(heroHeroineCard.dataset.edgeMidY || "0");

    expect(heroHeroineCard).toHaveAttribute("data-card-density", "compact");
    expect(heroHeroineCard.querySelectorAll("dt").length).toBeLessThanOrEqual(1);
    expect(Math.abs(heroHeroineCardTop - heroHeroineMidY)).toBeGreaterThanOrEqual(32);
    expect(relationshipWindow.querySelectorAll('.actor-node[data-node-density="compact"]').length).toBeGreaterThanOrEqual(4);
    expect(canvasInner.style.transform).toContain("scale(1)");

    await user.click(within(relationshipWindow).getByRole("button", { name: "放大任务线" }));
    expect(canvasInner.style.transform).toContain("scale(1.2)");

    await user.click(within(relationshipWindow).getByRole("button", { name: "缩小任务线" }));
    expect(canvasInner.style.transform).toContain("scale(1)");
  });

  it("offers relationship presets for novel type, graph layout, relation type, and update strategy", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    const presetPanel = within(relationshipWindow).getByLabelText("relationship preset panel");

    expect(within(presetPanel).getByText("背叛风险")).toBeInTheDocument();
    expect(within(presetPanel).getByText("秘密共享")).toBeInTheDocument();
    expect(within(presetPanel).getByText(/虚线.*隐藏关系/)).toBeInTheDocument();

    await user.selectOptions(within(presetPanel).getByLabelText("小说类型预设"), "political");
    await user.selectOptions(within(presetPanel).getByLabelText("布局预设"), "faction");
    await user.selectOptions(within(presetPanel).getByLabelText("AI 更新策略预设"), "low-token");

    expect(within(presetPanel).getAllByText("权谋朝堂").length).toBeGreaterThan(0);
    expect(within(presetPanel).getAllByText("阵营分组图").length).toBeGreaterThan(0);
    expect(within(presetPanel).getAllByText("低 token 更新").length).toBeGreaterThan(0);
    expect(within(presetPanel).getByText(/把柄|盟约|背刺/)).toBeInTheDocument();
  });

  it("edits a relationship by dragging its line and saves a plot impact with one AI call", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValue({ msg_id: "relationship-impact-1", status: "queued" });
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);
    const line = element<SVGPathElement>(relationshipWindow, 'path[data-edge-id="hero-heroine"]');
    const beforePath = line.getAttribute("d");

    fireEvent.pointerDown(line, { pointerId: 9, clientX: 220, clientY: 90 });
    fireEvent.pointerMove(line, { pointerId: 9, clientX: 250, clientY: 118 });
    fireEvent.pointerUp(line, { pointerId: 9, clientX: 250, clientY: 118 });

    const editor = within(relationshipWindow).getByLabelText("relationship line editor");
    expect(line.getAttribute("d")).not.toBe(beforePath);
    fireEvent.change(within(editor).getByLabelText("relationship status"), { target: { value: "fragile alliance" } });
    fireEvent.change(within(editor).getByLabelText("relationship cause"), { target: { value: "hero hides the real cost" } });
    fireEvent.change(within(editor).getByLabelText("relationship next shift"), { target: { value: "heroine tests him in the next chapter" } });
    await user.click(within(editor).getByRole("button", { name: "save relationship line change" }));

    expect(within(relationshipWindow).getAllByText("fragile alliance").length).toBeGreaterThan(0);
    expect(within(relationshipWindow).getAllByText("heroine tests him in the next chapter").length).toBeGreaterThan(0);
    expect(sendChat).toHaveBeenCalledTimes(1);
    expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("relationship impact"), "plot");
    expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("fragile alliance"), "plot");
  });

  it("does not submit duplicate relationship suggestions while one is sending", async () => {
    const user = userEvent.setup();
    let resolveChat: (value: Awaited<ReturnType<typeof sendChat>>) => void = () => undefined;
    vi.mocked(sendChat).mockReturnValue(
      new Promise((resolve) => {
        resolveChat = resolve;
      }) as ReturnType<typeof sendChat>,
    );

    const { container } = render(<StoryFlowMap />);
    await openRelationshipWindow(user, container);

    await user.type(element<HTMLTextAreaElement>(container, ".relationship-suggestion-panel textarea"), "Check this relationship change.");
    const submitButton = element<HTMLButtonElement>(container, ".relationship-suggestion-panel button");
    await user.click(submitButton);
    await user.click(submitButton);

    expect(sendChat).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    resolveChat({ msg_id: "ai-suggestion-2", status: "queued" });
    await waitFor(() => expect(container.querySelector(".suggestion-queued")).toBeInTheDocument());
  });

  it("lets the character relationship window itself move independently from the canvas", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal", "true");
    expect(container.querySelector(".relationship-window-layer")).toBeInTheDocument();

    const dragHandle = element<HTMLElement>(container, ".relationship-window-header");
    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 80, clientY: 80 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: 116, clientY: 104 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: 116, clientY: 104 });

    expect(relationshipWindow).toHaveStyle({ transform: "translate(24px, 24px)" });
  });

  it("keeps the character relationship window recoverable near screen edges", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    const dragHandle = element<HTMLElement>(container, ".relationship-window-header");
    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 80, clientY: 80 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: -2000, clientY: -2000 });
    expect(relationshipWindow).toHaveStyle({ transform: "translate(-24px, -24px)" });

    fireEvent.pointerDown(dragHandle, { pointerId: 2, clientX: 80, clientY: 80 });
    fireEvent.pointerMove(dragHandle, { pointerId: 2, clientX: 4000, clientY: 4000 });
    fireEvent.pointerUp(dragHandle, { pointerId: 2, clientX: 4000, clientY: 4000 });
    expect(relationshipWindow).toHaveStyle({ transform: "translate(24px, 24px)" });
  });

  it("ignores non-left pointer starts on relationship window resize handles", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    const resizeHandle = element<HTMLElement>(container, ".relationship-window .window-resize-handle");
    fireEvent.pointerDown(resizeHandle, { button: 2, pointerId: 1, clientX: 500, clientY: 500 });
    fireEvent.pointerMove(resizeHandle, { button: 2, pointerId: 1, clientX: 548, clientY: 530 });
    fireEvent.pointerUp(resizeHandle, { button: 2, pointerId: 1, clientX: 548, clientY: 530 });

    expect(relationshipWindow).toHaveStyle({ width: "1120px", height: "720px" });
  });

  it("lets the character relationship window resize like a mini window", async () => {
    const user = userEvent.setup();
    const { container } = render(<StoryFlowMap />);
    const relationshipWindow = await openRelationshipWindow(user, container);

    const resizeHandle = element<HTMLElement>(container, ".relationship-window .window-resize-handle");
    fireEvent.pointerDown(resizeHandle, { pointerId: 1, clientX: 500, clientY: 500 });
    fireEvent.pointerMove(resizeHandle, { pointerId: 1, clientX: 548, clientY: 530 });
    fireEvent.pointerUp(resizeHandle, { pointerId: 1, clientX: 548, clientY: 530 });

    expect(relationshipWindow).toHaveStyle({ width: "1168px", height: "750px" });
  });

  it("keeps story function windows open, movable, and able to send AI instructions", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValue({
      msg_id: "story-window-ai",
      response: "Scene advice recorded.",
      mode: "llm",
    });

    const { container } = render(<StoryFlowMap />);

    await user.click(element<HTMLButtonElement>(container, ".scene-card-board > header button"));
    await user.click(element<HTMLButtonElement>(container, ".relationship-timeline header button"));

    const sceneWindow = element<HTMLElement>(container, ".story-function-window");
    expect(container.querySelectorAll(".story-function-window")).toHaveLength(2);

    const dragHandle = element<HTMLElement>(sceneWindow, ".story-function-window-header");
    fireEvent.pointerDown(dragHandle, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(dragHandle, { pointerId: 1, clientX: 134, clientY: 126 });
    fireEvent.pointerUp(dragHandle, { pointerId: 1, clientX: 134, clientY: 126 });
    expect(sceneWindow).toHaveStyle({ transform: "translate(34px, 26px)" });

    await user.type(element<HTMLTextAreaElement>(sceneWindow, ".window-agent-box textarea"), "Strengthen the S01 hook.");
    await user.click(element<HTMLButtonElement>(sceneWindow, ".window-agent-actions button"));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith(expect.stringContaining("Strengthen the S01 hook."), "plot");
    });
    await waitFor(() => expect(sceneWindow.querySelector(".status-sent")).toBeInTheDocument());
  });

  it("lets story function windows resize independently", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValue({
      msg_id: "story-window-ai",
      response: "ok",
      mode: "llm",
    });

    const { container } = render(<StoryFlowMap />);

    await user.click(element<HTMLButtonElement>(container, ".scene-card-board > header button"));
    const sceneWindow = element<HTMLElement>(container, ".story-function-window");

    const resizeHandle = element<HTMLElement>(sceneWindow, ".window-resize-handle");
    fireEvent.pointerDown(resizeHandle, { pointerId: 1, clientX: 420, clientY: 420 });
    fireEvent.pointerMove(resizeHandle, { pointerId: 1, clientX: 476, clientY: 448 });
    fireEvent.pointerUp(resizeHandle, { pointerId: 1, clientX: 476, clientY: 448 });

    expect(sceneWindow).toHaveStyle({ width: "1036px", height: "548px" });
  });
});
