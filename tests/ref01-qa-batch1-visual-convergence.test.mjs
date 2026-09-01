import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderFilledIcon } from '../src/ui/icons.js';
import { renderSettingsMarkup } from '../src/ui/settings-refinement.js';
import { enhanceBottomNav } from '../src/ui/bottom-nav.js';
import { resolveLockedIcon } from '../src/ui/locked-icon-registry.js';

function classList(){const s=new Set();return{toggle(n,on){on?s.add(n):s.delete(n)},contains:n=>s.has(n)}}
function makeButton(left){const label={nodeType:1,textContent:''};const icon={innerHTML:''};return{dataset:{},childNodes:[label],classList:classList(),offsetLeft:left,offsetWidth:64,querySelector(sel){if(sel==='.nav-icon')return icon;if(sel==='.sjui01-nav-label')return label;return null},insertAdjacentText(){},icon,label}}

test('REF_02 active nav icons use dedicated solid geometry rather than blindly filling outline paths',()=>{
  const op=renderFilledIcon('operations',{size:21,label:'Operasional'});
  const gear=renderFilledIcon('settings',{size:21,label:'Pengaturan'});
  assert.match(op,/data-sj-icon-variant="solid"/);
  assert.match(op,/stroke="white"/,'filled cube keeps visible facet lines');
  assert.match(gear,/data-sj-icon-variant="solid"/);
  assert.match(gear,/fill="white"/,'filled gear keeps a visible center hole');
});

test('REF_02 bottom navigation uses dedicated locked active SVG and locked outline SVG for inactive tabs',()=>{
  const buttons={tab5:makeButton(7),tab1:makeButton(73),tab2:makeButton(139),tab3:makeButton(205),tab4:makeButton(271)};
  let capsule=null;
  const nav={dataset:{},setAttribute(){},querySelector(sel){return sel==='.sjr02-nav-capsule'?capsule:null},insertBefore(node){capsule=node}};
  const document={createElement(){return{className:'',dataset:{},style:{},setAttribute(){}}},getElementById(id){return id==='bottom-nav'?nav:buttons[id]??null}};
  enhanceBottomNav(document,'settings');
  assert.equal(resolveLockedIcon('settings',{active:true}).key,'active/navigation/settings');
  assert.equal(resolveLockedIcon('operations',{active:false}).key,'outline/navigation/operations');
  assert.match(buttons.tab4.icon.innerHTML,/data-sj-icon-authority="B01-B05"/);
  assert.match(buttons.tab2.icon.innerHTML,/data-sj-icon-authority="B01-B05"/);
  assert.doesNotMatch(buttons.tab4.icon.innerHTML,/data-sj-icon-variant="solid"/,'active state must not synthetically fill an outline');
});

test('REF_01 settings responsibility icons use the stronger filled authority shown by the reference pack',()=>{
  const html=renderSettingsMarkup({name:'Owner Utama',roleLabel:'Owner / Pemilik'});
  const settingsIcons=[...html.matchAll(/sjr01-setting-icon[^>]*>(<svg[\s\S]*?<\/svg>)/g)].map(m=>m[1]);
  assert.equal(settingsIcons.length,17);
  assert.ok(settingsIcons.every(svg=>/data-sj-icon-variant="solid"/.test(svg)));
});

test('REF_03 stock child header is forced into back-title-help row and stock KPI symbols use semantic icons',()=>{
  const css=readFileSync('src/ui/ref01.css','utf8');
  assert.match(css,/\.sjvc02-stock \.sjvc02-child-head\{[^}]*display:grid!important[^}]*grid-template-columns:44px minmax\(0,1fr\) 44px!important/s);
  assert.match(css,/\.sjvc02-stock \.sjvc02-child-head \.sjvc02-help\{[^}]*grid-column:3!important/s);
  const ops=readFileSync('src/ui/stock-refinement.js','utf8');
  assert.match(ops,/decorateStockReferenceSurface/);
  assert.match(ops,/warning-triangle/);
  assert.match(ops,/x-circle/);
  assert.match(ops,/check-circle/);
});
