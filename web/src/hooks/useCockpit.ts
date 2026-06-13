import { useCallback, useMemo, useRef, useState } from "react";
import {
  generatePrompt,
  getDocumentState,
  getStatus,
  pollChat,
  readDocSection,
  sendChat,
  writeToWps,
} from "../api/client";
import type { AgentStatus, ApiStatus, DocumentState, GenerationModeId, ModelRole, PromptBudget, StageId } from "../api/types";
import { agents as agentConfigs } from "../data/agents";
import { stageOrder, stages } from "../data/stages";

export type AgentRuntime = {
  id: string;
  name: string;
  role: string;
  stage: StageId | "all";
  status: AgentStatus;
  signal: string;
  task: string;
  output?: string;
};

export type ChatMessage = {
  id: string;
  from: "user" | "agent";
  text: string;
};

export type AssistantStatus = "idle" | "sending" | "queued" | "answered" | "error";

export type FormDataByStage = Record<StageId, Record<string, string>>;

export type InitialNovelSetup = {
  title: string;
  genre: string;
  style: string;
  premise: string;
  protagonist: string;
  coreConflict: string;
  worldRule: string;
  firstVolumeGoal: string;
};

function createInitialFormData(): FormDataByStage {
  return stageOrder.reduce((acc, stageId) => {
    acc[stageId] = {};
    for (const field of stages[stageId].fields) {
      acc[stageId][field.id] = "";
    }
    return acc;
  }, {} as FormDataByStage);
}

function statusForStage(stage: StageId): AgentStatus {
  if (stage === "chapters") return "working";
  if (stage === "plot") return "waiting";
  return "queued";
}

function buildAssistantPrompt(question: string, stageLabel: string) {
  return [
    "【AI 助手】",
    `当前阶段：${stageLabel}`,
    `用户问题：${question}`,
    "请输出三段：",
    "1. 可直接复制使用的提示词",
    "2. 下一步优化选项（3 条，按优先级排序）",
    "3. 需要用户补充的信息（如果没有就写“无需补充”）",
    "限制：只基于本次问题给短建议，不要重写整章，不要要求全量上下文。",
  ].join("\n");
}

function uniqueMessageId(seed: string) {
  return `${seed}-${crypto.randomUUID()}`;
}

function modelRoleForStage(stage: StageId): ModelRole {
  return stage === "chapters" ? "writer" : "planner";
}

function modelRoleForWindowInstruction(message: string, stage: StageId): ModelRole {
  return /检查|审校|审计|一致|矛盾|润色|修订|复盘/.test(message) ? "reviewer" : modelRoleForStage(stage);
}

