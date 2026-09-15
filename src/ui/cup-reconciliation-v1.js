const META=Object.freeze({
  UNRESOLVED:{label:'Belum Diselesaikan',cls:'unresolved'},
  NEEDS_OPNAME:{label:'Perlu Opname',cls:'needs-opname'},
  RESOLVED:{label:'Sudah Diselesaikan',cls:'resolved'}
});
const MONTH=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const esc=v=>String(v??'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const n=v=>{
  if(v===null||v===undefined||v==='')return null;
  const x=Number(v); return Number.isFinite(x)?x:null;
};
const pcs=v=>n(v)===null?'—':`${n(v)} pcs`;
const visualVariance=item=>{
  const expected=n(item?.expectedClosing), physical=n(item?.physicalClosing);
  if(expected===null||physical===null)return '—';
  const d=physical-expected;
  return `${d>0?'+':''}${d} pcs`;
};
const dateLabel=key=>{
  const m=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return String(key||'Tanggal tidak diketahui');
  return `${Number(m[3])} ${MONTH[Number(m[2])-1]||m[2]} ${m[1]}`;
};
const meta=status=>META[status]||META.UNRESOLVED;
const badge=status=>{
  const m=meta(status);
  return `<span class="sj-r10-status ${m.cls}">${esc(m.label)}</span>`;
};

function normalized(groups){
  return groups?.summary&&Array.isArray(groups?.groups)
    ? groups
    : {summary:{total:0,unresolved:0,needsOpname:0,resolved:0},groups:[]};
}

function findItem(model,ref){
  for(const group of model.groups){
    for(const item of group.items||[]){
      if(String(item.reference)===String(ref))return item;
    }
  }
  return null;
}

function kpis(s={}){
  return `<section class="sj-r10-kpis">
    <article data-r10-kpi="unresolved"><small>Belum Diselesaikan</small><strong>${esc(s.unresolved??0)}</strong></article>
    <article data-r10-kpi="needs-opname"><small>Perlu Opname</small><strong>${esc(s.needsOpname??0)}</strong></article>
    <article data-r10-kpi="resolved"><small>Sudah Diselesaikan</small><strong>${esc(s.resolved??0)}</strong></article>
  </section>`;
}

function itemCard(item={}){
  return `<button type="button" class="sj-r10-recon-item" data-r10-recon-item="${esc(item.reference)}">
    <div class="sj-r10-item-head">
      <span><b>${esc(item.name||item.code||'Cup')}</b><small>${esc(item.shiftLabel||'Shift')}</small></span>
      ${badge(item.status)}
    </div>
    <div class="sj-r10-item-metrics">
      <span><small>Sistem</small><strong>${esc(pcs(item.expectedClosing))}</strong></span>
      <span><small>Fisik</small><strong>${esc(pcs(item.physicalClosing))}</strong></span>
      <span><small>Selisih</small><strong>${esc(visualVariance(item))}</strong></span>
    </div>
    <span class="sj-r10-open-hint">Lihat detail <b>›</b></span>
  </button>`;
}

function dateGroup(group={},open=false){
  const c=group.counts||{};
  return `<section class="sj-r10-date-group ${open?'expanded':''}" data-r10-recon-date="${esc(group.dateKey)}">
    <button type="button" class="sj-r10-date-toggle" data-r10-date-toggle="${esc(group.dateKey)}" aria-expanded="${open?'true':'false'}">
      <span class="sj-r10-date-title"><b>${esc(dateLabel(group.dateKey))}</b><small>${esc(c.total??0)} rekonsiliasi</small></span>
      <span class="sj-r10-date-badges">
        ${c.unresolved?`<em class="unresolved">${esc(c.unresolved)} belum</em>`:''}
        ${c.needsOpname?`<em class="needs-opname">${esc(c.needsOpname)} opname</em>`:''}
        ${c.resolved?`<em class="resolved">${esc(c.resolved)} selesai</em>`:''}
      </span>
      <span class="sj-r10-date-chevron">${open?'⌃':'⌄'}</span>
    </button>
    ${open?`<div class="sj-r10-date-items">${(group.items||[]).map(itemCard).join('')}</div>`:''}
  </section>`;
}

