import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type Ref } from "react";
import { Move, Network, RotateCcw, SendHorizontal, X, ZoomIn, ZoomOut } from "lucide-react";
import { ReactFlowProvider } from "reactflow";
import { sendChat } from "../api/client";
import RelationshipGraphFlow from "./relationship/RelationshipGraphFlow";
import {
  flowSignals,
  flowStages,
  relationshipEdges,
  relationshipTimeline,
  sceneCards,
  storyActors,
} from "../data/storyFlow";
import type { RelationshipEdge, StoryActor } from "../data/storyFlow";
import {
  novelRelationshipPresets,
  relationshipEventPresets,
  relationshipLayoutPresets,
  relationshipLineStylePresets,
  relationshipTypePresets,
  relationshipUpdateStrategyPresets,
} from "../data/relationshipPresets";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.2;
const DEFAULT_RELATION_EDGE_ID = relationshipEdges[0]?.id ?? "";

const suggestionPositions: Record<string, { left: string; top: string }> = {
  "hero-heroine": { left: "41%", top: "42%" },
  "hero-rival": { left: "51%", top: "58%" },
  "mentor-hero": { left: "18%", top: "50%" },
};

type Pan = {
  x: number;
  y: number;
};

type WindowSize = {
  width: number;
  height: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  panX: number;
  panY: number;
};

type SuggestionStatus = "sending" | "queued" | "sent" | "error";
type StoryFunctionWindowId = "scenes" | "timeline";
type StoryWindowStatus = "idle" | "sending" | "sent" | "error";

type StoryWindowInstance = {
  kind: StoryFunctionWindowId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  draft: string;
  sendStatus: StoryWindowStatus;
};

const storyWindowTitles: Record<StoryFunctionWindowId, string> = {
  scenes: "场景卡片窗口",
  timeline: "关系时间线窗口",
};

const storyWindowOffsets: Record<StoryFunctionWindowId, { x: number; y: number }> = {
  scenes: { x: 0, y: 0 },
  timeline: { x: 42, y: 34 },
};

const storyWindowDefaultSize: WindowSize = { width: 980, height: 520 };
const storyWindowMinSize: WindowSize = { width: 540, height: 360 };
const storyWindowMaxSize: WindowSize = { width: 1240, height: 820 };
const relationshipWindowDefaultSize: WindowSize = { width: 1120, height: 720 };
const relationshipWindowMinSize: WindowSize = { width: 760, height: 520 };
const relationshipWindowMaxSize: WindowSize = { width: 1320, height: 840 };
const minVisibleWindowWidth = 160;
const minVisibleWindowHeader = 64;
const windowTopMargin = 16;
const windowEdgeMargin = 16;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampRange(value: number, min: number, max: number) {
  return clampNumber(value, min, Math.max(min, max));
}

function getViewportSize() {
  return {
    width: window.innerWidth || 1440,
    height: window.innerHeight || 900,
  };
}

function getRenderedWindowSize(size: WindowSize): WindowSize {
  const viewport = getViewportSize();
  return {
    width: Math.min(size.width, Math.max(minVisibleWindowWidth, viewport.width - 80)),
    height: Math.min(size.height, Math.max(minVisibleWindowHeader, viewport.height - 80)),
  };
}

function getCenteredWindowBasePosition(size: WindowSize) {
  const viewport = getViewportSize();
  const renderedSize = getRenderedWindowSize(size);
  return {
    left: (viewport.width - renderedSize.width) / 2,
    top: (viewport.height - renderedSize.height) / 2,
  };
}

function getStoryWindowBasePosition() {
  const viewport = getViewportSize();
  return {
    left: viewport.width / 2 - 490,
    top: viewport.height / 2 - 250,
  };
}

function clampFloatingWindowPosition(
  position: Pan,
  size: WindowSize,
  basePosition: { left: number; top: number },
): Pan {
  const viewport = getViewportSize();
  const renderedSize = getRenderedWindowSize(size);
  return {
    x: clampRange(
      position.x,
      windowEdgeMargin - basePosition.left,
      viewport.width - renderedSize.width - windowEdgeMargin - basePosition.left,
    ),
    y: clampRange(
      position.y,
      windowTopMargin - basePosition.top,
      viewport.height - renderedSize.height - windowEdgeMargin - basePosition.top,
    ),
  };
}

function clampWindowSize(size: WindowSize, minSize: WindowSize, maxSize: WindowSize): WindowSize {
  return {
    width: Math.min(maxSize.width, Math.max(minSize.width, size.width)),
    height: Math.min(maxSize.height, Math.max(minSize.height, size.height)),
  };
}

function createStoryWindow(kind: StoryFunctionWindowId, z: number): StoryWindowInstance {
  return {
    kind,
    x: storyWindowOffsets[kind].x,
    y: storyWindowOffsets[kind].y,
    width: storyWindowDefaultSize.width,
    height: storyWindowDefaultSize.height,
    z,
    draft: "",
    sendStatus: "idle",
  };
}

type RelationshipSuggestion = {
  id: string;
  edgeId: string;
  text: string;
  status: SuggestionStatus;
  response?: string;
};

type RelationshipChangeStatus = "idle" | "sending" | "applied" | "error";

type RelationshipChange = {
  id: string;
  edgeId?: string;
  summary: string;
  text: string;
  status: RelationshipChangeStatus;
  detail?: string;
  response?: string;
};

type RelationshipDraft = {
  status: string;
  cause: string;
  nextShift: string;
  strength: number;
};

type ParsedRelationshipChange = {
  addActor?: string;
  removeActors: string[];
  relationship?: { from: string; to: string };
  removeRelationship?: { from: string; to: string };
  status?: string;
  cause?: string;
  nextShift?: string;
};

type SendPlotInstruction = (message: string) => Promise<unknown>;

const suggestionStatusLabels: Record<SuggestionStatus, string> = {
  sending: "提交中",
  queued: "已入队",
  sent: "已回复",
  error: "失败",
};

const relationshipChangeStatusLabels: Record<RelationshipChangeStatus, string> = {
  idle: "waiting for plot",
  sending: "checking with AI",
  applied: "applied to graph",
  error: "AI check failed",
};

const dynamicEdgePaths = [
  "M126 96 C258 54 428 70 636 104",
  "M128 174 C290 218 440 206 638 166",
  "M626 210 C500 176 314 180 126 132",
  "M122 44 C280 110 448 118 638 48",
];

// Fixed layout based on actor lanes (no dragging needed)
const lanePositions: Record<StoryActor["lane"], Pan> = {
  force: { x: 380, y: 80 },   // Top center - 导师
  lead: { x: 380, y: 230 },   // Center - 主角
  ally: { x: 180, y: 340 },   // Bottom left - 女主
  shadow: { x: 580, y: 340 }, // Bottom right - 反派
};

const defaultActorPositions: Record<string, Pan> = {
  hero: { x: 380, y: 230 },    // lead
  heroine: { x: 180, y: 340 }, // ally
  rival: { x: 580, y: 340 },   // shadow
  mentor: { x: 380, y: 80 },   // force
};

const actorNodeSize = { width: 108, height: 44 };

const edgeCardAnchors: Record<string, Pan> = {
  "hero-heroine": { x: 420, y: 54 },
  "hero-rival": { x: 438, y: 246 },
  "mentor-hero": { x: 370, y: 360 },
};

const actorAliasIds: Record<string, string> = {
  hero: "hero",
  protagonist: "hero",
  "主角": "hero",
  heroine: "heroine",
  "女主": "heroine",
  rival: "rival",
  villain: "rival",
  antagonist: "rival",
  "反派": "rival",
  mentor: "mentor",
  teacher: "mentor",
  "导师": "mentor",
};

function createSuggestionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `suggestion-${Date.now()}`;
}

function createRelationshipChangeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `relationship-change-${Date.now()}`;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function slugifyToken(value: string) {
  const normalized = normalizeToken(value)
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "actor";
}

