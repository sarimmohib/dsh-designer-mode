# Designer Mode — DeepSeek Harness plugin

A live UI canvas in the right sidebar. The agent publishes a self-contained HTML
document with `designer_update`; you see it render immediately and can select elements
on it to ask for changes. Project work stays locked until you mark the design done.

## What it does

- **Live canvas** — the agent sends one complete HTML document per revision and it
  renders in the Designer tab. Nothing to build.
- **Three interaction modes**, in a thumb-reachable bar at the bottom:
  - `Navigate` — taps act on the page itself, nothing is intercepted.
  - `Select` — every tap *adds* that element to an ordered multi-selection.
  - `Unselect` — every tap *removes* that element.
- **Ordered selection** — picks are numbered on the canvas and mirrored as chips in a
  tray; the message sent to the agent lists every element in the order you picked it,
  with selector, text, box and computed styles.
- **Design-first gate** — while a design is unapproved, project and system tools are
  denied. Read-only tools still work. Approving unlocks implementation.
- **Prompt preview** — shows exactly what the selection would send, with a copy button.

## How selection works

The panel is same-origin with the canvas iframe, so it attaches its own listeners to the
frame document through `contentDocument` and paints numbered overlays there. That means
no script is injected into the design itself and no second host reload is needed.

`Navigate` mode paints no hover outline at all; `Select` and `Unselect` tint the hover
outline orange and slate respectively so the active mode is visible before you tap.

## Install

This is a local plugin, linked into a Harness profile:

```bash
# in your web profile
pnpm add link:/path/to/dsh-designer-mode
```

Then make sure the bundle row is present in the profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: designer-mode
      name: '@local/designer-mode'
```

Restart the Harness web server. The Designer tab appears in the right sidebar's
"New tab" guide.

## Usage

- Ask for an interface. The agent calls `designer_update` and the canvas renders.
- Switch to `Select`, tap elements, describe the change, send.
- Mark the design as done (the check button) when it is right — the agent may then
  implement it in the project.
- `/designer off` discards the canvas and leaves the mode.

## Files

| File | Role |
| --- | --- |
| `index.js` | Host half: per-session canvas state, the `designer_update` / `designer_state` tools, the design-first gate, the HTTP routes. |
| `client.js` | Web half: the Designer tab, the mode bar, the selection tray, and the same-origin canvas wiring. |
| `cordis.patch.yml` | Bundle patch that inserts the plugin row. |
| `locale/{en,zh}.json` | Dictionaries. |

## Notes

- Selection resets when the canvas revision changes, because the new document's
  elements are different objects.
- The canvas is sandboxed with `allow-scripts allow-same-origin allow-forms`; the
  same-origin grant is what makes panel-driven selection possible.
- No external network requests are made by the canvas — designs must be fully
  self-contained HTML with inline CSS and SVG.

## License

MIT
