# Workspace OS UI Implementation Plan

**Goal:** Rebuild the main React shell into a clearer desktop writing workspace with navigation, focused work area, AI assistant drawer, and compact status bar.

**Architecture:** Keep existing feature components and API wiring intact, but replace the current three-column dashboard composition in `App.tsx` with an application shell. The first stage changes only layout, navigation, and visual hierarchy so existing WPS, generation, setup, API settings, and relationship windows remain usable.

**Tech Stack:** React 19, TypeScript, Vite, CSS variables, Vitest, Testing Library, lucide-react.

---

### Task 1: App Shell Contract

**Files:**
- Modify: `web/src/App.test.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Write failing tests** for a left workspace navigation, active workspace region, AI assistant drawer toggle, and compact bottom status bar.
- [ ] **Step 2: Run `npm test -- --run web/src/App.test.tsx -t "workspace OS"`** and confirm the new test fails because the shell does not exist yet.
- [ ] **Step 3: Refactor `App.tsx`** to add navigation items for 初设, 写作, 剧情线, 人物关系, 世界设定, AI 协作, 设置; render one active workspace at a time; keep existing setup and API modals.
- [ ] **Step 4: Run the focused App test** and confirm the behavior passes.

### Task 2: Visual System Refresh

**Files:**
- Modify: `web/src/styles/tokens.css`
- Modify: `web/src/styles/app.css`

- [ ] **Step 1: Replace the heavy neon background** with quieter dark ink surfaces, restrained accent colors, and sharper text contrast.
- [ ] **Step 2: Add workspace shell classes** for `.workspace-os`, `.workspace-rail`, `.workspace-main`, `.workspace-toolbar`, `.workspace-panel`, `.assistant-drawer`, and `.workspace-statusbar`.
- [ ] **Step 3: Keep existing component class names supported** so feature panels still render without a full component rewrite.
- [ ] **Step 4: Use browser screenshots at 1440x900** to check density, hierarchy, and no obvious overlap.

### Task 3: Verification

**Files:**
- Test: `web/src/App.test.tsx`
- Test: `web/src/components/StoryFlowMap.test.tsx`
- Test: `tests`

- [ ] **Step 1: Run `npm test -- --run`** and fix only regressions caused by this shell refactor.
- [ ] **Step 2: Run `npm run build`** to verify TypeScript and production bundle.
- [ ] **Step 3: Run `python -m pytest tests -q`** to ensure backend behavior is untouched.
- [ ] **Step 4: Run `python -m py_compile server.py prompt_system.py wps_mcp_bridge.py`**.
- [ ] **Step 5: Capture `http://127.0.0.1:5173/?setup=closed`** and inspect the real UI.
