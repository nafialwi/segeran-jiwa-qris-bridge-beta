/**
 * SC-02 fixed Firebase contracts.
 *
 * This module deliberately does not initialize Firebase and does not write data.
 * It only centralizes immutable roots/path construction for later repository use.
 */
export const POS_ROOT='toko_segeranjiwa_v58';
export const QRIS_ROOT='segeranjiwa_qris_beta_v1';

function cleanSegment(value){
  return String(value??'').split('/').filter(Boolean);
}
function joinRoot(root,segments){
  const parts=[root];
  for(const segment of segments) parts.push(...cleanSegment(segment));
  return parts.join('/');
}
export function posPath(...segments){return joinRoot(POS_ROOT,segments)}
export function qrisPath(...segments){return joinRoot(QRIS_ROOT,segments)}

export const databaseContract=Object.freeze({
  posRoot:POS_ROOT,
  qrisRoot:QRIS_ROOT,
  writeMode:'legacy-authority-only-sc02'
});
