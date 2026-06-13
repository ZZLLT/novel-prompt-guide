# Cyber Writer Cockpit Design

Date: 2026-06-06

Project: `D:\OH-WorkSpace\novel-prompt-guide`

## Goal

Rebuild the current single-file web UI into a React + TypeScript + Vite "赛博作家舱" for AI-assisted novel creation. The first version should feel like a creative command center, not a plain form app, while preserving the existing Python/WPS backend behavior.

## Product Direction

The UI will emphasize four ideas:

1. The user is commanding a writing team, not only chatting with one assistant.
2. Story memory is visible and inspectable.
3. Chapter drafting is the main workspace.
4. AI context is explicit before generation, so the user can see what the AI is using.

External patterns considered:

- Sudowrite Story Bible and Scenes/Draft: source-of-truth story fields, then scene/chapter generation.
- Novelcrafter Codex and Chat context selection: story wiki plus scoped AI context.
- NovelAI Lorebook and Context Viewer: visible context composition before AI generation.
- PlotForge story bible and continuity workflow: universe-first planning, then writing and maintenance.

## Scope

### In Scope

- Replace `web/index.html` with a Vite-built React app.
- Add `package.json`, `vite.config.ts`, `tsconfig*.json`, and `src/`.
- Keep existing backend routes:
  - `GET /api/status`
  - `GET /api/state`
  - `GET /api/sections`
  - `GET /api/doc/read?section=...`
  - `POST /api/write`
  - `POST /api/generate`
  - `POST /api/chat/send`
  - `GET /api/chat/poll?msg_id=...`
- Add a small static serving compatibility change only if needed so `server.py` can serve the built Vite output.
- Create a polished cyber cockpit visual system with responsive desktop-first layout.
- Represent multiple writer agents in the UI with state, tasks, and outputs.
- Support both direct LLM replies and queued file-based replies.

### Out Of Scope For First Version

- No new backend agent orchestration engine.
- No changes to WPS MCP protocol behavior.
- No field-level WPS sync promises.
- No full document/chapter persistence model beyond the current local frontend state and backend API.
- No production authentication, cloud storage, or multi-user collaboration.

## Information Architecture

### Left: Story Universe Deck

Purpose: persistent project memory and progress.

Sections:

- Status rail: WPS connection, LLM availability, queue count.
- Stage map: cover, worldbuilding, characters, plot, chapters.
- Codex snapshot: world rules, main cast, factions, plot threads, hooks.
- Continuity alerts: empty states first, later can connect to consistency checks.

Design character:

- Compact, scan-friendly, cyber control panel.
- Uses icons and status dots instead of long instructional text.
- Keeps cards shallow, with no nested cards.

### Center: Chapter Cockpit

Purpose: main writing and editing area.

Sections:

- Header: current stage title, next action, WPS sync state.
- Stage fields: structured controls for current stage.
- Draft console: larger text area for chapter prose or prompt output.
- Primary actions: generate, write to WPS, read from WPS.
- Prompt preview panel: shows generated prompt or AI suggestion.

Design character:

- Dense but readable.
- Large enough writing surface to feel like the central workspace.
- Stable dimensions so buttons, labels, and dynamic content do not shift the page.

### Right: Agent Command Deck

Purpose: multiple AI roles working as a creative team.

Agents:

- 主笔 Agent: drafts prose.
- 世界观设计师: expands rules, factions, powers, constraints.
- 角色导演: character psychology, relationships, voice.
- 剧情策划: chapter goals, twists, pacing, hooks.
- 润色编辑: line edits, rhythm, sensory detail.
- 一致性审查: contradictions, dangling threads, timeline issues.
- WPS 排版官: sync, format, document structure hints.

First-version behavior:

- Agents are UI roles mapped to prompt shortcuts and stage-specific tasks.
- Agent state can be `idle`, `queued`, `working`, `done`, or `blocked`.
- When `/api/generate` or `/api/chat/send` runs, the matching agent row updates.
- Returned responses appear in the command deck and can be copied/applied to the center workspace.

### Bottom: Context Bus

Purpose: show what the AI will reference.

Segments:

- WPS current text.
- Story Bible/Codex snapshot.
- Current stage fields.
- Recent AI/user instruction.
- Generated prompt.

First-version behavior:

- Read-only context visualization.
- Uses colored segments and counts to indicate approximate context weight.
- Shows warnings when WPS is disconnected or a section is empty.

## Visual System

Theme: Cyber writer cockpit.

Palette:

- Background: near-black graphite, not pure blue/slate.
- Accent 1: cyan electric for active controls.
- Accent 2: magenta or violet for agent activity.
- Accent 3: amber for warnings and WPS sync.
- Success: green.
- Error: red.

Rules:

- Avoid one-note blue/purple dominance by mixing cyan, magenta, amber, and neutral graphite.
- No decorative orb/blob backgrounds.
- Use subtle grid lines, scanlines, and angular dividers instead of soft bokeh.
- Border radius stays 4-8px.
- Text must not scale with viewport width.
- Letter spacing remains `0`.
- Buttons use icons where available, with text only for clear commands.

Typography:

- UI font: system sans stack.
- Numeric/status text: optional monospace.
- Writing text areas: readable sans or serif toggle in later version, not required first.

## React Architecture