function splitList(value = "") {
  return value
    .split(/[,，、;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractChangeField(text: string, labels: string[]) {
  const normalizedLabels = labels.map((label) => normalizeToken(label));
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => {
      const [label] = item.split(/[:：]/);
      return normalizedLabels.includes(normalizeToken(label || ""));
    });
  if (!line) return undefined;
  return line.replace(/^[^:：]+[:：]\s*/, "").trim() || undefined;
}

function parseRelationshipPair(value?: string) {
  if (!value) return undefined;
  const parts = value.split(/\s*(?:->|→|>|到|至)\s*/).map((item) => item.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;
  return { from: parts[0], to: parts[1] };
}

function parseRelationshipChange(text: string): ParsedRelationshipChange {
  return {
    addActor: extractChangeField(text, ["add actor", "new actor", "新增人物", "新增角色"]),
    removeActors: splitList(extractChangeField(text, ["remove actor", "delete actor", "删除人物", "移除人物", "退场人物"])),
    relationship: parseRelationshipPair(extractChangeField(text, ["relationship", "relation", "关系", "新增关系", "改变关系"])),
    removeRelationship: parseRelationshipPair(extractChangeField(text, ["remove relationship", "delete relationship", "删除关系", "移除关系"])),
    status: extractChangeField(text, ["status", "状态", "关系状态"]),
    cause: extractChangeField(text, ["cause", "reason", "原因", "变化原因"]),
    nextShift: extractChangeField(text, ["next", "next shift", "后续", "后续变化"]),
  };
}

function resolveActor(actors: StoryActor[], token: string) {
  const normalized = normalizeToken(token);
  const aliasId = actorAliasIds[normalized] || actorAliasIds[token.trim()];
  return actors.find((actor) =>
    actor.id === aliasId ||
    normalizeToken(actor.id) === normalized ||
    normalizeToken(actor.name) === normalized,
  );
}

function actorIdForName(name: string) {
  const normalized = normalizeToken(name);
  return actorAliasIds[normalized] || actorAliasIds[name.trim()] || `dynamic-${slugifyToken(name)}`;
}

function fallbackActorPosition(index: number, actor?: StoryActor): Pan {
  // Use lane-based positioning if actor is available
  if (actor && lanePositions[actor.lane]) {
    return lanePositions[actor.lane];
  }
  // Fallback to grid layout
  return {
    x: 60 + (index % 4) * 172,
    y: 74 + Math.floor(index / 4) * 76,
  };
}

function ensureActorPositions(current: Record<string, Pan>, actors: StoryActor[]) {
  const next: Record<string, Pan> = {};
  actors.forEach((actor, index) => {
    // Prioritize: existing position -> default position -> lane position -> fallback
    next[actor.id] = current[actor.id] || defaultActorPositions[actor.id] || lanePositions[actor.lane] || fallbackActorPosition(index, actor);
  });
  return next;
}

function getActorPosition(actor: StoryActor | undefined, positions: Record<string, Pan>, actors: StoryActor[]) {
  if (!actor) return undefined;
  const index = actors.findIndex((item) => item.id === actor.id);
  return positions[actor.id] || defaultActorPositions[actor.id] || lanePositions[actor.lane] || fallbackActorPosition(index, actor);
}

function clampActorPosition(position: Pan): Pan {
  return {
    x: clampNumber(Math.round(position.x), 16, 622),
    y: clampNumber(Math.round(position.y), 18, 378),
  };
}

function getRelationshipPath(
  edge: RelationshipEdge,
  actors: StoryActor[],
  positions: Record<string, Pan>,
  edgeOffsets: Record<string, Pan>,
) {
  return getRelationshipGeometry(edge, actors, positions, edgeOffsets).pathD;
}

function getRelationshipGeometry(
  edge: RelationshipEdge,
  actors: StoryActor[],
  positions: Record<string, Pan>,
  edgeOffsets: Record<string, Pan>,
) {
  const fromActor = resolveActor(actors, edge.from);
  const toActor = resolveActor(actors, edge.to);
  const from = getActorPosition(fromActor, positions, actors);
  const to = getActorPosition(toActor, positions, actors);
  if (!from || !to) {
    return {
      pathD: edge.pathD,
      mid: { x: 380, y: 230 },
      card: { x: 380, y: 230 },
    };
  }

  // Calculate node centers
  const start = { x: from.x + actorNodeSize.width / 2, y: from.y + actorNodeSize.height / 2 };
  const end = { x: to.x + actorNodeSize.width / 2, y: to.y + actorNodeSize.height / 2 };

  // Simple quadratic curve - control point at midpoint with vertical offset
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const controlOffset = Math.abs(start.x - end.x) * 0.25; // Curve depth
  const controlY = midY - controlOffset; // Pull curve upward

  const offset = edgeOffsets[edge.id] || { x: 0, y: 0 };
  const cardAnchor = edgeCardAnchors[edge.id];

  return {
    pathD: `M${Math.round(start.x)},${Math.round(start.y)} Q${Math.round(midX + offset.x)},${Math.round(controlY + offset.y)} ${Math.round(end.x)},${Math.round(end.y)}`,
    mid: { x: Math.round(midX + offset.x), y: Math.round(controlY + offset.y) },
    card: {
      x: clampNumber(Math.round((cardAnchor?.x ?? midX) + offset.x * 0.35), 176, 584),
      y: clampNumber(Math.round((cardAnchor?.y ?? midY) + offset.y * 0.35), 52, 382),
    },
  };
}

function edgeMatches(edge: RelationshipEdge, from: string, to: string, actors: StoryActor[]) {
  const fromActor = resolveActor(actors, from);
  const toActor = resolveActor(actors, to);
  const fromTokens = new Set([normalizeToken(from), normalizeToken(fromActor?.name || ""), normalizeToken(fromActor?.id || "")]);
  const toTokens = new Set([normalizeToken(to), normalizeToken(toActor?.name || ""), normalizeToken(toActor?.id || "")]);
  return fromTokens.has(normalizeToken(edge.from)) && toTokens.has(normalizeToken(edge.to));
}

function applyParsedRelationshipChange(
  currentActors: StoryActor[],
  currentEdges: RelationshipEdge[],
  parsed: ParsedRelationshipChange,
) {
  let actors = [...currentActors];
  let edges = [...currentEdges];
  const removedActorIds = new Set<string>();

  parsed.removeActors.forEach((actorName) => {
    const actor = resolveActor(actors, actorName);
    removedActorIds.add(actor?.id || actorIdForName(actorName));
  });

  if (removedActorIds.size) {
    actors = actors.filter((actor) => !removedActorIds.has(actor.id));
    edges = edges.filter((edge) => {
      const from = resolveActor(currentActors, edge.from);
      const to = resolveActor(currentActors, edge.to);
      return !removedActorIds.has(from?.id || actorIdForName(edge.from)) && !removedActorIds.has(to?.id || actorIdForName(edge.to));
    });
  }

  if (parsed.removeRelationship) {
    edges = edges.filter((edge) => !edgeMatches(edge, parsed.removeRelationship!.from, parsed.removeRelationship!.to, actors));
  }

  if (parsed.addActor) {
    const id = actorIdForName(parsed.addActor);
    if (!actors.some((actor) => actor.id === id || normalizeToken(actor.name) === normalizeToken(parsed.addActor!))) {
      actors.push({
        id,
        name: parsed.addActor,
        role: "剧情新增 / 待细化",
        lane: "ally",
      });
    }
  }

  let affectedEdgeId: string | undefined;
  if (parsed.relationship) {
    const fromActor = resolveActor(actors, parsed.relationship.from) || {
      id: actorIdForName(parsed.relationship.from),
      name: parsed.relationship.from,
      role: "剧情新增 / 待细化",
      lane: "ally" as const,
    };
    const toActor = resolveActor(actors, parsed.relationship.to) || {
      id: actorIdForName(parsed.relationship.to),
      name: parsed.relationship.to,
      role: "剧情新增 / 待细化",
      lane: "ally" as const,
    };

    [fromActor, toActor].forEach((actor) => {
      if (!actors.some((item) => item.id === actor.id)) {
        actors.push(actor);
      }
    });

    const existingEdge = edges.find((edge) => edgeMatches(edge, fromActor.name, toActor.name, actors));
    if (existingEdge) {
      affectedEdgeId = existingEdge.id;
      edges = edges.map((edge) =>
        edge.id === existingEdge.id
          ? {
            ...edge,
            status: parsed.status || edge.status,
            guide: parsed.cause || edge.guide,
            cause: parsed.cause || edge.cause,
            nextShift: parsed.nextShift || edge.nextShift,
            evolution: parsed.status ? `${edge.evolution} -> ${parsed.status}` : edge.evolution,
            strength: Math.min(100, edge.strength + 6),
          }
          : edge,
      );
    } else {
      const edgeId = `dynamic-${slugifyToken(fromActor.id.replace(/^dynamic-/, ""))}-${slugifyToken(toActor.id.replace(/^dynamic-/, ""))}`;
      affectedEdgeId = edgeId;
      edges.push({
        id: edgeId,
        from: fromActor.name,
        to: toActor.name,
        status: parsed.status || "剧情新线",
        strength: 48,
        firstSeen: "当前剧情",
        pathD: dynamicEdgePaths[edges.length % dynamicEdgePaths.length],
        guide: parsed.cause || "由当前剧情变化触发的新关系线。",
        cause: parsed.cause || "新剧情事件改变了人物之间的利益和信任。",
        nextShift: parsed.nextShift || "等待下一章继续验证这条关系是否稳定。",
        evolution: `初次出现 -> ${parsed.status || "待观察"}`,
        tone: edges.length % 3 === 0 ? "cyan" : edges.length % 3 === 1 ? "amber" : "magenta",
      });
    }
  }

  const summary = parsed.relationship
    ? `${parsed.relationship.from} -> ${parsed.relationship.to} / ${parsed.status || "relationship changed"}`
    : parsed.removeActors.length
      ? `removed ${parsed.removeActors.join(", ")}`
      : parsed.addActor
        ? `added ${parsed.addActor}`
        : "relationship graph updated";

  return { actors, edges, affectedEdgeId, summary };
}

function getInitialStoryWindow(): StoryFunctionWindowId | null {
  const storyWindow = new URLSearchParams(window.location.search).get("storyWindow");
  if (storyWindow === "scenes" || storyWindow === "timeline") {
    return storyWindow;
  }
  return null;
}

async function defaultSendPlotInstruction(message: string) {
  return sendChat(message, "plot");
}

function getInstructionResponse(result: unknown) {
  if (!result || typeof result !== "object" || !("response" in result)) return undefined;
  const response = (result as { response?: unknown }).response;
  return typeof response === "string" ? response : undefined;
}

type StoryFlowMapProps = {
  onSendPlotInstruction?: SendPlotInstruction;
  relationshipWindowFocusTarget?: "overview" | "line-editor" | "suggestion";
  relationshipWindowOpenSignal?: number;
};

export function StoryFlowMap({
  onSendPlotInstruction = defaultSendPlotInstruction,
  relationshipWindowFocusTarget = "overview",
  relationshipWindowOpenSignal = 0,
}: StoryFlowMapProps = {}) {
  const [isRelationshipWindowOpen, setRelationshipWindowOpen] = useState(
    () => new URLSearchParams(window.location.search).get("relations") === "open",
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [relationshipWindowPosition, setRelationshipWindowPosition] = useState<Pan>({ x: 0, y: 0 });
  const [relationshipWindowSize, setRelationshipWindowSize] = useState<WindowSize>(relationshipWindowDefaultSize);
  const [activeEdgeId, setActiveEdgeId] = useState(DEFAULT_RELATION_EDGE_ID);
  const [relationshipActors, setRelationshipActors] = useState<StoryActor[]>(storyActors);
  const [relationshipEdgesState, setRelationshipEdgesState] = useState<RelationshipEdge[]>(relationshipEdges);
  const [actorPositions, setActorPositions] = useState<Record<string, Pan>>(() => ensureActorPositions(defaultActorPositions, storyActors));
  const [edgeOffsets, setEdgeOffsets] = useState<Record<string, Pan>>({});
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedRelationEdgeId, setSelectedRelationEdgeId] = useState(DEFAULT_RELATION_EDGE_ID);
  const [selectedNovelPresetId, setSelectedNovelPresetId] = useState(novelRelationshipPresets[0]?.id || "");
  const [selectedLayoutPresetId, setSelectedLayoutPresetId] = useState(relationshipLayoutPresets[0]?.id || "");
  const [selectedUpdateStrategyId, setSelectedUpdateStrategyId] = useState(relationshipUpdateStrategyPresets[0]?.id || "");
  const [relationshipDraft, setRelationshipDraft] = useState<RelationshipDraft>(() => {
    const edge = relationshipEdges[0];
    return {
      status: edge?.status || "",
      cause: edge?.cause || "",
      nextShift: edge?.nextShift || "",
      strength: edge?.strength || 50,
    };
  });
  const [storyWindows, setStoryWindows] = useState<StoryWindowInstance[]>(() => {
    const initialWindow = getInitialStoryWindow();
    return initialWindow ? [createStoryWindow(initialWindow, 1)] : [];
  });
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
  const [plotChangeText, setPlotChangeText] = useState("");
  const [plotChangeStatus, setPlotChangeStatus] = useState<RelationshipChangeStatus>("idle");
  const [relationshipChanges, setRelationshipChanges] = useState<RelationshipChange[]>([]);

  const relationshipWindowSizeRef = useRef(relationshipWindowSize);
  const storyWindowsRef = useRef(storyWindows);

  useEffect(() => {
    relationshipWindowSizeRef.current = relationshipWindowSize;
  }, [relationshipWindowSize]);

  useEffect(() => {
    storyWindowsRef.current = storyWindows;
  }, [storyWindows]);

  const dragState = useRef<DragState | null>(null);
  const relationshipWindowDragState = useRef<DragState | null>(null);
  const relationshipWindowResizeState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);
  const actorDragState = useRef<{
    actorId: string;
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const relationDragState = useRef<{
    edgeId: string;
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const storyDragState = useRef<{
    kind: StoryFunctionWindowId;
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const storyResizeState = useRef<{
    kind: StoryFunctionWindowId;
    pointerId: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);
  const relationshipStatusInputRef = useRef<HTMLInputElement | null>(null);
  const relationshipSuggestionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const relationshipFocusSignalRef = useRef(0);
  const suggestionSendingRef = useRef(false);
  const storyNextZRef = useRef(2);

  const zoomIn = () => setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(1))));
  const zoomOut = () => setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(1))));
  const isSuggestionSending = suggestions.some((suggestion) => suggestion.status === "sending");
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (relationshipWindowOpenSignal <= 0) return;
    setRelationshipWindowOpen(true);
  }, [relationshipWindowOpenSignal]);

  useEffect(() => {
    if (!isRelationshipWindowOpen || relationshipWindowOpenSignal <= 0) return;
    if (relationshipFocusSignalRef.current === relationshipWindowOpenSignal) return;

    const timeout = window.setTimeout(() => {
      const target =
        relationshipWindowFocusTarget === "suggestion"
          ? relationshipSuggestionTextareaRef.current
          : relationshipWindowFocusTarget === "line-editor"
            ? relationshipStatusInputRef.current
            : null;

      target?.scrollIntoView?.({ block: "center" });
      target?.focus();
      relationshipFocusSignalRef.current = relationshipWindowOpenSignal;
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isRelationshipWindowOpen, relationshipWindowFocusTarget, relationshipWindowOpenSignal]);

  useEffect(() => {
    if (relationshipEdgesState.some((edge) => edge.id === activeEdgeId)) return;
    setActiveEdgeId(relationshipEdgesState[0]?.id ?? "");
  }, [activeEdgeId, relationshipEdgesState]);

  useEffect(() => {
    setActorPositions((current) => ensureActorPositions(current, relationshipActors));
  }, [relationshipActors]);

  useEffect(() => {
    const edge = relationshipEdgesState.find((item) => item.id === selectedRelationEdgeId) || relationshipEdgesState[0];
    if (!edge) return;
    if (edge.id !== selectedRelationEdgeId) {
      setSelectedRelationEdgeId(edge.id);
    }
    setRelationshipDraft({
      status: edge.status,
      cause: edge.cause,
      nextShift: edge.nextShift,
      strength: edge.strength,
    });
  }, [relationshipEdgesState, selectedRelationEdgeId]);

  useEffect(() => {
    function handleGlobalPointerMove(event: globalThis.PointerEvent) {
      const actorDrag = actorDragState.current;
      if (actorDrag?.pointerId === event.pointerId) {
        setActorPositions((current) => ({
          ...current,
          [actorDrag.actorId]: clampActorPosition({
            x: actorDrag.baseX + event.clientX - actorDrag.startX,
            y: actorDrag.baseY + event.clientY - actorDrag.startY,
          }),
        }));
        return;
      }

      const relationDrag = relationDragState.current;
      if (relationDrag?.pointerId === event.pointerId) {
        setEdgeOffsets((current) => ({
          ...current,
          [relationDrag.edgeId]: {
            x: Math.round(relationDrag.baseX + event.clientX - relationDrag.startX),
            y: Math.round(relationDrag.baseY + event.clientY - relationDrag.startY),
          },
        }));
        return;
      }

      const relationshipDrag = relationshipWindowDragState.current;
      if (relationshipDrag?.pointerId === event.pointerId) {
        const currentSize = relationshipWindowSizeRef.current;
        setRelationshipWindowPosition(
          clampFloatingWindowPosition(
            {
              x: relationshipDrag.panX + event.clientX - relationshipDrag.startX,
              y: relationshipDrag.panY + event.clientY - relationshipDrag.startY,
            },
            currentSize,
            getCenteredWindowBasePosition(currentSize),
          ),
        );
        return;
      }

      const relationshipResize = relationshipWindowResizeState.current;
      if (relationshipResize?.pointerId === event.pointerId) {
        const size = clampWindowSize(
          {
            width: relationshipResize.width + event.clientX - relationshipResize.startX,
            height: relationshipResize.height + event.clientY - relationshipResize.startY,
          },
          relationshipWindowMinSize,
          relationshipWindowMaxSize,
        );
        setRelationshipWindowSize(size);
        setRelationshipWindowPosition((position) =>
          clampFloatingWindowPosition(position, size, getCenteredWindowBasePosition(size)),
        );
        return;
      }

      const storyDrag = storyDragState.current;
      if (storyDrag?.pointerId === event.pointerId) {
        const currentWindows = storyWindowsRef.current;
        const currentWindow = currentWindows.find((window) => window.kind === storyDrag.kind);
        if (!currentWindow) return;
        updateStoryWindow(
          storyDrag.kind,
          clampFloatingWindowPosition(
            {
              x: storyDrag.baseX + event.clientX - storyDrag.startX,
              y: storyDrag.baseY + event.clientY - storyDrag.startY,
            },
            currentWindow,
            getStoryWindowBasePosition(),
          ),
        );
        return;
      }

      const storyResize = storyResizeState.current;
      if (storyResize?.pointerId === event.pointerId) {
        const size = clampWindowSize(
          {
            width: storyResize.width + event.clientX - storyResize.startX,
            height: storyResize.height + event.clientY - storyResize.startY,
          },
          storyWindowMinSize,
          storyWindowMaxSize,
        );
        const currentWindows = storyWindowsRef.current;
        const currentWindow = currentWindows.find((window) => window.kind === storyResize.kind);
        const nextPosition = currentWindow
          ? clampFloatingWindowPosition(currentWindow, size, getStoryWindowBasePosition())
          : undefined;
        updateStoryWindow(storyResize.kind, nextPosition ? { ...size, ...nextPosition } : size);
      }
    }

    function handleGlobalPointerUp(event: globalThis.PointerEvent) {
      if (actorDragState.current?.pointerId === event.pointerId) {
        actorDragState.current = null;
      }
      if (relationDragState.current?.pointerId === event.pointerId) {
        relationDragState.current = null;
      }
      if (relationshipWindowDragState.current?.pointerId === event.pointerId) {
        relationshipWindowDragState.current = null;
      }
      if (relationshipWindowResizeState.current?.pointerId === event.pointerId) {
        relationshipWindowResizeState.current = null;
      }
      if (storyDragState.current?.pointerId === event.pointerId) {
        storyDragState.current = null;
      }
      if (storyResizeState.current?.pointerId === event.pointerId) {
        storyResizeState.current = null;
      }
    }

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, []);

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.panX + event.clientX - drag.startX,
      y: drag.panY + event.clientY - drag.startY,
    });
  };

  const stopPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) return;
    dragState.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const startRelationshipWindowDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    relationshipWindowDragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: relationshipWindowPosition.x,
      panY: relationshipWindowPosition.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveRelationshipWindow = (event: PointerEvent<HTMLElement>) => {
    const drag = relationshipWindowDragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setRelationshipWindowPosition(
      clampFloatingWindowPosition(
        {
          x: drag.panX + event.clientX - drag.startX,
          y: drag.panY + event.clientY - drag.startY,
        },
        relationshipWindowSize,
        getCenteredWindowBasePosition(relationshipWindowSize),
      ),
    );
  };

  const stopRelationshipWindowDrag = (event: PointerEvent<HTMLElement>) => {
    if (!relationshipWindowDragState.current || relationshipWindowDragState.current.pointerId !== event.pointerId) return;
    relationshipWindowDragState.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const startRelationshipWindowResize = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    relationshipWindowResizeState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: relationshipWindowSize.width,
      height: relationshipWindowSize.height,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveRelationshipWindowResize = (event: PointerEvent<HTMLElement>) => {
    const resize = relationshipWindowResizeState.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const size = clampWindowSize(
      {
        width: resize.width + event.clientX - resize.startX,
        height: resize.height + event.clientY - resize.startY,
      },
      relationshipWindowMinSize,
      relationshipWindowMaxSize,
    );
    setRelationshipWindowSize(size);
    setRelationshipWindowPosition((position) =>
      clampFloatingWindowPosition(position, size, getCenteredWindowBasePosition(size)),
    );
  };

  const stopRelationshipWindowResize = (event: PointerEvent<HTMLElement>) => {
    if (!relationshipWindowResizeState.current || relationshipWindowResizeState.current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    relationshipWindowResizeState.current = null;
  };

  const selectedActor = selectedActorId
    ? relationshipActors.find((actor) => actor.id === selectedActorId)
    : undefined;
  const selectedRelationEdge =
    relationshipEdgesState.find((edge) => edge.id === selectedRelationEdgeId) || relationshipEdgesState[0];
  const selectedNovelPreset =
    novelRelationshipPresets.find((preset) => preset.id === selectedNovelPresetId) || novelRelationshipPresets[0];
  const selectedLayoutPreset =
    relationshipLayoutPresets.find((preset) => preset.id === selectedLayoutPresetId) || relationshipLayoutPresets[0];
  const selectedUpdateStrategy =
    relationshipUpdateStrategyPresets.find((preset) => preset.id === selectedUpdateStrategyId) || relationshipUpdateStrategyPresets[0];

  const startActorDrag = (actorId: string, event: PointerEvent<HTMLElement>) => {
    if ((event.button ?? 0) !== 0) return;
    event.stopPropagation();
    const base = actorPositions[actorId] || defaultActorPositions[actorId] || { x: 60, y: 76 };
    setSelectedActorId(actorId);
    actorDragState.current = {
      actorId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: base.x,
      baseY: base.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const startRelationDrag = (edgeId: string, event: PointerEvent<SVGPathElement>) => {
    if ((event.button ?? 0) !== 0) return;
    event.stopPropagation();
    const base = edgeOffsets[edgeId] || { x: 0, y: 0 };
    setSelectedRelationEdgeId(edgeId);
    relationDragState.current = {
      edgeId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: base.x,
      baseY: base.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const openStoryWindow = (kind: StoryFunctionWindowId) => {
    const z = storyNextZRef.current++;
    setStoryWindows((current) => {
      if (current.some((window) => window.kind === kind)) {
        return current.map((window) => (window.kind === kind ? { ...window, z } : window));
      }
      return [...current, createStoryWindow(kind, z)];
    });
  };

  const closeStoryWindow = (kind: StoryFunctionWindowId) => {
    setStoryWindows((current) => current.filter((window) => window.kind !== kind));
  };

  const updateStoryWindow = (kind: StoryFunctionWindowId, patch: Partial<StoryWindowInstance>) => {
    setStoryWindows((current) => current.map((window) => (window.kind === kind ? { ...window, ...patch } : window)));
  };

  const bringStoryWindowToFront = (kind: StoryFunctionWindowId) => {
    const z = storyNextZRef.current++;
    updateStoryWindow(kind, { z });
  };

  const startStoryWindowDrag = (kind: StoryFunctionWindowId, event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const currentWindow = storyWindows.find((window) => window.kind === kind);
    if (!currentWindow) return;
    bringStoryWindowToFront(kind);
    storyDragState.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: currentWindow.x,
      baseY: currentWindow.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveStoryWindow = (event: PointerEvent<HTMLElement>) => {
    const drag = storyDragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const currentWindow = storyWindows.find((window) => window.kind === drag.kind);
    if (!currentWindow) return;
    updateStoryWindow(
      drag.kind,
      clampFloatingWindowPosition(
        {
          x: drag.baseX + event.clientX - drag.startX,
          y: drag.baseY + event.clientY - drag.startY,
        },
        currentWindow,
        getStoryWindowBasePosition(),
      ),
    );
  };

  const stopStoryWindowDrag = (event: PointerEvent<HTMLElement>) => {
    if (!storyDragState.current || storyDragState.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    storyDragState.current = null;
  };

  const startStoryWindowResize = (kind: StoryFunctionWindowId, event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const currentWindow = storyWindows.find((window) => window.kind === kind);
    if (!currentWindow) return;
    event.stopPropagation();
    bringStoryWindowToFront(kind);
    storyResizeState.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: currentWindow.width,
      height: currentWindow.height,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveStoryWindowResize = (event: PointerEvent<HTMLElement>) => {
    const resize = storyResizeState.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const size = clampWindowSize(
      {
        width: resize.width + event.clientX - resize.startX,
        height: resize.height + event.clientY - resize.startY,
      },
      storyWindowMinSize,
      storyWindowMaxSize,
    );
    const currentWindow = storyWindows.find((window) => window.kind === resize.kind);
    const nextPosition = currentWindow
      ? clampFloatingWindowPosition(currentWindow, size, getStoryWindowBasePosition())
      : undefined;
    updateStoryWindow(
      resize.kind,
      nextPosition ? { ...size, ...nextPosition } : size,
    );
  };

  const stopStoryWindowResize = (event: PointerEvent<HTMLElement>) => {
    if (!storyResizeState.current || storyResizeState.current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    storyResizeState.current = null;
  };

  const submitStoryWindowInstruction = async (window: StoryWindowInstance) => {
    const text = window.draft.trim();
    if (!text || window.sendStatus === "sending") return;
    const title = storyWindowTitles[window.kind];
    updateStoryWindow(window.kind, { draft: "", sendStatus: "sending" });
    const message = [
      `【${title}】`,
      `用户指令：${text}`,
      "请只围绕这个窗口里的剧情材料给出可执行建议，避免复述全量设定。",
    ].join("\n");
    try {
      await onSendPlotInstruction(message);
      updateStoryWindow(window.kind, { sendStatus: "sent" });
    } catch {
      updateStoryWindow(window.kind, { sendStatus: "error" });
    }
  };

  const saveRelationshipLineChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const edge = selectedRelationEdge;
    if (!edge) return;

    const status = relationshipDraft.status.trim() || edge.status;
    const cause = relationshipDraft.cause.trim() || edge.cause;
    const nextShift = relationshipDraft.nextShift.trim() || edge.nextShift;
    const strength = clampNumber(Math.round(relationshipDraft.strength), 1, 100);
    const nextEdge: RelationshipEdge = {
      ...edge,
      status,
      cause,
      guide: cause || edge.guide,
      nextShift,
      strength,
      evolution: edge.evolution.includes(status) ? edge.evolution : `${edge.evolution} -> ${status}`,
    };
    const changeId = createRelationshipChangeId();

    setRelationshipEdgesState((current) => current.map((item) => (item.id === edge.id ? nextEdge : item)));
    setRelationshipDraft({ status, cause, nextShift, strength });
    setRelationshipChanges((current) => [
      ...current,
      {
        id: changeId,
        edgeId: edge.id,
        summary: `${edge.from} -> ${edge.to} / ${status}`,
        text: `relationship impact: ${status}`,
        detail: nextShift,
        status: "sending",
      },
    ]);

    const message = [
      "[relationship impact]",
      "Only evaluate this edited character relationship line and its next plot impact.",
      `relationship: ${edge.from}->${edge.to}`,
      `status: ${status}`,
      `cause: ${cause}`,
      `next shift: ${nextShift}`,
      `strength: ${strength}`,
    ].join("\n");

    try {
      const result = await onSendPlotInstruction(message);
      const response = getInstructionResponse(result);
      setRelationshipChanges((current) =>
        current.map((item) => (item.id === changeId ? { ...item, status: "applied", response } : item)),
      );
    } catch (error) {
      setRelationshipChanges((current) =>
        current.map((item) =>
          item.id === changeId
            ? { ...item, status: "error", response: error instanceof Error ? error.message : String(error) }
            : item,
        ),
      );
    }
  };

  const submitSuggestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = suggestionText.trim();
    const edge = relationshipEdgesState.find((item) => item.id === activeEdgeId);
    if (!text || !edge || suggestionSendingRef.current) return;
    suggestionSendingRef.current = true;

    const id = createSuggestionId();
    setSuggestionText("");
    setSuggestions((current) => [...current, { id, edgeId: edge.id, text, status: "sending" }]);

    const message = [
      "【人物关系图建议】",
      `关系：${edge.from} -> ${edge.to}`,
      `当前状态：${edge.status}`,
      `主要剧情引导：${edge.guide}`,
      `用户建议：${text}`,
      "请判断这条建议是否适合加入后续剧情，并给出可执行调整。",
    ].join("\n");

    try {
      const result = await onSendPlotInstruction(message);
      const response = getInstructionResponse(result);
      setSuggestions((current) =>
        current.map((item) =>
          item.id === id
            ? {
              ...item,
              status: response ? "sent" : "queued",
              response,
            }
            : item,
        ),
      );
    } catch (error) {
      setSuggestions((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: "error", response: error instanceof Error ? error.message : String(error) }
            : item,
        ),
      );
    } finally {
      suggestionSendingRef.current = false;
    }
  };

  const submitRelationshipChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = plotChangeText.trim();
    if (!text || plotChangeStatus === "sending") return;

    const parsed = parseRelationshipChange(text);
    const nextGraph = applyParsedRelationshipChange(relationshipActors, relationshipEdgesState, parsed);
    const changeId = createRelationshipChangeId();

    setRelationshipActors(nextGraph.actors);
    setRelationshipEdgesState(nextGraph.edges);
    setPlotChangeText("");
    setPlotChangeStatus("sending");
    setRelationshipChanges((current) => [
      ...current,
      {
        id: changeId,
        edgeId: nextGraph.affectedEdgeId,
        summary: nextGraph.summary,
        text,
        status: "sending",
      },
    ]);

    const message = [
      "[relationship graph plot change]",
      "only evaluate this relationship change; do not restate the whole novel bible.",
      `change: ${text}`,
      `graph summary: ${nextGraph.summary}`,
      `actors: ${nextGraph.actors.map((actor) => actor.name).join(", ")}`,
      `edges: ${nextGraph.edges.map((edge) => `${edge.from}->${edge.to}/${edge.status}`).join("; ")}`,
    ].join("\n");

    try {
      const result = await onSendPlotInstruction(message);
      const response = getInstructionResponse(result);
      setPlotChangeStatus("applied");
      setRelationshipChanges((current) =>
        current.map((item) =>
          item.id === changeId ? { ...item, status: "applied", response } : item,
        ),
      );
    } catch (error) {
      setPlotChangeStatus("error");
      setRelationshipChanges((current) =>
        current.map((item) =>
          item.id === changeId
            ? { ...item, status: "error", response: error instanceof Error ? error.message : String(error) }
            : item,
        ),
      );
    }
  };

  return (
    <section className="story-flow-map" aria-label="故事流程图">
      <header className="flow-header">
        <div>
          <span>流程总览</span>
          <h3>故事流程图</h3>
        </div>
        <Network aria-hidden="true" size={18} />
      </header>

      <section className="relationship-launch-panel" aria-label="人物关系入口">
        <div>
          <span>关系总览</span>
          <strong>人物关系图</strong>
        </div>
        <dl>
          <div>
            <dt>角色</dt>
            <dd>{relationshipActors.length}</dd>
          </div>
          <div>
            <dt>连线</dt>
            <dd>{relationshipEdgesState.length}</dd>
          </div>
          <div>
            <dt>主关系</dt>
            <dd>{relationshipEdgesState[0]?.status}</dd>
          </div>
        </dl>
        <button type="button" aria-label="打开人物关系窗" onClick={() => setRelationshipWindowOpen(true)}>
          <Network aria-hidden="true" size={16} />
          <span>人物关系窗</span>
        </button>
      </section>

      {isRelationshipWindowOpen ? (
        <div className="relationship-window-layer">
          <section
            className="relationship-window"
            role="dialog"
            aria-label="人物关系窗口"
            style={{
                top: `calc(50% - ${relationshipWindowSize.height / 2}px)`,
                left: `calc(50% - ${relationshipWindowSize.width / 2}px)`,
                transform: `translate(${relationshipWindowPosition.x}px, ${relationshipWindowPosition.y}px)`,
                width: `${relationshipWindowSize.width}px`,
                height: `${relationshipWindowSize.height}px`,
                maxWidth: "calc(100vw - 80px)",
                maxHeight: "calc(100vh - 80px)",
              }}
            >
            <header
              className="relationship-window-header"
              aria-label="拖动人物关系窗口"
              onPointerDown={startRelationshipWindowDrag}
              onPointerMove={moveRelationshipWindow}
              onPointerUp={stopRelationshipWindowDrag}
              onPointerCancel={stopRelationshipWindowDrag}
            >
              <div>
                <span>人物关系</span>
                <strong>人物关系窗口</strong>
              </div>
              <div className="relationship-toolbar">
                <Move aria-hidden="true" size={16} />
                <span>ReactFlow 图谱</span>
                <button type="button" aria-label="关闭人物关系窗口" onPointerDown={(event) => event.stopPropagation()} onClick={() => setRelationshipWindowOpen(false)}>
                  <X aria-hidden="true" size={15} />
                </button>
              </div>
            </header>
            <div className="relationship-window-layout">
              <div className="relationship-canvas" aria-label="人物关系图谱">
                <ReactFlowProvider>
                  <RelationshipGraphFlow
                    actors={relationshipActors}
                    relationships={relationshipEdgesState}
                    selectedActorId={selectedActorId}
                    selectedEdgeId={selectedRelationEdge?.id || null}
                    onNodeClick={setSelectedActorId}
                    onEdgeClick={setSelectedRelationEdgeId}
                  />
                </ReactFlowProvider>
              </div>
              <div className="relationship-side-panel">
                <RelationshipLog edges={relationshipEdgesState} />
                <RelationshipPresetPanel
                  layoutPresetId={selectedLayoutPresetId}
                  novelPresetId={selectedNovelPresetId}
                  onLayoutPresetChange={setSelectedLayoutPresetId}
                  onNovelPresetChange={setSelectedNovelPresetId}
                  onUpdateStrategyChange={setSelectedUpdateStrategyId}
                  selectedLayoutPreset={selectedLayoutPreset}
                  selectedNovelPreset={selectedNovelPreset}
                  selectedUpdateStrategy={selectedUpdateStrategy}
                  updateStrategyId={selectedUpdateStrategyId}
                />
                <ActorProfilePanel actor={selectedActor} actors={relationshipActors} edges={relationshipEdgesState} />
                <RelationshipLineEditor
                  draft={relationshipDraft}
                  edge={selectedRelationEdge}
                  onDraftChange={setRelationshipDraft}
                  onSubmit={saveRelationshipLineChange}
                  statusInputRef={relationshipStatusInputRef}
                />
                <RelationshipSuggestionPanel
                  activeEdgeId={activeEdgeId}
                  edges={relationshipEdgesState}
                  onActiveEdgeChange={setActiveEdgeId}
                  onSubmit={submitSuggestion}
                  isSending={isSuggestionSending}
                  suggestionText={suggestionText}
                  onSuggestionTextChange={setSuggestionText}
                  textareaRef={relationshipSuggestionTextareaRef}
                />
                <RelationshipPlotChangePanel
                  changes={relationshipChanges}
                  onSubmit={submitRelationshipChange}
                  onTextChange={(value) => {
                    setPlotChangeText(value);
                    if (plotChangeStatus !== "sending") setPlotChangeStatus("idle");
                  }}
                  status={plotChangeStatus}
                  text={plotChangeText}
                />
              </div>
            </div>
            <button
              type="button"
              className="window-resize-handle"
              aria-label="调整人物关系窗口大小"
              onPointerDown={startRelationshipWindowResize}
              onPointerMove={moveRelationshipWindowResize}
              onPointerUp={stopRelationshipWindowResize}
              onPointerCancel={stopRelationshipWindowResize}
            />
          </section>
        </div>
      ) : null}

      <section className="scene-card-board" aria-label="场景卡片">
        <header>
          <div>
            <span>场景总览</span>
            <strong>场景卡片</strong>
          </div>
          <button type="button" aria-label="打开场景卡片窗口" onClick={() => openStoryWindow("scenes")}>
            场景窗
          </button>
        </header>
        <div className="scene-card-row">
          {sceneCards.map((scene) => (
            <article className="scene-card" data-edge-id={scene.relationEdgeId} key={scene.id}>
              <div>
                <span>{scene.plotLine}</span>
                <strong>{scene.title}</strong>
              </div>
              <p><b>目标</b>{scene.goal}</p>
              <p><b>冲突</b>{scene.conflict}</p>
              <p><b>钩子</b>{scene.hook}</p>
            </article>
          ))}
        </div>
        <div className="relationship-timeline" aria-label="关系时间线">
          <header>
            <div>
              <span>关系推进</span>
              <strong>关系时间线</strong>
            </div>
            <button type="button" aria-label="打开关系时间线窗口" onClick={() => openStoryWindow("timeline")}>
              时间线窗
            </button>
          </header>
          <div className="timeline-row">
            {relationshipTimeline.map((item) => (
              <article className={`timeline-item timeline-${item.tone}`} data-edge-id={item.edgeId} key={item.id}>
                <span>{item.sceneTitle}</span>
                <strong>{item.relation} / {item.status}</strong>
                <p><b>变化原因</b>{item.cause}</p>
                <p><b>后续变化</b>{item.nextShift}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {storyWindows.length ? (
        <div className="story-function-window-desk" aria-label="故事多窗口工作台">
          {storyWindows.map((window) => (
            <StoryFunctionWindow
              activeWindow={window.kind}
              draft={window.draft}
              key={window.kind}
              onBringToFront={() => bringStoryWindowToFront(window.kind)}
              onClose={() => closeStoryWindow(window.kind)}
              onDragEnd={stopStoryWindowDrag}
              onDragMove={moveStoryWindow}
              onDragStart={(event) => startStoryWindowDrag(window.kind, event)}
              onDraftChange={(value) => updateStoryWindow(window.kind, { draft: value, sendStatus: "idle" })}
              onResizeEnd={stopStoryWindowResize}
              onResizeMove={moveStoryWindowResize}
              onResizeStart={(event) => startStoryWindowResize(window.kind, event)}
              onSubmitInstruction={() => submitStoryWindowInstruction(window)}
              sendStatus={window.sendStatus}
              size={{ width: window.width, height: window.height }}
              transform={`translate(${window.x}px, ${window.y}px)`}
              zIndex={window.z}
            />
          ))}
        </div>
      ) : null}

      <div className="flow-stage-rail">
        {flowStages.map((stage, index) => (
          <div className="flow-stage-step" key={stage.id}>
            <article>
              <strong>{stage.label}</strong>
              <p>{stage.summary}</p>
            </article>
            {index < flowStages.length - 1 ? <span aria-hidden="true">-&gt;</span> : null}
          </div>
        ))}
      </div>

      <div className="flow-signal-row">
        {flowSignals.map((signal) => (
          <article key={signal.label}>
            <strong>{signal.label}</strong>
            <p>{signal.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StoryFunctionWindow({
  activeWindow,
  draft,
  onBringToFront,
  onClose,
  onDragEnd,
  onDragMove,
  onDragStart,
  onDraftChange,
  onResizeEnd,
  onResizeMove,
  onResizeStart,
  onSubmitInstruction,
  sendStatus,
  size,
  transform,
  zIndex,
}: {
  activeWindow: StoryFunctionWindowId;
  draft: string;
  onBringToFront: () => void;
  onClose: () => void;
  onDragEnd: (event: PointerEvent<HTMLElement>) => void;
  onDragMove: (event: PointerEvent<HTMLElement>) => void;
  onDragStart: (event: PointerEvent<HTMLElement>) => void;
  onDraftChange: (text: string) => void;
  onResizeEnd: (event: PointerEvent<HTMLElement>) => void;
  onResizeMove: (event: PointerEvent<HTMLElement>) => void;
  onResizeStart: (event: PointerEvent<HTMLElement>) => void;
  onSubmitInstruction: () => void;
  sendStatus: StoryWindowStatus;
  size: WindowSize;
  transform: string;
  zIndex: number;
}) {
  const title = storyWindowTitles[activeWindow];

  return (
    <section
      className="story-function-window"
      role="dialog"
      aria-label={title}
      aria-modal="true"
      style={{
        transform,
        zIndex,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: "calc(100vw - 80px)",
        maxHeight: "calc(100vh - 80px)",
      }}
      onPointerDown={onBringToFront}
    >
      <header
        className="story-function-window-header"
        aria-label={`拖动${title}`}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div>
          <span>故事窗口</span>
          <strong>{title}</strong>
        </div>
        <button type="button" aria-label="关闭故事功能窗口" onPointerDown={(event) => event.stopPropagation()} onClick={onClose}>
          <X aria-hidden="true" size={15} />
        </button>
      </header>
      {activeWindow === "scenes" ? (
        <div className="story-window-grid">
          {sceneCards.map((scene) => (
            <article className="story-window-card" data-edge-id={scene.relationEdgeId} key={scene.id}>
              <span>{scene.plotLine}</span>
              <strong>{scene.title}</strong>
              <dl>
                <div>
                  <dt>场景作用</dt>
                  <dd>{scene.goal}</dd>
                </div>
                <div>
                  <dt>冲突压力</dt>
                  <dd>{scene.conflict}</dd>
                </div>
                <div>
                  <dt>读者钩子</dt>
                  <dd>{scene.hook}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="story-window-grid">
          {relationshipTimeline.map((item) => (
            <article className={`story-window-card story-window-${item.tone}`} data-edge-id={item.edgeId} key={item.id}>
              <span>{item.sceneTitle}</span>
              <strong>{item.relation} / {item.status}</strong>
              <dl>
                <div>
                  <dt>变化原因</dt>
                  <dd>{item.cause}</dd>
                </div>
                <div>
                  <dt>后续关系变化</dt>
                  <dd>{item.nextShift}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
      <StoryWindowAgentBox
        draft={draft}
        onDraftChange={onDraftChange}
        onSubmit={onSubmitInstruction}
        status={sendStatus}
        title={title}
      />
      <button
        type="button"
        className="window-resize-handle"
        aria-label={`调整${title}大小`}
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
      />
    </section>
  );
}

function StoryWindowAgentBox({
  draft,
  onDraftChange,
  onSubmit,
  status,
  title,
}: {
  draft: string;
  onDraftChange: (text: string) => void;
  onSubmit: () => void;
  status: StoryWindowStatus;
  title: string;
}) {
  const statusLabel: Record<StoryWindowStatus, string> = {
    idle: "待发送",
    sending: "发送中",
    sent: "已发送",
    error: "发送失败",
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="window-agent-box story-window-agent-box" onSubmit={submit}>
      <label>
        <span>{title} AI 指令</span>
        <textarea
          aria-label={`${title} AI 指令`}
          value={draft}
          onChange={(event) => onDraftChange(event.currentTarget.value)}
          placeholder="例如：强化 S01 的读者钩子，只给三个可替换方案。"
        />
      </label>
      <div className="window-agent-actions">
        <span className={`window-agent-status status-${status}`}>{statusLabel[status]}</span>
        <button type="submit" aria-label={`发送${title}指令`} disabled={!draft.trim() || status === "sending"}>
          <SendHorizontal aria-hidden="true" size={15} />
          发送
        </button>
      </div>
    </form>
  );
}

function RelationshipGraph({
  actors,
  actorPositions,
  changes,
  edgeOffsets,
  edges,
  onActorClick,
  onActorPointerDown,
  onRelationPointerDown,
  onRelationSelect,
  selectedActorId,
  selectedEdgeId,
  suggestions,
}: {
  actors: StoryActor[];
  actorPositions: Record<string, Pan>;
  changes: RelationshipChange[];
  edgeOffsets: Record<string, Pan>;
  edges: RelationshipEdge[];
  onActorClick: (actorId: string) => void;
  onActorPointerDown: (actorId: string, event: PointerEvent<HTMLElement>) => void;
  onRelationPointerDown: (edgeId: string, event: PointerEvent<SVGPathElement>) => void;
  onRelationSelect: (edgeId: string) => void;
  selectedActorId: string | null;
  selectedEdgeId?: string;
  suggestions: RelationshipSuggestion[];
}) {
  return (
    <div className="relationship-map">
      <svg aria-hidden="true" className="relationship-lines" viewBox="0 0 760 460" preserveAspectRatio="none">
        <defs>
          <marker id="arrow-cyan" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" />
          </marker>
          <marker id="arrow-magenta" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" />
          </marker>
          <marker id="arrow-amber" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const geometry = getRelationshipGeometry(edge, actors, actorPositions, edgeOffsets);
          return (
            <g key={edge.id}>
              <path
                className={`line-${edge.tone}${selectedEdgeId === edge.id ? " line-selected" : ""}`}
                data-edge-id={edge.id}
                d={geometry.pathD}
                strokeWidth={edge.strength / 20 + 2}
                markerEnd={`url(#arrow-${edge.tone})`}
                onPointerDown={(event) => onRelationPointerDown(edge.id, event)}
              />
              <text
                x={geometry.mid.x}
                y={geometry.mid.y - 10}
                className="relation-label"
                textAnchor="middle"
                pointerEvents="none"
              >
                {edge.status}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="relationship-line-card-layer" aria-label="关系线剧情卡片">
        {edges.map((edge) => {
          const geometry = getRelationshipGeometry(edge, actors, actorPositions, edgeOffsets);
          return (
            <button
              type="button"
              className={`relationship-line-card card-${edge.tone}${selectedEdgeId === edge.id ? " card-selected" : ""}`}
              data-card-density="compact"
              data-edge-summary-id={edge.id}
              data-edge-mid-x={String(geometry.mid.x)}
              data-edge-mid-y={String(geometry.mid.y)}
              key={edge.id}
              onClick={() => onRelationSelect(edge.id)}
              onPointerDown={(event) => event.stopPropagation()}
              style={{ left: `${geometry.card.x}px`, top: `${geometry.card.y}px` }}
            >
              <span className="relationship-line-direction">{edge.from} -&gt; {edge.to}</span>
              <strong>{edge.status}</strong>
              <small>强 {edge.strength}</small>
              <p>后续：{edge.nextShift}</p>
            </button>
          );
        })}
      </div>

      <div className="actor-grid">
        {actors.map((actor, index) => {
          const position = getActorPosition(actor, actorPositions, actors) || fallbackActorPosition(index);
          return (
            <article
              className={`actor-node actor-${actor.lane}${selectedActorId === actor.id ? " actor-selected" : ""}`}
              data-actor-id={actor.id}
              data-actor-x={String(Math.round(position.x))}
              data-actor-y={String(Math.round(position.y))}
              data-node-density="compact"
              key={actor.id}
              onClick={() => onActorClick(actor.id)}
              onPointerDown={(event) => onActorPointerDown(actor.id, event)}
              style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            >
              <strong>{actor.name}</strong>
              <span>{actor.role}</span>
            </article>
          );
        })}
      </div>

      {changes.length ? (
        <div className="relationship-change-layer" aria-label="plot relationship changes">
          {changes.map((change, index) => {
            const position = change.edgeId ? suggestionPositions[change.edgeId] : undefined;
            const fallback = { left: `${34 + (index % 3) * 22}%`, top: `${20 + (index % 2) * 17}%` };
            return (
              <article
                className={`relationship-change-chip change-${change.status}`}
                data-change-edge-id={change.edgeId || "graph"}
                key={change.id}
                style={position ?? fallback}
              >
                <span>{relationshipChangeStatusLabels[change.status]}</span>
                <strong>{change.summary}</strong>
                {change.detail ? <p>{change.detail}</p> : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {suggestions.length ? (
        <div className="relationship-suggestion-layer" aria-label="图中 AI 建议">
          {suggestions.map((suggestion) => {
            const position = suggestionPositions[suggestion.edgeId] ?? { left: "50%", top: "50%" };
            return (
              <article
                className={`relationship-suggestion-chip suggestion-${suggestion.status}`}
                data-suggestion-edge-id={suggestion.edgeId}
                key={suggestion.id}
                style={position}
              >
                <div className="relationship-suggestion-chip-head">
                  <span>AI建议</span>
                  <strong>{suggestionStatusLabels[suggestion.status]}</strong>
                </div>
                <p>{suggestion.text}</p>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RelationshipPresetPanel({
  layoutPresetId,
  novelPresetId,
  onLayoutPresetChange,
  onNovelPresetChange,
  onUpdateStrategyChange,
  selectedLayoutPreset,
  selectedNovelPreset,
  selectedUpdateStrategy,
  updateStrategyId,
}: {
  layoutPresetId: string;
  novelPresetId: string;
  onLayoutPresetChange: (presetId: string) => void;
  onNovelPresetChange: (presetId: string) => void;
  onUpdateStrategyChange: (presetId: string) => void;
  selectedLayoutPreset: (typeof relationshipLayoutPresets)[number];
  selectedNovelPreset: (typeof novelRelationshipPresets)[number];
  selectedUpdateStrategy: (typeof relationshipUpdateStrategyPresets)[number];
  updateStrategyId: string;
}) {
  return (
    <section className="relationship-preset-panel" aria-label="relationship preset panel">
      <header>
        <span>预设</span>
        <strong>关系预设库</strong>
      </header>
      <div className="relationship-preset-selects">
        <label>
          <span>小说类型</span>
          <select
            aria-label="小说类型预设"
            value={novelPresetId}
            onChange={(event) => onNovelPresetChange(event.currentTarget.value)}
          >
            {novelRelationshipPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>布局</span>
          <select
            aria-label="布局预设"
            value={layoutPresetId}
            onChange={(event) => onLayoutPresetChange(event.currentTarget.value)}
          >
            {relationshipLayoutPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>更新策略</span>
          <select
            aria-label="AI 更新策略预设"
            value={updateStrategyId}
            onChange={(event) => onUpdateStrategyChange(event.currentTarget.value)}
          >
            {relationshipUpdateStrategyPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="relationship-preset-summary">
        <strong>{selectedNovelPreset.label}</strong>
        <p>{selectedNovelPreset.promptHint}</p>
        <span>{selectedLayoutPreset.label}</span>
        <p>{selectedLayoutPreset.description}</p>
        <span>{selectedUpdateStrategy.label}</span>
        <p>{selectedUpdateStrategy.description}</p>
      </div>
      <div className="relationship-preset-group">
        <span>关系类型</span>
        <div className="relationship-preset-chip-row">
          {relationshipTypePresets.map((preset) => (
            <button className={`preset-chip preset-${preset.tone}`} key={preset.id} type="button" title={preset.promptHint}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relationship-preset-group">
        <span>线条样式</span>
        <div className="relationship-line-style-list">
          {relationshipLineStylePresets.map((item) => (
            <small key={item}>{item}</small>
          ))}
        </div>
      </div>
      <div className="relationship-preset-group">
        <span>触发事件</span>
        <div className="relationship-preset-chip-row compact">
          {relationshipEventPresets.map((event) => (
            <i key={event}>{event}</i>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActorProfilePanel({
  actor,
  actors,
  edges,
}: {
  actor?: StoryActor;
  actors: StoryActor[];
  edges: RelationshipEdge[];
}) {
  const connectedEdges = actor
    ? edges.filter((edge) => {
      const from = resolveActor(actors, edge.from);
      const to = resolveActor(actors, edge.to);
      return from?.id === actor.id || to?.id === actor.id;
    })
    : [];

  return (
    <aside className="actor-profile-panel" aria-label="actor profile panel">
      <header>
        <span>角色信息</span>
        <strong>{actor ? actor.name : "选择人物"}</strong>
      </header>
      {actor ? (
        <>
          <dl>
            <div>
              <dt>定位</dt>
              <dd>{actor.role}</dd>
            </div>
            <div>
              <dt>关系数</dt>
              <dd>{connectedEdges.length}</dd>
            </div>
          </dl>
          <p>{connectedEdges.map((edge) => edge.status).join(" / ")}</p>
        </>
      ) : (
        <p>点击图中的人物节点后，这里会显示角色定位、牵连关系和当前状态。</p>
      )}
    </aside>
  );
}

function RelationshipLineEditor({
  draft,
  edge,
  onDraftChange,
  onSubmit,
  statusInputRef,
}: {
  draft: RelationshipDraft;
  edge?: RelationshipEdge;
  onDraftChange: (draft: RelationshipDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  statusInputRef?: Ref<HTMLInputElement>;
}) {
  const preventEnterSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  return (
    <form className="relationship-line-editor" aria-label="relationship line editor" onSubmit={onSubmit}>
      <header>
        <span>关系线编辑</span>
        <strong>{edge ? `${edge.from} -> ${edge.to}` : "选择关系线"}</strong>
      </header>
      <label>
        <span>关系状态</span>
        <input
          aria-label="relationship status"
          ref={statusInputRef}
          value={draft.status}
          onChange={(event) => onDraftChange({ ...draft, status: event.currentTarget.value })}
          onKeyDown={preventEnterSubmit}
          placeholder="例如：脆弱同盟"
        />
      </label>
      <label>
        <span>变化原因</span>
        <textarea
          aria-label="relationship cause"
          value={draft.cause}
          onChange={(event) => onDraftChange({ ...draft, cause: event.currentTarget.value })}
          placeholder="写清是哪一次事件改变了两人的信任、筹码或敌意。"
        />
      </label>
      <label>
        <span>后续变化</span>
        <input
          aria-label="relationship next shift"
          value={draft.nextShift}
          onChange={(event) => onDraftChange({ ...draft, nextShift: event.currentTarget.value })}
          onKeyDown={preventEnterSubmit}
          placeholder="这条关系下一章会如何推动剧情。"
        />
      </label>
      <label className="relationship-strength-field">
        <span>{`调整强度：${draft.strength}`}</span>
        <input
          aria-label="relationship strength"
          type="range"
          min="1"
          max="100"
          value={draft.strength}
          onChange={(event) => onDraftChange({ ...draft, strength: Number(event.currentTarget.value) })}
        />
      </label>
      <button type="submit" aria-label="save relationship line change" disabled={!edge}>
        <SendHorizontal aria-hidden="true" size={15} />
        保存关系线变化
      </button>
    </form>
  );
}

function RelationshipSuggestionPanel({
  activeEdgeId,
  edges,
  isSending,
  onActiveEdgeChange,
  onSubmit,
  suggestionText,
  onSuggestionTextChange,
  textareaRef,
}: {
  activeEdgeId: string;
  edges: RelationshipEdge[];
  isSending: boolean;
  onActiveEdgeChange: (edgeId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  suggestionText: string;
  onSuggestionTextChange: (text: string) => void;
  textareaRef?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <form className="relationship-suggestion-panel" onSubmit={onSubmit}>
      <header>
          <span>AI 建议</span>
        <strong>AI 建议入图</strong>
      </header>
      <label>
        <span>关系线</span>
        <select
          aria-label="选择人物关系线"
          value={activeEdgeId}
          onChange={(event) => onActiveEdgeChange(event.currentTarget.value)}
        >
          {edges.map((edge) => (
            <option key={edge.id} value={edge.id}>
              {edge.from} -&gt; {edge.to} / {edge.status}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>建议</span>
        <textarea
          aria-label="AI 关系建议"
          ref={textareaRef}
          value={suggestionText}
          onChange={(event) => onSuggestionTextChange(event.currentTarget.value)}
          placeholder="例如：让女主在公开失败后替主角补一句证词。"
        />
      </label>
      <button type="submit" aria-label="提交 AI 建议" disabled={!suggestionText.trim() || isSending}>
        <SendHorizontal aria-hidden="true" size={15} />
        <span>提交 AI 建议</span>
      </button>
    </form>
  );
}

function RelationshipPlotChangePanel({
  changes,
  onSubmit,
  onTextChange,
  status,
  text,
}: {
  changes: RelationshipChange[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTextChange: (text: string) => void;
  status: RelationshipChangeStatus;
  text: string;
}) {
  return (
    <form className="relationship-change-panel" onSubmit={onSubmit}>
      <header>
        <span>Plot change</span>
        <strong>剧情变动入图</strong>
      </header>
      <label>
        <span>剧情变化</span>
        <textarea
          aria-label="plot relationship change"
          value={text}
          onChange={(event) => onTextChange(event.currentTarget.value)}
          placeholder="新增人物：情报商&#10;关系：主角->情报商&#10;状态：短期交易&#10;原因：他提供禁区地图&#10;后续：主角要付出秘密代价"
        />
      </label>
      <div className="relationship-change-actions">
        <span className={`relationship-change-status change-${status}`}>
          {relationshipChangeStatusLabels[status]}
        </span>
        <button type="submit" aria-label="apply plot relationship change" disabled={!text.trim() || status === "sending"}>
          <SendHorizontal aria-hidden="true" size={15} />
          应用剧情变动
        </button>
      </div>
      {changes.length ? (
        <div className="relationship-change-history" aria-label="relationship change history">
          {changes.slice(-3).map((change) => (
            <article className={`relationship-change-history-item change-${change.status}`} key={change.id}>
              <span>{relationshipChangeStatusLabels[change.status]}</span>
              <strong>{change.summary}</strong>
            </article>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function RelationshipLog({ edges }: { edges: RelationshipEdge[] }) {
  return (
    <aside className="relationship-log relationship-log-window">
      <header>
        <span>关系日志</span>
        <strong>关系演变日志</strong>
      </header>
      {edges.map((edge) => (
        <article className={`relation-card relation-${edge.tone}`} key={edge.id}>
          <div>
            <span>{edge.from} {"->"} {edge.to}</span>
            <strong>{edge.status}</strong>
          </div>
          <dl>
            <div>
              <dt>强度</dt>
              <dd>{edge.strength}</dd>
            </div>
            <div>
              <dt>首现</dt>
              <dd>首现 {edge.firstSeen}</dd>
            </div>
          </dl>
          <p><b>演变</b>{edge.evolution}</p>
          <p><b>主要剧情引导</b>{edge.guide}</p>
          <p><b>变化原因</b>{edge.cause}</p>
          <p><b>后续变化</b><span>{`next: ${edge.nextShift}`}</span></p>
        </article>
      ))}
    </aside>
  );
}
