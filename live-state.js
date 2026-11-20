/**
 * Shared live-state store for designer mode.
 *
 * The agent's tools and the browser panel run in different session contexts,
 * so keying canvas state by session id means they never see each other's work.
 * This module keeps ONE live design (the most recently published canvas) that
 * both sides read and write, and mirrors it to disk so a page reload or a
 * process restart still shows the latest design.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';

const STORE_DIR = join(process.env.DSH_HOME || join(process.env.USERPROFILE || '', '.dsh'), 'designer-mode');
const STORE_FILE = join(STORE_DIR, 'live.json');
const EMPTY = { html: '', revision: 0, started: false, approved: false, updatedAt: 0, agentMode: false, label: '', activity: null, trace: [] };

let live = load();
function load() {
  try {
    if (existsSync(STORE_FILE)) {
      const parsed = JSON.parse(readFileSync(STORE_FILE, 'utf8'));
      if (parsed && typeof parsed.html === 'string') return { ...EMPTY, ...parsed };
    }
  } catch {}
  return { ...EMPTY };
}
function persist() {
  try {
    mkdirSync(dirname(STORE_FILE), { recursive: true });
    const tmp = STORE_FILE + '.tmp';
    writeFileSync(tmp, JSON.stringify(live), 'utf8');
    renameSync(tmp, STORE_FILE);
  } catch {}
}

export function addTrace(entry) {
  if (!Array.isArray(live.trace)) live.trace = [];
  live.trace.push({ ts: Date.now(), ...entry });
  if (live.trace.length > 200) live.trace = live.trace.slice(live.trace.length - 200);
  persist();
  return live.trace;
}
export function clearTrace() {
  live.trace = [];
  persist();
  return live.trace;
}
export function getTrace() { return Array.isArray(live.trace) ? live.trace : []; }
export function setActivity(type, label = '') {
  live.activity = { type, label, ts: Date.now() };
  live.updatedAt = Date.now();
  persist();
  return live;
}
export function getLive() { return live; }
export function publish(html, options = {}) {
  live = {
    html: String(html ?? ''),
    revision: (live.revision || 0) + 1,
    started: true,
    approved: options.approved === true || live.approved === true,
    agentMode: options.agentMode === true,
    updatedAt: Date.now(),
    label: typeof options.label === 'string' ? options.label : (options.label ?? live.label ?? ''),
  };
  persist();
  return live;
}
export function clearLive() {
  live = { ...EMPTY };
  persist();
  return live;
}
export function setApproved(value) {
  live.approved = value === true;
  live.updatedAt = Date.now();
  persist();
  return live;
}
export function setAgentMode(value) {
  live.agentMode = value === true;
  live.approved = value === true || live.approved;
  live.updatedAt = Date.now();
  persist();
  return live;
}
