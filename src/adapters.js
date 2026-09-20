'use strict';

window.CT = window.CT || {};
window.CT.adapters = (function () {
  const config = { minLevel: 1 };

  const UNIVERSAL_USER = [
    '[data-message-author-role="user"]',
    '[data-role="user"]',
    '[data-content="user-message"]',
    '[data-testid*="user"]',
    '[data-test-id*="user"]',
    'user-request',
    'user-query',
    '[class*="user-message"]',
    '[class*="user-query"]',
    '[class*="UserMessage"]',
    '[class*="message-user"]',
    '.user_query',
    '.user-message',
    '.user-chat',
    '.user-content',
    '.query',
    '.prompt-container'
  ];

  const platforms = [
    {
      id: 'claude',
      speaker: 'Claude',
      test(h) {
        return h === 'claude.ai' || h === 'claude.com' || /(^|\.)claude\.(ai|com)$/.test(h);
      },
      user: ['[data-testid="user-message"]'],
      heading: ['h1,h2,h3,h4,h5', '[role="heading"]']
    },
    {
      id: 'gemini',
      speaker: 'Gemini',
      test(h) {
        return h === 'gemini.google.com' || h === 'gemini.com' || /(^|\.)gemini\.(google\.com|com)$/.test(h);
      },
      user: ['[data-test-id="user-query"]'],
      heading: ['h1,h2,h3,h4', '[role="heading"]']
    },
    {
      id: 'kimi',
      speaker: 'Kimi',
      test(h) {
        return /(^|\.)kimi\.com$/.test(h) || h === 'kimi.moonshot.cn' || /(^|\.)kimi\.moonshot\.cn$/.test(h);
      },
      user: ['.user-chat', '[data-testid*="user-message"]', '[class*="user-chat"]'],
      heading: ['h1,h2,h3,h4,h5', '[role="heading"]']
    },
    {
      id: 'perplexity',
      speaker: 'Perplexity',
      test(h) {
        return /(^|\.)perplexity\.(ai|com)$/.test(h);
      },
      user: [
        '[data-testid="user-message"]',
        '[data-testid*="user"]',
        '.user_query',
        '[class*="user-query"]',
        '[class*="message-user"]',
        '.prompt-container'
      ],
      heading: ['h1,h2,h3,h4,h5', '[role="heading"]', '[class*="markdown"] h1', '[class*="markdown"] h2', '[class*="markdown"] h3', '[class*="markdown"] h4']
    },
    {
      id: 'copilot',
      speaker: 'Copilot',
      test(h) {
        return h === 'copilot.microsoft.com' || h === 'chat.bing.com' || /(^|\.)bing\.com$/.test(h);
      },
      user: ['[data-content="user-message"]', '[data-testid*="user-message"]'],
      heading: ['h1,h2,h3,h4,h5', '[role="heading"]']
    },
    {
      id: 'grok',
      speaker: 'Grok',
      test(h) {
        return /(^|\.)grok\.com$/.test(h);
      },
      user: ['[data-testid*="user-message"]', '[class*="user-message"]', '[class*="UserMessage"]', '.message-user'],
      heading: ['h1,h2,h3,h4,h5', '[role="heading"]']
    },
    {
      id: 'generic',
      speaker: "L'IA",
      test() {
        return true;
      },
      user: [],
      heading: ['h1,h2,h3,h4,h5,h6', '[role="heading"]']
    }
  ];

  const SITE_CHROME = [
    'nav',
    'header',
    'footer',
    'aside',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="log"]',
    '[role="status"]',
    '[aria-live]',
    '[aria-label*="sidebar" i]',
    '[aria-label*="menu" i]'
  ];

  function detect() {
    const host = location.hostname || '';
    const found = platforms.filter((p) => p.test(host));
    return found.length ? found[0] : platforms[platforms.length - 1];
  }

  function setConfig(c) {
    if (c && typeof c.minLevel === 'number') config.minLevel = c.minLevel;
  }

  function firstMatch(list, root) {
    for (let i = 0; i < list.length; i += 1) {
      let ms = null;
      try {
        ms = root.querySelectorAll(list[i]);
      } catch (e) {
        continue;
      }
      const arr = ms && ms.length ? Array.from(ms) : null;
      if (arr && arr.length) return arr;
    }
    return [];
  }

  function dedupe(list) {
    const out = [];
    for (const el of list) {
      if (!el || !el.isConnected) continue;
      const parent = out.find((o) => o !== el && el.contains(o));
      if (parent) {
        const idx = out.indexOf(parent);
        out.splice(idx, 1, el);
        continue;
      }
      if (out.some((o) => o !== el && o.contains(el))) continue;
      out.push(el);
    }
    return out;
  }

  function insideSiteChrome(el) {
    for (const s of SITE_CHROME) {
      try {
        if (el.closest(s)) return true;
      } catch (e) {}
    }
    return false;
  }

  function inCode(el) {
    try {
      return !!el.closest('pre, code, .katex, [class*="code-b"]');
    } catch (e) {
      return true;
    }
  }

  function levelOf(h) {
    const aria = h.getAttribute ? h.getAttribute('aria-level') : null;
    if (aria) {
      const n = parseInt(aria, 10);
      if (n >= 1 && n <= 6) return n;
    }
    const m = (h.tagName || '').match(/\d/);
    const n = m ? parseInt(m[0], 10) : 99;
    return n >= 1 && n <= 6 ? n : 4;
  }

  function elText(el) {
    return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function headingCandidates() {
    const a = detect();
    return firstMatch(a.heading, document);
  }

  function headingObjects() {
    const list = headingCandidates();
    const min = config.minLevel || 1;
    return list
      .map((h) => ({ el: h, level: levelOf(h) }))
      .filter((h) => {
        if (!h.el.isConnected) return false;
        if (h.level < min) return false;
        if (h.level > 6) return false;
        if (inCode(h.el)) return false;
        if (insideSiteChrome(h.el)) return false;
        return elText(h.el).length > 0;
      });
  }

  function userElements() {
    const a = detect();
    const list = a.user.concat(UNIVERSAL_USER);
    const els = dedupe(firstMatch(list, document));
    return els.filter((u) => {
      if (!u.isConnected) return false;
      const tag = (u.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button' || tag === 'a' || tag === 'img' || tag === 'svg' || tag === 'label') {
        return false;
      }
      if (insideSiteChrome(u)) return false;
      return elText(u).length > 0;
    });
  }

  let seq = 0;

  function keyFor(el) {
    const ex = el.getAttribute && el.getAttribute('data-ct-seq');
    if (ex) return ex;
    seq += 1;
    if (el.setAttribute) el.setAttribute('data-ct-seq', String(seq));
    return String(seq);
  }

  const SEEN_CAP = 4000;
  let seenUsers = []; // { key, text, el, order, children:[{text,level}] }
  let seqMap = new Map();
  let fingerprint = '';

  function currentFp() {
    return (location.pathname || '') + (location.hash || '');
  }

  function syncFingerprint() {
    const fp = currentFp();
    if (fp !== fingerprint) {
      fingerprint = fp;
      clearCache();
    }
  }

  function insertionOrder(newEl) {
    if (!seenUsers.length) return 0;
    let before = Number.NEGATIVE_INFINITY;
    let after = Number.POSITIVE_INFINITY;
    for (const e of seenUsers) {
      if (!e.el || !e.el.isConnected) continue;
      const r = CT.utils.docOrder(e.el, newEl);
      if (r === 1 && e.order < after) after = e.order;
      else if (r === -1 && e.order > before) before = e.order;
    }
    if (!isFinite(before) && !isFinite(after)) return seenUsers.length;
    if (!isFinite(before)) before = after - 0.5;
    if (!isFinite(after)) after = before + 0.5;
    return (before + after) / 2;
  }

  function ensureEntry(u) {
    const attrKey = u.getAttribute && u.getAttribute('data-ct-seq');
    const existing = attrKey ? seqMap.get(attrKey) : null;
    if (existing) return existing;
    const loc = insertionOrder(u);
    let idx = seenUsers.findIndex((e) => e.order > loc);
    if (idx < 0) idx = seenUsers.length;
    const t = elText(u).slice(0, 80);
    const start = Math.max(0, idx - 4);
    const end = Math.min(seenUsers.length, idx + 4);
    for (let i = start; i < end; i += 1) {
      if (seenUsers[i].text.slice(0, 80) === t) {
        seenUsers[i].el = u;
        seenUsers[i].text = elText(u);
        return seenUsers[i];
      }
    }
    const ent = { key: keyFor(u), text: elText(u), el: u, order: loc, children: [] };
    seenUsers.push(ent);
    seqMap.set(ent.key, ent);
    if (seenUsers.length > SEEN_CAP) {
      const old = seenUsers.shift();
      seqMap.delete(old.key);
    }
    return ent;
  }

  function findEntry(u) {
    return seqMap.get(u.getAttribute && u.getAttribute('data-ct-seq')) || null;
  }

  function buildMessages() {
    syncFingerprint();
    const users = userElements().sort((a, b) => CT.utils.docOrder(a, b));
    const headsAll = headingObjects().sort((a, b) => CT.utils.docOrder(a.el, b.el));

    const live = [];
    for (const u of users) {
      const ent = ensureEntry(u);
      ent.text = elText(u);
      ent.order = live.length;
      live.push(ent);
    }

    for (const e of live) e.childrenEls = [];

    const builtHeads = headsAll.map((hh) => {
      let owner = null;
      for (const ent of live) {
        if (ent.el.contains(hh.el)) {
          owner = null;
          break;
        }
        if (CT.utils.docOrder(ent.el, hh.el) === -1) owner = ent;
      }
      return { owner, node: { text: CT.utils.textSnippet(hh.el, 70), level: hh.level, el: hh.el } };
    });

    for (const b of builtHeads) {
      if (b.owner) b.owner.childrenEls.push(b.node);
    }
    for (const ent of live) {
      ent.childrenEls.sort((a, b) => CT.utils.docOrder(a.el, b.el));
      ent.children = ent.childrenEls.map((n) => ({ text: n.text, level: n.level }));
    }

    const ordered = seenUsers.slice().sort((a, b) => a.order - b.order);
    const items = [];
    for (const ent of ordered) {
      let heads;
      if (ent.el && ent.el.isConnected && ent.childrenEls) {
        heads = ent.childrenEls.map((n) => ({ level: n.level, text: n.text, el: n.el }));
      } else {
        heads = (ent.children || []).map((c) => ({ level: c.level, text: c.text, el: null }));
      }
      const built = nestHeads(heads);
      const flatSig = built.flat.map((n) => n.level + ':' + n.text.length + ':' + n.text.slice(0, 12)).join(',');
      items.push({
        role: 'user',
        user: ent,
        el: ent.el && ent.el.isConnected ? ent.el : null,
        key: ent.key,
        label: ent.text,
        sig: 'u' + ent.text.length + ':' + ent.key + ':' + flatSig.length,
        children: built.children,
        flat: built.flat,
        live: !!(ent.el && ent.el.isConnected)
      });
    }
    return items;
  }

  function nestHeads(heads) {
    const root = [];
    const stack = [{ level: 0, children: root }];
    for (const h of heads) {
      while (stack.length > 1 && stack[stack.length - 1].level >= h.level) stack.pop();
      const node = { level: h.level, text: h.text, el: h.el, children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }
    let hid = 0;
    const flat = [];
    (function walk(nodes) {
      for (const n of nodes) {
        n.hid = hid;
        flat.push(n);
        hid += 1;
        walk(n.children);
      }
    })(root);
    return { children: root, flat };
  }

  function signature(items) {
    let s = '';
    for (const it of items) s += it.sig + ';';
    return s;
  }

  function clearCache() {
    seenUsers = [];
    seqMap = new Map();
  }

  return { detect, setConfig, buildMessages, signature, platforms, clearCache };
})();