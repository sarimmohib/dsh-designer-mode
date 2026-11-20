/**
 * Designer mode — Host half.
 *
 * Per-session design state with multiple tabs, the agent tools that publish
 * canvases, an agent-only unrestricted design mode, headless screenshots, and
 * the HTTP surface the Designer tab uses to render and control everything.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { measureAnimation } from './anim.js';
import { getLive, publish as publishLive, setApproved as setLiveApproved, setAgentMode as setLiveAgent, clearLive, setActivity } from './live-state.js';

const execFileAsync = promisify(execFile);

/** Tools a session may keep using while a normal design is under revision. */
const ALLOWED_WHILE_DESIGNING = new Set([
  'designer_update',
  'designer_state',
  'designer_agent_begin',
  'designer_screenshot',
  'designer_animate',
  // DSH bridges (including the Web GUI) dispatch calls through this wrapper.
  'execute',
  'read',
  'grep',
  'glob',
  'read_image',
  'skill',
  'todo_write',
  'ask_user_question',
  'web_search',
  'web_fetch',
  'cordis_inspect_list',
  'cordis_inspect_query',
  'job_list',
  'job_output',
]);

const FRAME_PATH = '/designer-mode/frame';
const STATE_PATH = '/designer-mode/state';
const COMMAND_PATH = '/designer-mode/command';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter((value) => typeof value === 'string' && value !== '');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function blankTab(name, options = {}) {
  return {
    id: options.id ?? '',
    name: name || 'Design',
    html: '',
    revision: 0,
    started: options.started === true,
    approved: options.approved === true,
    agentMode: options.agentMode === true,
    updatedAt: 0,
  };
}

function blankState() {
  const first = blankTab('Design 1');
  first.id = 'tab-1';
  return { tabs: [first], activeTabId: 'tab-1', seq: 2, ratio: 'fill', mode: 'select', reloadSeq: 0, selected: [], selectionClearSeq: 0 };
}

function activeTab(state) {
  if (state === undefined) return undefined;
  return state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0];
}

function tabById(state, id) {
  if (state === undefined || typeof id !== 'string') return undefined;
  return state.tabs.find((tab) => tab.id === id);
}

function createTab(state, name, options = {}) {
  const id = 'tab-' + (state.seq++);
  const tab = blankTab(name || ('Design ' + (state.tabs.length + 1)), options);
  tab.id = id;
  state.tabs.push(tab);
  if (options.activate !== false) state.activeTabId = id;
  return tab;
}

function tabPublic(tab, state) {
  return {
    id: tab.id,
    name: tab.name,
    revision: tab.revision,
    started: tab.started,
    approved: tab.approved,
    empty: tab.html === '',
    updatedAt: tab.updatedAt,
    active: state.activeTabId === tab.id,
  };
}

function publicState(state) {
  if (state === undefined) {
    return {
      started: false, approved: false, revision: 0, updatedAt: 0,
      empty: true, agentMode: false,
      active: { id: '', name: '', revision: 0, started: false, approved: false, empty: true, updatedAt: 0, active: true },
      tabs: [],
      view: { ratio: 'fill', mode: 'select', reloadSeq: 0, selected: [], selectionClearSeq: 0 },
      animation: null,
    };
  }
  const tab = activeTab(state);
  return {
    started: tab.started,
    approved: tab.approved,
    revision: tab.revision,
    updatedAt: tab.updatedAt,
    empty: tab.html === '',
    agentMode: tab.agentMode,
    active: tabPublic(tab, state),
    tabs: state.tabs.map((entry) => tabPublic(entry, state)),
    view: { ratio: state.ratio ?? 'fill', mode: state.mode ?? 'select', reloadSeq: state.reloadSeq ?? 0, selected: state.selected ?? [], selectionClearSeq: state.selectionClearSeq ?? 0 },
    animation: state.animation ?? null,
  };
}

