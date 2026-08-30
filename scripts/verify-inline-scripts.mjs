import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const html=readFileSync(join(ROOT,'baseline','legacy-v1.0.40.html'),'utf8');
const matches=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const failures=[]; const blocks=[];
for(let i=0;i<matches.length;i++){
  const attrs=matches[i][1]||''; const code=matches[i][2]||'';
  const line=html.slice(0,matches[i].index||0).split('\n').length;
  if(/\bsrc\s*=/.test(attrs)){blocks.push({index:i+1,line,attrs,status:'external'});continue;}
  try{ new Function(code); blocks.push({index:i+1,line,attrs,status:'parsed'}); }
  catch(e){ failures.push({index:i+1,line,attrs,error:e.message}); blocks.push({index:i+1,line,attrs,status:'failed',error:e.message}); }
}
mkdirSync(join(ROOT,'audit'),{recursive:true});
const result={inlineScriptBlocks:matches.length,parsed:blocks.filter(x=>x.status==='parsed').length,external:blocks.filter(x=>x.status==='external').length,failures,blocks};
writeFileSync(join(ROOT,'audit','inline-script-parse.json'),JSON.stringify(result,null,2));
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exit(1)}
console.log(`Inline scripts: ${matches.length}/${matches.length} parse, 0 failures`);
