const make=(paths,viewBox='0 0 24 24',strokeWidth=1.9)=>Object.freeze({viewBox,paths:Object.freeze(paths),strokeWidth});
const A=(name)=>Object.freeze({alias:name});

export const ICONS=Object.freeze({
  home:make(['M3.5 10.8 12 3.8l8.5 7','M5.5 9.8V20h13V9.8','M9.2 20v-6.2h5.6V20']),
  sale:make(['M3.5 5.5H6l2 9.3h9.6l2-6.6H7.2','M10 19h.01','M17.3 19h.01']),
  cart:A('sale'),
  chart:A('reports'),
  package:A('warehouse-box'),
  user:A('account-circle'),
  clock:A('shift'),
  repeat:A('refund'),
  arrow:A('chevron'),
  scan:make(['M4 8V5a1 1 0 0 1 1-1h3','M16 4h3a1 1 0 0 1 1 1v3','M20 16v3a1 1 0 0 1-1 1h-3','M8 20H5a1 1 0 0 1-1-1v-3','M7 12h10','M9 9v6','M15 9v6']),
  filter:make(['M4 6h16','M7 12h10','M10 18h4']),
  plusbox:make(['M12 8v8','M8 12h8','M4 4h16v16H4z']),
  receipt:make(['M6 3h12v18l-3-2-3 2-3-2-3 2V3Z','M9 8h6','M9 12h6','M9 16h4']),
  operations:make(['M4 7.2 12 3l8 4.2-8 4.3z','M4 7.2V17l8 4 8-4V7.2','M12 11.5V21']),
  reports:make(['M5 20V11','M12 20V5','M19 20v-7','M3 20h18']),
  settings:make(['M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z','M19.4 15.1l1.5 2.5-2.7 2.7-2.5-1.5a7.8 7.8 0 0 1-2 .8L13 22H9l-.7-2.4a8 8 0 0 1-2-.8l-2.5 1.5-2.7-2.7 1.5-2.5a8.3 8.3 0 0 1-.8-2L-.6 12V8l2.4-.7a8 8 0 0 1 .8-2L1.1 2.8 3.8.1l2.5 1.5a8 8 0 0 1 2-.8L9-1.6h4l.7 2.4a8 8 0 0 1 2 .8L18.2.1l2.7 2.7-1.5 2.5a8 8 0 0 1 .8 2l2.4.7v4l-2.4.7a8 8 0 0 1-.8 2.4Z']),

  'shopping-bag':make(['M6 8h12l1 12H5L6 8Z','M9 9V6a3 3 0 0 1 6 0v3']),
  'category-grid':make(['M4 4h6v6H4z','M14 4h6v6h-6z','M4 14h6v6H4z','M14 14h6v6h-6z']),
  'warehouse-box':make(['M3.5 8 12 3l8.5 5v11H3.5V8Z','M3.5 8 12 13l8.5-5','M12 13v8','M8 5.4 16.5 10']),
  customers:make(['M8.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z','M2.5 20c.3-4 2.4-6.3 6-6.3s5.7 2.3 6 6.3','M16.5 10a2.5 2.5 0 1 0 0-5','M15.3 14c3.5.3 5.4 2.4 5.7 5.6']),
  'id-card':make(['M3 6h18v13H3z','M7.5 11a2 2 0 1 0 0-4','M5 16c.2-2.4 1.3-3.7 2.5-3.7S9.8 13.6 10 16','M13 10h5','M13 14h4']),
  'account-circle':make(['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z','M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z','M6.8 19c.5-3.1 2.2-4.7 5.2-4.7s4.7 1.6 5.2 4.7']),
  'users-access':make(['M8.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z','M2.5 20c.3-4 2.4-6.3 6-6.3s5.7 2.3 6 6.3','M17 8.5V5.8','M15.6 7.2h2.8','M15 12.5h5.5','M17.8 10v5']),
  devices:make(['M3 5h13v10H3z','M7 19h5','M9.5 15v4','M18 9h3v10h-5v-7']),
  palette:make(['M12 3a9 9 0 0 0 0 18h1.4a1.7 1.7 0 0 0 0-3.4H12a2 2 0 1 1 0-4h2.2A6.8 6.8 0 0 0 12 3Z','M7.2 9h.01','M9.8 6.5h.01','M14.4 6.8h.01','M17 10h.01']),
  storefront:make(['M4 9 6 4h12l2 5','M3 9h18','M5 9v11h14V9','M9 20v-6h6v6','M5 9c0 2 3 2 3 0 0 2 4 2 4 0 0 2 3 2 3 0']),
  printer:make(['M7 8V3h10v5','M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2','M7 14h10v7H7z']),
  bell:make(['M18 9a6 6 0 0 0-12 0c0 6-2.5 6.5-3 8h18c-.5-1.5-3-2-3-8','M9.5 20h5']),
  'shield-lock':make(['M12 3 20 6v6c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6z','M9 13h6v5H9z','M10.5 13v-1.5a1.5 1.5 0 0 1 3 0V13']),
  history:make(['M4 8H1V5','M2 8a10 10 0 1 1 2 9','M12 7v5l3 2']),
  stethoscope:make(['M6 3v7a4 4 0 0 0 8 0V3','M4 3h4','M12 3h4','M10 17a4 4 0 0 0 8 0v-2','M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z']),
  'cloud-upload':make(['M7 18a5 5 0 0 1 1-9.8A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18H7Z','M12 16V9','M9 12l3-3 3 3']),
  'shield-alert':make(['M12 3 20 6v6c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6z','M12 8v5','M12 17h.01']),
  logout:make(['M10 4H5v16h5','M14 8l4 4-4 4','M8 12h10']),
  crown:make(['M4 8l3 3 5-6 5 6 3-3-2 9H6L4 8Z','M6 20h12']),
  'check-circle':make(['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z','M8 12l2.5 2.5L16.5 9']),
  offline:make(['M4 4l16 16','M8.5 8.2a6 6 0 0 1 7.2.6','M5.5 11.5a10 10 0 0 1 2-1.6','M8.8 15a5 5 0 0 1 5.6-.8','M12 19h.01']),
  help:make(['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z','M9.8 9a2.3 2.3 0 1 1 3.5 2c-1 .7-1.3 1.2-1.3 2.5','M12 17h.01']),
  chevron:make(['m9 6 6 6-6 6']),
  camera:make(['M4 7h4l1.5-2h5L16 7h4v12H4z','M12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z']),
  cash:make(['M3 6h18v12H3z','M7 10h4','M7 14h2','M16 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z']),
  wallet:make(['M3 6h15v13H3z','M3 9h15','M18 11h3v5h-3a2.5 2.5 0 1 1 0-5Z']),
  shift:make(['M12 3a9 9 0 1 0 9 9','M12 7v5l3 2','M17.5 4.5 21 4l-.5 3.5']),
  note:make(['M6 3h9l3 3v15H6z','M15 3v4h4','M9 11h6','M9 15h6']),
  refund:make(['M7 7H3v-4','M3 7a9 9 0 1 1-1 8','M17 17h4v4','M21 17a9 9 0 0 1 1-8']),
  activity:A('history'),
  diagnostics:A('stethoscope'),
  backup:A('cloud-upload'),
  product:A('warehouse-box'),
  category:A('category-grid'),
  store:A('storefront'),
  device:A('devices'),
  users:A('customers'),
  employee:A('id-card'),
  security:A('shield-lock'),
  inventory:A('warehouse-box'),
  image:make(['M4 4h16v16H4z','M7 16l4-4 3 3 2-2 3 3','M9 9h.01']),
  search:make(['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z','M15.5 15.5 21 21']),
  close:make(['M6 6l12 12','M18 6 6 18']),
  upload:make(['M12 16V4','M8 8l4-4 4 4','M4 20h16']),
  trash:make(['M4 7h16','M9 7V4h6v3','M7 7l1 14h8l1-14','M10 11v6','M14 11v6']),
  database:make(['M4 6c0-2 3.6-3 8-3s8 1 8 3-3.6 3-8 3-8-1-8-3Z','M4 6v6c0 2 3.6 3 8 3s8-1 8-3V6','M4 12v6c0 2 3.6 3 8 3s8-1 8-3v-6'])
});

function resolve(name){let icon=ICONS[name]??ICONS['warehouse-box'];let guard=0;while(icon?.alias&&guard++<5)icon=ICONS[icon.alias];return icon||ICONS['warehouse-box']}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
export function renderIcon(name,{size=20,label='',className='sj-ref-icon'}={}){
  const icon=resolve(name);
  const aria=label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"';
  return `<svg class="${esc(className)}" width="${Number(size)||20}" height="${Number(size)||20}" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${aria}>${icon.paths.map(d=>`<path d="${esc(d)}"></path>`).join('')}</svg>`;
}