async function readBody(req, limit = 1_500_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('request body too large');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return '';
  return Buffer.concat(chunks).toString('utf8');
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export const inject = ['tools', 'systemPrompt'];

export function apply(ctx) {
  /** @type {Map<string, ReturnType<typeof blankState>>} */
  const states = new Map();
  /** Latest canvas revision pushed to each session's frame stream waiters. */
  const waiters = new Map();

  const stateOf = (sessionId) => states.get(sessionId);
  const ensureState = (sessionId) => {
    let state = states.get(sessionId);
    if (state === undefined) {
      state = blankState();
      states.set(sessionId, state);
    }
    return state;
  };
  const notify = (sessionId) => {
    const list = waiters.get(sessionId);
    if (list === undefined) return;
    waiters.delete(sessionId);
    for (const resolve of list) resolve();
  };

  const writeCanvas = (sessionId, html, tabId, name) => {
    const state = ensureState(sessionId);
    let tab = tabId === undefined ? activeTab(state) : tabById(state, tabId);
    if (tab === undefined) {
      const id = tabId === undefined ? 'tab-' + (state.seq++) : tabId;
      tab = blankTab(name || (tabId || ('Design ' + (state.tabs.length + 1))), { id });
      state.tabs.push(tab);
      state.activeTabId = id;
      const n = Number(String(id).replace(/\D/g, ''));
      if (Number.isFinite(n)) state.seq = Math.max(state.seq, n + 1);
    }
    tab.html = String(html ?? '');
    tab.revision += 1;
    tab.started = true;
    tab.updatedAt = Date.now();
    publishLive(tab.html, { label: tab.name, agentMode: tab.agentMode });
    setActivity('design', tab.name);
    notify(sessionId);
    return tab;
  };

  const agentBegin = (sessionId, name) => {
    const state = ensureState(sessionId);
    const tab = createTab(state, name || 'Agent design', { started: true, approved: true, agentMode: true });
    tab.updatedAt = Date.now();
    notify(sessionId);
    return tab;
  };

  const start = (sessionId) => {
    const state = ensureState(sessionId);
    const tab = activeTab(state);
    if (tab !== undefined && !tab.started) {
      tab.started = true;
      tab.updatedAt = Date.now();
    }
    return state;
  };

  const approve = async (sessionId) => {
    const state = ensureState(sessionId);
    const tab = activeTab(state);
    if (tab !== undefined) {
      tab.approved = true;
      tab.updatedAt = Date.now();
    }
    notify(sessionId);
    post(sessionId, 'The user marked the design as done. Designer mode stays on as a reference: you may now implement this design in the project with the normal tools.');
    return state;
  };

  let requestSeq = 0;

  const post = async (sessionId, text) => {
    const controller = ctx.get('sessionController');
    if (controller === undefined) throw new Error('designer: session controller unavailable');
    requestSeq += 1;
    const result = await controller.prompt({
      requestId: 'designer-' + Date.now() + '-' + requestSeq,
      sessionId,
      mode: 'steer',
      content: [{ type: 'text', text }],
    }, new AbortController().signal);
    return result;
  };

  const screenshot = async (sessionId, options = {}) => {
    const state = ensureState(sessionId);
    const tab = activeTab(state);
    const html = tab === undefined ? '' : tab.html;
    if (html === '') return { error: 'No design on the active tab yet. Publish one with designer_update first.' };

    const width = clamp(Number(options.width) || 900, 320, 2560);
    const height = clamp(Number(options.height) || 1600, 320, 3200);
    const tempDir = mkdtempSync(join(tmpdir(), 'designer-shot-'));
    const htmlPath = join(tempDir, 'design.html');
    writeFileSync(htmlPath, html, 'utf8');
    const outPath = typeof options.path === 'string' && options.path !== ''
      ? resolve(options.path)
      : join(tempDir, 'design.png');
    mkdirSync(dirname(outPath), { recursive: true });

    const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
    if (chrome === undefined) {
      return { error: 'No headless Chrome or Edge executable found. Set CHROME_PATH to one.' };
    }
    const sep = String.fromCharCode(92);
    const fileUrl = 'file:///' + htmlPath.split(sep).join('/');
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=' + width + ',' + height,
      '--screenshot=' + outPath,
      fileUrl,
    ];
    try {
      await execFileAsync(chrome, args, { timeout: 45000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
    } catch (error) {
      if (!existsSync(outPath)) {
        return { error: 'Screenshot failed: ' + String(error?.message ?? error) };
      }
    }
    if (!existsSync(outPath)) return { error: 'Screenshot produced no file.' };
    const bytes = readFileSync(outPath);
    const result = {
      path: outPath, width, height, bytes: bytes.length,
      tab: tab.id, revision: tab.revision,
    };
    if (bytes.length <= 400000) result.base64 = bytes.toString('base64');
    else result.note = 'PNG is too large to inline; open the path or use read_image.';
    return result;
  };


  /* ---------------------------------------------------------------- tools -- */

  ctx.effect(() => ctx.tools.register({
    name: 'designer_update',
    description:
      "Publish the complete current interface of the design canvas. In designer mode this is how you show work: send one self-contained HTML document (inline CSS, inline SVG, system fonts, no external network requests) and it renders live in the user's Designer tab immediately. Replace the whole document each time; the previous version is discarded.",
    parameters: {
      html: { type: 'string', required: true, description: 'The complete HTML document for the canvas.' },
      note: { type: 'string', description: 'One short line about what changed.' },
      tab: { type: 'string', description: 'Optional tab id. Targets an existing tab or creates a new one.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          revision: { type: 'number' },
          approved: { type: 'boolean' },
          tab: { type: 'string' },
        },
        required: ['revision', 'approved', 'tab'],
      },
      render: (_args, value) => [{
        type: 'text',
        text: 'Canvas updated (revision ' + value.revision + ', tab ' + value.tab + '). ' + (value.approved ? 'The user already approved the design; you may implement it now.' : 'Keep iterating on the canvas until the user marks the design done.'),
      }],
    },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_update needs a calling agent');
      const tab = writeCanvas(agent.session.id, String(args.html ?? ''), args.tab, args.note);
      return { revision: tab.revision, approved: tab.approved, tab: tab.id };
    },
  }), 'designer-mode: designer_update tool');

  ctx.effect(() => ctx.tools.register({
    name: 'designer_state',
    description: 'Read the current designer-mode state: tabs, active tab, revision, approval, and agent mode.',
    parameters: {},
    output: {
      schema: { type: 'object' },
    },
    async execute(_args, exec) {
      const agent = exec.agent;
      const state = agent === undefined ? undefined : stateOf(agent.session.id);
      if (state === undefined) return { started: false, approved: false, revision: 0, agentMode: false, tabs: [], active: { id: '', name: '' } };
      const tab = activeTab(state);
      return {
        started: tab.started,
        approved: tab.approved,
        revision: tab.revision,
        agentMode: tab.agentMode,
        active: { id: tab.id, name: tab.name },
        tabs: state.tabs.map((entry) => ({ id: entry.id, name: entry.name, revision: entry.revision, started: entry.started, approved: entry.approved, agentMode: entry.agentMode })),
      };
    },
  }), 'designer-mode: designer_state tool');

  ctx.effect(() => ctx.tools.register({
    name: 'designer_agent_begin',
    description: 'Create a new design tab in agent mode: unrestricted (no design-first gate) and pre-approved (no user approval needed). Use when the agent needs to design something on its own, e.g. a logo or UI element in isolation. Publish with designer_update, then capture with designer_screenshot.',
    parameters: { name: { type: 'string' } },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, name: { type: 'string' } },
        required: ['id', 'name'],
      },
    },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_agent_begin needs a calling agent');
      const tab = agentBegin(agent.session.id, typeof args.name === 'string' ? args.name : undefined);
      return { id: tab.id, name: tab.name };
    },
  }), 'designer-mode: designer_agent_begin tool');

  ctx.effect(() => ctx.tools.register({
    name: 'designer_screenshot',
    description: 'Headlessly render and screenshot the active design tab (or a named tab) to a PNG file. Returns the file path, dimensions, byte size, and base64 when small enough. Use it to verify a published design without any browser UI.',
    parameters: {
      width: { type: 'number' },
      height: { type: 'number' },
      path: { type: 'string' },
      tab: { type: 'string' },
    },
    output: { schema: { type: 'object' } },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_screenshot needs a calling agent');
      if (typeof args.tab === 'string' && args.tab !== '') {
        const state = ensureState(agent.session.id);
        if (tabById(state, args.tab) !== undefined) state.activeTabId = args.tab;
      }
      setActivity('screenshot', 'Capturing canvas');
      return screenshot(agent.session.id, args);
    },
  }), 'designer-mode: designer_screenshot tool');

  ctx.effect(() => ctx.tools.register({
    name: 'designer_animate',
    description: 'Test and measure UI animation smoothness headlessly using Chrome DevTools Protocol. Runs the active design (or supplied HTML) in headless Chrome, samples real requestAnimationFrame frame timings, and returns FPS, frame-time percentiles (p50/p95/p99), jank counts, and a 0-100 smoothness score. Use html to test an animation variant without publishing, or omit it to measure the current canvas. interaction is an optional JS snippet executed after warmup to trigger the animation.',
    parameters: {
      html: { type: 'string', description: 'Optional HTML to measure instead of the published canvas.' },
      tab: { type: 'string', description: 'Optional tab id whose canvas to measure.' },
      durationMs: { type: 'number', description: 'Measurement duration (200-20000, default 2000).' },
      warmupMs: { type: 'number', description: 'Warmup before sampling (default 0).' },
      width: { type: 'number' },
      height: { type: 'number' },
      interaction: { type: 'string', description: 'Optional JS to trigger the animation (eval in page).' },
      label: { type: 'string', description: 'Label for this measurement.' },
      save: { type: 'boolean', description: 'Save this score to the active tab state for the panel display.' },
    },
    output: { schema: { type: 'object' } },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_animate needs a calling agent');
      let html = typeof args.html === 'string' ? args.html : undefined;
      if (html === undefined) {
        const state = ensureState(agent.session.id);
        const tab = typeof args.tab === 'string' ? tabById(state, args.tab) : activeTab(state);
        html = tab === undefined ? '' : tab.html;
      }
      setActivity('animate', args.label || 'Measuring animation');
      const result = await measureAnimation({
        html,
        durationMs: args.durationMs,
        warmupMs: args.warmupMs,
        width: args.width,
        height: args.height,
        interaction: args.interaction,
        label: args.label,
      });
      if (result.error === undefined && args.save === true) {
        const state = ensureState(agent.session.id);
        state.animation = { score: result.score, verdict: result.verdict, fps: result.fps, p95Ms: result.p95Ms, label: result.label, updatedAt: Date.now() };
        notify(agent.session.id);
      }
      return result;
    },
  }), 'designer-mode: designer_animate tool');

  /* ------------------------------------------ headless control of UI features */

  const VIEW_RATIOS = ['fill', 'phone', 'portrait', 'square', 'landscape', 'tv', 'wide'];
  const VIEW_MODES = ['navigate', 'select', 'unselect'];

  ctx.effect(() => ctx.tools.register({
    name: 'designer_canvas',
    description: 'Control the canvas view headlessly: set the size ratio (fill/phone/portrait/square/landscape/tv/wide), the interaction mode (navigate/select/unselect), reload the frame, or clear the selected elements. This is the agent equivalent of the panel rail controls.',
    parameters: {
      ratio: { type: 'string', description: 'One of fill, phone, portrait, square, landscape, tv, wide.' },
      mode: { type: 'string', description: 'One of navigate, select, unselect.' },
      reload: { type: 'boolean', description: 'Reload the canvas frame (bumps its key).' },
      clearSelection: { type: 'boolean', description: 'Clear all selected element chips.' },
    },
    output: { schema: { type: 'object' } },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_canvas needs a calling agent');
      const state = ensureState(agent.session.id);
      const applied = {};
      if (typeof args.ratio === 'string' && VIEW_RATIOS.includes(args.ratio)) {
        state.ratio = args.ratio; applied.ratio = state.ratio;
      }
      if (typeof args.mode === 'string' && VIEW_MODES.includes(args.mode)) {
        state.mode = args.mode; applied.mode = state.mode;
      }
      if (args.reload === true) {
        state.reloadSeq = (state.reloadSeq ?? 0) + 1; applied.reloadSeq = state.reloadSeq;
      }
      if (args.clearSelection === true) {
        state.selected = [];
        state.selectionClearSeq = (state.selectionClearSeq ?? 0) + 1;
        applied.selectionClearSeq = state.selectionClearSeq;
      }
      notify(agent.session.id);
      return { ok: true, applied, view: publicState(state).view };
    },
  }), 'designer-mode: designer_canvas tool');

  ctx.effect(() => ctx.tools.register({
    name: 'designer_tab',
    description: 'Headlessly control design tabs: create, select, close, or rename a tab. Equivalent to the panel tab bar.',
    parameters: {
      action: { type: 'string', required: true, description: 'new | select | close | rename' },
      id: { type: 'string', description: 'Target tab id for select/close/rename.' },
      name: { type: 'string', description: 'Name for a new tab or rename.' },
    },
    output: { schema: { type: 'object' } },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_tab needs a calling agent');
      const state = ensureState(agent.session.id);
      const action = String(args.action ?? '');
      let target;
      if (action === 'new') {
        target = createTab(state, typeof args.name === 'string' ? args.name : undefined);
      } else if (action === 'select') {
        if (tabById(state, args.id) !== undefined) state.activeTabId = args.id;
      } else if (action === 'close') {
        if (state.tabs.length > 1) {
          const index = state.tabs.findIndex((tab) => tab.id === args.id);
          if (index >= 0) {
            state.tabs.splice(index, 1);
            if (state.activeTabId === args.id) state.activeTabId = state.tabs[Math.min(index, state.tabs.length - 1)].id;
          }
        }
      } else if (action === 'rename') {
        target = tabById(state, args.id);
        if (target !== undefined && typeof args.name === 'string' && args.name !== '') target.name = args.name;
      } else {
        return { ok: false, error: 'unknown action: ' + action };
      }
      notify(agent.session.id);
      return { ok: true, tab: target === undefined ? undefined : { id: target.id, name: target.name }, state: publicState(state) };
    },
  }), 'designer-mode: designer_tab tool');

  /* No design-first gate: agents are never restricted and can multitask. */

  /* ------------------------------------------------------- session guidance -- */

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'designer:canvas',
    order: 1010,
    text: (context) => {
      const agent = context.agent;
      if (agent === undefined) return '';
      const tab = activeTab(stateOf(agent.session.id));
      if (tab === undefined || !tab.started) return '';
      return [
        'DESIGNER MODE IS ON for this session (tab ' + tab.name + ', revision ' + tab.revision + ').',
        'You are UNRESTRICTED: there is no design-first gate and no user approval is required. You may freely work on other tasks, use all tools, or hand the design work to a subagent while you continue elsewhere.',
        'Designer tools:',
        '- designer_update(html, note?, tab?) publishes a complete self-contained HTML document to the canvas.',
        '- designer_state() reads tabs, active tab, revision, and view state.',
        '- designer_screenshot(width?, height?, path?, tab?) headlessly captures the canvas to a PNG.',
        '- designer_agent_begin(name?) creates a fresh isolated design tab.',
        '- designer_tab(action, id?, name?) with action new|select|close|rename controls tabs headlessly.',
        '- designer_canvas(ratio?, mode?, reload?, clearSelection?) controls the panel rail headlessly: ratios fill/phone/portrait/square/landscape/tv/wide, modes navigate/select/unselect.',
        'The user sees published HTML live in the Designer tab. In Select/Unselect modes their taps produce ordered element selections; change exactly those elements and republish the whole document.',
      ].join(String.fromCharCode(10));
    },
  }), 'designer-mode: canvas guidance');

  /* ------------------------------------------------------------- commands -- */

  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.effect(() => commandCtx.commands.register({
      name: 'designer',
      description: 'Enter or leave designer mode',
      input: { hint: '[off]' },
      handler: ({ agent, rawInput }) => {
        const arg = rawInput.trim();
        if (arg === 'off') {
          states.delete(agent.session.id);
          return { kind: 'success', text: 'Designer mode off.' };
        }
        start(agent.session.id);
        return { kind: 'success', text: 'Designer mode on. Ask for an interface; it renders live in the Designer tab of the right sidebar. Use /designer off to leave.' };
      },
    }), 'designer-mode: /designer command');
  });

  /* ------------------------------------------------------------------ web -- */

  const EMPTY_FRAME = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;font:14px/1.5 system-ui,sans-serif;color:#6b7280;display:flex;align-items:center;justify-content:center;background:#faf9f7}</style></head><body>No design yet.</body></html>';
  const renderFrame = (sessionId, tabId) => {
    const state = stateOf(sessionId);
    const tab = tabId === undefined || tabId === '' ? activeTab(state) : tabById(state, tabId);
    if (tab !== undefined && tab.html !== '') return tab.html;
    // Shared live canvas: the agent publishes into a different session than the
    // panel polls, so fall back to the one shared design on disk.
    const live = getLive();
    return live !== undefined && live.html !== '' ? live.html : EMPTY_FRAME;
  };

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: FRAME_PATH,
      handler: (req, res) => {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const sessionId = url.searchParams.get('session') ?? '';
        const html = renderFrame(sessionId, url.searchParams.get('tab') ?? undefined);
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-frame-options': 'SAMEORIGIN',
        });
        res.end(html);
      },
    }), 'designer-mode: canvas frame route');

    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: STATE_PATH,
      handler: async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const sessionId = url.searchParams.get('session') ?? '';
        const result = publicState(stateOf(sessionId));
        // Blend the shared live canvas so the panel always reflects the latest
        // agent publish, regardless of which session id it polls with.
        const live = getLive();
        if (live !== undefined && live.activity !== undefined) result.activity = live.activity;
        if (live !== undefined && live.label) result.liveLabel = live.label;
        if (live !== undefined && live.started && (result.empty || live.revision > (result.revision ?? 0))) {
          result.started = true;
          result.revision = live.revision;
          result.approved = live.approved;
          result.agentMode = live.agentMode;
          result.updatedAt = live.updatedAt;
          result.empty = false;
          if (result.active !== undefined) {
            result.active.revision = live.revision;
            result.active.started = true;
            result.active.approved = live.approved;
            result.active.empty = false;
          }
        }
        sendJson(res, 200, result);
      },
    }), 'designer-mode: state route');

    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: COMMAND_PATH,
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end();
          return;
        }
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch (error) {
          sendJson(res, 400, { ok: false, error: 'bad request: ' + String(error?.message ?? error) });
          return;
        }
        const sessionId = typeof payload.session === 'string' ? payload.session : '';
        const action = payload.action;
        try {
          const state = ensureState(sessionId);
          if (action === 'start') {
            sendJson(res, 200, { ok: true, state: publicState(start(sessionId)) });
            return;
          }
          if (action === 'done') {
            await approve(sessionId);
            sendJson(res, 200, { ok: true, state: publicState(stateOf(sessionId)) });
            return;
          }
          if (action === 'send') {
            const text = typeof payload.text === 'string' ? payload.text.trim() : '';
            if (text === '') {
              sendJson(res, 400, { ok: false, error: 'empty message' });
              return;
            }
            await post(sessionId, text);
            sendJson(res, 200, { ok: true });
            return;
          }
          if (action === 'tab-new') {
            createTab(state, typeof payload.name === 'string' ? payload.name : undefined);
            notify(sessionId);
            sendJson(res, 200, { ok: true, state: publicState(state) });
            return;
          }
          if (action === 'tab-select') {
            if (tabById(state, payload.id) !== undefined) {
              state.activeTabId = payload.id;
              notify(sessionId);
            }
            sendJson(res, 200, { ok: true, state: publicState(state) });
            return;
          }
          if (action === 'tab-close') {
            if (state.tabs.length > 1) {
              const index = state.tabs.findIndex((tab) => tab.id === payload.id);
              if (index >= 0) {
                state.tabs.splice(index, 1);
                if (state.activeTabId === payload.id) {
                  state.activeTabId = state.tabs[Math.min(index, state.tabs.length - 1)].id;
                }
                notify(sessionId);
              }
            }
            sendJson(res, 200, { ok: true, state: publicState(state) });
            return;
          }
          if (action === 'tab-rename') {
            const tab = tabById(state, payload.id);
            if (tab !== undefined && typeof payload.name === 'string' && payload.name !== '') {
              tab.name = payload.name;
              notify(sessionId);
            }
            sendJson(res, 200, { ok: true, state: publicState(state) });
            return;
          }
          if (action === 'agent-begin') {
            agentBegin(sessionId, typeof payload.name === 'string' ? payload.name : undefined);
            sendJson(res, 200, { ok: true, state: publicState(state) });
            return;
          }
          if (action === 'animate') {
            const tab = activeTab(state);
            const html = tab === undefined ? '' : tab.html;
            const result = await measureAnimation({
              html,
              durationMs: payload.durationMs,
              warmupMs: payload.warmupMs,
              width: payload.width,
              height: payload.height,
              interaction: payload.interaction,
              label: payload.label,
            });
            if (result.error === undefined) {
              state.animation = { score: result.score, verdict: result.verdict, fps: result.fps, p95Ms: result.p95Ms, label: result.label, updatedAt: Date.now() };
              notify(sessionId);
            }
            sendJson(res, 200, { ok: result.error === undefined, result, state: publicState(state) });
            return;
          }
          if (action === 'view-set') {
            if (typeof payload.ratio === 'string') state.ratio = payload.ratio;
            if (typeof payload.mode === 'string') state.mode = payload.mode;
            if (payload.reload === true) state.reloadSeq = (state.reloadSeq ?? 0) + 1;
            if (payload.clearSelection === true) {
              state.selected = [];
              state.selectionClearSeq = (state.selectionClearSeq ?? 0) + 1;
            }
            if (Array.isArray(payload.selected)) state.selected = payload.selected;
            notify(sessionId);
            sendJson(res, 200, { ok: true, state: publicState(state) });
            return;
          }
          sendJson(res, 400, { ok: false, error: 'unknown action: ' + String(action) });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
        }
      },
    }), 'designer-mode: command route');
  });

  ctx.effect(() => () => {
    states.clear();
    waiters.clear();
  }, 'designer-mode: state lifetime');
}