Recommended structure:

```text
web/
  index.html
  src/
    main.tsx
    App.tsx
    api/
      client.ts
      types.ts
    data/
      agents.ts
      stages.ts
    hooks/
      useAppData.ts
      useChatQueue.ts
    components/
      layout/
        Shell.tsx
        StoryUniverseDeck.tsx
        ChapterCockpit.tsx
        AgentCommandDeck.tsx
        ContextBus.tsx
      ui/
        Button.tsx
        IconButton.tsx
        StatusPill.tsx
        Panel.tsx
        Field.tsx
      writing/
        StageEditor.tsx
        PromptPreview.tsx
        AgentCard.tsx
        ContextSegment.tsx
    styles/
      tokens.css
      app.css
```

State model:

- `currentStage`
- `formData`
- `status`
- `documentState`
- `sections`
- `chatMessages`
- `pendingRequests`
- `agentStates`
- `lastPrompt`

Use local React state and custom hooks for the first version. No Redux or server state library is needed yet.

## Data Flow

Initial load:

1. `GET /api/status`
2. `GET /api/state`
3. Render stage map, connection state, agent idle states.

User switches stage:

1. Update `currentStage`.
2. Render stage fields from local config.
3. Update context bus from current form data and last backend snapshot.

Generate prompt:

1. Call `POST /api/generate` with current stage.
2. Mark relevant agent as `queued` or `working`.
3. Show prompt in center preview.
4. If response is queued, poll `/api/chat/poll`.

Send instruction:

1. Call `POST /api/chat/send`.
2. Direct LLM response updates agent output immediately.
3. Queued response adds pending item and polls.

Write to WPS:

1. Serialize current stage fields to the existing text format.
2. Call `POST /api/write`.
3. Show success or backend error.
4. Refresh state after a short delay.

Read from WPS:

1. Call `GET /api/doc/read?section=currentStage`.
2. Display returned text as a WPS snapshot.
3. Do not overwrite local form fields without explicit user action.

## Error Handling

Visible states:

- WPS disconnected.
- LLM unavailable.
- Queue waiting.
- Invalid/unknown backend response.
- WPS read timeout or empty section.
- Write to WPS failed.

UI behavior:

- Do not silently swallow errors.
- Use status pills and a compact incident line.
- Keep old data visible while refresh is loading.
- Provide retry buttons for status/state refresh.

## Accessibility And Responsiveness

Desktop:

- Four-region cockpit: left, center, right, bottom.
- Fixed side widths with flexible center.
- No layout shift when status text changes.

Tablet/mobile:

- Center workspace first.
- Universe deck and Agent deck become tabbed panels or collapsible drawers.
- Context bus moves below the center workspace.

Accessibility:

- Keyboard-focusable controls.
- Buttons have accessible labels.
- Status colors also include text labels.
- Minimum contrast targets WCAG AA for normal text.

## Testing Strategy

Frontend:

- TypeScript compile check.
- Vite production build.
- Unit tests for API client error normalization if test stack is added.
- Playwright or browser screenshot smoke test after implementation if feasible.

Backend compatibility:

- Existing Python tests should continue to pass.
- No change to API paths unless explicitly tested.

Manual smoke flow:

1. Start Python server.
2. Open local URL.
3. Verify cockpit renders.
4. Verify status refresh works when WPS is disconnected.
5. Generate a prompt.
6. Send a chat message.
7. Confirm queued/direct response displays without breaking layout.

## Multi-Agent Implementation Plan

First version:

- Multi-agent is represented as UI role routing and state, using existing `/api/generate` and `/api/chat/send`.
- Agents do not yet run independent backend jobs.

Second version:

- Add backend route for agent tasks:
  - `POST /api/agents/run`
  - `GET /api/agents/status`
  - `GET /api/agents/result`
- Store agent task queue separately from general chat queue.
- Add consistency checker and WPS layout officer hooks.

Third version:

- True multi-agent orchestration:
  - planner agent creates chapter plan
  - writer agent drafts
  - editor agent revises
  - continuity agent audits
  - WPS agent formats and writes

## Risks

- Vite output must be served correctly by the existing Python static server.
- UI may imply backend precision that does not exist yet.
- Agent cards can look functional before backend orchestration exists, so labels must make first-version behavior clear.
- Large visual redesign can hide operational failures if status states are weak.
- Introducing dependencies means users need `npm install` and build/run instructions.

## Acceptance Criteria

- React app renders as a cyber writing cockpit.
- Existing backend API routes still work.
- User can switch stages, edit fields, generate prompts, chat, write to WPS, and read WPS snapshots.
- Agent deck visibly tracks at least queued/direct responses.
- Context bus displays current context segments and empty/disconnected states.
- Production build succeeds.
- Python compatibility tests still pass.

## Open Decisions

- Whether to use `lucide-react` for icons or keep CSS/text symbols for first version.
- Whether `server.py` should serve `web/dist` in production or Vite dev server should be the default during development.
- Whether to add Playwright immediately or only after the React UI is in place.

## Self-Review

- No placeholders remain.
- Scope is focused on React UI rebuild and preserves backend behavior.
- The first version explicitly distinguishes UI role routing from true backend multi-agent orchestration.
- The design covers architecture, components, data flow, error handling, testing, and risks.
