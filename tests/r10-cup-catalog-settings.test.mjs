import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCupCatalogSettingsV1 } from '../src/ui/cup-catalog-settings-v1.js';

test('Cup Control settings lists active/inactive Cup and product usage',()=>{
  const html=renderCupCatalogSettingsV1([{code:'c10',name:'Cup 10 Oz',active:true,builtin:true},{code:'cup24',name:'Cup 24 Oz',active:false,builtin:false}],{usageByCode:code=>code==='c10'?3:0});
  assert.match(html,/Cup Control/);assert.match(html,/Cup 10 Oz/);assert.match(html,/3 produk memakai Cup ini/);assert.match(html,/Cup 24 Oz/);assert.match(html,/Nonaktif/);assert.match(html,/Tambah Jenis Cup/);
});

test('Cup editor keeps code disabled after creation and explains immutability',()=>{
  const html=renderCupCatalogSettingsV1([{code:'cup24',name:'Cup 24 Oz',active:true,builtin:false}],{editing:{isNew:false,code:'cup24',name:'Cup 24 Oz'}});
  assert.match(html,/data-cup-field="code"[^>]*disabled/);assert.match(html,/identitas permanen/);assert.match(html,/data-cup-editor-save/);
});

test('read-only settings disable mutation actions but still display catalog',()=>{
  const html=renderCupCatalogSettingsV1([{code:'c10',name:'Cup 10 Oz',active:true,builtin:true}],{readOnly:true});
  assert.match(html,/data-cup-add disabled/);assert.match(html,/data-cup-edit="c10" disabled/);assert.match(html,/Cup 10 Oz/);
});
