'use strict';

(function () {
  if (!document.body) return;
  if (/^(about:|blob:|data:|chrome:)/.test(location.protocol || '')) return;
  if (location.protocol === 'chrome-extension:') return;

  chrome.storage.local.get('ct_settings', (res) => {
    const s = (res && res.ct_settings) || {};
    const iconUri = (() => {
      try {
        return chrome.runtime.getURL('icons/icon16.png');
      } catch (e) {
        return '';
      }
    })();
    window.CT.runtime.start({
      getSettings: () => s,
      saveSettings: (next) => {
        Object.assign(s, next);
        chrome.storage.local.set({ ct_settings: s });
      },
      getIconUri: () => iconUri
    });
  });
})();