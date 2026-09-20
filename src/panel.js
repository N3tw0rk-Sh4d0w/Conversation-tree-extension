'use strict';

window.CT = window.CT || {};
window.CT.panel = (function () {
  const U = window.CT.utils;

  const PLATFORM_LABELS = {
    claude: 'Claude',
    gemini: 'Gemini',
    kimi: 'Kimi',
    perplexity: 'Perplexity',
    copilot: 'Copilot',
    grok: 'Grok',
    generic: 'Autres IA (générique)'
  };

  const USER_PREFIX = 'Vous avez dit : ';
  const CSS = `
.ct-scope{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.45;--ct-bg:#ffffff;--ct-fg:#1f2328;--ct-border:rgba(27,31,36,.14);--ct-border2:rgba(27,31,36,.24);--ct-btn:#f6f8fa;--ct-btn-h:#eef1f4;--ct-btn-fg:#1f2328;--ct-muted:#57606a;--ct-accent:#1f6feb;--ct-accent-fg:#ffffff;--ct-active:#ddf4ff;--ct-fab:rgba(31,111,235,.35);color:var(--ct-fg);}
@media (prefers-color-scheme: dark){
.ct-scope{--ct-bg:#0d1117;--ct-fg:#e6edf3;--ct-border:#30363d;--ct-border2:#444c56;--ct-btn:#21262d;--ct-btn-h:#2d333b;--ct-btn-fg:#e6edf3;--ct-muted:#8b949e;--ct-accent:#1f6feb;--ct-accent-fg:#ffffff;--ct-active:#163b5f;--ct-fab:rgba(31,111,235,.35);color:var(--ct-fg);}
}
.ct-fab{position:fixed;right:14px;bottom:14px;width:42px;height:42px;border-radius:12px;border:none;cursor:pointer;background:var(--ct-accent);color:var(--ct-accent-fg);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px var(--ct-fab);transition:transform .15s ease;z-index:2147483500;}
.ct-fab:hover{transform:scale(1.06);}
.ct-fab img{width:22px;height:22px;border-radius:6px;}
.ct-fab[hidden]{display:none;}
.ct-panel{position:fixed;top:0;right:0;bottom:0;width:340px;max-width:88vw;background:var(--ct-bg);color:var(--ct-fg);border-left:1px solid var(--ct-border2);box-shadow:-8px 0 28px rgba(0,0,0,.14);display:flex;flex-direction:column;z-index:2147483500;}
.ct-panel[hidden]{display:none;}
.ct-head{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--ct-border);}
.ct-title{flex:1;font-weight:700;font-size:13.5px;}
.ct-btn{border:1px solid var(--ct-border2);background:var(--ct-btn);color:var(--ct-btn-fg);border-radius:8px;padding:3px 8px;cursor:pointer;font-size:12px;}
.ct-btn:hover{background:var(--ct-btn-h);}
.ct-btn.primary{background:var(--ct-accent);color:var(--ct-accent-fg);border:none;font-weight:600;}
.ct-x{border:none;background:transparent;cursor:pointer;font-size:15px;line-height:1;color:var(--ct-fg);padding:2px 6px;border-radius:6px;}
.ct-x:hover{background:var(--ct-btn-h);}
.ct-search{padding:8px 12px;border-bottom:1px solid var(--ct-border);}
.ct-search input{width:100%;box-sizing:border-box;padding:6px 9px;border:1px solid var(--ct-border2);border-radius:8px;font-size:12.5px;outline:none;background:var(--ct-bg);color:var(--ct-fg);}
.ct-search input:focus{border-color:var(--ct-accent);}
.ct-search input::placeholder{color:var(--ct-muted);}
.ct-tree{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 0;}
.ct-node{padding:2px 0;}
.ct-row{display:flex;align-items:center;gap:6px;padding:4px 10px;cursor:pointer;border-radius:6px;margin:0 6px;user-select:none;}
.ct-row:hover{background:var(--ct-btn-h);}
.ct-row.active{background:var(--ct-active);}
.ct-node.node-active > .ct-row{background:var(--ct-active);}
.ct-caret{width:12px;height:12px;flex:none;color:var(--ct-muted);display:inline-flex;align-items:center;justify-content:center;transition:transform .12s ease;font-size:10px;}
.ct-caret.open{transform:rotate(90deg);}
.ct-caret.empty{visibility:hidden;}
.ct-ico{width:8px;height:8px;flex:none;border-radius:50%;}
.ct-ico.u{background:#8250df;}
.ct-ico.a{background:var(--ct-accent);}
.ct-txt{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;}
.ct-who{color:var(--ct-muted);}
.ct-count{flex:none;background:var(--ct-btn);border-radius:9px;padding:0 6px;font-size:10.5px;color:var(--ct-muted);}
.ct-kids{margin:0 0 2px 14px;padding-left:4px;border-left:1px solid var(--ct-border);}
.ct-hnode{padding:1px 0;}
.ct-heading{display:flex;align-items:flex-start;gap:6px;padding:3px 8px;margin:0 6px 0 0;cursor:pointer;border-radius:6px;}
.ct-heading:hover{background:var(--ct-btn-h);}
.ct-heading.active{background:var(--ct-active);}
.ct-heading.l1{font-weight:700;}
.ct-heading.l2{font-weight:600;}
.ct-bullet{flex:none;color:var(--ct-muted);transform:translateY(-1px);}
.ct-heading .ct-txt{white-space:normal;}
.ct-answer{margin:2px 0;}
.ct-anshead{display:flex;align-items:center;gap:6px;padding:5px 12px 2px;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ct-muted);}
.ct-empty{padding:24px 16px;text-align:center;color:var(--ct-muted);}
.ct-foot{border-top:1px solid var(--ct-border);padding:8px 12px;font-size:12px;display:flex;gap:10px;align-items:center;}
.ct-foot .ct-link{color:var(--ct-accent);cursor:pointer;text-decoration:none;}
.ct-foot .ct-link:hover{text-decoration:underline;}
.ct-foot .ct-top{margin-left:auto;cursor:pointer;font-weight:600;color:var(--ct-fg);}
.ct-modal{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:2147483501;}
.ct-modal[hidden]{display:none;}
.ct-mcard{width:286px;max-width:92vw;background:var(--ct-bg);color:var(--ct-fg);border:1px solid var(--ct-border2);border-radius:14px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.3);}
.ct-mhead{display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:13.5px;margin-bottom:10px;}
.ct-mfield{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12.5px;}
.ct-mfield input[type="checkbox"]{width:14px;height:14px;accent-color:var(--ct-accent);flex:none;}
.ct-mfield select{margin-left:auto;font-size:12px;padding:3px 6px;border-radius:6px;border:1px solid var(--ct-border2);background:var(--ct-bg);color:var(--ct-fg);}
.ct-msave{margin-top:14px;display:flex;gap:10px;align-items:center;}
.ct-note{font-size:11px;opacity:.7;margin-top:8px;color:var(--ct-muted);}`;

  const ICON = 'icons/icon16.png';

  let host = null;
  let shadow = null;
  let wrap = null;
  let treeEl = null;
  let searchEl = null;
  let panelEl = null;
  let fabEl = null;
  let modalEl = null;
  let open = false;
  let adapter = null;
  let expanded = new Set();
  let renderRefs = [];
  let seeded = false;
  let rowTimer = null;
  let reverseOrder = false;
  let state = { items: [], activeRef: null };

  function mount(platform) {
    if (host) return;
    adapter = platform;
    host = document.createElement('div');
    host.id = 'ct-host';
    host.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;';
    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);
    wrap = document.createElement('div');
    wrap.className = 'ct-scope';
    wrap.innerHTML =
      '<button class="ct-fab" data-act="toggle" title="Arbre de conversation">' +
      '<img alt="" src="' + U.esc(fabIconUrl()) + '"/>' +
      '</button>' +
      '<div class="ct-panel" hidden>' +
      '<div class="ct-head">' +
      '<div class="ct-title">Fil de conversation</div>' +
      '<button class="ct-btn" data-act="collapse" title="Réduire tout">Réduire</button>' +
      '<button class="ct-btn" data-act="loadall" title="Charger tout l\'historique (défilement auto)">Charger tout</button>' +
      '<button class="ct-btn" data-act="reverse" title="Inverser l\'ordre">↕</button>' +
      '<button class="ct-btn" data-act="settings" title="Réglages">…</button>' +
      '<button class="ct-x" data-act="close" title="Fermer">×</button>' +
      '</div>' +
      '<div class="ct-search"><input type="search" placeholder="Filtrer la conversation…" autocomplete="off" spellcheck="false"/></div>' +
      '<div class="ct-tree"></div>' +
      '<div class="ct-foot">' +
      '<span class="ct-link" data-act="top" title="Remonter au tout premier message">Début de conversation</span>' +
      '<span class="ct-link" data-act="settings">Réglages</span>' +
      '<span class="ct-top" data-act="close">Fermer</span>' +
      '</div>' +
      '</div>' +
      '<div class="ct-modal" hidden><div class="ct-mcard">' +
      '<div class="ct-mhead">Réglages<span class="ct-x" data-act="mhide">×</span></div>' +
      '<div class="ct-mbody"></div>' +
      '</div></div>';
    shadow.appendChild(wrap);
    document.documentElement.appendChild(host);

    panelEl = wrap.querySelector('.ct-panel');
    fabEl = wrap.querySelector('.ct-fab');
    treeEl = wrap.querySelector('.ct-tree');
    searchEl = wrap.querySelector('.ct-search input');
    modalEl = wrap.querySelector('.ct-modal');

    wrap.addEventListener('click', onTap);
    wrap.addEventListener('dblclick', onDbl);
    searchEl.addEventListener('input', U.debounce(onSearch, 120));
    ['keydown', 'keyup', 'keypress', 'beforeinput', 'compositionend'].forEach((t) => {
      searchEl.addEventListener(t, (e) => e.stopPropagation(), true);
    });
    document.addEventListener('keydown', onKey, true);
    return this;
  }

  function destroy() {
    if (document) {
      document.removeEventListener('keydown', onKey, true);
    }
    if (host && host.parentNode) host.parentNode.removeChild(host);
    host = null;
    shadow = null;
    wrap = null;
    treeEl = null;
    searchEl = null;
    panelEl = null;
    fabEl = null;
    modalEl = null;
    open = false;
    adapter = null;
    expanded = new Set();
    renderRefs = [];
    seeded = false;
    reverseOrder = false;
    state = { items: [], activeRef: null };
  }

  function fabIconUrl() {
    if (window.CT && typeof window.CT.iconUri === 'function') {
      const u = window.CT.iconUri();
      if (u) return u;
    }
    try {
      return chrome.runtime.getURL(ICON);
    } catch (e) {
      return 'icons/icon16.png';
    }
  }

  function onKey(e) {
    if (e.key !== 'Escape') return;
    if (modalEl && !modalEl.hidden) {
      modalEl.hidden = true;
      return;
    }
    if (open) setOpen(false);
  }

  function setOpen(v) {
    open = v;
    if (panelEl) panelEl.hidden = !v;
    if (fabEl) fabEl.hidden = v;
    if (v) pruneExpanded(state.items);
  }

  function onTap(e) {
    const actEl = e.target.closest('[data-act]');
    if (actEl) {
      const act = actEl.getAttribute('data-act');
      if (act === 'toggle') setOpen(!open);
      else if (act === 'close') setOpen(false);
      else if (act === 'collapse') collapseAll();
      else if (act === 'loadall') loadAllHistory();
      else if (act === 'reverse') toggleReverse();
      else if (act === 'settings') openSettings();
      else if (act === 'mhide') modalEl.hidden = true;
      else if (act === 'msave') saveSettingsFromModal();
      return;
    }
    const caret = e.target.closest('.ct-caret');
    if (caret && !caret.classList.contains('empty')) {
      const node = caret.closest('.ct-node');
      if (node) toggleRow(node.getAttribute('data-key'));
      return;
    }
    const heading = e.target.closest('.ct-heading');
    if (heading) {
      const item = itemByKey(heading.getAttribute('data-key'));
      if (item) {
        const hid = parseInt(heading.getAttribute('data-hid'), 10);
        const node = item.flat && item.flat[hid] ? item.flat[hid] : null;
        jumpTo(node && node.el, item);
      }
      return;
    }
    const row = e.target.closest('.ct-row');
    if (row) scheduleToggle(row);
  }

  function onDbl(e) {
    const row = e.target.closest('.ct-row');
    if (!row) return;
    clearTimeout(rowTimer);
    rowTimer = null;
    const item = itemByKey(row.getAttribute('data-key'));
    if (item) jumpTo(item.el, item);
  }

  function scheduleToggle(row) {
    clearTimeout(rowTimer);
    const key = row.getAttribute('data-key');
    rowTimer = setTimeout(() => {
      rowTimer = null;
      toggleRow(key);
    }, 240);
  }

  function toggleRow(key) {
    if (expanded.has(key)) expanded.delete(key);
    else expanded.add(key);
    render(state.items, true);
    updateCollapseButton();
  }

  function toggleReverse() {
    reverseOrder = !reverseOrder;
    render(state.items, true);
    const btn = wrap && wrap.querySelector('[data-act="reverse"]');
    if (btn) btn.textContent = reverseOrder ? '↑' : '↕';
    btn && (btn.title = reverseOrder ? 'Plus anciens en premier' : 'Plus récents en premier');
  }

  function loadAllHistory() {
    const btn = wrap && wrap.querySelector('[data-act="loadall"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Chargement...';
    }
    const scrollable = findScrollContainer();
    if (!scrollable) {
      if (btn) { btn.disabled = false; btn.textContent = 'Charger tout'; }
      return;
    }
    const originalTop = scrollable.scrollTop;
    const viewHeight = scrollable.clientHeight || window.innerHeight;
    let currentTop = scrollable.scrollTop;
    let lastHeight = scrollable.scrollHeight;
    let stuck = 0;

    function step() {
      if (currentTop <= 0) {
        // Reached top, wait a bit for any final content
        setTimeout(finish, 800);
        return;
      }
      currentTop = Math.max(0, currentTop - viewHeight * 0.8);
      scrollable.scrollTop = currentTop;

      // Check if new content loaded (height increased)
      if (scrollable.scrollHeight > lastHeight) {
        lastHeight = scrollable.scrollHeight;
        stuck = 0;
      } else {
        stuck++;
      }
      if (stuck > 6) { // no new content after 6 steps
        setTimeout(finish, 500);
        return;
      }
      setTimeout(step, 250);
    }

    function finish() {
      // Trigger immediate rebuild to capture all loaded messages
      if (typeof window.CT !== 'undefined' && window.CT.adapters && window.CT.adapters.clearCache) {
        window.CT.adapters.clearCache(); // force fresh rebuild with all DOM
      }
      if (typeof window.CT !== 'undefined' && window.CT.runtime && window.CT.runtime.forceRebuild) {
        window.CT.runtime.forceRebuild();
      }
      scrollable.scrollTop = originalTop;
      if (btn) { btn.disabled = false; btn.textContent = 'Charger tout'; }
    }

    step();
  }

  function findScrollContainer() {
    const candidates = [
      document.scrollingElement,
      document.body,
      document.documentElement,
      ...Array.from(document.querySelectorAll('[style*="overflow"], [class*="scroll"], [class*="virtual"], main, [role="main"]'))
    ];
    for (const el of candidates) {
      if (el && el.scrollHeight > el.clientHeight + 50) return el;
    }
    return document.scrollingElement || document.body;
  }

  function itemByKey(key) {
    return state.items.find((i) => i.key === key);
  }

  function jumpTo(el, item) {
    let target = el && el.isConnected ? el : null;
    if (!target && item && item.el && item.el.isConnected) target = item.el;
    if (!target && item) {
      // Try to find element in current DOM by data-ct-seq or text match
      const key = item.key || item.user?.key;
      if (key) {
        const bySeq = document.querySelector('[data-ct-seq="' + key + '"]');
        if (bySeq && bySeq.isConnected) target = bySeq;
      }
      if (!target && item.label) {
        // Fallback: find by text content match
        const candidates = document.querySelectorAll('[data-ct-seq]');
        for (const c of candidates) {
          if (!c.isConnected) continue;
          const t = (c.innerText || c.textContent || '').trim().slice(0, 120);
          if (t === (item.label || '').slice(0, 120) || t.includes(item.label.slice(0, 60))) {
            target = c;
            break;
          }
        }
      }
    }
    if (!target) return;
    if (U.scrollToEl(target)) {
      const r = target.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      setTimeout(() => U.flash(target), 220);
    }
  }

  function goTop() {
    if (!state.items.length) return;
    const first = state.items[0];
    jumpTo(first.el, first);
  }

  function collapseAll() {
    const hasExpanded = expanded.size > 0;
    if (hasExpanded) {
      expanded.clear();
    } else {
      // Expand all: add all item keys
      for (const it of state.items) expanded.add(it.key);
    }
    render(state.items, true);
    updateCollapseButton();
  }

  function updateCollapseButton() {
    const btn = wrap && wrap.querySelector('[data-act="collapse"]');
    if (btn) btn.textContent = expanded.size ? 'Réduire' : 'Déplier tout';
  }

  function onSearch() {
    render(state.items, true);
  }

  function openSettings() {
    buildSettingsModal();
    modalEl.hidden = false;
  }

  function buildSettingsModal() {
    const body = modalEl.querySelector('.ct-mbody');
    const cfg = (window.CT.settings && window.CT.settings.get && window.CT.settings.get()) || {};
    const platforms = cfg.platforms || {};
    const minLevel = cfg.minLevel || 1;
    let html = '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;opacity:.75;margin:4px 0 2px;">Plateformes analysées</div>';
    for (const p of window.CT.adapters.platforms) {
      const label = PLATFORM_LABELS[p.id] || p.id;
      const checked = platforms[p.id] !== false ? ' checked' : '';
      html +=
        '<label class="ct-mfield"><input type="checkbox" data-p="' + p.id + '"' + checked + '/>' +
        '<span>' + U.esc(label) + '</span></label>';
    }
    html +=
      '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;opacity:.75;margin:12px 0 2px;">Titres minimum</div>' +
      '<label class="ct-mfield"><span>Titre minimum</span>' +
      '<select data-ct="minLevel">' +
      [1, 2, 3, 4, 5, 6].map((n) => '<option value="' + n + '"' + (n === minLevel ? ' selected' : '') + '>h' + n + '</option>').join('') +
      '</select></label>' +
      '<div class="ct-msave">' +
      (window.CT.settings && typeof window.CT.settings.save === 'function'
        ? '<button class="ct-btn primary" data-act="msave">Enregistrer</button>'
        : '<span class="ct-note">Les réglages se gèrent depuis la fenêtre « Réglages » de l&apos;application de bureau.</span>') +
      '</div>';
    body.innerHTML = html;
  }

  function collectModal() {
    const platforms = {};
    modalEl.querySelectorAll('input[data-p]').forEach((cb) => {
      platforms[cb.getAttribute('data-p')] = cb.checked;
    });
    const minLevel = parseInt(modalEl.querySelector('select[data-ct="minLevel"]').value, 10) || 1;
    return { platforms, minLevel };
  }

  function saveSettingsFromModal() {
    const s = collectModal();
    if (window.CT.settings && typeof window.CT.settings.save === 'function') {
      window.CT.settings.save(s);
    }
    if (typeof window.CT.applySettings === 'function') window.CT.applySettings(s);
    modalEl.hidden = true;
  }

  function render(items, keepScroll) {
    state.items = items;
    if (!treeEl) return;
    const prev = keepScroll ? treeEl.scrollTop : 0;
    const q = (searchEl.value || '').trim().toLowerCase();
    if (!seeded && !q) {
      if (items.length) expanded.add(items[0].key);
      seeded = true;
    }
    const html = buildTree(items, q);
    treeEl.innerHTML = html;
    if (keepScroll) treeEl.scrollTop = prev;
    renderRefs = [];
    treeEl.querySelectorAll('.ct-row, .ct-heading').forEach((rowEl) => {
      const key = rowEl.getAttribute('data-key');
      const hid = parseInt(rowEl.getAttribute('data-hid') || '-1', 10);
      const it = state.items.find((i) => i.key === key);
      if (!it) return;
      const node = hid >= 0 && it.flat ? it.flat[hid] : null;
      const el = node && node.el ? node.el : it.el;
      renderRefs.push({ row: rowEl, el });
    });
    pruneExpanded(items);
    updateCollapseButton();
  }

  function pruneExpanded(items) {
    const alive = new Set(items.map((i) => i.key));
    for (const k of Array.from(expanded)) if (!alive.has(k)) expanded.delete(k);
  }

  function kidsHtml(nodes, itemKey, depth) {
    return nodes
      .map((n) => {
        const pad = 4 + depth * 13;
        return (
          '<div class="ct-hnode">' +
          '<div class="ct-heading l' + n.level + '" data-key="' + itemKey + '" data-hid="' + n.hid + '" style="padding-left:' + pad + 'px;">' +
          '<span class="ct-bullet">›</span>' +
          '<span class="ct-txt">' + U.esc(n.text) + '</span>' +
          '</div>' +
          (n.children.length ? '<div class="ct-kids">' + kidsHtml(n.children, itemKey, depth + 1) + '</div>' : '') +
          '</div>'
        );
      })
      .join('');
  }

  function stripPrefix(label) {
    const low = (label || '').toLowerCase();
    if (low.indexOf('vous avez dit') === 0 || low.indexOf('vous :') === 0) {
      const idx = (label || '').indexOf(':');
      if (idx >= 0 && idx < 40) return (label || '').slice(idx + 1).trim();
    }
    return label || '';
  }

  function buildTree(items, q) {
    if (!items.length) {
      return (
        '<div class="ct-empty">Aucun message détecté sur cette page.<br/><span style="font-size:11px;opacity:.8">L&apos;extension fonctionne sur Claude, Gemini, Kimi, Perplexity, Copilot, Grok et la plupart des IA de chat.</span></div>'
      );
    }
    const speaker = (adapter && adapter.speaker) || "L'IA";
    const parts = [];
    let visible = 0;
    const MAX = 2000;
    const srcItems = reverseOrder ? [...items].reverse() : items;
    for (const it of srcItems) {
      if (visible >= MAX) break;
      const kids = it.children || [];
      const labelMatch = !q || it.label.toLowerCase().includes(q);
      const kidMatch = q ? kids.some((n) => n.text.toLowerCase().includes(q)) : false;
      if (q && !labelMatch && !kidMatch) continue;
      const hasKids = kids.length > 0;
      const isOpen = q ? kidMatch : expanded.has(it.key);
      const dispLabel = stripPrefix(it.label);
      const partsKids =
        hasKids && isOpen
          ? '<div class="ct-answer"><div class="ct-anshead"><span class="ct-ico a"></span>' + U.esc(speaker) + ' a répondu :</div>' +
            '<div class="ct-kids">' + kidsHtml(kids, it.key, 1) + '</div></div>'
          : '';
      parts.push(
        '<div class="ct-node" data-key="' + it.key + '">' +
          '<div class="ct-row" data-key="' + it.key + '">' +
          '<span class="ct-caret ' + (hasKids ? isOpen ? 'open' : '' : 'empty') + '"></span>' +
          '<span class="ct-ico u"></span>' +
          '<span class="ct-txt"><span class="ct-who">' + USER_PREFIX + '</span>' + U.esc(dispLabel) + '</span>' +
          (hasKids ? '<span class="ct-count">' + it.flat.length + '</span>' : '') +
          '</div>' +
          partsKids +
          '</div>'
      );
      visible += 1;
    }
    if (!visible) {
      return '<div class="ct-empty">Aucun résultat pour ce filtre.</div>';
    }
    return parts.join('');
  }

  function onScroll() {
    const line = window.innerHeight * 0.28;
    let active = null;
    for (const ref of renderRefs) {
      const el = ref.el;
      if (!el || !el.isConnected) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= line) active = ref;
      else break;
    }
    if (active !== state.activeRef) {
      state.activeRef = active;
      for (const ref of renderRefs) {
        const isActive = active && ref.row === active.row;
        ref.row.classList.toggle('active', isActive);
        const node = ref.row.closest('.ct-node');
        if (node) node.classList.toggle('node-active', isActive);
      }
    }
  }

  return { mount, render, onScroll, destroy };
})();