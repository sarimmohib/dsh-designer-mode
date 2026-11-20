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
      'ui.nothing': '还没有选中元素。',
      'ui.remove': '移出选择',
      'ui.prompt': '提示词',
      'ui.copy': '复制',
      'ui.copied': '已复制',
      'ui.canvasTitle': '设计画布',
      'ui.selection': '选择',
      'ui.selectionHint': '点击加入。已选元素保持选中。',
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
      'ui.nothing': 'Nothing selected yet.',
      'ui.remove': 'Remove from selection',
      'ui.prompt': 'Prompt',
      'ui.copy': 'Copy',
      'ui.copied': 'Copied',
      'ui.canvasTitle': 'Designer canvas',
      'ui.selection': 'Selection',
      'ui.selectionHint': 'Tap adds. Already picked stay picked.',
      'ui.picked': '{count} picked',
    };

    const ACCENT = '#c8732f';
    const SLATE = '#6b7f95';

    /** Canvas size presets. w/h = null means fill the panel exactly. */
    const RATIOS = {
      fill: { label: 'Full screen', short: 'Fill', tiny: 'Full', w: null, h: null },
      phone: { label: 'Mobile 9:16', short: 'Phone', tiny: 'Ph', w: 9, h: 16 },
      portrait: { label: 'Portrait 3:4', short: 'Port', tiny: 'Pt', w: 3, h: 4 },
      square: { label: 'Square 1:1', short: 'Sq', tiny: 'Sq', w: 1, h: 1 },
      landscape: { label: 'Landscape 3:2', short: 'Land', tiny: 'Lnd', w: 3, h: 2 },
      tv: { label: 'TV 16:9', short: 'TV', tiny: 'TV', w: 16, h: 9 },
      wide: { label: 'Ultra-wide 21:9', short: 'Wide', tiny: 'Wd', w: 21, h: 9 },
    };
    const FRAME_MARGIN = 12;
    const isFill = (preset) => preset.w === null || preset.h === null;

    /** Largest w×h box with the preset ratio that fits the available canvas (fit-contained). */
    function fitSize(availableW, availableH, preset) {
      const r = preset.w / preset.h;
      if (availableW / availableH > r) {
        return { w: Math.floor(availableH * r), h: Math.floor(availableH) };
      }
      return { w: Math.floor(availableW), h: Math.floor(availableW / r) };
    }

    const css = [
      '[data-designer-panel] {',
      '  display: flex; flex-direction: column; height: 100%; min-height: 0;',
      '  background: #12110e; color: #f4f0e8;',
      "  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;",
      '  -webkit-font-smoothing: antialiased;',
      '}',
      '[data-designer-panel] [data-designer-bar] {',
      '  flex: none; display: flex; align-items: center; gap: 6px; padding: 6px 10px;',
      '  border-bottom: 1px solid #262420;',
      '}',
      '[data-designer-panel] [data-designer-status] {',
      '  display: inline-flex; align-items: center; gap: 9px; min-width: 0;',
      '  margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .01em; color: #f4f0e8;',
      '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
      '}',
      '[data-designer-panel] [data-designer-status] span {',
      '  color: #7b756a; font-weight: 400;',
      '}',
      '[data-designer-panel] [data-designer-dot] {',
      '  width: 7px; height: 7px; border-radius: 50%; flex: none; background: #6b665b;',
      '  transition: background .18s;',
      '}',
      '[data-designer-panel] [data-designer-dot][data-live] { background: #ff5a2e; }',
      '[data-designer-panel] [data-designer-dot][data-approved] { background: #ff5a2e; }',
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
      '  flex: none; height: 24px; padding: 0 7px; border-radius: 6px; cursor: pointer;',
      '  font: inherit; font-size: 11px; font-weight: 550;',
      '  border: 1px solid #2e2b25; background: transparent; color: #d9d3c6;',
      '  display: inline-flex; align-items: center; gap: 5px;',
      '}',
      '[data-designer-panel] [data-designer-bar] button:hover { border-color: #ff5a2e; color: #fff; }',
      '[data-designer-panel] [data-designer-bar] button[data-primary] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-bar] button[data-primary]:hover { background: #ff6b41; }',
      '[data-designer-panel] [data-designer-bar] button:disabled { opacity: .35; cursor: default; border-color: #2e2b25; }',
      '[data-designer-panel] [data-designer-bar] button[data-icon] { width: 24px; padding: 0; justify-content: center; }',
      '/* tab bar */',
      '[data-designer-panel] [data-designer-tabs] {',
      '  flex: none; display: flex; align-items: center; gap: 4px; overflow-x: auto;',
      '  padding: 5px 8px; border-bottom: 1px solid #262420; background: #15140f; scrollbar-width: none;',
      '}',
      '[data-designer-panel] [data-designer-tabs]::-webkit-scrollbar { display: none; }',
      '[data-designer-panel] [data-designer-tabs] button {',
      '  flex: none; height: 24px; padding: 0 7px; border-radius: 6px; cursor: pointer;',
      '  font: inherit; font-size: 11px; color: #a9a294; border: 1px solid #2e2b25;',
      '  background: transparent; display: inline-flex; align-items: center; gap: 5px;',
      '}',
      '[data-designer-panel] [data-designer-tabs] button:hover { border-color: #ff5a2e; color: #f4f0e8; }',
      '[data-designer-panel] [data-designer-tabs] button[data-active] {',
      '  background: #2a2118; border-color: #ff5a2e; color: #f4f0e8;',
      '}',
      '[data-designer-panel] [data-designer-tabs] [data-tab-name] {',
      '  max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-tabs] [data-tab-close] {',
      '  height: auto; padding: 0 1px; min-width: 0; border: 0; background: transparent;',
      '  color: #7b756a; font-size: 13px; line-height: 1;',
      '}',
      '[data-designer-panel] [data-designer-tabs] [data-tab-close]:hover { color: #ff8a65; }',
      '[data-designer-panel] [data-designer-canvas] {',
      '  flex: 1; min-height: 0; position: relative; overflow: auto; background: #0d0c0a;',
      '  display: flex; align-items: center; justify-content: safe center; padding: 6px; overscroll-behavior: contain;',
      '}',
      '[data-designer-panel] [data-designer-frame] {',
      '  flex: none; position: relative; max-width: 100%; margin: 0 auto;',
      '  border-radius: 10px; box-shadow: 0 12px 40px -16px #000, 0 0 0 1px #2b2822;',
      '}',
      '[data-designer-panel] [data-designer-canvas] iframe {',
      '  position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
      '  border: 0; border-radius: 10px; display: block; background: #f6f2e9;',
      '  box-shadow: 0 12px 40px -16px #000, 0 0 0 1px #2b2822;',
      '}',
      '[data-designer-panel] [data-designer-ratios] {',
      '  flex: none; display: flex; gap: 4px; overflow-x: auto; padding: 6px 10px;',
      '  border-top: 1px solid #262420; background: #171612; scrollbar-width: none;',
      '}',
      '[data-designer-panel] [data-designer-ratios]::-webkit-scrollbar { display: none; }',
      '[data-designer-panel] [data-designer-ratios] button {',
      '  flex: none; height: 22px; padding: 0 8px; border-radius: 6px; cursor: pointer;',
      '  font: inherit; font-size: 10px; font-weight: 550; color: #a9a294;',
      '  border: 1px solid #2e2b25; background: transparent; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-ratios] button[aria-pressed="true"] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
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
      '[data-designer-panel] [data-designer-tray-head] {',
      '  display: flex; align-items: center; gap: 8px; padding: 9px 16px 7px;',
      '}',
      '[data-designer-panel] [data-designer-tray-label] {',
      '  flex: none; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #6b665b;',
      '}',
      '[data-designer-panel] [data-designer-tray-hint] {',
      '  min-width: 0; font-size: 11px; color: #8b8374;',
      '  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-tray-head] button {',
      '  margin-left: auto; flex: none; height: auto; padding: 5px 9px; border-radius: 7px;',
      '  font: inherit; font-size: 11px; font-weight: 550; cursor: pointer;',
      '  border: 1px solid #2e2b25; background: transparent; color: #d9d3c6;',
      '}',
      '[data-designer-panel] [data-designer-tray-head] button:not(:disabled):hover { border-color: #ff5a2e; color: #fff; }',
      '[data-designer-panel] [data-designer-tray-head] button:disabled { opacity: .3; cursor: default; }',
      '[data-designer-panel] [data-designer-chips] {',
      '  display: flex; gap: 5px; overflow-x: auto; padding: 2px 10px 6px; scrollbar-width: none;',
      '}',
      '[data-designer-panel] [data-designer-chips]::-webkit-scrollbar { display: none; }',
      '[data-designer-panel] [data-designer-nothing] {',
      '  padding: 3px 16px 9px; font-size: 11.5px; color: #6b665b; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-chip] {',
      '  flex: none; display: flex; align-items: center; gap: 7px; cursor: pointer;',
      '  background: #221f19; border: 1px solid #332f27; border-radius: 10px;',
      '  padding: 3px 6px 3px 4px; font: inherit; text-align: left; color: inherit;',
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
      '[data-designer-panel] [data-designer-prompt] {',
      '  flex: none; display: flex; align-items: center; gap: 9px; padding: 8px 16px 9px;',
      '  border-top: 1px solid #211f1a;',
      '}',
      '[data-designer-panel] [data-designer-prompt-label] {',
      '  flex: none; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: #5f5a51;',
      '}',
      '[data-designer-panel] [data-designer-prompt] code {',
      '  flex: 1; min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;',
      '  font-size: 10.5px; color: #c8c2b4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-copy] {',
      '  flex: none; height: auto; padding: 4px 8px; border-radius: 6px; cursor: pointer;',
      '  font: inherit; font-size: 10px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;',
      '  border: 1px solid #2e2b25; background: transparent; color: #a9a294;',
      '}',
      '[data-designer-panel] [data-designer-copy]:not(:disabled):hover { border-color: #ff5a2e; color: #fff; }',
      '[data-designer-panel] [data-designer-copy]:disabled { opacity: .3; cursor: default; }',
      '/* composer */',
      '[data-designer-panel] [data-designer-composer] {',
      '  flex: none; display: flex; align-items: flex-end; gap: 6px; padding: 0 10px 8px;',
      '}',
      '[data-designer-panel] [data-designer-composer] textarea {',
      '  flex: 1; min-width: 0; min-height: 30px; max-height: 70px; resize: none;',
      '  font: inherit; font-size: 12px; line-height: 1.35; padding: 6px 9px;',
      '  border-radius: 10px; border: 1px solid #2e2b25; background: #0d0c0a; color: #f4f0e8; outline: none;',
      '}',
      '[data-designer-panel] [data-designer-composer] textarea::placeholder { color: #6b665b; }',
      '[data-designer-panel] [data-designer-composer] textarea:focus { border-color: #ff5a2e; }',
      '[data-designer-panel] [data-designer-composer] button {',
      '  flex: none; height: 30px; padding: 0 11px; border-radius: 7px; cursor: pointer;',
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
      '  margin: 0 10px 8px; padding: 3px; background: #0d0c0a;',
      '  border: 1px solid #2a2721; border-radius: 13px;',
      '}',
      '[data-designer-panel] [data-designer-modes] button {',
      '  appearance: none; border: 0; background: transparent; color: #a39c8d; font: inherit;',
      '  min-height: 30px; height: auto; padding: 0; border-radius: 8px; cursor: pointer;',
      '  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;',
      '  transition: background .14s, color .14s;',
      '}',
      '[data-designer-panel] [data-designer-modes] button:hover { background: transparent; color: #f4f0e8; }',
      '[data-designer-panel] [data-designer-mode-top] {',
      '  display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;',
      '}',
      '[data-designer-panel] [data-designer-mode-top] svg { width: 14px; height: 14px; flex: none; }',
      '[data-designer-panel] [data-designer-modes] button small {',
      '  display: none;',
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
      'html[data-designer-immersive] [data-dockkit-strip] { display: none !important; }',
      'html[data-designer-immersive] [data-dockkit-pane] { border-radius: 0 !important; }',
      '[data-designer-panel] [data-designer-rail] button[aria-pressed="true"][data-icon] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-error] {',
      '  flex: none; padding: 0 16px 9px; font-size: 11px; color: #ff8a65;',
      '}',
      '/* canvas + vertical rail layout */',
      '[data-designer-panel] [data-designer-workspace] {',
      '  flex: 1; min-height: 0; display: flex; flex-direction: row;',
      '}',
      '[data-designer-panel] [data-designer-rail] {',
      '  flex: none; width: 46px; display: flex; flex-direction: column; gap: 6px;',
      '  padding: 6px 4px; overflow-y: auto; overflow-x: hidden;',
      '  border-right: 1px solid #262420; background: #12110e; scrollbar-width: none;',
      '}',
      '[data-designer-panel] [data-designer-rail]::-webkit-scrollbar { display: none; }',
      '[data-designer-panel] [data-designer-rail-group] {',
      '  flex: none; display: flex; flex-direction: column; gap: 4px;',
      '  padding-bottom: 6px; border-bottom: 1px solid #262420;',
      '}',
      '[data-designer-panel] [data-designer-rail] button {',
      '  flex: none; width: 36px; min-height: 24px; padding: 2px 0; border-radius: 6px;',
      '  font: inherit; font-size: 9px; font-weight: 600; color: #a9a294;',
      '  border: 1px solid #2e2b25; background: transparent; cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center; gap: 2px;',
      '}',
      '[data-designer-panel] [data-designer-rail] button:hover { border-color: #ff5a2e; color: #fff; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-pill] {',
      '  flex: none; width: 36px; min-height: 24px; padding: 2px 0;',
      '  display: inline-flex; align-items: center; justify-content: center;',
      '  font: inherit; font-size: 11px; font-weight: 600; color: #a9a294;',
      '  border: 1px solid #2e2b25; border-radius: 6px; background: transparent;',
      '  font-variant-numeric: tabular-nums; white-space: nowrap;',
      '}',
      '[data-designer-panel] [data-designer-rail] [data-designer-pill] b { font-size: 12px; font-weight: 650; color: #f4f0e8; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-anim] {',
      '  flex: none; width: 36px; min-height: 24px; display: inline-flex; align-items: center;',
      '  justify-content: center; border-radius: 6px; font-size: 11px; font-weight: 700;',
      '  font-variant-numeric: tabular-nums; border: 1px solid #2e2b25;',
      '  background: #12332a; color: #5ee0a0;',
      '}',
      '[data-designer-panel] [data-designer-rail] button[aria-pressed="true"],',
      '[data-designer-panel] [data-designer-rail] button[data-active] {',
      '  background: #ff5a2e; border-color: #ff5a2e; color: #fff;',
      '}',
      '[data-designer-panel] [data-designer-rail] button:disabled { opacity: .3; cursor: default; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-tabs] {',
      '  flex-direction: column; overflow-y: auto; overflow-x: hidden; padding: 0;',
      '  border: 0; background: transparent; gap: 4px;',
      '}',
      '[data-designer-panel] [data-designer-rail] [data-designer-tabs] button { width: 36px; min-height: 24px; }',
      '[data-designer-panel] [data-designer-rail] [data-tab-name] { max-width: 14px; overflow: hidden; white-space: nowrap; }',
      '[data-designer-panel] [data-designer-rail] [data-tab-close] { width: auto; min-width: 0; border: 0; padding: 0; font-size: 11px; color: #7b756a; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-ratios] {',
      '  flex-direction: column; overflow-y: auto; overflow-x: hidden; padding: 0;',
      '  border: 0; background: transparent; gap: 4px;',
      '}',
      '[data-designer-panel] [data-designer-rail] [data-designer-ratios] button { width: 36px; min-height: 24px; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-modes] {',
      '  display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0;',
      '  border: 0; background: transparent;',
      '}',
      '[data-designer-panel] [data-designer-rail] [data-designer-modes] button { width: 36px; min-height: 26px; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-modes] button small { display: none; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-mode-label] { display: none; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-tray] {',
      '  flex: none; border: 0; background: transparent; width: 36px; overflow-y: auto;',
      '}',
      '[data-designer-panel] [data-designer-rail] [data-designer-chips] {',
      '  flex-direction: column; overflow-y: auto; padding: 0; gap: 4px;',
      '}',
      '[data-designer-panel] [data-designer-rail] [data-designer-chip] { width: 36px; padding: 2px; justify-content: center; gap: 2px; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-chip] span { display: none; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-chip] i { width: 14px; height: 14px; font-size: 8px; }',
      '[data-designer-panel] [data-designer-rail] [data-designer-chip] em { font-size: 11px; }',
      '[data-designer-panel] [data-designer-canvas] { min-width: 0; }',
    ].join('\n');

    const stateUrl = (sessionId) => `/designer-mode/state?session=${encodeURIComponent(sessionId)}`;
    const frameUrl = (sessionId, revision, tabId) => `/designer-mode/frame?session=${encodeURIComponent(sessionId)}&tab=${encodeURIComponent(tabId ?? '')}&r=${revision}`;

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
      const [state, setState] = React.useState({ started: false, approved: false, revision: 0, empty: true, loaded: false, tabs: [], active: null });
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
      const cur = state.active ?? state;
      const tabs = state.tabs ?? [];
      const activeId = cur.id ?? tabs.find((tab) => tab.active)?.id ?? '';
      const [mode, setMode] = React.useState('select');
      const [selected, setSelected] = React.useState([]);
      const [draft, setDraft] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [animating, setAnimating] = React.useState(false);
      const [animResult, setAnimResult] = React.useState(null);
      const [immersive, setImmersive] = React.useState(false);
      const [frameKey, setFrameKey] = React.useState(0);
      const [ratio, setRatio] = React.useState('fill');
      const reloadRef = React.useRef(0);
      const clearRef = React.useRef(0);
      const frameRef = React.useRef(null);
      const canvasRef = React.useRef(null);
      const [frameSize, setFrameSize] = React.useState({ w: 320, h: 480 });
      const editorRef = React.useRef(null);
      const selectedRef = React.useRef(selected);
      selectedRef.current = selected;
      const modeRef = React.useRef(mode);
      modeRef.current = mode;

      /* Adopt view changes made headlessly by agents (designer_canvas). Only
       * overwrite local state when the host value actually differs, so user
       * clicks are not fought by the 1.5s poll. */
      const view = state.view;
      React.useEffect(() => {
        if (view === undefined) return;
        if (typeof view.ratio === 'string' && view.ratio !== ratio) setRatio(view.ratio);
        if (typeof view.mode === 'string' && view.mode !== mode) setMode(view.mode);
        if (typeof view.reloadSeq === 'number' && view.reloadSeq !== reloadRef.current) {
          reloadRef.current = view.reloadSeq;
          setFrameKey((value) => value + 1);
        }
        if (typeof view.selectionClearSeq === 'number' && view.selectionClearSeq !== clearRef.current) {
          clearRef.current = view.selectionClearSeq;
          setSelected([]);
        }
      }, [view]);

      /** Keep the fixed-ratio frame fit-contained inside the canvas (letterbox). */
      React.useLayoutEffect(() => {
        const preset = RATIOS[ratio] ?? RATIOS.fill;
        if (isFill(preset)) return undefined;
        const el = canvasRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const measure = () => {
          const cs = window.getComputedStyle(el);
          const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
          const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
          const availW = el.clientWidth - padX - FRAME_MARGIN;
          const availH = el.clientHeight - padY - FRAME_MARGIN;
          if (availW <= 0 || availH <= 0) return;
          setFrameSize(fitSize(availW, availH, preset));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
      }, [ratio]);

      const ratioStyle = (id) => {
        const preset = RATIOS[id] ?? RATIOS.fill;
        return isFill(preset)
          ? { width: '100%', height: '100%' }
          : { width: frameSize.w + 'px', height: frameSize.h + 'px' };
      };

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

      /* Mode or selection changed: repaint the frame overlays. */
      React.useEffect(() => {
        wiringRef.current?.paint();
      }, [mode, selected]);

      /* Immersive: flag the product root so the shell's tab strip can collapse
       * and give the canvas the whole screen. The toggle lives in this rail,
       * so there is always a way back. */
      React.useEffect(() => {
        const root = document.documentElement;
        if (immersive) root.setAttribute('data-designer-immersive', '');
        else root.removeAttribute('data-designer-immersive');
        return () => root.removeAttribute('data-designer-immersive');
      }, [immersive]);

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
      }, [cur.revision, activeId]);

      const status = cur.approved ? 'approved' : cur.started ? 'live' : 'idle';
      const statusLabel = cur.approved ? t('ui.statusDone') : cur.started ? t('ui.statusLive') : t('ui.statusIdle');

      const start = async () => {
        setBusy(true);
        try {
          await command(sessionId, 'start');
        } finally {
          setBusy(false);
        }
      };

      /** Run a tab action, then refresh state right away (polling also continues). */
      const tabCommand = async (action, extra) => {
        setError('');
        try {
          await command(sessionId, action, extra);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };

      /** Trigger a headless animation-smoothness measurement of the active canvas. */
      const runAnimation = async () => {
        setAnimating(true);
        setError('');
        try {
          const result = await command(sessionId, 'animate', { durationMs: 2000 });
          if (result.ok && result.result !== undefined) setAnimResult(result.result);
          else setError(String(result.result?.error ?? result.error ?? 'measurement failed'));
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setAnimating(false);
        }
      };

      /** Mirror a local view change to the host so the 1.5s poll cannot revert it,
       *  and so agents reading state see the same values the user sees. */
      const pushView = async (extra) => {
        try {
          const result = await command(sessionId, 'view-set', extra);
          const v = result?.state?.view;
          if (v !== undefined) {
            if (typeof v.ratio === 'string') setRatio(v.ratio);
            if (typeof v.mode === 'string') setMode(v.mode);
            if (typeof v.reloadSeq === 'number') reloadRef.current = v.reloadSeq;
            if (typeof v.selectionClearSeq === 'number') clearRef.current = v.selectionClearSeq;
          }
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };

      const tabNew = () => {
        const n = tabs.filter((tab) => /^Design [0-9]+$/.test(tab.name ?? '')).length + 1;
        void tabCommand('tab-new', { name: 'Design ' + n });
      };
      const tabSelect = (id) => { if (id !== activeId) void tabCommand('tab-select', { id }); };
      const tabClose = (event, id) => { event.stopPropagation(); void tabCommand('tab-close', { id }); };
      const agentBegin = () => { void tabCommand('agent-begin', { name: 'Design ' + (tabs.length + 1) }); };

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
        onClick: () => { setMode(id); void pushView({ mode: id }); },
      }, h('span', { 'data-designer-mode-top': '' }, ICONS[id], h('span', { 'data-designer-mode-label': '' }, label)));


      const ratioBar = h('div', { 'data-designer-ratios': '', role: 'group', 'aria-label': 'Canvas size' },
        Object.keys(RATIOS).map((id) => h('button', {
          key: id, type: 'button', 'data-ratio': id,
          'aria-pressed': ratio === id ? 'true' : 'false',
          title: RATIOS[id].label,
          onClick: () => { setRatio(id); void pushView({ ratio: id }); },
        }, RATIOS[id].short)));

      const tabBar = h('div', { 'data-designer-tabs': '', role: 'tablist', 'aria-label': 'Designer tabs' },
        tabs.map((tab) => h('button', {
          key: tab.id,
          type: 'button',
          role: 'tab',
          'data-tab': tab.id,
          'data-active': tab.id === activeId ? '' : undefined,
          'aria-selected': tab.id === activeId ? 'true' : 'false',
          title: tab.name,
          onClick: () => tabSelect(tab.id),
        },
          h('span', { 'data-tab-name': '' }, tab.active ? '● ' : '', tab.name ?? tab.id),
          h('span', {
            'data-tab-close': '',
            role: 'button',
            'aria-label': 'Close tab ' + (tab.name ?? tab.id),
            title: 'Close tab',
            onClick: (event) => tabClose(event, tab.id),
          }, '×'))),
        h('button', { type: 'button', 'data-tab-add': '', title: 'New design tab', 'aria-label': 'New design tab', onClick: tabNew }, '+'),
        h('button', { type: 'button', 'data-tab-agent': '', title: 'Design with agent', 'aria-label': 'Design with agent', onClick: agentBegin }, 'Agent'));

      const canvas = h('div', { 'data-designer-canvas': '', ref: canvasRef },
        state.loaded && !cur.started ? null : h('div', {
          'data-designer-frame': '', style: ratioStyle(ratio),
        }, h('iframe', {
          key: `${cur.revision}:${frameKey}:${activeId}`,
          ref: frameRef,
          src: frameUrl(sessionId, `${cur.revision}-${frameKey}`, activeId),
          title: t('tab.title'),
          sandbox: 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads',
          onLoad: attach,
        })),
        state.loaded && !cur.started
          ? h('div', { 'data-designer-empty': '' },
            h('div', null,
              h('p', { style: { margin: '0 0 12px' } }, t('ui.empty')),
              h('button', { type: 'button', 'data-primary': '', disabled: busy, onClick: () => void start() }, busy ? t('ui.starting') : t('ui.start'))))
          : null);

      const removeAt = (id) => {
        setSelected((current) => current.filter((element) => element.id !== id));
      };

      const tray = h('div', { 'data-designer-tray': '' },
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
            h('em', null, '×')))));

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

      /* Everything except the text box lives in a thin vertical rail on the
       * right of the canvas. The composer stays alone at the bottom. */
      const animScore = animResult ?? state.animation;
      const animBadge = animScore === null || animScore === undefined ? null
        : h('span', {
            'data-designer-anim': '',
            title: 'Smoothness ' + animScore.score + '/100 (' + animScore.verdict + '), ' + animScore.fps + ' FPS, p95 ' + animScore.p95Ms + 'ms',
          }, String(animScore.score));

      const rail = h('div', { 'data-designer-rail': '' },
        h('div', { 'data-designer-rail-group': '' }, tabBar),
        h('div', { 'data-designer-rail-group': '' }, ratioBar),
        h('div', { 'data-designer-rail-group': '' }, modeBar),
        h('div', { 'data-designer-rail-group': '' }, tray),
        h('div', { 'data-designer-rail-group': '' },
          h('span', { 'data-designer-pill': '', title: statusLabel },
            h('b', null, String(selected.length))),
          h('button', {
            type: 'button',
            title: 'Test animation smoothness',
            'aria-label': 'Test animation smoothness',
            disabled: animating || !cur.started,
            onClick: () => void runAnimation(),
          }, animating ? '…' : 'Anim'),
          animBadge,
          h('button', {
            type: 'button', 'data-icon': '',
            'aria-pressed': immersive ? 'true' : 'false',
            title: immersive ? t('ui.immersiveExit') : t('ui.immersive'),
            'aria-label': immersive ? t('ui.immersiveExit') : t('ui.immersive'),
            onClick: () => setImmersive((value) => !value),
          }, h(ImmersiveIcon)),
          h('button', {
            type: 'button', title: t('ui.reload'), 'aria-label': t('ui.reload'),
            onClick: () => { setFrameKey((value) => value + 1); void pushView({ reload: true }); },
          }, 'Reload'),
          cur.approved ? null : h('button', {
            type: 'button', 'data-primary': '',
            disabled: busy || !cur.started,
            title: t('ui.approve'), 'aria-label': t('ui.approve'),
            onClick: () => void approve(),
          }, 'Done')));

      const workspace = h('div', { 'data-designer-workspace': '' }, rail, canvas);

      return h('div', { 'data-designer-panel': '', 'data-designer-status-value': status, 'data-designer-mode': mode },
        workspace,
        composer,
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
