window.__ModuleLoader__.load({
  id: '@local/designer-mode',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'designerMode';
    const TAB_ID = '@local/designer-mode';
    const TAB_KIND = 'designer';

    const zh = {
      'meta.title': '设计模式',
      'meta.description': '右侧栏中的实时界面画布：智能体持续生成并修改界面，直到你将设计标记为完成；支持多选与取消选择元素。',
      'tab.title': '设计',
      'guide.title': '设计模式',
      'guide.description': '实时界面画布，可多选元素进行修改',
      'more.open': '设计模式',
      'ui.start': '开始设计',
      'ui.starting': '正在启动…',
      'ui.done': '设计完成',
      'ui.approve': '标记设计完成',
      'ui.finished': '设计已通过，智能体现在可以在项目中实现它。',
      'ui.empty': '还没有设计。在下方描述你想要的界面。',
      'ui.ask': '这些元素要如何修改？',
      'ui.send': '发送',
      'ui.sending': '发送中…',
      'ui.hint': '描述一个改动，或要求下一个界面…',
      'ui.clear': '清空',
      'ui.reload': '重新载入画布',
      'ui.immersive': '全屏',
      'ui.immersiveExit': '退出全屏',
      'ui.statusLive': '实时',
      'ui.statusDone': '已通过',
      'ui.statusIdle': '未开始',
      'ui.offline': '无法获取设计状态',
      'ui.failed': '发送失败：{error}',
      'ui.modeNavigate': '浏览',
      'ui.modeSelect': '多选',
      'ui.modeUnselect': '取消',
      'ui.modeNavigateHint': '忽略点击',
      'ui.modeSelectHint': '点击加入',
      'ui.modeUnselectHint': '点击移除',
      'ui.selectedCount': '已选 {count}',
      'ui.remove': '移出选择',
      'ui.picked': '已选 {count}',
    };

    const en = {
      'meta.title': 'Designer Mode',
      'meta.description': 'A live UI canvas in the right sidebar: the agent builds and revises the interface until you mark the design done, with multi-select and unselect of elements.',
      'tab.title': 'Designer',
      'guide.title': 'Designer mode',
      'guide.description': 'Live UI canvas with multi-select element editing',
      'more.open': 'Designer mode',
      'ui.start': 'Start designing',
      'ui.starting': 'Starting…',
      'ui.done': 'Design done',
      'ui.approve': 'Mark design as done',
      'ui.finished': 'Design approved — the agent may now implement it in the project.',
      'ui.empty': 'No design yet. Describe the interface you want below.',
      'ui.ask': 'What should change about these elements?',
      'ui.send': 'Send',
      'ui.sending': 'Sending…',
      'ui.hint': 'Describe a change, or ask for the next screen…',
      'ui.clear': 'Clear',
      'ui.reload': 'Reload canvas',
      'ui.immersive': 'Full screen',
      'ui.immersiveExit': 'Exit full screen',
      'ui.statusLive': 'Live',
      'ui.statusDone': 'Approved',
      'ui.statusIdle': 'Not started',
      'ui.offline': 'Designer state unavailable',
      'ui.failed': 'Send failed: {error}',
      'ui.modeNavigate': 'Navigate',
      'ui.modeSelect': 'Select',
      'ui.modeUnselect': 'Unselect',
      'ui.modeNavigateHint': 'Ignore taps',
      'ui.modeSelectHint': 'Tap adds',
      'ui.modeUnselectHint': 'Tap removes',
      'ui.selectedCount': '{count} selected',
      'ui.remove': 'Remove from selection',
      'ui.picked': '{count} picked',
    };

    const ACCENT = '#c8732f';
    const SLATE = '#6b7f95';

    const css = [
      '[data-designer-panel] {',
      '  display: flex; flex-direction: column; height: 100%; min-height: 0;',
      '  background: #12110e; color: #f4f0e8;',
      "  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;",
      '  -webkit-font-smoothing: antialiased;',
      '}',
      '[data-designer-panel] [data-designer-bar] {',
      '  flex: none; display: flex; align-items: center; gap: 7px; padding: 6px 10px;',
      '  border-bottom: 1px solid #262420;',
      '}',
      '[data-designer-panel] [data-designer-dot] {',
      '  width: 7px; height: 7px; border-radius: 50%; flex: none; background: #6b665b;',
      '  transition: background .18s;',
      '}',
      '[data-designer-panel] [data-designer-dot][data-live] { background: #ff5a2e; }',
      '[data-designer-panel] [data-designer-dot][data-approved] { background: #2f8f5b; }',
      '[data-designer-panel] [data-designer-bar] button[data-primary][data-approved] {',
      '  background: #2f8f5b; border-color: #2f8f5b;',
      '}',
      '[data-designer-panel] [data-designer-spacer] { flex: 1; }',
      '[data-designer-panel] [data-designer-pill] {',
      '  flex: none; display: inline-flex; align-items: baseline; gap: 6px;',
      '  padding: 5px 10px; border: 1px solid #2e2b25; border-radius: 999px;',
      '  font-size: 10.5px; color: #a9a294; font-variant-numeric: tabular-nums; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-pill] b {',
      '  color: #f4f0e8; font-size: 13px; font-weight: 650;',
      '}',
      '[data-designer-panel] [data-designer-bar] button {',
      '  flex: none; height: 30px; padding: 0 10px; border-radius: 8px; cursor: pointer;',
      '  font: inherit; font-size: 11.5px; font-weight: 550;',
      '  border: 1px solid #2e2b25; background: transparent; color: #d9d3c6;',
      '  display: inline-flex; align-items: center; gap: 5px;',
      '}',
      '[data-designer-panel] [data-designer-bar] button:hover { border-color: #ff5a2e; color: #fff; }',
      '[data-designer-panel] [data-designer-bar] button[data-primary] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-bar] button[data-primary]:hover { background: #ff6b41; }',
      '[data-designer-panel] [data-designer-bar] button:disabled { opacity: .35; cursor: default; border-color: #2e2b25; }',
      '[data-designer-panel] [data-designer-bar] button[data-icon] { width: 30px; padding: 0; justify-content: center; }',
      '[data-designer-panel] [data-designer-canvas] {',
      '  flex: 1; min-height: 0; position: relative; overflow: auto; background: #0d0c0a;',
      '  display: flex; align-items: center; justify-content: center; padding: 16px;',
      '  background-image: radial-gradient(circle at 1px 1px, rgba(244,240,232,.07) 1px, transparent 0);',
      '  background-size: 22px 22px;',
      '}',
      '[data-designer-panel] [data-designer-canvas] iframe {',
      '  width: 100%; max-width: 344px; aspect-ratio: 9 / 16; max-height: 100%;',
      '  border: 0; border-radius: 14px; display: block; background: #f6f2e9;',
      '  box-shadow: 0 24px 60px -20px #000, 0 0 0 1px #2b2822;',
      '}',
      '[data-designer-panel] [data-designer-empty] {',
      '  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;',
      '  text-align: center; padding: 24px; font-size: 12px; color: #a9a294; background: #12110e;',
      '}',
      '[data-designer-panel] [data-designer-empty] p { margin: 0 0 12px; }',
      '[data-designer-panel] [data-designer-empty] button {',
      '  height: 32px; padding: 0 14px; border-radius: 8px; cursor: pointer;',
      '  font: inherit; font-size: 12px; font-weight: 600;',
      '  border: 1px solid #ff5a2e; background: #ff5a2e; color: #fff;',
      '}',
      '/* selection tray */',
      '[data-designer-panel] [data-designer-tray] {',
      '  flex: none; border-top: 1px solid #262420; background: #171612;',
      '}',
      '[data-designer-panel] [data-designer-chips] {',
      '  display: flex; gap: 7px; overflow-x: auto; padding: 0 16px 9px; scrollbar-width: none;',
      '}',
      '[data-designer-panel] [data-designer-chips]::-webkit-scrollbar { display: none; }',
      '[data-designer-panel] [data-designer-chip] {',
      '  flex: none; display: flex; align-items: center; gap: 7px; cursor: pointer;',
      '  background: #221f19; border: 1px solid #332f27; border-radius: 10px;',
      '  padding: 5px 8px 5px 6px; font: inherit; text-align: left; color: inherit;',
      '}',
      '[data-designer-panel] [data-designer-chip]:hover { border-color: #ff5a2e; }',
      '[data-designer-panel] [data-designer-chip] i {',
      '  flex: none; width: 17px; height: 17px; border-radius: 50%; background: #ff5a2e; color: #fff;',
      '  font-size: 9.5px; font-weight: 700; display: grid; place-items: center; font-style: normal;',
      '  font-variant-numeric: tabular-nums;',
      '}',
      '[data-designer-panel] [data-designer-chip] span {',
      '  font-size: 11.5px; color: #f0ece2; max-width: 150px;',
      '  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-chip] em {',
      '  flex: none; font-style: normal; font-size: 13px; line-height: 1; color: #8b8374;',
      '}',
      '/* prompt preview */',
      '/* composer */',
      '[data-designer-panel] [data-designer-composer] {',
      '  flex: none; display: flex; align-items: flex-end; gap: 8px; padding: 0 16px 10px;',
      '}',
      '[data-designer-panel] [data-designer-composer] textarea {',
      '  flex: 1; min-width: 0; min-height: 38px; max-height: 120px; resize: none;',
      '  font: inherit; font-size: 12.5px; line-height: 1.45; padding: 9px 11px;',
      '  border-radius: 10px; border: 1px solid #2e2b25; background: #0d0c0a; color: #f4f0e8; outline: none;',
      '}',
      '[data-designer-panel] [data-designer-composer] textarea::placeholder { color: #6b665b; }',
      '[data-designer-panel] [data-designer-composer] textarea:focus { border-color: #ff5a2e; }',
      '[data-designer-panel] [data-designer-composer] button {',
      '  flex: none; height: 38px; padding: 0 14px; border-radius: 9px; cursor: pointer;',
      '  font: inherit; font-size: 12.5px; font-weight: 600;',
      '  border: 1px solid #2e2b25; background: transparent; color: #d9d3c6;',
      '}',
      '[data-designer-panel] [data-designer-composer] button[data-primary] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-composer] button:disabled { opacity: .35; cursor: default; border-color: #2e2b25; }',
      '/* thumb-zone mode bar */',
      '[data-designer-panel] [data-designer-modes] {',
      '  flex: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;',
      '  margin: 0 12px 12px; padding: 4px; background: #0d0c0a;',
      '  border: 1px solid #2a2721; border-radius: 13px;',
      '}',
      '[data-designer-panel] [data-designer-modes] button {',
      '  appearance: none; border: 0; background: transparent; color: #a39c8d; font: inherit;',
      '  min-height: 50px; height: auto; padding: 0; border-radius: 10px; cursor: pointer;',
      '  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;',
      '  transition: background .14s, color .14s;',
      '}',
      '[data-designer-panel] [data-designer-modes] button:hover { background: transparent; color: #f4f0e8; }',
      '[data-designer-panel] [data-designer-mode-top] {',
      '  display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;',
      '}',
      '[data-designer-panel] [data-designer-mode-top] svg { width: 14px; height: 14px; flex: none; }',
      '[data-designer-panel] [data-designer-modes] button small {',
      '  font-size: 8.5px; font-weight: 500; letter-spacing: .07em; text-transform: uppercase;',
      '  opacity: .65; line-height: 1.25; text-align: center;',
      '}',
      '[data-designer-panel] [data-designer-modes] button[aria-pressed="true"][data-mode="navigate"] {',
      '  background: #f4f0e8; color: #12110e;',
      '}',
      '[data-designer-panel] [data-designer-modes] button[aria-pressed="true"][data-mode="select"] {',
      '  background: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-modes] button[aria-pressed="true"][data-mode="unselect"] {',
      '  background: #6b7f95; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-modes] button[aria-pressed="true"] small { opacity: .7; color: inherit; }',
      /* Immersive: collapse the shell's tab strip for this panel so the canvas
       * owns the screen. Scoped to the panel's own pane, and only while the
       * flag is set by the toggle in this bar. */
      'html[data-designer-immersive] [data-dockkit-strip] {',
      '  display: none !important;',
      '}',
      'html[data-designer-immersive] [data-dockkit-pane] {',
      '  border-radius: 0 !important;',
      '}',
      '[data-designer-panel] [data-designer-bar] button[aria-pressed="true"][data-icon] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-error] {',
      '  flex: none; padding: 0 16px 9px; font-size: 11px; color: #ff8a65;',
      '}',
      /* single chips row; only rendered when something is selected */
      '[data-designer-panel] [data-designer-tray] {',
      '  flex: none; display: flex; align-items: center; gap: 8px; padding: 5px 10px;',
      '  border-top: 1px solid #262420; background: #171612;',
      '}',
      '[data-designer-panel] [data-designer-clear] {',
      '  flex: none; height: 24px; padding: 0 9px; border-radius: 7px; cursor: pointer;',
      '  border: 1px solid #2e2b25; background: transparent; color: #d9d3c6;',
      '  font: inherit; font-size: 10px; font-weight: 550; letter-spacing: .05em; text-transform: uppercase;',
      '}',
      '[data-designer-panel] [data-designer-clear]:hover { border-color: #ff5a2e; color: #fff; }',
    ].join('\n');

    const stateUrl = (sessionId) => `/designer-mode/state?session=${encodeURIComponent(sessionId)}`;
    const frameUrl = (sessionId, revision) => `/designer-mode/frame?session=${encodeURIComponent(sessionId)}&r=${revision}`;

    /** POST one designer command; resolves the parsed body even on failure. */
    async function command(sessionId, action, extra) {
      const response = await fetch('/designer-mode/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session: sessionId, action, ...extra }),
      });
      let body;
      try {
        body = await response.json();
      } catch (error) {
        body = { ok: false, error: `HTTP ${response.status}` };
      }
      return body;
    }

    /** Poll one session's design state until unmount. */
    function useDesignState(sessionId) {
      const [state, setState] = React.useState({ started: false, approved: false, revision: 0, empty: true, loaded: false });
      React.useEffect(() => {
        let alive = true;
        const tick = async () => {
          try {
            const response = await fetch(stateUrl(sessionId), { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const next = await response.json();
            if (alive) setState({ ...next, loaded: true });
          } catch (error) {
            if (alive) setState((current) => ({ ...current, loaded: true, offline: true }));
          }
        };
        tick();
        const timer = window.setInterval(tick, 1500);
        return () => {
          alive = false;
          window.clearInterval(timer);
        };
      }, [sessionId]);
      return state;
    }

    const ReloadIcon = () => h('svg', {
      viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': true, fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
    }, h('path', { d: 'M13.5 8a5.5 5.5 0 1 1-1.9-4.2' }), h('path', { d: 'M13.6 1.9v3.4h-3.4' }));

    const ImmersiveIcon = () => h('svg', {
      viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
    }, h('path', { d: 'M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4' }));

    const CheckIcon = () => h('svg', {
      viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': true, fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
    }, h('path', { d: 'M2.5 8.5l3.5 3.5 7.5-8' }));

    /** A short, human name for a selected element (chip label). */
    function nameOf(element) {
      const text = (element.text ?? '').trim();
      if (text !== '') return text.length > 28 ? `${text.slice(0, 28)}…` : text;
      return element.selector.split(' > ').pop() ?? element.selector;
    }

    /** Compose the chat message that carries an ordered canvas selection to the agent. */
    function describeSelection(selected, request) {
      const count = selected.length;
      const lines = [count === 1
        ? 'Designer canvas: change this element.'
        : `Designer canvas: change these ${count} selected elements. They are listed in the order the user picked them.`];
      selected.forEach((element, index) => {
        if (count > 1) lines.push('');
        if (count > 1) lines.push(`${index + 1}. ${element.selector}`);
        else lines.push(`- selector: ${element.selector}`);
        const pad = count > 1 ? '   ' : '- ';
        if (count > 1) {
          if (element.text) lines.push(`${pad}text: ${JSON.stringify(element.text)}`);
          if (element.box) lines.push(`${pad}box: ${element.box.w}x${element.box.h} at ${element.box.x},${element.box.y}`);
          if (element.styles) {
            const s = element.styles;
            lines.push(`${pad}styles: color ${s.color}; background ${s.background}; font ${s.size} ${s.weight} ${s.font}; radius ${s.radius}; padding ${s.padding}; display ${s.display}`);
          }
        } else {
          if (element.text) lines.push(`- text: ${JSON.stringify(element.text)}`);
          if (element.box) lines.push(`- box: ${element.box.w}x${element.box.h} at ${element.box.x},${element.box.y}`);
          if (element.styles) {
            const s = element.styles;
            lines.push(`- styles: color ${s.color}; background ${s.background}; font ${s.size} ${s.weight} ${s.font}; radius ${s.radius}; padding ${s.padding}; display ${s.display}`);
          }
        }
      });
      const asked = request.trim();
      lines.push('');
      lines.push(asked === ''
        ? 'Make these elements better: adjust their spacing, type, and color to fit the surrounding design.'
        : asked);
      lines.push('');
      lines.push('Reply by calling designer_update with the complete revised HTML document.');
      return lines.join('\n');
    }

    /**
     * Canvas interaction, driven from the panel through the frame's own document.
     * The frame is same-origin (sandbox allow-same-origin), so attaching
     * listeners and painting overlays here needs no script inside the canvas and
     * no host-side reload.
     */
    function createWiring(doc, options) {
      const WS = /[ \t\r\n]+/;
      const WS_G = /[ \t\r\n]+/g;
      const registry = new Map();
      const ids = new WeakMap();
      const layers = new Map();
      let seq = 0;

      const hoverBox = doc.createElement('div');
      hoverBox.setAttribute('data-designer-outline', '');
      hoverBox.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px dashed #c8732f;border-radius:3px;background:rgba(200,115,47,0.06);display:none';
      doc.documentElement.appendChild(hoverBox);

      const hoverTag = doc.createElement('div');
      hoverTag.setAttribute('data-designer-label', '');
      hoverTag.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;font:11px/1.3 ui-monospace,monospace;background:#c8732f;color:#fff;padding:2px 6px;border-radius:3px;display:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      doc.documentElement.appendChild(hoverTag);

      function eidOf(el) {
        let id = ids.get(el);
        if (id === undefined) {
          seq += 1;
          id = 'e' + seq;
          ids.set(el, id);
          registry.set(id, el);
        }
        return id;
      }

      function describe(el) {
        if (!el || el.nodeType !== 1) return null;
        const path = [];
        let node = el;
        while (node && node.nodeType === 1 && path.length < 5) {
          let part = node.tagName.toLowerCase();
          if (node.id) part += '#' + node.id;
          else if (typeof node.className === 'string' && node.className.trim() !== '') part += '.' + node.className.trim().split(WS).slice(0, 2).join('.');
          path.unshift(part);
          node = node.parentElement;
        }
        const text = (el.innerText || el.textContent || '').trim().replace(WS_G, ' ').slice(0, 120);
        const rect = el.getBoundingClientRect();
        const s = doc.defaultView.getComputedStyle(el);
        return {
          selector: path.join(' > '),
          tag: el.tagName.toLowerCase(),
          text: text,
          box: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          styles: {
            color: s.color, background: s.backgroundColor, font: s.fontFamily, size: s.fontSize,
            weight: s.fontWeight, radius: s.borderRadius, padding: s.padding, margin: s.margin, display: s.display,
          },
        };
      }

      function isOverlay(el) {
        return el.hasAttribute('data-designer-outline')
          || el.hasAttribute('data-designer-label')
          || el.hasAttribute('data-designer-selection');
      }

      function interactive(target) {
        if (options.getMode() === 'navigate') return null;
        if (!target || target.nodeType !== 1) return null;
        if (isOverlay(target)) return null;
        if (target === doc.documentElement || target === doc.body) return null;
        return target;
      }

      function paintHover(el) {
        if (options.getMode() === 'navigate' || !el) {
          hoverBox.style.display = 'none';
          hoverTag.style.display = 'none';
          return;
        }
        const r = el.getBoundingClientRect();
        const tint = options.getMode() === 'unselect' ? '#6b7f95' : '#c8732f';
        hoverBox.style.display = 'block';
        hoverBox.style.left = r.x + 'px';
        hoverBox.style.top = r.y + 'px';
        hoverBox.style.width = r.width + 'px';
        hoverBox.style.height = r.height + 'px';
        hoverBox.style.borderColor = tint;
        const info = describe(el);
        hoverTag.style.display = 'block';
        hoverTag.textContent = info ? info.selector : '';
        hoverTag.style.background = tint;
        hoverTag.style.left = Math.max(4, r.x) + 'px';
        hoverTag.style.top = Math.max(4, r.y - 20) + 'px';
      }

      function paint() {
        const selected = options.getSelected();
        const seen = new Set();
        selected.forEach((entry, order) => {
          const el = registry.get(entry.id);
          if (el === undefined || !el.isConnected) return;
          seen.add(entry.id);
          let layer = layers.get(entry.id);
          if (layer === undefined) {
            layer = doc.createElement('div');
            layer.setAttribute('data-designer-selection', '');
            layer.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483645;border:2px solid #c8732f;border-radius:3px;background:rgba(200,115,47,0.10)';
            doc.documentElement.appendChild(layer);
            layers.set(entry.id, layer);
          }
          const r = el.getBoundingClientRect();
          layer.style.left = r.x + 'px';
          layer.style.top = r.y + 'px';
          layer.style.width = r.width + 'px';
          layer.style.height = r.height + 'px';
          layer.style.display = 'block';
          let badge = layer.firstChild;
          if (badge === null) {
            badge = doc.createElement('span');
            badge.style.cssText = 'position:absolute;top:-9px;left:-9px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#c8732f;color:#fff;font:700 10px/17px ui-monospace,monospace;text-align:center;box-shadow:0 0 0 2px #fff';
            layer.appendChild(badge);
          }
          badge.textContent = String(order + 1);
        });
        layers.forEach((layer, id) => {
          if (!seen.has(id)) {
            layer.remove();
            layers.delete(id);
          }
        });
        if (options.getMode() === 'navigate') paintHover(null);
      }

      let hovered = null;
      const onMove = (event) => {
        const el = interactive(event.target);
        if (el === null) {
          /* Navigate mode, overlays and the page root have no hover target:
           * clear any outline left from select/unselect instead of keeping it. */
          if (hovered !== null) {
            hovered = null;
            paintHover(null);
          }
          return;
        }
        if (el === hovered) return;
        hovered = el;
        paintHover(el);
      };
      const onLeave = () => {
        hovered = null;
        paintHover(null);
      };
      const onClick = (event) => {
        if (options.getMode() === 'navigate') return;
        const el = interactive(event.target);
        if (el === null) return;
        event.preventDefault();
        event.stopPropagation();
        const info = describe(el);
        if (info === null) return;
        paintHover(el);
        options.onTap(info, eidOf(el), options.getMode());
      };
      const onSubmit = (event) => {
        if (options.getMode() !== 'navigate') event.preventDefault();
      };

      doc.addEventListener('mousemove', onMove, true);
      doc.addEventListener('mouseleave', onLeave, true);
      doc.addEventListener('click', onClick, true);
      doc.addEventListener('submit', onSubmit, true);
      doc.addEventListener('scroll', paint, true);

      return {
        paint,
        detach() {
          doc.removeEventListener('mousemove', onMove, true);
          doc.removeEventListener('mouseleave', onLeave, true);
          doc.removeEventListener('click', onClick, true);
          doc.removeEventListener('submit', onSubmit, true);
          doc.removeEventListener('scroll', paint, true);
          hoverBox.remove();
          hoverTag.remove();
          layers.forEach((layer) => layer.remove());
          layers.clear();
        },
      };
    }

    function DesignerPanel({ sessionId, t }) {
      const state = useDesignState(sessionId);
      const [mode, setMode] = React.useState('select');
      const [selected, setSelected] = React.useState([]);
      const [draft, setDraft] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [frameKey, setFrameKey] = React.useState(0);
      const [immersive, setImmersive] = React.useState(false);
      const frameRef = React.useRef(null);
      const editorRef = React.useRef(null);
      const selectedRef = React.useRef(selected);
      selectedRef.current = selected;
      const modeRef = React.useRef(mode);
      modeRef.current = mode;

      /** Live canvas wiring for the current frame document (same-origin). */
      const wiringRef = React.useRef(null);

      /** Re-attach to the frame document and repaint from current state. */
      const attach = React.useCallback(() => {
        const frame = frameRef.current;
        const doc = frame ? frame.contentDocument : null;
        if (wiringRef.current !== null) {
          wiringRef.current.detach();
          wiringRef.current = null;
        }
        if (!doc || doc.readyState !== 'complete' || doc.body === null) return;
        wiringRef.current = createWiring(doc, {
          getMode: () => modeRef.current,
          getSelected: () => selectedRef.current.map((element, order) => ({ id: element.id, order })),
          onTap: (element, id, tappedMode) => {
            setError('');
            setSelected((current) => {
              const at = current.findIndex((entry) => entry.id === id);
              if (tappedMode === 'unselect') {
                if (at < 0) return current;
                return current.filter((entry) => entry.id !== id);
              }
              if (at > -1) return current;
              return [...current, { ...element, id }];
            });
            if (tappedMode !== 'unselect') window.setTimeout(() => editorRef.current?.focus(), 0);
          },
        });
        wiringRef.current.paint();
      }, []);

      /* Immersive: flag the product root so the panel's own tab strip can
       * collapse and give the canvas the whole screen. Reversible, and the
       * toggle that set it lives in this bar, so there is always a way back. */
      React.useEffect(() => {
        const root = document.documentElement;
        if (immersive) root.setAttribute('data-designer-immersive', '');
        else root.removeAttribute('data-designer-immersive');
        return () => root.removeAttribute('data-designer-immersive');
      }, [immersive]);

      /* Mode or selection changed: repaint the frame overlays. */
      React.useEffect(() => {
        wiringRef.current?.paint();
      }, [mode, selected]);

      /* Detach when the panel unmounts. */
      React.useEffect(() => () => {
        if (wiringRef.current !== null) {
          wiringRef.current.detach();
          wiringRef.current = null;
        }
      }, []);

      /* A new revision is a new document: element ids restart, so drop the selection. */
      React.useEffect(() => {
        setSelected([]);
      }, [state.revision]);

      const status = state.approved ? 'approved' : state.started ? 'live' : 'idle';
      const statusLabel = state.approved ? t('ui.statusDone') : state.started ? t('ui.statusLive') : t('ui.statusIdle');

      const start = async () => {
        setBusy(true);
        try {
          await command(sessionId, 'start');
        } finally {
          setBusy(false);
        }
      };

      const approve = async () => {
        setBusy(true);
        setError('');
        try {
          const result = await command(sessionId, 'done');
          if (!result.ok) setError(String(result.error ?? 'failed'));
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setBusy(false);
        }
      };

      const send = async () => {
        const text = draft.trim();
        if (selected.length === 0 && text === '') return;
        setBusy(true);
        setError('');
        const message = selected.length === 0
          ? text
          : describeSelection(selected, text);
        try {
          const result = await command(sessionId, 'send', { text: message });
          if (!result.ok) setError(t('ui.failed').replace('{error}', String(result.error ?? 'failed')));
          else {
            setDraft('');
            setSelected([]);
          }
        } catch (cause) {
          setError(t('ui.failed').replace('{error}', String(cause?.message ?? cause)));
        } finally {
          setBusy(false);
        }
      };

      const onKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          void send();
        }
      };

      const ICONS = {
        navigate: h('svg', { viewBox: '0 0 24 24', width: 14, height: 14, fill: 'currentColor', 'aria-hidden': true },
          h('path', { d: 'M5.5 2.6l13.6 6.9-5.9 1.6-1.6 5.9z' })),
        select: h('svg', { viewBox: '0 0 24 24', width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', 'aria-hidden': true },
          h('path', { d: 'M12 5.5v13M5.5 12h13' })),
        unselect: h('svg', { viewBox: '0 0 24 24', width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', 'aria-hidden': true },
          h('path', { d: 'M5.5 12h13' })),
      };

      const modeButton = (id, label, hint) => h('button', {
        type: 'button',
        'data-mode': id,
        'aria-pressed': mode === id ? 'true' : 'false',
        title: hint,
        onClick: () => setMode(id),
      }, h('span', { 'data-designer-mode-top': '' }, ICONS[id], label), h('small', null, hint));

      const toolbar = h('div', { 'data-designer-bar': '' },
        h('i', {
          'data-designer-dot': '',
          title: statusLabel,
          'aria-label': statusLabel,
          'data-live': status === 'live' ? '' : undefined,
          'data-approved': status === 'approved' ? '' : undefined,
        }),
        h('span', { 'data-designer-spacer': '' }),
        h('span', { 'data-designer-pill': '', title: statusLabel },
          h('b', null, String(selected.length)),
          t('ui.picked').replace('{count}', '').trim() || 'picked'),
        h('button', {
          type: 'button',
          'data-icon': '',
          'aria-pressed': immersive ? 'true' : 'false',
          title: immersive ? t('ui.immersiveExit') : t('ui.immersive'),
          'aria-label': immersive ? t('ui.immersiveExit') : t('ui.immersive'),
          onClick: () => setImmersive((value) => !value),
        }, h(ImmersiveIcon)),
        h('button', {
          type: 'button',
          'data-icon': '',
          title: t('ui.reload'),
          'aria-label': t('ui.reload'),
          onClick: () => setFrameKey((value) => value + 1),
        }, h(ReloadIcon)),
        state.approved
          ? null
          : h('button', {
            type: 'button',
            'data-primary': '',
            'data-icon': '',
            'data-approved': state.approved ? '' : undefined,
            disabled: busy || !state.started,
            title: t('ui.approve'),
            'aria-label': t('ui.approve'),
            onClick: () => void approve(),
          }, h(CheckIcon)));

      const canvas = h('div', { 'data-designer-canvas': '' },
        h('iframe', {
          key: `${state.revision}:${frameKey}`,
          ref: frameRef,
          src: frameUrl(sessionId, `${state.revision}-${frameKey}`),
          title: t('tab.title'),
          sandbox: 'allow-scripts allow-same-origin allow-forms',
          onLoad: attach,
        }),
        state.loaded && !state.started
          ? h('div', { 'data-designer-empty': '' },
            h('div', null,
              h('p', { style: { margin: '0 0 12px' } }, t('ui.empty')),
              h('button', { type: 'button', 'data-primary': '', disabled: busy, onClick: () => void start() }, busy ? t('ui.starting') : t('ui.start'))))
          : null);

      const removeAt = (id) => {
        setSelected((current) => current.filter((element) => element.id !== id));
      };

      /* One chips row, and it only exists when something is picked — an empty
       * tray costs vertical space on a phone for no information. */
      const tray = selected.length === 0
        ? null
        : h('div', { 'data-designer-tray': '' },
          h('div', { 'data-designer-chips': '' },
            selected.map((element, index) => h('button', {
              key: element.id,
              type: 'button',
              'data-designer-chip': '',
              title: `${t('ui.remove')}: ${element.selector}`,
              onClick: () => removeAt(element.id),
            },
            h('i', null, String(index + 1)),
            h('span', null, nameOf(element)),
            h('em', null, '×')))),
          h('button', {
            type: 'button',
            'data-designer-clear': '',
            onClick: () => setSelected([]),
          }, t('ui.clear')));

      const composer = h('div', { 'data-designer-composer': '' },
        h('textarea', {
          ref: editorRef,
          value: draft,
          rows: 1,
          placeholder: selected.length > 0 ? t('ui.ask') : t('ui.hint'),
          onChange: (event) => setDraft(event.target.value),
          onKeyDown,
        }),
        h('button', {
          type: 'button',
          'data-primary': '',
          disabled: busy || (draft.trim() === '' && selected.length === 0),
          onClick: () => void send(),
        }, busy ? t('ui.sending') : t('ui.send')));

      /* Thumb-zone mode bar: the primary control, kept last in the panel. */
      const modeBar = h('div', { 'data-designer-modes': '', role: 'group', 'aria-label': 'Interaction mode' },
        modeButton('navigate', t('ui.modeNavigate'), t('ui.modeNavigateHint')),
        modeButton('select', t('ui.modeSelect'), t('ui.modeSelectHint')),
        modeButton('unselect', t('ui.modeUnselect'), t('ui.modeUnselectHint')));

      return h('div', { 'data-designer-panel': '', 'data-designer-status-value': status, 'data-designer-mode': mode },
        toolbar,
        canvas,
        tray,
        composer,
        modeBar,
        error === '' ? null : h('div', { 'data-designer-error': '' }, error));
    }

    /** The Designer tab chip: the name plus a live dot. */
    function DesignerTitle({ useTabInfo, t }) {
      const info = useTabInfo();
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
        h('i', { 'data-designer-dot': '' }),
        t('tab.title'));
    }

    /** The More-menu row under the right sidebar's More card. */
    function DesignerMoreRow({ entries, onOpen, onDismiss, t }) {
      return h('button', {
        type: 'button',
        style: {
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
          font: 'inherit', fontSize: 12, textAlign: 'left', background: 'transparent',
          border: 0, borderRadius: 6, color: 'inherit', cursor: 'pointer',
        },
        onClick: () => {
          onOpen(TAB_KIND);
          onDismiss();
        },
      }, h(CheckIcon), t('more.open'));
    }

    return {
      inject: ['slots', 'locale', 'sidebarRight', 'sidebarRightTabs'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'designer-mode: dictionaries');

        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = '@local/designer-mode';
          tag.textContent = css;
          document.head.appendChild(tag);
          return () => tag.remove();
        }, 'designer-mode: stylesheet');

        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: TAB_ID,
          kind: TAB_KIND,
          priority: 'extension',
          keepMounted: true,
          title: () => ctx.locale.bind(NS)('tab.title'),
          guide: [{
            id: 'designer',
            order: 12,
            title: () => ctx.locale.bind(NS)('guide.title'),
            description: () => ctx.locale.bind(NS)('guide.description'),
          }],
        }), 'designer-mode: tab type');

        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          locale: NS,
        }, DesignerPanel));

        ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: TAB_ID,
          locale: NS,
        }, DesignerTitle));

        ctx.slots.inject('sidebar.right.tab.guide.actions', () => ctx.slots.register({
          name: 'sidebar.right.tab.guide.actions',
          id: 'designer-mode',
          order: 5,
          locale: NS,
        }, DesignerMoreRow));
      },
    };
  },
});
