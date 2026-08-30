import { chmodSync, mkdirSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = join(ROOT, 'baseline', 'legacy-v1.0.40.html');
const DIST_DIR = join(ROOT, 'dist');
const DIST = join(DIST_DIR, 'index.html');
mkdirSync(DIST_DIR, { recursive: true });
rmSync(DIST, { force: true });
copyFileSync(BASE, DIST);
chmodSync(DIST, 0o644);
const sha = createHash('sha256').update(readFileSync(DIST)).digest('hex');
console.log(`SC-01 compatibility build: dist/index.html ${sha}`);
