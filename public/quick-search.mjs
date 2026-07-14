// Cmd/Ctrl+K Quick Search (Pagefind UI)
// This module is loaded site-wide (cached) while Pagefind UI assets are loaded lazily on first open.

const dialog = document.getElementById('quick-search');
const rootSelector = '#quick-search-root';
const closeBtn = dialog?.querySelector('.quick-search__close');
const status = dialog?.querySelector('.quick-search__status');
const triggers = [...document.querySelectorAll('[data-search-trigger]')];

const BASE_URL = (document.body?.dataset?.baseUrl || '/').trim();

let initPromise = null;
let returnFocus = null;

function isMac() {
  const platform =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    navigator.userAgent ||
    '';
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

function ensurePagefindUI() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // CSS
    const cssHref = `${BASE_URL}pagefind/pagefind-ui.css`;
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }

    // JS (non-ESM)
    const uiUrl = `${BASE_URL}pagefind/pagefind-ui.js`;
    if (!window.PagefindUI) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = uiUrl;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${uiUrl}`));
        document.head.appendChild(s);
      });
    }

    const UI = window.PagefindUI;
    if (!UI) throw new Error('PagefindUI not found on window after loading script');

    const mount = document.querySelector(rootSelector);
    if (!mount) return;
    mount.textContent = '';

    new UI({
      element: rootSelector,
      showImages: false,
      showSubResults: false,
      pageSize: 6,
      excerptLength: 18,
    });

    const input = mount.querySelector('.pagefind-ui__search-input');
    if (input) {
      input.placeholder = '搜索文章、Now 与标签…';
      input.setAttribute('aria-describedby', 'quick-search-shortcuts');
    }

    status?.setAttribute('hidden', '');
  })();

  initPromise.catch(() => {
    initPromise = null;
  });
  return initPromise;
}

async function openQuickSearch(trigger = document.activeElement) {
  if (!dialog) return;
  if (!dialog.open) {
    returnFocus = trigger instanceof HTMLElement ? trigger : null;
    dialog.showModal();
    triggers.forEach((item) => item.setAttribute('aria-expanded', 'true'));
  }

  try {
    await ensurePagefindUI();
    const input = dialog.querySelector('.pagefind-ui__search-input');
    input?.focus();
  } catch (e) {
    if (status) {
      status.hidden = false;
      status.dataset.state = 'error';
      status.textContent = '搜索组件加载失败，请刷新页面后重试。';
    }
    console.error('[quick-search] init failed', e);
  }
}

function closeQuickSearch() {
  if (!dialog) return;
  if (dialog.open) dialog.close();
}

function moveResultFocus(direction) {
  if (!dialog) return;
  const links = [...dialog.querySelectorAll('.pagefind-ui__result-link')];
  if (!links.length) return;

  const current = links.indexOf(document.activeElement);
  const next = current === -1
    ? direction > 0 ? 0 : links.length - 1
    : (current + direction + links.length) % links.length;

  links[next].focus();
  links[next].scrollIntoView({ block: 'nearest' });
}

// Global hotkeys

document.addEventListener('keydown', (e) => {
  const key = e.key?.toLowerCase();
  const want = key === 'k' && (e.metaKey || e.ctrlKey);
  if (want) {
    e.preventDefault();
    openQuickSearch(document.activeElement);
  }
});

triggers.forEach((trigger) => {
  trigger.addEventListener('click', () => openQuickSearch(trigger));
});

closeBtn?.addEventListener('click', closeQuickSearch);
dialog?.addEventListener('click', (e) => {
  // click backdrop to close
  if (e.target === dialog) closeQuickSearch();
});
dialog?.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeQuickSearch();
});
dialog?.addEventListener('close', () => {
  triggers.forEach((item) => item.setAttribute('aria-expanded', 'false'));
  returnFocus?.focus();
  returnFocus = null;
});
dialog?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveResultFocus(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveResultFocus(-1);
  }
});

// Platform hint
const hint = dialog?.querySelector('.quick-search__hint');
const shortcut = isMac() ? '⌘K' : 'Ctrl K';
if (hint) hint.textContent = `${shortcut} · Esc 关闭`;
document.querySelectorAll('[data-search-shortcut]').forEach((item) => {
  item.textContent = shortcut;
});
