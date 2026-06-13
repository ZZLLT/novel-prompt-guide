# React Cyber Writer Cockpit Implementation Plan

**Goal:** Rebuild the existing single-file web UI into a React + TypeScript + Vite cyber writing cockpit while preserving the current Python/WPS API.

**Architecture:** The backend remains `server.py` with the existing `/api/*` routes. The frontend becomes a Vite app under `web/`, with typed API helpers, static stage/agent data, composable cockpit panels, and CSS token styling.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Python stdlib HTTP server.

---

### Task 1: Frontend Tooling And First Failing Test

**Files:**
- Create: `D:\OH-WorkSpace\novel-prompt-guide\package.json`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\vite.config.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\tsconfig.json`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\tsconfig.node.json`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\index.html`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\test\setup.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\App.test.tsx`

- [ ] **Step 1: Preserve old HTML** by copying `web/index.html` to `web/index.legacy.html`.
- [ ] **Step 2: Add frontend package/config files** with scripts `dev`, `build`, `test`, `preview`.
- [ ] **Step 3: Write failing React render test** expecting the app to show `赛博作家舱`, `故事宇宙`, `章节驾驶舱`, `Agent 指挥台`, and `上下文总线`.
- [ ] **Step 4: Run** `npm install`.
- [ ] **Step 5: Run** `npm test -- --run` and confirm it fails because `App` is not implemented.

### Task 2: Typed API And Domain Data

**Files:**
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\api\types.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\api\client.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\data\stages.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\data\agents.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\api\client.test.ts`

- [ ] **Step 1: Write failing API tests** for invalid HTTP responses and `postJson` request shape.
- [ ] **Step 2: Implement typed API helpers** for status, state, sections, readDocSection, writeToWps, generatePrompt, sendChat, and pollChat.
- [ ] **Step 3: Implement stage and agent data** for cockpit rendering.
- [ ] **Step 4: Run** `npm test -- --run` and confirm API/data tests pass.

### Task 3: Cockpit Components And State Hooks

**Files:**
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\main.tsx`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\App.tsx`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\hooks\useCockpit.ts`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\components\StoryUniverseDeck.tsx`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\components\ChapterCockpit.tsx`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\components\AgentCommandDeck.tsx`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\components\ContextBus.tsx`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\components\ui.tsx`

- [ ] **Step 1: Implement minimal App and components** to satisfy the render test.
- [ ] **Step 2: Add state hook** for current stage, form data, backend status, document state, agent states, prompt preview, chat messages, and errors.
- [ ] **Step 3: Wire actions** to API helpers while preserving direct and queued chat behavior.
- [ ] **Step 4: Run** `npm test -- --run` and confirm all tests pass.

### Task 4: Cyber Visual System

**Files:**
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\styles\tokens.css`
- Create: `D:\OH-WorkSpace\novel-prompt-guide\web\src\styles\app.css`
- Modify: `D:\OH-WorkSpace\novel-prompt-guide\web\src\main.tsx`

- [ ] **Step 1: Add CSS variables** for graphite background, cyan/magenta/amber accents, semantic status colors, spacing, shadows, and typography.
- [ ] **Step 2: Style the cockpit layout** with left universe deck, center writing deck, right agent deck, and bottom context bus.
- [ ] **Step 3: Add responsive behavior** so narrow screens stack without text overlap.
- [ ] **Step 4: Run** `npm test -- --run` and `npm run build`.

### Task 5: Backend Static Compatibility

**Files:**
- Modify: `D:\OH-WorkSpace\novel-prompt-guide\server.py`
- Modify: `D:\OH-WorkSpace\novel-prompt-guide\tests\test_server_api.py`

- [ ] **Step 1: Write failing Python test** that static directory selection prefers `web/dist` when it exists.
- [ ] **Step 2: Implement `get_web_dir()`** so built Vite output can be served by Python while Vite dev server remains available in development.
- [ ] **Step 3: Run** `python -m pytest tests -q`.
- [ ] **Step 4: Run** `python -m py_compile server.py wps_mcp_bridge.py`.

### Task 6: Browser Verification And Polish

**Files:**
- Modify frontend files only if visual verification finds issues.

- [ ] **Step 1: Start dev server** with `npm run dev -- --host 127.0.0.1`.
- [ ] **Step 2: Open the local app in the browser and inspect desktop screenshot.**
- [ ] **Step 3: Inspect mobile/narrow viewport screenshot.**
- [ ] **Step 4: Check for blank screens, overlapping text, unreadable contrast, broken controls, and missing cockpit sections.**
- [ ] **Step 5: Run final verification:** `npm test -- --run`, `npm run build`, `python -m pytest tests -q`, `python -m py_compile server.py wps_mcp_bridge.py`.

Self-review: The plan covers the confirmed React/Vite UI rebuild, keeps backend behavior stable, uses failing tests before implementation, and includes browser visual verification.
