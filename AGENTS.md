# Working Rules

- **Direct Action**: Run the required command directly without overcomplicating with unnecessary pre-checks, version checks, or redundant verification steps.
- **Fast & Minimal**: If a task can be done in 1 command, execute it in 1 command immediately.

# Design references

When asked for a design audit, critique, polish or redesign, follow these repos (clone them; they are not vendored here):

- **unslop** — https://github.com/heydamir/unslop (CC BY 4.0, Damir Sokolovsky). Audit AI-looking UI against `signs.md`, write a 5-line direction, then fix in passes: spacing, color, icons, copy, type, layout, details, visuals, motion.
- **Impeccable** — https://github.com/pbakaus/impeccable (Apache 2.0). Commands such as `critique`, `audit`, `polish`, `bolder`, `optimize`; read `plugin/skills/impeccable/SKILL.md` and the matching `reference/<command>.md`.
- **charles-skills** — https://github.com/LemonFace0309/charles-skills. Useful here: `charles-unslop` (unslop plus one product-specific moment), `charles-polish`, `charles-ux-animation` (loading, feedback, motion), `charles-unreasonable-craft` (award-level redesign).

House rules already agreed for GETXH:
- One accent: dashboard blue `#2563d9` / `#2563eb`. No hue gradients, glows, glass or looping shimmer.
- Sentence case, weights 400–600, 4px spacing grid.
- The home page login card (banner + form) stays as it is unless the owner asks.
- Loaders only when needed: skip when the user's data is already cached on the device.
- Do not add or change trust claims (ratings, "100%", "cheapest", user counts) without the owner confirming they are true.
