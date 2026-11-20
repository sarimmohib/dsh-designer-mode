# Designer Mode — DeepSeek Harness plugin

A live UI canvas in the Designer tab of the right sidebar. The agent publishes a
self-contained HTML document with `designer_update`; you see it render immediately
and can select elements at any time to ask for changes.

## What it does

- **Live canvas** — one complete HTML document per revision, rendered in the tab.
- **Per-session designs** — each conversation keeps its own canvas (persisted under
  `~/.dsh/designer-mode/sessions/`). Designs never leak between sessions.
- **Selection always available** — click elements in Select/Unselect mode, or use
  Alt/Shift/Ctrl/Meta-click in Navigate mode. Picked elements are numbered on the
  canvas and mirrored as ordered chips; the message sent to the agent lists each
  element's selector, text, box and computed styles in pick order.
- **Tabs** — create/select/close design tabs from the rail for separate designs.
- **Ratio presets** — Fill, Phone, Portrait, Square, Landscape, TV, Ultra-wide,
  letterboxed to fit the panel.
- **Animation scoring** — `designer_animate` measures real rAF frame timings in
  headless Chrome (FPS, p50/p95/p99, jank, 0–100 score).
- **Movement trace** — click/tap points and motion paths (DOM + canvas interiors)
  are logged and drawable as agent-only SVG lines; the Trace rail button toggles
  visibility.
- **No design-first gate** — agents may use all tools at any time. Only the user can
  finalize a design with the Done button; agents keep designs editable.

## Agent tools

| Tool | Purpose |
| --- | --- |
| `designer_update(html, note?, tab?)` | Publish a complete self-contained HTML document. |
| `designer_state()` | Read tabs, active tab, revision, view state. |
| `designer_screenshot(width?, height?, path?, tab?)` | Headless PNG capture. |
| `designer_animate(html?, interaction?, ...)` | CDP-based smoothness measurement. |
| `designer_tab(action, id?, name?)` | new / select / close / rename tabs. |
| `designer_canvas(ratio?, mode?, reload?, clearSelection?)` | Control view headlessly. |
| `designer_trace(action?)` | Read or clear the movement trace. |

## Install

This is a local plugin, linked into a Harness profile:

```bash
pnpm add link:/path/to/dsh-designer-mode
```

Ensure the bundle row is in the profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: designer-mode
      name: '@local/designer-mode'
```

Restart DeepSeek Harness. The Designer tab appears in the right sidebar's "New tab" guide.

## Usage

- Ask for an interface; the agent calls `designer_update` and it renders live.
- Select elements (modifier-click works in Navigate mode), describe the change, send.
- Use Done only when you want to finalize — you can still edit afterwards.
- `/designer off` clears this session's canvas state.

## Files

| File | Role |
| --- | --- |
| `index.js` | Host half: per-session state, agent tools, HTTP routes. |
| `client.js` | Web half: Designer tab, rail controls, same-origin selection wiring. |
| `anim.js` | Headless CDP animation smoothness measurement. |
| `live-state.js` | Informational cross-session activity + movement trace store. |
| `cordis.patch.yml` | Bundle patch inserting the plugin row. |
| `locale/{en,zh}.json` | Dictionaries. |

## Notes

- Canvas sandbox: `allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads`.
  The same-origin grant is what makes panel-driven selection possible.
- Designs must be self-contained HTML (inline CSS/SVG), no external network requests.
- Screenshots/animation use headless Chrome or Edge (`CHROME_PATH` override).

MIT
