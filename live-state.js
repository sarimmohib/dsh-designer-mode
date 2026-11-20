/**
 * Shared live-state store for designer mode.
 *
 * Informational cross-session data: the latest agent activity and the movement
 * trace. Canvas state itself is session-scoped (see index.js SESSION_STORE_DIR);
 * this store never holds a design and must never make designs bleed across
 * sessions. Data is mirrored to disk so it survives reloads.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';

const STORE_DIR = join(process.env.DSH_HOME || join(process.env.USERPROFILE || '', '.dsh'), 'designer-mode');
const STORE_FILE = join(STORE_DIR, 'live.json');
const EMPTY = { activity: null, trace: [] };

let live = load();
let sessionHint = undefined;
export function setSessionHint(session) { sessionHint = session; }
function load() {
  try {
    if (existsSync(STORE_FILE)) {
      const parsed = JSON.parse(readFileSync(STORE_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') return { ...EMPTY, ...parsed, trace: Array.isArray(parsed.trace) ? parsed.trace : [] };
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
  live.trace.push({ ts: Date.now(), ...entry, session: entry.session ?? sessionHint });
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
export function setActivity(type, label = '', session = undefined) {
  live.activity = { type, label, session, ts: Date.now() };
  live.updatedAt = Date.now();
  persist();
  return live;
}
export function getLive() { return live; }
