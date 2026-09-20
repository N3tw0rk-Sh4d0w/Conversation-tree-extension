'use strict';

window.CT = window.CT || {};
window.CT.runtime = (function (CT) {
  let started = false;
  let lastSig = '';
  let mounted = false;

  function start(cfg) {
    if (started) return;
    started = true;
    cfg = cfg || {};

    const getSettings = cfg.getSettings || (() => ({}));
    const saveSettings = cfg.saveSettings || null;
    const getIconUri = cfg.getIconUri || (() => '');

    CT.settings = { get: getSettings, save: saveSettings };

    const settings = getSettings() || {};
    const adapter = CT.adapters.detect();
    CT.adapters.setConfig({ minLevel: settings.minLevel || 1 });

    const platforms = settings.platforms || {};
    const enabled =
      Object.prototype.hasOwnProperty.call(platforms, adapter.id)
        ? platforms[adapter.id] !== false
        : true;
    if (!enabled) return;

    const icon = getIconUri();
    if (icon) CT.iconUri = () => icon;

    function ensureMounted() {
      if (mounted) return;
      CT.panel.mount(adapter);
      mounted = true;
    }

    function rebuild(force) {
      if (!document.body) return;
      const items = CT.adapters.buildMessages(adapter);
      const sig = CT.adapters.signature(items);
      if (!force && sig === lastSig) return;
      lastSig = sig;
      if (!mounted && adapter.id === 'generic' && !items.length) return;
      ensureMounted();
      CT.panel.render(items);
    }

    window.CT.applySettings = function (s) {
      const pl = s && s.platforms;
      if (pl && Object.prototype.hasOwnProperty.call(pl, adapter.id) && pl[adapter.id] === false) {
        if (CT.panel && CT.panel.destroy) {
          CT.panel.destroy();
          mounted = false;
          lastSig = '';
        }
        return;
      }
      CT.adapters.setConfig({ minLevel: (s && s.minLevel) || 1 });
      rebuild(true);
    };

    const initial = () => rebuild(adapter.id === 'generic');
    window.setTimeout(initial, 120);
    window.setTimeout(() => rebuild(false), 700);

    const onMutations = CT.utils.debounce(() => rebuild(false), 150);
    new MutationObserver(onMutations).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    const onScroll = CT.utils.throttle(() => {
      rebuild(false);
      if (CT.panel && CT.panel.onScroll) CT.panel.onScroll();
    }, 120);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });

    const onNav = () => rebuild(true);
    window.addEventListener('load', onNav);
    window.addEventListener('popstate', onNav);
    window.addEventListener('hashchange', onNav);

    window.setInterval(() => rebuild(false), 1500);
  }

  function forceRebuild() {
    lastSig = '';
    rebuild(true);
  }

  return { start, forceRebuild };
})(window.CT);