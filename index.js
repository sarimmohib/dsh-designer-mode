/**
 * Designer mode — Host half.
 *
 * Owns the per-session design state (the live HTML canvas), the agent tools that
 * publish it, the rule that keeps the agent generating interfaces until the user
 * marks the design done, and the small HTTP surface the Designer tab uses to
 * render the canvas, mark the design done, and forward a message into the chat.
 */

/** Tools a session may keep using while a design is still under revision. */
const ALLOWED_WHILE_DESIGNING = new Set([
  'designer_update',
  'designer_state',
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

/** One session's design state. */
function blankState() {
  return {
    html: '',
    revision: 0,
    started: false,
    approved: false,
    updatedAt: 0,
  };
}

function publicState(state) {
  if (state === undefined) return { started: false, approved: false, revision: 0, updatedAt: 0, empty: true };
  return {
    started: state.started,
    approved: state.approved,
    revision: state.revision,
    updatedAt: state.updatedAt,
    empty: state.html === '',
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

  const writeCanvas = (sessionId, html) => {
    const state = ensureState(sessionId);
    state.html = html;
    state.revision += 1;
    state.started = true;
    state.updatedAt = Date.now();
    notify(sessionId);
    return state;
  };

  const approve = async (sessionId) => {
    const state = ensureState(sessionId);
    state.approved = true;
    state.updatedAt = Date.now();
    notify(sessionId);
    post(sessionId, 'The user marked the design as done. Designer mode stays on as a reference: you may now implement this design in the project with the normal tools.');
    return state;
  };

  const start = (sessionId) => {
    const state = ensureState(sessionId);
    if (!state.started) {
      state.started = true;
      state.updatedAt = Date.now();
    }
    return state;
  };

  let requestSeq = 0;

  /**
   * Deliver one message into a session through the Session Controller gateway,
   * which records it with the durable `user` source the chat renders like any
   * other typed message. `mode: 'steer'` lands it in the running turn.
   */
  const post = async (sessionId, text) => {
    const controller = ctx.get('sessionController');
    if (controller === undefined) throw new Error('designer: session controller unavailable');
    requestSeq += 1;
    const result = await controller.prompt({
      requestId: `designer-${Date.now()}-${requestSeq}`,
      sessionId,
      mode: 'steer',
      content: [{ type: 'text', text }],
    }, new AbortController().signal);
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
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          revision: { type: 'number', description: 'Canvas revision after this update.' },
          approved: { type: 'boolean', description: 'Whether the user already approved the design.' },
        },
        required: ['revision', 'approved'],
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Canvas updated (revision ${value.revision}). ${value.approved ? 'The user already approved the design; you may implement it now.' : 'Keep iterating on the canvas until the user marks the design done.'}`,
      }],
    },
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === undefined) throw new Error('designer_update needs a calling agent');
      const state = writeCanvas(agent.session.id, String(args.html ?? ''));
      return { revision: state.revision, approved: state.approved };
    },
  }), 'designer-mode: designer_update tool');

  ctx.effect(() => ctx.tools.register({
    name: 'designer_state',
    description: 'Read the current designer-mode state of this session: whether a canvas exists, its revision, and whether the user approved the design.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          started: { type: 'boolean', description: 'A canvas has been published.' },
          approved: { type: 'boolean', description: 'The user marked the design done.' },
          revision: { type: 'number', description: 'Current canvas revision.' },
        },
        required: ['started', 'approved', 'revision'],
      },
      render: (_args, value) => [{
        type: 'text',
        text: `designer: ${value.started ? `canvas at revision ${value.revision}` : 'no canvas yet'}; ${value.approved ? 'approved' : 'not approved'}.`,
      }],
    },
    async execute(_args, exec) {
      const agent = exec.agent;
      const state = agent === undefined ? undefined : stateOf(agent.session.id);
      return {
        started: state?.started === true,
        approved: state?.approved === true,
        revision: state?.revision ?? 0,
      };
    },
  }), 'designer-mode: designer_state tool');

  /* ------------------------------------------------------- design-first rule -- */

  ctx.on('tools/pre-execute', async (exec, next) => {
    const decision = await next();
    if (decision.kind !== 'allow') return decision;
    const agent = exec.agent;
    if (agent === undefined) return decision;
    const state = stateOf(agent.session.id);
    if (state === undefined || !state.started || state.approved) return decision;
    if (ALLOWED_WHILE_DESIGNING.has(exec.name)) return decision;
    return {
      kind: 'deny',
      reason: `Designer mode is on and the user has not marked the design done, so only the canvas may change. Publish the interface with designer_update and revise it until the user approves; project and system tools stay locked until then. (${exec.name} denied)`,
    };
  });

  /* ------------------------------------------------------- session guidance -- */

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'designer:canvas',
    order: 1010,
    text: (context) => {
      const agent = context.agent;
      if (agent === undefined) return '';
      const state = stateOf(agent.session.id);
      if (state === undefined || !state.started) return '';
      if (state.approved) {
        return 'Designer mode: the user approved the canvas design. Implement it in the project normally; designer_update still replaces the canvas when the user asks for design changes.';
      }
      return [
        'DESIGNER MODE IS ON for this session.',
        `The live canvas is at revision ${state.revision}.`,
        'Rules while designer mode is on:',
        '1. Your job is the interface itself: call designer_update with one complete, self-contained HTML document (inline CSS and SVG, system fonts, no external assets) for every visual change. The user sees it render live in the Designer tab.',
        '2. Do not write, edit, run, or delegate project work; those tools are denied until the user marks the design done. Read-only tools are fine.',
        '3. The user selects elements on the canvas in three modes: Navigate (taps ignored), Select (each tap adds that element), and Unselect (each tap removes it). Their message lists every selected element in the order they picked it — change exactly those elements and republish the whole document.',
        '4. Keep iterating on the canvas until the user marks the design as done. Only then implement it in the project.',
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
        return {
          kind: 'success',
          text: 'Designer mode on. Ask for an interface; it renders live in the Designer tab of the right sidebar. Use /designer off to leave.',
        };
      },
    }), 'designer-mode: /designer command');
  });

  /* ------------------------------------------------------------------ web -- */

  const renderFrame = (sessionId) => {
    const state = stateOf(sessionId);
    const body = state === undefined || state.html === ''
      ? '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;font:14px/1.5 system-ui,sans-serif;color:#6b7280;display:flex;align-items:center;justify-content:center;background:#faf9f7}</style></head><body>No design yet.</body></html>'
      : state.html;
    /* Interaction lives in the panel (same-origin contentDocument wiring).
     * Injecting a second script here would double-handle every tap. */
    return body;
  };

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: FRAME_PATH,
      handler: (req, res) => {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const sessionId = url.searchParams.get('session') ?? '';
        const html = renderFrame(sessionId);
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
        sendJson(res, 200, publicState(stateOf(sessionId)));
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
          sendJson(res, 400, { ok: false, error: `bad request: ${String(error?.message ?? error)}` });
          return;
        }
        const sessionId = typeof payload.session === 'string' ? payload.session : '';
        const action = payload.action;
        try {
          if (action === 'start') {
            start(sessionId);
            sendJson(res, 200, { ok: true, state: publicState(stateOf(sessionId)) });
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
          sendJson(res, 400, { ok: false, error: `unknown action: ${String(action)}` });
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
