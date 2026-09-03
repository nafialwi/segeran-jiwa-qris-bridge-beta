import test from 'node:test';
import assert from 'node:assert/strict';
import * as refBootstrap from '../src/app/ref01-bootstrap.js';

test('RC3 layout reconciliation prefers the same role-aware effective authority used by the Owner settings modal',()=>{
  const document={documentElement:{dataset:{}}};
  const runtime={
    SJMobileUX:{settings(){return {productColumns:3,operationColumns:2,reportColumns:2,managementColumns:2,productMasterColumns:2,compactCards:false}}},
    SJMobileProfessionalP1:{effective(){return {productColumns:4,operationColumns:2,reportColumns:2,managementColumns:2,productMasterColumns:2,compactCards:false}}}
  };
  const result=refBootstrap.reconcileLayoutPreferences(document,runtime);
  assert.equal(result.productColumns,4,'canonical reconciliation must follow role-aware Owner setting, not stale generic fallback');
  assert.equal(document.documentElement.dataset.sjProductCols,'4');
});

test('RC3 settings presentation authority wraps the late mobile management renderer so canonical Settings wins the final write',()=>{
  assert.equal(typeof refBootstrap.installSettingsPresentationAuthority,'function');
  const calls=[];
  const runtime={SJRefinementPass3V5960:{renderManagementMenu(){calls.push('legacy-late-render')}}};
  const authority=refBootstrap.installSettingsPresentationAuthority(runtime,{reconcile(){calls.push('canonical-settings')}});
  runtime.SJRefinementPass3V5960.renderManagementMenu();
  assert.deepEqual(calls,['legacy-late-render','canonical-settings']);
  authority.stop();
  calls.length=0;
  runtime.SJRefinementPass3V5960.renderManagementMenu();
  assert.deepEqual(calls,['legacy-late-render'],'stop must restore original late renderer');
});
