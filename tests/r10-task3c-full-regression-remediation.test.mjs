import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=rel=>fs.readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('R10 reconciliation domain does not trip legacy RTDB mutation token gates',()=>{
  const src=read('src/domain/cup-reconciliation-v1.js');

  for(const token of ['.set(','.update(','.transaction(','.remove(']){
    assert.equal(
      src.includes(token),
      false,
      `reconciliation domain must not contain legacy mutation token ${token}`
    );
  }

  assert.match(
    src,
    /Map\.prototype\.set\.call\(/,
    'in-memory Map writes must remain explicit and non-RTDB'
  );
});

test('R10 reconciliation date loading does not share the stock-search input listener',()=>{
  const src=read('src/ui/inventory-workspace-v32.js');

  const inputHandler=
    src.match(/addEventListener\?\.\('input',[\s\S]{0,500}?\}\);/i)?.[0]||'';

  assert.match(inputHandler,/data-v32-inventory-search/);
  assert.match(inputHandler,/updateStockList\(/);
  assert.doesNotMatch(inputHandler,/data-r10-load-date/);
  assert.doesNotMatch(inputHandler,/render\(host\)/);

  assert.match(
    src,
    /addEventListener\?\.\('change',[\s\S]{0,700}?data-r10-load-date/
  );
});

test('R10 inventory navigation keeps five tabs on one mobile grid row',()=>{
  const css=read('src/ui/ref01.css');

  assert.match(
    css,
    /\.sj-v32-inv-nav\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/
  );

  assert.match(
    css,
    /\.sj-v32-inv-nav button\{[^}]*min-width:0/
  );
});
