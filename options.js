'use strict';

(function () {
  const DEFAULTS = {
    platforms: { claude: true, gemini: true, kimi: true, perplexity: true, copilot: true, grok: true, generic: true },
    minLevel: 1
  };

  const ids = ['claude', 'gemini', 'kimi', 'perplexity', 'copilot', 'grok', 'generic'];
  const savedEl = document.getElementById('saved');

  function load() {
    chrome.storage.local.get('ct_settings', (res) => {
      const s = Object.assign({}, DEFAULTS, (res && res.ct_settings) || {});
      const platforms = Object.assign({}, DEFAULTS.platforms, s.platforms || {});
      for (const id of ids) {
        document.getElementById('p_' + id).checked = platforms[id] !== false;
      }
      document.getElementById('minLevel').value = String(s.minLevel || 1);
    });
  }

  function save() {
    const platforms = {};
    for (const id of ids) platforms[id] = document.getElementById('p_' + id).checked;
    const settings = {
      platforms,
      minLevel: parseInt(document.getElementById('minLevel').value, 10) || 1
    };
    chrome.storage.local.set({ ct_settings: settings }, () => {
      savedEl.classList.add('show');
      setTimeout(() => savedEl.classList.remove('show'), 1800);
    });
  }

  document.getElementById('save').addEventListener('click', save);
  load();
})();