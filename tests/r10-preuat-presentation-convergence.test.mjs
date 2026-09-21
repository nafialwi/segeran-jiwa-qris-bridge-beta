import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
const psc=fs.readFileSync(new URL('../src/ui/product-stock-components-ui.js',import.meta.url),'utf8');
const inventory=fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');

test('PU-06 defines one explicit presentation layer scale for legacy modal, child sheet and workspace',()=>{
  for(const token of ['--sj-layer-modal','--sj-layer-child-sheet','--sj-layer-workspace','--sj-layer-critical']){
    assert.ok(css.includes(token),token);
  }
  assert.ok(css.includes('.overlay{')&&css.includes('z-index:var(--sj-layer-modal'));
  assert.ok(css.includes('.sj-stock-components-editor-layer{')&&css.includes('z-index:var(--sj-layer-child-sheet'));
  assert.ok(css.includes('.sj-v32-inv-overlay{')&&css.includes('z-index:var(--sj-layer-workspace'));
});

test('PU-06 Product Stock Components child dialog locks background, supports Escape and restores focus',()=>{
  assert.ok(psc.includes('lockEditorPresentation'));
  assert.ok(psc.includes('unlockEditorPresentation'));
  assert.ok(psc.includes("body.style.overflow='hidden'"));
  assert.ok(psc.includes("event?.key==='Escape'"));
  assert.ok(psc.includes('editorReturnFocus'));
  assert.ok(psc.includes('focusEditor'));
  assert.ok(psc.includes("setAttribute?.('inert','')"));
  assert.ok(psc.includes('active?.blur?.()'));
});

test('PU-06 Inventory workspace owns close lifecycle, background lock, Escape and focus restoration',()=>{
  assert.ok(inventory.includes('function closeWorkspace'));
  assert.ok(inventory.includes('lockWorkspacePresentation'));
  assert.ok(inventory.includes('unlockWorkspacePresentation'));
  assert.ok(inventory.includes("body.style.overflow='hidden'"));
  assert.ok(inventory.includes("event?.key==='Escape'"));
  assert.ok(inventory.includes('presentationReturnFocus'));
  assert.ok(inventory.includes('aria-modal'));
});

test('PU-06 mobile Inventory workspace is a single full-height surface, not a floating layer over another modal',()=>{
  assert.ok(css.includes('@media(max-width:520px)'));
  assert.ok(css.includes('.sj-v32-inv-card{width:100%;height:100dvh'));
  assert.ok(css.includes('.sj-v32-inv-card{width:min(720px,100%);max-height:94dvh')&&css.includes('overflow:hidden'));
  assert.ok(css.includes('.sj-v32-inv-body{overflow:auto;overscroll-behavior:contain'));
});

test('PU-06 new modal controls expose keyboard focus treatment',()=>{
  assert.ok(css.includes('focus-visible'));
  assert.ok(css.includes('sj-stock-components-editor-layer'));
  assert.ok(css.includes('sj-v32-inv-overlay'));
});


test('PU-11 final UAT responsive hardening keeps tablet Product Master styled and 360px edit actions reachable',()=>{
  for(const selector of [
    '.sjmux-master-toolbar',
    '.sjmux-master-grid',
    '.sjmux-product-master-card',
    '.sjmux-product-master-actions',
    '.sjmux-icon-btn'
  ]) assert.ok(css.includes(selector),selector);
  assert.ok(css.includes('@media(min-width:768px) and (max-width:1023px)'));
  assert.ok(css.includes('#modal-edit-master>.modal.sj-product-form-v2'));
  assert.ok(css.includes('safe-area-inset-bottom'));
});
