# Editorial Studio UI Refactor

## Goal

Turn the current cockpit-style interface into a desktop writing studio for long-form novel documents. The UI should make drafting, planning, relationship editing, prompt reuse, API settings, and AI collaboration feel like coordinated writing tools instead of large visual panels.

## Design Direction

- Document-first: the center workspace is the primary reading and writing surface.
- Low-noise editorial style: light paper surfaces, ink text, muted blue actions, amber/green status accents.
- Dense desktop workflow: no mobile-first expansion, no large hero blocks, no oversized budget panels.
- Windowed tools: every function window should feel like a small desktop utility window, with clear title bars, resize handles, and compact content.
- AI is explicit: AI calls are only triggered by user actions, with visible status and short-context wording.

## Implementation Scope

- Add a final CSS design layer that overrides legacy dark/neon styling without changing existing component contracts.
- Preserve existing accessible names and test labels.
- Improve workspace shell, left rail, top bar, right AI drawer, status bar, forms, prompt plaza, budget panel, function windows, API settings, and relationship graph.
- Keep relationship cards compact and lines legible.

## Visual Rules

- Use semantic tokens for surfaces, text, borders, focus, and status.
- Prefer borders and whitespace over shadows for grouping.
- Keep card radius at 8px or less.
- Avoid radial glow, grid backgrounds, purple gradients, and decorative orbs.
- Keep line-height readable and letter-spacing at 0.
