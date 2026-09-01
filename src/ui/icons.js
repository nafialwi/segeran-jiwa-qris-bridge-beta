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
function solidCanonical(name){
  const alias={cart:'sale',chart:'reports',package:'warehouse-box',product:'warehouse-box',inventory:'warehouse-box',user:'account-circle',users:'customers',employee:'id-card',device:'devices',store:'storefront',security:'shield-lock',activity:'history',diagnostics:'stethoscope',backup:'cloud-upload',clock:'shift',repeat:'refund'};
  return alias[name]||name;
}

const SOLID_ICON_BODY=Object.freeze({
  home:'<path fill="currentColor" d="M3 11.1 12 3.5l9 7.6v9.4h-6.2v-6.1H9.2v6.1H3z"/>',
  sale:'<path fill="currentColor" d="M3 4.5h3.2l1.9 9.1a2 2 0 0 0 2 1.6h7.3a2 2 0 0 0 1.9-1.4L21 7H7.2l-.5-2.5H3z"/><circle cx="10" cy="19" r="1.7" fill="currentColor"/><circle cx="17.5" cy="19" r="1.7" fill="currentColor"/>',
  operations:'<path fill="currentColor" d="M3.4 7.1 12 2.7l8.6 4.4L12 11.6z"/><path fill="currentColor" d="M3.4 8.7 11.1 12.6v8.5l-7.7-3.9z"/><path fill="currentColor" d="M20.6 8.7 12.9 12.6v8.5l7.7-3.9z"/><path d="M12 11.6v9.1M3.8 7.3 12 11.6l8.2-4.3" fill="none" stroke="white" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>',
  reports:'<rect x="4" y="12" width="3.6" height="8" rx="1" fill="currentColor"/><rect x="10.2" y="5" width="3.6" height="15" rx="1" fill="currentColor"/><rect x="16.4" y="9" width="3.6" height="11" rx="1" fill="currentColor"/>',
  settings:'<g fill="currentColor"><rect x="10.25" y="1.7" width="3.5" height="5.2" rx="1.4"/><rect x="10.25" y="17.1" width="3.5" height="5.2" rx="1.4"/><rect x="17.1" y="10.25" width="5.2" height="3.5" rx="1.4"/><rect x="1.7" y="10.25" width="5.2" height="3.5" rx="1.4"/><rect x="15.75" y="3.45" width="3.5" height="5.2" rx="1.4" transform="rotate(45 17.5 6.05)"/><rect x="4.75" y="14.35" width="3.5" height="5.2" rx="1.4" transform="rotate(45 6.5 16.95)"/><rect x="15.75" y="14.35" width="3.5" height="5.2" rx="1.4" transform="rotate(-45 17.5 16.95)"/><rect x="4.75" y="3.45" width="3.5" height="5.2" rx="1.4" transform="rotate(-45 6.5 6.05)"/><circle cx="12" cy="12" r="7"/></g><circle cx="12" cy="12" r="3.1" fill="white"/>',
  'shopping-bag':'<path fill="currentColor" d="M5.2 8h13.6l1 12H4.2z"/><path d="M8.6 9V6.5a3.4 3.4 0 0 1 6.8 0V9" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round"/>',
  'category-grid':'<rect x="3.5" y="3.5" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4" fill="currentColor"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4" fill="currentColor"/>',
  'warehouse-box':'<path fill="currentColor" d="M3.2 7.5 12 2.8l8.8 4.7L12 12.1z"/><path fill="currentColor" d="M3.2 9.1 11 13v8.2l-7.8-3.9z"/><path fill="currentColor" d="M20.8 9.1 13 13v8.2l7.8-3.9z"/><path d="M12 12.1v8.7M7.2 5.5l8.8 4.7" fill="none" stroke="white" stroke-width="1.25" stroke-linecap="round"/>',
  customers:'<circle cx="9" cy="8" r="4" fill="currentColor"/><path fill="currentColor" d="M2.7 20c.4-4.7 2.6-7.1 6.3-7.1s5.9 2.4 6.3 7.1z"/><circle cx="17.2" cy="8.5" r="3" fill="currentColor" opacity=".9"/><path fill="currentColor" d="M15.2 13.2c3.6.3 5.7 2.5 6 6.8h-4.6c-.2-2.7-.8-4.8-1.4-6.8z" opacity=".9"/>',
  'id-card':'<rect x="2.5" y="5" width="19" height="14" rx="2.2" fill="currentColor"/><circle cx="7.8" cy="10" r="2.3" fill="white"/><path d="M5 15.7c.3-2.3 1.2-3.6 2.8-3.6s2.5 1.3 2.8 3.6M13 9.3h5M13 13h5M13 16.5h3.7" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round"/>',
  'account-circle':'<circle cx="12" cy="12" r="10" fill="currentColor"/><circle cx="12" cy="9" r="3.2" fill="white"/><path fill="white" d="M5.8 19.2c.5-4.1 2.7-6.1 6.2-6.1s5.7 2 6.2 6.1A8.6 8.6 0 0 1 12 21a8.6 8.6 0 0 1-6.2-1.8z"/>',
  'users-access':'<circle cx="8.5" cy="8" r="3.8" fill="currentColor"/><path fill="currentColor" d="M2.5 20c.4-4.6 2.5-6.9 6-6.9 3.4 0 5.5 2.1 6 6.4v.5z"/><circle cx="17.2" cy="8.5" r="2.7" fill="currentColor" opacity=".9"/><path fill="currentColor" d="M15.4 14.1h6.1v2.2h-6.1z"/><path fill="currentColor" d="M17.35 12.15h2.2v6.1h-2.2z"/>',
  devices:'<rect x="2.2" y="4" width="14.5" height="10.8" rx="1.7" fill="currentColor"/><path fill="currentColor" d="M7.2 16h4.5v2H14v2H4.8v-2h2.4z"/><rect x="16" y="8" width="6" height="12.5" rx="1.4" fill="currentColor"/><rect x="17.2" y="9.5" width="3.6" height="8" rx=".5" fill="white"/>',
  palette:'<path fill="currentColor" d="M12 2.7a9.3 9.3 0 0 0 0 18.6h1.6c2 0 3.2-2.3 2-3.8l-.5-.6c-.8-1-.1-2.5 1.2-2.5h2A3.7 3.7 0 0 0 22 10.7C22 6.1 17.7 2.7 12 2.7z"/><circle cx="7.2" cy="9" r="1.25" fill="white"/><circle cx="10" cy="6.2" r="1.25" fill="white"/><circle cx="14.1" cy="6.2" r="1.25" fill="white"/><circle cx="17" cy="9.2" r="1.25" fill="white"/>',
  storefront:'<path fill="currentColor" d="M4.2 8.2 6 3.5h12l1.8 4.7z"/><path fill="currentColor" d="M4 10h16v10.5H4z"/><path d="M8.5 20.5v-6h7v6M4 9c0 2.1 3 2.1 3 0 0 2.1 3.2 2.1 3.2 0 0 2.1 3.6 2.1 3.6 0 0 2.1 3.2 2.1 3.2 0 0 2.1 3 2.1 3 0" fill="none" stroke="white" stroke-width="1.25" stroke-linecap="round"/>',
  printer:'<path fill="currentColor" d="M6.2 3h11.6v6H6.2z"/><rect x="2.4" y="8" width="19.2" height="10" rx="2.4" fill="currentColor"/><rect x="6.2" y="14" width="11.6" height="7" rx="1" fill="white"/><circle cx="18.4" cy="11.3" r="1" fill="white"/>',
  bell:'<path fill="currentColor" d="M12 2.8a6.2 6.2 0 0 0-6.2 6.3c0 4.8-1.9 6.3-3.1 7.8-.5.6-.1 1.5.7 1.5h17.2c.8 0 1.2-.9.7-1.5-1.2-1.5-3.1-3-3.1-7.8A6.2 6.2 0 0 0 12 2.8z"/><path fill="currentColor" d="M9 19.3h6c-.4 1.4-1.4 2.2-3 2.2s-2.6-.8-3-2.2z"/>',
  'shield-lock':'<path fill="currentColor" d="M12 2.2 20.4 5v6.4c0 5.3-3.5 8.4-8.4 10.4-4.9-2-8.4-5.1-8.4-10.4V5z"/><rect x="8.5" y="11" width="7" height="6" rx="1.2" fill="white"/><path d="M10.2 11V9.7a1.8 1.8 0 0 1 3.6 0V11" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  history:'<path d="M4.3 8.2A8.5 8.5 0 1 1 4 16.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path fill="currentColor" d="M1.8 4.7h5.8v5.8H1.8z"/><path d="M12 7v5l3.7 2.2" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>',
  stethoscope:'<path d="M6 3v7a4.8 4.8 0 0 0 9.6 0V3M4 3h4M13.6 3h4M10.8 17.4c.8 2 2.5 3.2 4.8 3.2 2.7 0 4.4-1.7 4.4-4.4v-1" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="13" r="2.3" fill="currentColor"/>',
  'cloud-upload':'<path fill="currentColor" d="M6.7 19.5a5.2 5.2 0 0 1-.9-10.3A6.9 6.9 0 0 1 19 10.4a4.4 4.4 0 0 1-.5 8.8z"/><path d="M12 17V9.3M8.9 12.3 12 9l3.1 3.3" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  'shield-alert':'<path fill="currentColor" d="M12 2.2 20.4 5v6.4c0 5.3-3.5 8.4-8.4 10.4-4.9-2-8.4-5.1-8.4-10.4V5z"/><path d="M12 7.4v6.5" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="white"/>',
  logout:'<path fill="currentColor" d="M4 3.5h8v3H7v11h5v3H4z"/><path fill="currentColor" d="m13 7 6 5-6 5v-3.2H9.5v-3.6H13z"/>',
  cash:'<rect x="2.7" y="5.2" width="18.6" height="13.6" rx="2.2" fill="currentColor"/><circle cx="12" cy="12" r="3.2" fill="white"/><path d="M5.5 8.3h3M15.5 15.7h3" stroke="white" stroke-width="1.4" stroke-linecap="round"/>',
  wallet:'<rect x="2.5" y="5" width="17" height="15" rx="2.2" fill="currentColor"/><path fill="currentColor" d="M16 9h6v8h-6a4 4 0 1 1 0-8z"/><circle cx="17.5" cy="13" r="1.1" fill="white"/>',
  shift:'<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M12 6.8v5.4l3.5 2.1" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/>',
  note:'<path fill="currentColor" d="M5 2.8h10.3L19 6.5v14.7H5z"/><path fill="white" d="M14.5 2.8v4.5H19z"/><path d="M8.2 11h7.4M8.2 14.6h7.4M8.2 18.2h5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>',
  refund:'<path d="M6.3 6.5A8.3 8.3 0 1 1 4 15.5M17.7 17.5A8.3 8.3 0 0 1 20 8.5" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/><path fill="currentColor" d="M2.2 3.1h6.5v6.5H2.2zM15.3 14.4h6.5v6.5h-6.5z"/>',
  database:'<path fill="currentColor" d="M3.5 6c0-2.5 3.8-4 8.5-4s8.5 1.5 8.5 4-3.8 4-8.5 4S3.5 8.5 3.5 6z"/><path fill="currentColor" d="M3.5 7.5c1.8 1.7 4.8 2.5 8.5 2.5s6.7-.8 8.5-2.5V12c0 2.4-3.8 4-8.5 4s-8.5-1.6-8.5-4z"/><path fill="currentColor" d="M3.5 13.5c1.8 1.7 4.8 2.5 8.5 2.5s6.7-.8 8.5-2.5V18c0 2.4-3.8 4-8.5 4s-8.5-1.6-8.5-4z"/>',
  'check-circle':'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.2 3 3 6.2-6.5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'warning-triangle':'<path fill="currentColor" d="M10.3 3.8a2 2 0 0 1 3.4 0l8 13.8a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3z"/><path d="M12 8v5" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="white"/>',
  'x-circle':'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="white" stroke-width="2" stroke-linecap="round"/>',
  camera:'<rect x="3" y="6.5" width="18" height="13" rx="2.3" fill="currentColor"/><path fill="currentColor" d="M8.5 6.5 10 4h4l1.5 2.5z"/><circle cx="12" cy="13" r="3.5" fill="white"/><circle cx="12" cy="13" r="2" fill="currentColor"/>',
  crown:'<path fill="currentColor" d="M3 7.2 7.2 11 12 4l4.8 7L21 7.2l-2.1 10.3H5.1z"/><rect x="5.5" y="18.5" width="13" height="2.3" rx="1" fill="currentColor"/>'
});

export function renderFilledIcon(name,{size=20,label='',className='sj-ref-icon'}={}){
  const key=solidCanonical(name);
  const body=SOLID_ICON_BODY[key];
  if(!body)return renderIcon(name,{size,label,className});
  const aria=label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"';
  return `<svg class="${esc(className)}" data-sj-icon-variant="solid" width="${Number(size)||20}" height="${Number(size)||20}" viewBox="0 0 24 24"${aria}>${body}</svg>`;
}
export function renderIcon(name,{size=20,label='',className='sj-ref-icon'}={}){
  const icon=resolve(name);
  const aria=label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"';
  return `<svg class="${esc(className)}" width="${Number(size)||20}" height="${Number(size)||20}" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${aria}>${icon.paths.map(d=>`<path d="${esc(d)}"></path>`).join('')}</svg>`;
}
