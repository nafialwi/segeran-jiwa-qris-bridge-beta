import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { theoreticalCupUsageV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCategoryCupMappingV34 } from '../src/ui/cup-product-costing-v34.js';

const buildPath=new URL('../scripts/build-ref01.mjs',import.meta.url);
const compatPath=new URL('../src/compat/legacy-cup-01b-product-cup-ui.js',import.meta.url);
const htmlPath=new URL('../dist-ref01/index.html',import.meta.url);
const read=u=>fs.readFileSync(u,'utf8');

function selectBody(html,id){
 const m=html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)<\\/select>`));
 assert.ok(m,`${id} select missing`);return m[1];
}

test('LEGACY-CUP-01B adds a safe product-cup UI compat entry without Firebase access',()=>{
 assert.equal(fs.existsSync(compatPath),true,'product cup UI compat source must exist');
 const src=read(compatPath);
 for(const token of ['SJLegacyCup01BProductCupUI','Cup Paper 10 Oz','Kemasan / Jenis Cup','Kategori Produk','Harga Jual','data-sj-product-cup-value'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.doesNotMatch(src,/\b(?:db|database|firebase)\s*\.\s*ref\s*\(/i);
 assert.doesNotMatch(src,/\.(?:set|update|remove|transaction)\s*\(/);
});

test('LEGACY-CUP-01B build patches both create/edit product selectors and injects UI once',()=>{
 const build=read(buildPath);
 for(const token of ['PRODUCT_CUP_UI_ENTRY','patchLegacyProductCupSelects','legacy-cup-01b-product-cup-ui.js','data-sj-legacy-cup-01b-product-ui'])assert.ok(build.includes(token),`missing build token ${token}`);
 const html=read(htmlPath);
 assert.equal((html.match(/data-sj-legacy-cup-01b-product-ui="true"/g)||[]).length,1);
 for(const id of ['new-cp','edit-m-cp']){
   const body=selectBody(html,id);
   const expected=[['','Per produk / tanpa cup'],['c10','Cup 10 Oz'],['c10p','Cup Paper 10 Oz'],['c16','Cup 16 Oz'],['c22p','Cup 22 Oz Datar Polos'],['c22d','Cup 22 Oz Datar'],['c22o','Cup 22 Oz Oval']];
   for(const [code,label] of expected){assert.ok(body.includes(`value="${code}"`));assert.ok(body.includes(label))}
 }
});

test('LEGACY-CUP-01B R2 preserves frozen S10A/manual/ref01 build tail while injecting product UI before it',()=>{
 const build=read(buildPath);
 assert.match(build,/\$\{S10A_CLASSIC_ENTRY\}\\n\$\{QRIS_MANUAL_ENTRY\}\\n\$\{ENTRY\}/);
 const product=build.indexOf('\${PRODUCT_CUP_UI_ENTRY}'), frozen=build.indexOf('\${S10A_CLASSIC_ENTRY}');
 assert.ok(product>=0&&frozen>product,{product,frozen});
});

test('LEGACY-CUP-01B keeps per-product cp save authority and Paper 10 Oz contributes theoretical usage',()=>{
 const html=read(htmlPath);
 assert.match(html,/cp=document\.getElementById\('new-cp'\)\.value\.toLowerCase\(\)/);
 assert.match(html,/cp=document\.getElementById\('edit-m-cp'\)\.value\.toLowerCase\(\)/);
 const usage=theoreticalCupUsageV34([{status:'DONE',cartData:[{id:'PAPER',q:3,cp:'c10p'}]}],[]);
 assert.equal(usage.c10p,3);
});

test('LEGACY-CUP-01B preserves the five legacy product cup codes',()=>{
 const html=read(htmlPath),body=selectBody(html,'new-cp');
 for(const code of ['c10','c16','c22p','c22d','c22o'])assert.ok(body.includes(`value="${code}"`),`legacy mapping ${code} lost`);
});

test('LEGACY-CUP-01B does not silently enable Paper 10 Oz category-level defaults',()=>{
 const categoryHtml=renderCategoryCupMappingV34(['MINUMAN'],[],{readOnly:true});
 assert.doesNotMatch(categoryHtml,/Cup Paper 10 Oz/);
 assert.doesNotMatch(categoryHtml,/value="c10p"/);
});
