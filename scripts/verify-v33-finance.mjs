import fs from 'node:fs';
import { validateMutationSource } from './sc04-mutation-policy.mjs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const read=rel=>fs.readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');
const src=read('src/domain/finance-v33-analytics.js');
const repo=read('src/data/repositories/finance-repository.js');
const writer=read('src/data/writers/finance-writer.js');
const coordinator=read('src/data/writers/qris-cash-out-coordinator.js');
const checks=[
 ['version 3.3.0',pkg.version==='3.3.0'],
 ['finance separates owner capital/prive',/OPENING_CAPITAL/.test(src)&&/PRIVE/.test(src)],
 ['inventory purchase double count guard',/INVENTORY_PURCHASE/.test(src)&&/purchaseRef/.test(src)],
 ['hpp unknown guard',/unknownTransactions/.test(src)&&/netProfit/.test(src)],
 ['QRIS cashout semantics',/qrisCashOutSemantics/.test(src)&&/qrisReceived/.test(src)],
 ['finance repository read only',/readMonthShifts/.test(repo)&&!/\.set\(|\.update\(|\.remove\(|\.transaction\(/.test(repo)],
 ['finance writer append-only owner/month paths',/ownerEvents/.test(writer)&&/monthCloseEvents/.test(writer)&&!/approvedPathPrefixes[\s\S]*qrisCashOut/.test(writer)&&validateMutationSource('src/data/writers/finance-writer.js',writer).length===0],
 ['QRIS cashout dedicated fail-closed coordinator',/QRIS_CASH_OUT_RECOVERY_REQUIRED/.test(coordinator)&&/commitLegacy/.test(coordinator)&&/cashMovements/.test(coordinator)&&validateMutationSource('src/data/writers/qris-cash-out-coordinator.js',coordinator).length===0],
 ['destructive mutation absent',!/\.remove\s*\(/.test(writer)&&!/\.remove\s*\(/.test(coordinator)]
];
let pass=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`); if(ok)pass++;}
console.log(`${pass}/${checks.length} PASS`); if(pass!==checks.length)process.exit(1);