function timeline(item={}){
  if(item.status==='RESOLVED'){
    return `<div class="sj-r10-timeline">
      <div class="done"><i></i><span><b>Tutup Shift</b><small>Rekonsiliasi cup tercatat.</small></span></div>
      ${item.resolution?`<div class="done"><i></i><span><b>Opname Inventory</b><small>${esc(item.resolution.id||'Movement Opname')}${n(item.resolution.beforeQty)!==null&&n(item.resolution.afterQty)!==null?` · ${esc(item.resolution.beforeQty)} → ${esc(item.resolution.afterQty)}`:''}</small></span></div>`:''}
      <div class="done"><i></i><span><b>Selesai</b><small>Rekonsiliasi selesai.</small></span></div>
    </div>`;
  }
  return `<div class="sj-r10-timeline">
    <div class="done"><i></i><span><b>Tutup Shift</b><small>Sistem ${esc(pcs(item.expectedClosing))} · Fisik ${esc(pcs(item.physicalClosing))} · Selisih ${esc(visualVariance(item))}</small></span></div>
    <div class="active"><i></i><span><b>${item.status==='NEEDS_OPNAME'?'Menunggu Opname':'Menunggu Tindak Lanjut'}</b><small>${item.status==='NEEDS_OPNAME'?'Belum ada koreksi stok Inventory V2.':'Evidence rekonsiliasi belum lengkap.'}</small></span></div>
    <div><i></i><span><b>Selesai</b><small>Belum tercapai.</small></span></div>
  </div>`;
}

function detail(item={}){
  const actionable=item.status==='NEEDS_OPNAME'&&item.ingredientId&&n(item.physicalClosing)!==null;
  return `<section class="sj-r10-cup-recon sj-r10-detail" data-r10-recon-detail="${esc(item.reference)}">
    <button type="button" class="sj-r10-back" data-r10-detail-back>‹ Kembali ke Rekonsiliasi Cup</button>
    <header class="sj-r10-detail-hero">
      <div><small>Kemasan · pcs</small><h3>${esc(item.name||item.code||'Cup')}</h3><p>${esc(item.shiftLabel||'Shift')} · ${esc(dateLabel(item.dateKey))}</p></div>
      ${badge(item.status)}
    </header>
    <section class="sj-r10-detail-section">
      <div class="sj-r10-section-head"><h3>Detail Rekonsiliasi</h3></div>
      <div class="sj-r10-detail-metrics">
        <article><small>Stok Sistem</small><strong>${esc(pcs(item.expectedClosing))}</strong></article>
        <article><small>Hitung Fisik</small><strong>${esc(pcs(item.physicalClosing))}</strong></article>
        <article><small>Selisih</small><strong>${esc(visualVariance(item))}</strong></article>
      </div>
    </section>
    ${item.reason||item.reasonNote?`<section class="sj-r10-detail-section">
      <div class="sj-r10-section-head"><h3>Alasan Selisih</h3></div>
      <div class="sj-r10-reason">${item.reason?`<b>${esc(item.reason)}</b>`:''}${item.reasonNote?`<p>${esc(item.reasonNote)}</p>`:''}</div>
    </section>`:''}
    <section class="sj-r10-detail-section">
      <div class="sj-r10-section-head"><h3>Tindak Lanjut</h3></div>
      <div class="sj-r10-followup">
        <div><small>Status</small>${badge(item.status)}</div>
        ${actionable?`<button type="button" class="sj-r10-primary-action" data-r10-opname-ref="${esc(item.reference)}">Buat Opname Sekarang <span>→</span></button>`:''}
      </div>
    </section>
    <section class="sj-r10-detail-section">
      <div class="sj-r10-section-head"><h3>Jejak Proses</h3></div>
      ${timeline(item)}
    </section>
    <button type="button" class="sj-r10-stock-activity" data-r10-stock-activity="${esc(item.ingredientId||'')}">
      <span><b>Lihat Aktivitas Stok</b><small>Riwayat movement Inventory V2</small></span><b>›</b>
    </button>
  </section>`;
}

export function renderCupReconciliationV1({groups,expandedDates=[],selectedRef=''}={}){
  const model=normalized(groups);
  if(selectedRef){
    const item=findItem(model,selectedRef);
    return item?detail(item):`<section class="sj-r10-cup-recon"><button type="button" class="sj-r10-back" data-r10-detail-back>‹ Kembali ke Rekonsiliasi Cup</button><div class="sj-r10-empty">Data rekonsiliasi tidak ditemukan.</div></section>`;
  }
  const expanded=new Set((expandedDates||[]).map(String));
  return `<section class="sj-r10-cup-recon" data-r10-cup-reconciliation>
    <header class="sj-r10-page-head"><div><small>Bahan &amp; Gudang</small><h2>Jejak Rekonsiliasi Cup</h2><p>Riwayat selisih cup per shift dan penyelesaiannya melalui Opname.</p></div></header>
    ${kpis(model.summary)}
    <section class="sj-r10-history">
      <div class="sj-r10-section-head"><h3>Riwayat per Tanggal</h3><span>${esc(model.summary.total??0)} rekonsiliasi</span></div>
      ${model.groups.length?model.groups.map(g=>dateGroup(g,expanded.has(String(g.dateKey)))).join(''):'<div class="sj-r10-empty">Belum ada rekonsiliasi cup.</div>'}
    </section>
    <aside class="sj-r10-authority-note"><b>Inventory V2 tetap sumber stok resmi</b><span>Rekonsiliasi hanya membandingkan dan menelusuri evidence. Koreksi stok dilakukan melalui Opname.</span></aside>
  </section>`;
}
