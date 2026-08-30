import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const OUT=join(ROOT,'dist-sc04');
const ENTRY='<script type="module" src="./src/sc04-entry.js" data-sj-sc04-entry="true"></script>';

rmSync(OUT,{recursive:true,force:true});
mkdirSync(OUT,{recursive:true});
cpSync(join(ROOT,'src'),join(OUT,'src'),{recursive:true});
const legacy=readFileSync(BASE,'utf8');
if((legacy.match(/<\/body>/gi)||[]).length!==1) throw new Error('SC04_BUILD_BODY_ANCHOR_INVALID');
const candidate=legacy.replace(/<\/body>/i,`${ENTRY}\n</body>`);
writeFileSync(join(OUT,'index.html'),candidate);
const sha=createHash('sha256').update(candidate).digest('hex');
console.log(`SC-04 candidate build: dist-sc04/index.html ${sha}`);
