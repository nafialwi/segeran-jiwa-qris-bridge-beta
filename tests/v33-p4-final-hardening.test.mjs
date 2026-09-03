import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enhanceBottomNav } from '../src/ui/bottom-nav.js';
import { renderPurchaseAuditV33 } from '../src/ui/finance-v33-workspace.js';

function classList(initial=[]){
  const set=new Set(initial);
  return {
    toggle(name,on){on?set.add(name):set.delete(name)},
    add(name){set.add(name)},remove(name){set.delete(name)},contains(name){return set.has(name)},
    values(){return [...set]}
  };
}
function style(){const d={};return {setProperty(k,v){d[k]=String(v)},set width(v){d.width=v},get width(){return d.width},set transform(v){d.transform=v},get transform(){return d.transform}}}
function button(left,active=false){
  const label={nodeType:1,textContent:''},icon={innerHTML:''};
  return {dataset:{},childNodes:[label],classList:classList(active?['active']:[]),offsetLeft:left,offsetWidth:60,
    querySelector(sel){if(sel==='.nav-icon')return icon;if(sel==='.sjui01-nav-label')return label;return null},insertAdjacentText(){},icon,label};
}

test('Final hardening keeps exactly one canonical active bottom-nav item after stale operational render',()=>{
  const buttons={tab5:button(7),tab1:button(69),tab2:button(131,true),tab3:button(193),tab4:button(255)};
  let capsule=null;const nav={dataset:{},setAttribute(){},querySelector(sel){return sel==='.sjr02-nav-capsule'?capsule:null},insertBefore(node){capsule=node}};
  const document={createElement(){return {className:'',dataset:{},style:style(),setAttribute(){}}},getElementById(id){return id==='bottom-nav'?nav:buttons[id]??null}};
  enhanceBottomNav(document,'reports');
  assert.equal(buttons.tab2.classList.contains('active'),false,'stale legacy Operasional active must be cleared');
  assert.equal(buttons.tab3.classList.contains('active'),true,'legacy active must converge to canonical Laporan route');
  assert.equal(buttons.tab3.classList.contains('ref01-active'),true);
  assert.equal(Object.values(buttons).filter(x=>x.classList.contains('active')).length,1);
  assert.equal(Object.values(buttons).filter(x=>x.classList.contains('ref01-active')).length,1);
});

const audit={purchaseId:'PTEH',status:'COMMITTED',itemName:'TEH',fundSource:'OWNER',landedCost:25000,shiftKey:'2026-08-29-S1',expenseRef:'E1',movementRef:'M1',evidence:{stock:'verified',wac:'verified',expense:'missing',movement:'verified'},warnings:[],reconciliation:{linkRepair:{eligible:true,blockers:[]},reversal:{eligible:false,blockers:['DOWNSTREAM_CONSUMPTION_DETECTED']},events:[]},shiftAudit:{shiftKey:'2026-08-29-S1',state:'NOT_STARTED',sessionId:null,locked:false,closingSnapshot:false,issues:['SHIFT_STATUS_INCOMPLETE']},historicalShiftResolution:{eligible:true,resolved:false,blockers:[]},funding:{treatment:'OWNER_DIRECT',source:'OWNER',amount:25000,confirmedBusinessAmount:0,requiresAuthority:false},wacCostReview:{status:'REVIEW_REQUIRED',autoRewriteAllowed:false,reasonCodes:[]},resolutionPlan:{safeActions:['LINK_REPAIR','HISTORICAL_SHIFT_ACK'],blockedActions:['PURCHASE_REVERSAL'],reviewActions:['WAC_COST_REVIEW'],productionWriteApproved:false}};

test('Final hardening makes LOCAL QA mutation controls visibly locked rather than green-active',()=>{
  const html=renderPurchaseAuditV33(audit,{readOnly:true});
  assert.match(html,/data-v33-readonly-action="true"/);
  assert.match(html,/🔒 Pulihkan Link Expense · READ ONLY/);
  assert.match(html,/🔒 Acknowledgement Shift Historis · READ ONLY/);
  const css=readFileSync('src/ui/ref01.css','utf8');
  assert.match(css,/\[data-v33-readonly-action="true"\]/);
});
