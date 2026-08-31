const make=(paths,viewBox='0 0 24 24')=>Object.freeze({viewBox,paths:Object.freeze(paths)});
export const ICONS=Object.freeze({
  home:make(['M3 11.5 12 4l9 7.5','M5.5 10.5V20h13v-9.5','M9.5 20v-6h5v6']),
  sale:make(['M4 5h2l2 10h9l2-7H7','M10 19h.01','M17 19h.01']),
  operations:make(['M4 7.5 12 3l8 4.5-8 4.5z','M4 7.5V17l8 4 8-4V7.5','M12 12v9']),
  reports:make(['M5 20V10','M12 20V4','M19 20v-7','M3 20h18']),
  settings:make(['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z','M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04-2.12 3.67-.06-.02a1.8 1.8 0 0 0-2.02-.2 1.8 1.8 0 0 0-.88 1.8V22H10.5v-.08a1.8 1.8 0 0 0-.9-1.55 1.8 1.8 0 0 0-1.98.2l-.06.03-2.12-3.68.04-.04A1.8 1.8 0 0 0 5.84 15a1.8 1.8 0 0 0-1.55-.9H4.2V9.9h.09a1.8 1.8 0 0 0 1.55-.9 1.8 1.8 0 0 0-.36-1.98l-.04-.04 2.12-3.67.06.02a1.8 1.8 0 0 0 2.02.2 1.8 1.8 0 0 0 .88-1.8V1.7h4.24v.08a1.8 1.8 0 0 0 .88 1.55 1.8 1.8 0 0 0 1.98-.2l.06-.03 2.12 3.68-.04.04A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.55.9h.09v4.2h-.09a1.8 1.8 0 0 0-1.55.9Z']),
  cash:make(['M3 6h18v12H3z','M7 10h4','M7 14h2','M16 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z']),
  users:make(['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M2.5 21c0-4 2.5-7 6.5-7s6.5 3 6.5 7','M16 9a3 3 0 1 0 0-6','M17 14c3.2.4 4.5 2.5 4.5 6']),
  inventory:make(['M4 7 12 3l8 4-8 4z','M4 7v10l8 4 8-4V7','M12 11v10']),
  shift:make(['M12 3a9 9 0 1 0 9 9','M12 7v5l3 2','M17.5 4.5 21 4l-.5 3.5']),
  note:make(['M6 3h9l3 3v15H6z','M15 3v4h4','M9 11h6','M9 15h6']),
  refund:make(['M7 7H3v-4','M3 7a9 9 0 1 1-1 8','M17 17h4v4','M21 17a9 9 0 0 1 1-8']),
  employee:make(['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M5 21c0-4 2.7-7 7-7s7 3 7 7','M9 3.5h6']),
  printer:make(['M7 8V3h10v5','M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2','M7 14h10v7H7z']),
  bell:make(['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9','M9 20h6']),
  security:make(['M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6z','M9 12l2 2 4-4']),
  activity:make(['M3 12a9 9 0 1 0 3-6.7L3 8','M3 3v5h5','M12 7v5l4 2']),
  diagnostics:make(['M4 13h3l2-5 4 10 2-5h5','M4 20h16','M4 4h16']),
  backup:make(['M7 18a5 5 0 0 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18H7Z','M12 10v7','M9 13l3-3 3 3']),
  camera:make(['M4 7h4l1.5-2h5L16 7h4v12H4z','M12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z']),
  image:make(['M4 4h16v16H4z','M7 16l4-4 3 3 2-2 3 3','M9 9h.01']),
  search:make(['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z','M15.5 15.5 21 21']),
  chevron:make(['m9 6 6 6-6 6']),
  close:make(['M6 6l12 12','M18 6 6 18']),
  upload:make(['M12 16V4','M8 8l4-4 4 4','M4 20h16']),
  trash:make(['M4 7h16','M9 7V4h6v3','M7 7l1 14h8l1-14','M10 11v6','M14 11v6']),
  product:make(['M4 7 12 3l8 4-8 4z','M4 7v10l8 4 8-4V7','M9 9.5l6-3']),
  category:make(['M4 4h6v6H4z','M14 4h6v6h-6z','M4 14h6v6H4z','M14 14h6v6h-6z']),
  store:make(['M4 9 6 4h12l2 5','M5 9v11h14V9','M9 20v-6h6v6','M3 9h18']),
  device:make(['M7 3h10v18H7z','M10 18h4']),
  palette:make(['M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a7 7 0 0 0-2-11Z','M7.5 9h.01','M10 6.5h.01','M15 7h.01','M17 10h.01']),
  database:make(['M4 6c0-2 3.6-3 8-3s8 1 8 3-3.6 3-8 3-8-1-8-3Z','M4 6v6c0 2 3.6 3 8 3s8-1 8-3V6','M4 12v6c0 2 3.6 3 8 3s8-1 8-3v-6'])
});

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
export function renderIcon(name,{size=20,label='',className='sj-ref-icon'}={}){
  const icon=ICONS[name]??ICONS.product;
  const aria=label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"';
  return `<svg class="${esc(className)}" width="${Number(size)||20}" height="${Number(size)||20}" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${aria}>${icon.paths.map(d=>`<path d="${esc(d)}"></path>`).join('')}</svg>`;
}
