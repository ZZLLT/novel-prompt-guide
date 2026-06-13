# Design

## Register

Product UI for a desktop novel-writing workbench.

## Interface Intent

The app should feel like a calm writing desk with many usable surfaces open at once. It is not a landing page, video tool, voice studio, or decorative AI dashboard. The user should always know three things: what stage the novel is in, which window to open next, and whether an AI/API action will spend tokens.

## Layout System

- The default layout is desktop-first: left project stages, center writing workspace, right AI collaboration, bottom context summary.
- The center column owns the main writing flow. Side panels support orientation and AI feedback, but should not compete with the active chapter task.
- Budget information stays compact. Detailed token reasoning belongs in the budget window, not as a large permanent panel.
- Feature windows are movable, resizable work surfaces. Window controls should stay familiar: title, drag affordance, close button, resize handle, AI instruction box.

## Color And Type

- Palette: restrained dark neutral surfaces, soft blue-gray borders, warm amber for cost/attention, muted green for workflow readiness.
- Avoid neon, cyberpunk glow, gradient text, decorative grid backgrounds, and one-hue dashboards.
- Typography uses the system Chinese UI stack already defined in tokens. Labels stay compact; headings are clear but not oversized.
- English is allowed for stable technical terms only: API, AI, Agent, WPS, Token. Workflow labels should be Chinese whenever possible.

## Components

- Buttons: icon plus short verb/object labels for actions; compact text buttons are acceptable in dense toolbars.
- Panels: full borders, no side stripes, no nested decorative cards.
- Inputs: dark field surface, high-contrast text and placeholders, visible focus ring.
- Status: state labels must be explicit, especially for queued AI work, API disabled state, and token-limit fallback.
- Window workgroups: quick-open buttons can open several windows, but must never call AI automatically.

## AI And Token Rules

- No hidden API calls. AI requests happen only after a user clicks a send/generate/fetch action.
- Window AI prompts should send short, structured instructions scoped to that window.
- Model fetching occurs only when the user clicks "获取模型".
- API settings must sanitize endpoint/model text, clamp numeric limits, and tolerate malformed provider responses.

## Current Backlog

1. Add a queue polling manager so queued AI replies can resolve after more than one poll without repeated user clicks.
2. Add WPS read/write pending states, duplicate-click guards, and last-sync feedback.
3. Add browser-level smoke tests for small desktop and narrow viewports to catch real overflow that jsdom cannot see.
4. Make token units more consistent by showing estimated tokens, API limit, saved tokens, and model role together.
