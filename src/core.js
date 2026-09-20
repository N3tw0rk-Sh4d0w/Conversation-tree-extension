'use strict';

window.CT = window.CT || {};
window.CT.utils = (function () {
  const debounce = (fn, wait) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const throttle = (fn, wait) => {
    let last = 0;
    let timer = null;
    return (...args) => {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn(...args);
      } else {
        clearTimeout(timer);
        timer = setTimeout(() => {
          last = Date.now();
          fn(...args);
        }, remaining);
      }
    };
  };

  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  const textSnippet = (node, max) => {
    if (!node) return '';
    let text = (node.innerText || node.textContent || '')
      .replace(/\s+/g, ' ')
      .replace(/[#*`>_~\\[\](){}]/g, '')
      .trim();
    if (text.length > max) text = text.slice(0, max) + '...';
    return text;
  };

  const scrollToEl = (el) => {
    if (!el || !el.isConnected) return false;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    } catch (e) {
      return false;
    }
  };

  const flash = (el, color) => {
    if (!el || !el.isConnected) return;
    const rect = el.getBoundingClientRect();
    const mask = document.createElement('div');
    Object.assign(mask.style, {
      position: 'fixed',
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      border: '2px solid ' + (color || '#f5cc57'),
      borderRadius: '10px',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      zIndex: '2147483647',
      boxShadow: '0 0 0 6px rgba(245,204,87,0.22)',
      transition: 'opacity .7s ease, box-shadow .7s ease'
    });
    document.documentElement.appendChild(mask);
    setTimeout(() => {
      mask.style.opacity = '0';
      mask.style.boxShadow = '0 0 0 0 rgba(245,204,87,0)';
    }, 650);
    setTimeout(() => mask.remove(), 1500);
  };

  const docOrder = (a, b) => {
    if (a === b) return 0;
    if (a.contains(b)) return -1;
    if (b.contains(a)) return 1;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  };

  return { debounce, throttle, esc, textSnippet, scrollToEl, flash, docOrder };
})();