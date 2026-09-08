(function () {
  'use strict';

  const VERSION = 'EMG-D1-P1-DASHFAST-R7';

  function install() {
    if (window.__SJ_EMG_D1_P1_DASH_FAST_R7) return true;
    const dashboard = window.SJRefinementRoleDashboardV100;
    if (!dashboard || typeof dashboard.ownerHTML !== 'function') return false;

    window.__SJ_EMG_D1_P1_DASH_FAST_R7 = true;
    // Keep the old marker for compatibility with diagnostics that only test installation.
    window.__SJ_EMG_D1_P1_DASH_FAST_R4 = true;
    const baseOwnerHTML = dashboard.ownerHTML.bind(dashboard);
    dashboard.ownerHTML = function (model) {
      let html = baseOwnerHTML(model);
      if (model?._sjFastLocal || model?.finance?.unavailable === true) {
        html = html.replace('Terakhir tersinkronisasi • Hari ini', 'Data lokal • sedang memperbarui');
      }
      return html;
    };

    window.SJDashboardFastP1 = Object.freeze({
      version: VERSION,
      mode: 'presentation-only',
    });
    return true;
  }

  // Script order guarantees the dashboard authority is installed before this compat.
  // R7 deliberately adds no retry timers/readers/cache authority here.
  install();
})();
