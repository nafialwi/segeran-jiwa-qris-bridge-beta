import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enhanceBottomNav } from '../src/ui/bottom-nav.js';

function classList(){
  const set=new Set();
  return {toggle(name,on){on?set.add(name):set.delete(name)},contains:name=>set.has(name)};
}
function style(){
  const data={};
  return {setProperty(k,v){data[k]=String(v)},getPropertyValue:k=>data[k]??'',set transform(v){data.transform=v},get transform(){return data.transform},set width(v){data.width=v},get width(){return data.width}};
}
function makeButton(left){
  const label={nodeType:1,textContent:''};
  const icon={innerHTML:''};
  return {dataset:{},childNodes:[label],classList:classList(),offsetLeft:left,offsetWidth:60,
    querySelector(sel){if(sel==='.nav-icon')return icon;if(sel==='.sjui01-nav-label')return label;return null},
    insertAdjacentText(){},icon,label};
}

test('REF_02 uses one moving capsule and a filled active icon instead of per-button background jumps',()=>{
  const buttons={tab5:makeButton(7),tab1:makeButton(69),tab2:makeButton(131),tab3:makeButton(193),tab4:makeButton(255)};
  let capsule=null;
  const nav={dataset:{},children:[],style:style(),setAttribute(){},
    querySelector(sel){return sel==='.sjr02-nav-capsule'?capsule:null},
    insertBefore(node){capsule=node;this.children.unshift(node)}};
  const document={
    createElement(){return {className:'',dataset:{},style:style(),setAttribute(){}}},
    getElementById(id){return id==='bottom-nav'?nav:buttons[id]??null}
  };
  enhanceBottomNav(document,'operational');
  assert.ok(capsule,'single moving capsule must be installed');
  assert.equal(capsule.style.transform,'translateX(131px)');
  assert.equal(capsule.style.width,'60px');
  assert.equal(nav.dataset.ref01ActiveRoute,'operational');
  assert.match(buttons.tab2.icon.innerHTML,/fill="currentColor"/,'active icon must switch from outline to filled state');
  assert.match(buttons.tab1.icon.innerHTML,/fill="none"/,'inactive icon remains outline');
});

test('REF_02 CSS neutralizes legacy active margin/height so the selected tab does not drop downward',()=>{
  const css=readFileSync('src/ui/ref01.css','utf8');
  assert.match(css,/\.sjr02-nav-capsule/);
  assert.match(css,/\[data-ref01-nav="true"\]\.active\{[^}]*margin:0!important[^}]*height:auto!important/s);
});
