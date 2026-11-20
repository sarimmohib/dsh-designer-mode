/**
 * Animation smoothness measurement via Chrome DevTools Protocol.
 * Launches headless Chrome, runs a rAF sampler in the page, and returns real
 * frame-timing statistics (FPS, percentiles, jank counts, smoothness score).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter((v) => typeof v === 'string' && v !== '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.id === undefined || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message || 'CDP error'));
      else resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitFor(condition, timeoutMs, intervalMs = 50) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await condition();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error('timeout waiting for Chrome DevTools');
}

function computeMetrics(dts, elapsed) {
  const frames = dts.filter((d) => Number.isFinite(d) && d > 0);
  if (frames.length === 0) return null;
  const sorted = [...frames].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const mean = frames.reduce((a, b) => a + b, 0) / frames.length;
  const jank32 = frames.filter((d) => d > 32).length;
  const jank50 = frames.filter((d) => d > 50).length;
  const p95 = pct(0.95);
  const score = clamp(Math.round(100 - Math.max(0, p95 - 16.7) * 2 - (jank50 / frames.length) * 40), 0, 100);
  return {
    frames: frames.length,
    elapsedMs: Math.round(elapsed),
    fps: +(1000 / mean).toFixed(1),
    meanMs: +mean.toFixed(2),
    p50Ms: +pct(0.5).toFixed(2),
    p95Ms: +p95.toFixed(2),
    p99Ms: +pct(0.99).toFixed(2),
    maxMs: +sorted[sorted.length - 1].toFixed(2),
    janky32: jank32,
    janky50: jank50,
    score,
    verdict: score >= 85 ? 'smooth' : score >= 65 ? 'ok' : 'janky',
  };
}

export async function measureAnimation(options = {}) {
  const html = String(options.html ?? '');
  if (html === '') return { error: 'No HTML to measure. Publish a design first.' };
  const width = clamp(Number(options.width) || 900, 320, 2560);
  const height = clamp(Number(options.height) || 1600, 320, 3200);
  const duration = clamp(Number(options.durationMs) || 2000, 200, 20000);
  const warmup = clamp(Number(options.warmupMs) || 0, 0, Math.floor(duration / 2));
  const interaction = typeof options.interaction === 'string' ? options.interaction : '';
  const label = typeof options.label === 'string' ? options.label : '';

  const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (chrome === undefined) return { error: 'No headless Chrome or Edge found. Set CHROME_PATH.' };

  const tempDir = mkdtempSync(join(tmpdir(), 'designer-anim-'));
  const htmlPath = join(tempDir, 'anim.html');
  writeFileSync(htmlPath, html, 'utf8');
  const sep = String.fromCharCode(92);
  const fileUrl = 'file:///' + htmlPath.split(sep).join('/');

  const child = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--remote-debugging-port=0',
    '--user-data-dir=' + join(tempDir, 'profile'),
    '--window-size=' + width + ',' + height,
    fileUrl,
  ], { windowsHide: true, stdio: 'ignore' });

  let cdp;
  try {
    const activePortPath = join(tempDir, 'profile', 'DevToolsActivePort');
    const activePortText = await waitFor(() => existsSync(activePortPath) ? readFileSync(activePortPath, 'utf8') : null, 15000);
    const port = Number(activePortText.split(String.fromCharCode(10))[0]);
    if (!Number.isFinite(port)) throw new Error('Invalid DevTools port');

    const targets = await waitFor(async () => {
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/json/list');
        const list = await response.json();
        const page = list.find((entry) => entry.type === 'page');
        return page && page.webSocketDebuggerUrl ? page : null;
      } catch { return null; }
    }, 15000);

    const ws = new WebSocket(targets.webSocketDebuggerUrl);
    await waitFor(() => ws.readyState === 1 ? true : null, 10000);
    cdp = new Cdp(ws);
    await cdp.send('Runtime.enable');

    await waitFor(async () => {
      const result = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
      return result.result.value === 'complete' ? true : null;
    }, 10000);

    const interactionCall = interaction === '' ? '' : 'setTimeout(() => { try { (0, eval)(' + JSON.stringify(interaction) + ') } catch (e) {} }, ' + warmup + ');';
    const expression = '(async () => { const dts = []; let last = performance.now(); const start = last; const end = start + ' + duration + '; ' + interactionCall + ' return await new Promise((resolve) => { function frame(now) { dts.push(now - last); last = now; if (now >= end) resolve({ dts, elapsed: now - start }); else requestAnimationFrame(frame); } requestAnimationFrame(frame); }); })()';
    const evaluated = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.text || 'Evaluation failed');
    const value = evaluated.result.value;
    const metrics = computeMetrics(value.dts, value.elapsed);
    if (metrics === null) throw new Error('No animation frames were produced');
    return { label, ...metrics, interaction, width, height };
  } finally {
    if (cdp !== undefined) cdp.close();
    try { child.kill(); } catch {}
  }
}
