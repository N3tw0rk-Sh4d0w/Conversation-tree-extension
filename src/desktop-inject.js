'use strict';

(function () {
  const readSettings = () => window.__CT_SETTINGS__ || {};
  const readIcon = () => window.__CT_ICON__ || '';

  function boot() {
    if (document.body) {
      window.CT.runtime.start({ getSettings: readSettings, getIconUri: readIcon });
    } else {
      window.setTimeout(boot, 250);
    }
  }

  boot();
})();