import test from 'node:test';
import assert from 'node:assert/strict';
import { installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

test('CUP-01 LEGACY mode must not wait forever for Firebase Auth currentUser', async () => {
  let reads = 0;
  let subscriptions = 0;

  const auth = {
    currentUser: null,
    onAuthStateChanged(cb) {
      subscriptions++;
      queueMicrotask(() => cb(null));
      return () => {};
    }
  };

  const runtime = {
    firebase: { auth: () => auth },
    SJProductionArchitectureP3: { authMode: () => 'LEGACY' },
    SJInventoryV2: {
      recipeForProduct() {
        return { components: {} };
      }
    },
    Function
  };

  const repository = {
    async readInventoryV2() {
      reads++;
      return { ingredients: {}, balances: { ingredients: {} } };
    }
  };

  const api = installCupProductCostingV34(runtime, {
    inventoryWorkspace: { cupRows: () => [] },
    repository,
    autoEnhance: false
  });

  const resolved = await Promise.race([
    api.ready.then(() => true),
    new Promise(resolve => setTimeout(() => resolve(false), 100))
  ]);

  assert.equal(resolved, true, 'LEGACY readiness must stay bounded when Firebase Auth has no currentUser');
  assert.equal(reads, 1, 'LEGACY mode should continue through the existing Inventory V2 read path');
  assert.equal(subscriptions, 0, 'LEGACY mode must not subscribe to Firebase Auth readiness');
});