export function useCockpit() {
  const [currentStage, setCurrentStage] = useState<StageId>("worldbuilding");
  const [formData, setFormData] = useState<FormDataByStage>(() => createInitialFormData());
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState | null>(null);
  const [agents, setAgents] = useState<AgentRuntime[]>(agentConfigs);
  const [promptPreview, setPromptPreview] = useState("");
  const [lastBudget, setLastBudget] = useState<PromptBudget | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationModeId>("standard");
  const [wpsSnapshot, setWpsSnapshot] = useState("");
  const [wpsSyncStatus, setWpsSyncStatus] = useState("等待 WPS 操作");
  const [wpsReading, setWpsReading] = useState(false);
  const [wpsWriting, setWpsWriting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "agent",
      text: "创作舱已待命。选择阶段，调度 Agent，或把当前内容同步到 WPS。",
    },
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>("idle");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      from: "agent",
      text: "可以直接问我：下一步优化什么、怎么写提示词、哪个窗口该先处理。",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const generatePendingRef = useRef(false);
  const wpsReadPendingRef = useRef(false);
  const wpsWritePendingRef = useRef(false);
  const instructionPendingRef = useRef(false);
  const assistantPendingRef = useRef(false);
  const windowInstructionPendingRef = useRef<Set<string>>(new Set());

  const activeStage = stages[currentStage];

  const setFieldValue = useCallback((fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [currentStage]: {
        ...prev[currentStage],
        [fieldId]: value,
      },
    }));
  }, [currentStage]);

  const markAgent = useCallback((stage: StageId | "all", statusValue: AgentStatus, output?: string) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.stage !== stage && agent.stage !== "all") return agent;
        return {
          ...agent,
          status: statusValue,
          output: output ?? agent.output,
        };
      }),
    );
  }, []);

  const refreshStatus = useCallback(async () => {
    setError(null);
    try {
      const [nextStatus, nextState] = await Promise.all([getStatus(), getDocumentState()]);
      setStatus(nextStatus);
      setDocumentState(nextState);
      if (!nextStatus.connected) {
        markAgent("all", "blocked", "WPS 未连接，暂时只使用本地上下文。");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }, [markAgent]);

  const generate = useCallback(async () => {
    if (generatePendingRef.current) return;
    generatePendingRef.current = true;
    setError(null);
    markAgent(currentStage, "working");
    try {
      const result = await generatePrompt(currentStage, generationMode);
      if (result.status === "blocked" && result.guard === "token_limit") {
        const message = `生成提示超过 API 上限，已阻止入队，估算 ${result.api_token_estimate ?? "?"} tok。请改用更短指令或继续补充局部场景。`;
        setPromptPreview(message);
        setLastBudget(result.budget ?? null);
        markAgent(currentStage, "blocked", message);
        return;
      }
      const prompt = result.prompt || "已提交生成任务，等待文件队列返回。";
      setPromptPreview(prompt);
      setLastBudget(result.budget ?? null);
      const output = result.guard === "auto_downgraded"
        ? `已自动降为 ${result.mode} 模式，估算 ${result.api_token_estimate ?? "?"} tok。`
        : prompt.slice(0, 160);
      markAgent(currentStage, result.status === "queued" ? "queued" : "done", output);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : String(nextError);
      setError(message);
      markAgent(currentStage, "blocked", message);
    } finally {
      generatePendingRef.current = false;
    }
  }, [currentStage, generationMode, markAgent]);

  const writeCurrentStage = useCallback(async () => {
    if (wpsWritePendingRef.current) return;
    const lines = [`=== ${activeStage.label} ===`];
    for (const field of activeStage.fields) {
      const value = formData[currentStage][field.id];
      if (value.trim()) lines.push(`${field.label}：${value}`);
    }
    const payload = lines.join("\n");
    wpsWritePendingRef.current = true;
    setWpsWriting(true);
    setWpsSyncStatus("正在写入 WPS");
    setError(null);
    try {
      await writeToWps(payload, "end");
      const statusText = `已写入 WPS：${activeStage.label}，${payload.length} 字。`;
      setWpsSyncStatus(statusText);
      markAgent("all", "done", "当前阶段已写入 WPS。");
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : String(nextError);
      setError(message);
      setWpsSyncStatus(`写入失败：${message}`);
      markAgent("all", "blocked", message);
    } finally {
      wpsWritePendingRef.current = false;
      setWpsWriting(false);
    }
  }, [activeStage, currentStage, formData, markAgent]);

  const readCurrentStage = useCallback(async () => {
    if (wpsReadPendingRef.current) return;
    wpsReadPendingRef.current = true;
    setWpsReading(true);
    setWpsSyncStatus("正在读取 WPS");
    setError(null);
    try {
      const result = await readDocSection(currentStage);
      setWpsSnapshot(result.text || "WPS 中此阶段暂无内容。");
      setWpsSyncStatus(`已读取 WPS：${activeStage.label}`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : String(nextError);
      setError(message);
      setWpsSyncStatus(`读取失败：${message}`);
    } finally {
      wpsReadPendingRef.current = false;
      setWpsReading(false);
    }
  }, [activeStage.label, currentStage]);

  const queueQuickCommand = useCallback((command: string) => {
    setChatInput(command);
  }, []);

  const selectGenerationMode = useCallback((mode: GenerationModeId, command: string) => {
    setGenerationMode(mode);
    setChatInput(command);
  }, []);

  const applyInitialSetup = useCallback((setup: InitialNovelSetup) => {
    setFormData((prev) => ({
      ...prev,
      cover: {
        ...prev.cover,
        title: setup.title,
        genre: setup.genre,
        style: setup.style,
        concept: setup.premise,
      },
      worldbuilding: {
        ...prev.worldbuilding,
        world_type: setup.genre,
        conflict: setup.coreConflict,
        rules: setup.worldRule,
      },
      characters: {
        ...prev.characters,
        name: setup.protagonist,
        profile: setup.protagonist ? `${setup.protagonist}：${setup.premise}` : setup.premise,
      },
      plot: {
        ...prev.plot,
        oneliner: setup.premise,
        volume1: setup.firstVolumeGoal,
      },
    }));
    setCurrentStage("cover");
    setChatInput(
      [
        "请基于以下小说初设，帮我检查卖点、主线冲突和第一卷目标是否足够清晰。",
        `作品：${setup.title || "未命名"}`,
        `类型：${setup.genre || "未定"}`,
        `风格：${setup.style || "未定"}`,
        `一句话设定：${setup.premise || "未填写"}`,
        `主角：${setup.protagonist || "未定"}`,
        `核心冲突：${setup.coreConflict || "未填写"}`,
        `世界规则：${setup.worldRule || "未填写"}`,
        `第一卷目标：${setup.firstVolumeGoal || "未填写"}`,
      ].join("\n"),
    );
  }, []);

  const sendInstruction = useCallback(async () => {
    const message = chatInput.trim();
    if (!message || instructionPendingRef.current) return;
    instructionPendingRef.current = true;
    setChatInput("");
    setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text: message }]);
    markAgent(currentStage, "working");
    try {
      const result = await sendChat(message, currentStage, modelRoleForStage(currentStage));
      setLastBudget(result.budget ?? null);
      if ("response" in result) {
        setChatMessages((prev) => [...prev, { id: uniqueMessageId(result.msg_id), from: "agent", text: result.response }]);
        markAgent(currentStage, "done", result.response.slice(0, 160));
        return result;
      }
      const queuedText = result.guard === "token_limit"
        ? `本次超过 API 即时调用上限，已转入文件队列，估算 ${result.api_token_estimate ?? "?"} tok。`
        : "任务已进入队列，等待 AI 回传。";
      setChatMessages((prev) => [...prev, { id: uniqueMessageId(result.msg_id), from: "agent", text: queuedText }]);
      markAgent(currentStage, "queued", result.guard === "token_limit" ? "Token 守卫已拦截直接 API 调用。" : "文件队列处理中。");
      const pollResult = await pollChat(result.msg_id);
      if (pollResult.response) {
        setChatMessages((prev) => [...prev, { id: `${result.msg_id}-reply`, from: "agent", text: pollResult.response!.response }]);
        markAgent(currentStage, "done", pollResult.response.response.slice(0, 160));
      }
    } catch (nextError) {
      const nextMessage = nextError instanceof Error ? nextError.message : String(nextError);
      setError(nextMessage);
      markAgent(currentStage, "blocked", nextMessage);
    } finally {
      instructionPendingRef.current = false;
    }
  }, [chatInput, currentStage, markAgent]);

  const sendWindowInstruction = useCallback(async (message: string, stageOverride?: StageId) => {
    const trimmedMessage = message.trim();
    const targetStage = stageOverride ?? currentStage;
    const requestKey = `${targetStage}:${trimmedMessage}`;
    if (!trimmedMessage || windowInstructionPendingRef.current.has(requestKey)) return;
    windowInstructionPendingRef.current.add(requestKey);
    setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text: trimmedMessage }]);
    markAgent(targetStage, "working");
    try {
      const result = await sendChat(trimmedMessage, targetStage, modelRoleForWindowInstruction(trimmedMessage, targetStage));
      setLastBudget(result.budget ?? null);
      if ("response" in result) {
        setChatMessages((prev) => [...prev, { id: uniqueMessageId(result.msg_id), from: "agent", text: result.response }]);
        markAgent(targetStage, "done", result.response.slice(0, 160));
        return result;
      }
      const queuedText = result.guard === "token_limit"
        ? `窗口指令超过 API 即时调用上限，已转入文件队列，估算 ${result.api_token_estimate ?? "?"} tok。`
        : "窗口指令已进入队列，等待 AI 回传。";
      setChatMessages((prev) => [...prev, { id: uniqueMessageId(result.msg_id), from: "agent", text: queuedText }]);
      markAgent(targetStage, "queued", result.guard === "token_limit" ? "Token 守卫已拦截窗口直接调用。" : "窗口指令排队处理中。");
      const pollResult = await pollChat(result.msg_id);
      if (pollResult.response) {
        setChatMessages((prev) => [...prev, { id: `${result.msg_id}-reply`, from: "agent", text: pollResult.response!.response }]);
        markAgent(targetStage, "done", pollResult.response.response.slice(0, 160));
      }
      return result;
    } catch (nextError) {
      const nextMessage = nextError instanceof Error ? nextError.message : String(nextError);
      setError(nextMessage);
      markAgent(targetStage, "blocked", nextMessage);
      throw nextError;
    } finally {
      windowInstructionPendingRef.current.delete(requestKey);
    }
  }, [currentStage, markAgent]);

  const askAssistant = useCallback(async (questionOverride?: string) => {
    const question = (questionOverride ?? assistantInput).trim();
    if (!question || assistantPendingRef.current) return;
    assistantPendingRef.current = true;
    setAssistantBusy(true);
    setAssistantStatus("sending");
    setAssistantInput("");
    setAssistantMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text: question }]);
    const message = buildAssistantPrompt(question, activeStage.label);
    markAgent(currentStage, "working");
    try {
      const result = await sendChat(message, currentStage, "assistant");
      setLastBudget(result.budget ?? null);
      if ("response" in result) {
        setAssistantMessages((prev) => [...prev, { id: uniqueMessageId(result.msg_id), from: "agent", text: result.response }]);
        setAssistantStatus("answered");
        markAgent(currentStage, "done", result.response.slice(0, 160));
        return result;
      }
      const queuedText = result.guard === "token_limit"
        ? `AI 助手问题已转入队列，Token 守卫估算 ${result.api_token_estimate ?? "?"} tok。`
        : "AI 助手问题已入队，等待返回提示词和优化选项。";
      setAssistantMessages((prev) => [...prev, { id: uniqueMessageId(result.msg_id), from: "agent", text: queuedText }]);
      setAssistantStatus("queued");
      markAgent(currentStage, result.guard === "token_limit" ? "queued" : "waiting", queuedText);
      const pollResult = await pollChat(result.msg_id);
      if (pollResult.response) {
        setAssistantMessages((prev) => [...prev, { id: `${result.msg_id}-reply`, from: "agent", text: pollResult.response!.response }]);
        setAssistantStatus("answered");
        markAgent(currentStage, "done", pollResult.response.response.slice(0, 160));
      }
      return result;
    } catch (nextError) {
      const nextMessage = nextError instanceof Error ? nextError.message : String(nextError);
      setAssistantStatus("error");
      setAssistantMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "agent", text: nextMessage }]);
      setError(nextMessage);
      markAgent(currentStage, "blocked", nextMessage);
    } finally {
      assistantPendingRef.current = false;
      setAssistantBusy(false);
    }
  }, [activeStage.label, assistantInput, currentStage, markAgent]);

  const useAssistantShortcut = useCallback((kind: "prompt" | "next") => {
    const question = kind === "prompt"
      ? `请基于“${activeStage.label}”阶段，生成一个可直接复制给写作模型的提示词，并附带使用注意事项。`
      : `请基于“${activeStage.label}”阶段，给我下一步最值得优化的 3 个选项，并说明先做哪一个。`;
    setAssistantInput(question);
  }, [activeStage.label]);

  const contextSegments = useMemo(() => {
    const filledFields = activeStage.fields.filter((field) => formData[currentStage][field.id].trim());
    return [
      {
        label: "故事圣经",
        value: documentState?.sections?.worldbuilding?.chars ?? 0,
        tone: "cyan",
      },
      {
        label: "角色记忆",
        value: documentState?.sections?.characters?.chars ?? filledFields.length * 120,
        tone: "magenta",
      },
      {
        label: "章节草稿",
        value: formData.chapters.content?.length ?? 0,
        tone: "amber",
      },
      {
        label: "WPS 快照",
        value: wpsSnapshot.length,
        tone: status?.connected ? "green" : "red",
      },
    ];
  }, [activeStage.fields, currentStage, documentState, formData, status, wpsSnapshot]);

  return {
    activeStage,
    agents,
    assistantBusy,
    assistantInput,
    assistantMessages,
    assistantStatus,
    chatInput,
    chatMessages,
    contextSegments,
    currentStage,
    documentState,
    error,
    formData,
    generationMode,
    promptPreview,
    lastBudget,
    setChatInput,
    setAssistantInput,
    setCurrentStage,
    setFieldValue,
    status,
    wpsSnapshot,
    wpsReading,
    wpsSyncStatus,
    wpsWriting,
    actions: {
      generate,
      queueQuickCommand,
      selectGenerationMode,
      applyInitialSetup,
      askAssistant,
      readCurrentStage,
      refreshStatus,
      sendInstruction,
      sendWindowInstruction,
      useAssistantShortcut,
      writeCurrentStage,
    },
  };
}
