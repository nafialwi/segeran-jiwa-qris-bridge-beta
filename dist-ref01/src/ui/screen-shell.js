import { renderIcon } from './icons.js';
export const SYSTEM_STATES=Object.freeze(['loading','empty','error','success','offline','permission','retry']);
const META=Object.freeze({
  loading:{title:'Memuat',message:'Menyiapkan data…',icon:'activity',recoverable:true},
  empty:{title:'Belum ada data',message:'Belum ada data untuk ditampilkan.',icon:'note',recoverable:true},
  error:{title:'Terjadi kendala',message:'Data tidak dapat dimuat.',icon:'diagnostics',recoverable:true},
  success:{title:'Berhasil',message:'Perubahan berhasil diproses.',icon:'security',recoverable:true},
  offline:{title:'Koneksi terputus',message:'Sesi tetap tersimpan. Sambungkan kembali untuk validasi server.',icon:'activity',recoverable:true},
  permission:{title:'Akses dibatasi',message:'Akun ini tidak memiliki izin untuk tindakan tersebut.',icon:'security',recoverable:false},
  retry:{title:'Coba lagi',message:'Hubungkan kembali dan ulangi tindakan.',icon:'activity',recoverable:true}
});
export function stateModel(kind='empty',overrides={}){
  if(!SYSTEM_STATES.includes(kind)) throw new Error(`REF01_STATE_UNKNOWN:${kind}`);
  return Object.freeze({...META[kind],...overrides,kind});
}
export function renderState(kind,overrides={}){
  const m=stateModel(kind,overrides);
  return `<section class="sj-ref-state sj-ref-state-${m.kind}" role="status">${renderIcon(m.icon,{size:28})}<h3>${m.title}</h3><p>${m.message}</p>${m.recoverable&&m.kind!=='success'?'<button type="button" data-ref01-retry="true">Coba Lagi</button>':''}</section>`;
}
