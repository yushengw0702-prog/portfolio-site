const DEFAULTS = {
  fontFamily: '"Songti SC", "STSong", "宋体", "SimSun", serif',
  fontWeight: '400',
  bgColor: '#faf9f5',
};

// ── 颜色工具 ─────────────────────────────────────────────────────
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substr(0, 2), 16),
    parseInt(hex.substr(2, 2), 16),
    parseInt(hex.substr(4, 2), 16),
  ];
}

function adjustColor(hex, delta) {
  const [r, g, b] = hexToRgb(hex);
  const clamp = v => Math.max(0, Math.min(255, v + delta));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('');
}

// ── 动态样式注入 ─────────────────────────────────────────────────
function buildCSS(s) {
  const bg = s.bgColor;
  return `
* {
  font-family: ${s.fontFamily} !important;
  font-weight: ${s.fontWeight} !important;
}
code, pre, kbd, samp,
[class*="code"], [class*="Code"],
.lark-editor-codeblock, .code-block {
  font-family: "SF Mono", "Menlo", "Monaco", "Consolas", "Courier New", monospace !important;
  font-weight: 400 !important;
}
:root, :root[data-theme], :root[theme-mode], body,
.semi-always-light, .semi-light-scrollbar {
  --semi-color-bg-0: ${bg} !important;
  --semi-color-bg-1: ${bg} !important;
  --semi-color-bg-2: ${adjustColor(bg, -4)} !important;
  --semi-color-bg-3: ${adjustColor(bg, -9)} !important;
  --semi-color-bg-4: ${adjustColor(bg, -14)} !important;
  --semi-color-fill-0: ${adjustColor(bg, -9)} !important;
  --semi-color-fill-1: ${adjustColor(bg, -14)} !important;
  --bg-body: ${bg} !important;
  --bg-body-overlay: ${bg} !important;
  --bg-content: ${bg} !important;
  --bg-content-base: ${bg} !important;
  --bg-base: ${bg} !important;
  --bg-sidebar: ${adjustColor(bg, -4)} !important;
  --bg-pri-default: ${bg} !important;
  --bg-pri-hover: ${adjustColor(bg, -9)} !important;
  --bg-float: ${adjustColor(bg, 3)} !important;
  --bg-float-base: ${adjustColor(bg, 3)} !important;
  --bg-float-overlay: ${adjustColor(bg, 3)} !important;
  --N00: ${bg} !important;
  --N50: ${adjustColor(bg, -4)} !important;
  --N100: ${adjustColor(bg, -9)} !important;
}
html, body, #root, #app,
[class*="appLayout"], [class*="AppLayout"],
[class*="workspace"], [class*="Workspace"] {
  background-color: ${bg} !important;
}
`.trim();
}

function applyStyles(settings) {
  let style = document.getElementById('__feishu-songti-dynamic__');
  if (!style) {
    style = document.createElement('style');
    style.id = '__feishu-songti-dynamic__';
    (document.head || document.documentElement).appendChild(style);
  }
  style.textContent = buildCSS(settings);
}

chrome.storage.sync.get(DEFAULTS, applyStyles);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  chrome.storage.sync.get(DEFAULTS, applyStyles);
});

// ── 个人面板 ─────────────────────────────────────────────────────
const PANEL_URL    = 'https://yushengw0702-prog.github.io/portfolio-site/os/#';
const BTN_ID       = '__fp-nav-btn__';
const FLOAT_BTN_ID = '__fp-float-btn__';
const PANEL_ID     = '__fp-panel__';

// ── 面板开关 ──────────────────────────────────────────────────────
function getSidebarWidth() {
  const btn = document.getElementById(BTN_ID);
  if (btn) {
    const rect = btn.getBoundingClientRect();
    return Math.max(rect.right, 180);
  }
  // 取屏幕左侧第一个固定/相对定位的块
  for (const el of document.querySelectorAll('body > * > *, body > *')) {
    const r = el.getBoundingClientRect();
    if (r.left < 10 && r.width > 100 && r.width < 400 && r.height > 300) return r.width;
  }
  return 220;
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  Object.assign(panel.style, {
    position: 'fixed', top: '0', left: getSidebarWidth() + 'px',
    right: '0', bottom: '0', zIndex: '99999',
    display: 'flex', flexDirection: 'column',
    background: '#faf9f5', boxShadow: '-3px 0 18px rgba(0,0,0,0.12)',
  });

  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '0 16px', height: '52px', flexShrink: '0',
    background: '#f2efe8', borderBottom: '1px solid #dedad2',
  });
  header.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#555" stroke-width="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="#555" stroke-width="1.8"/>
      <line x1="9" y1="9" x2="9" y2="21" stroke="#555" stroke-width="1.8"/>
    </svg>
    <span style="font-family:'Songti SC','STSong','宋体',serif;font-size:15px;font-weight:600;color:#2c2c2c">个人面板</span>
    <div style="flex:1"></div>
    <button id="__fp-reload__" title="刷新" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M4 12a8 8 0 0 1 14.9-3H16v2h5V6h-2v2.3A10 10 0 0 0 2 12h2z" fill="#666"/>
        <path d="M20 12a8 8 0 0 1-14.9 3H8v-2H3v5h2v-2.3A10 10 0 0 0 22 12h-2z" fill="#666"/>
      </svg>
    </button>
    <button id="__fp-close__" title="关闭" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <line x1="5" y1="5" x2="19" y2="19" stroke="#666" stroke-width="2" stroke-linecap="round"/>
        <line x1="19" y1="5" x2="5" y2="19" stroke="#666" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>`;

  const iframe = document.createElement('iframe');
  iframe.src = PANEL_URL;
  Object.assign(iframe.style, { flex: '1', border: 'none', width: '100%' });

  panel.append(header, iframe);
  document.body.appendChild(panel);

  panel.querySelector('#__fp-close__').addEventListener('click', togglePanel);
  panel.querySelector('#__fp-reload__').addEventListener('click', () => { iframe.src = PANEL_URL; });
}

function togglePanel() {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
    [BTN_ID, FLOAT_BTN_ID].forEach(id => {
      document.getElementById(id)?.classList.remove('__fp-active__');
    });
  } else {
    buildPanel();
    [BTN_ID, FLOAT_BTN_ID].forEach(id => {
      document.getElementById(id)?.classList.add('__fp-active__');
    });
  }
}

// ── 保底浮动按钮（始终注入，确保有入口）────────────────────────────
function injectFloatBtn() {
  if (document.getElementById(FLOAT_BTN_ID)) return;

  if (!document.getElementById('__fp-style__')) {
    const s = document.createElement('style');
    s.id = '__fp-style__';
    s.textContent = `
      #${BTN_ID}, #${FLOAT_BTN_ID} {
        display:flex;align-items:center;gap:8px;cursor:pointer;
        font-family:"Songti SC","STSong","宋体",serif;
        transition:background 0.15s,color 0.15s;user-select:none;
      }
      #${BTN_ID} { padding:7px 14px;margin:2px 6px;border-radius:8px;font-size:14px;color:#555; }
      #${BTN_ID}:hover, #${BTN_ID}.__fp-active__ { background:#e8e4dc;color:#1a1a1a; }
      #${FLOAT_BTN_ID} {
        position:fixed;bottom:72px;left:6px;z-index:99998;
        padding:7px 11px;border-radius:10px;font-size:13px;color:#444;
        background:#f2efe8;border:1px solid #d5d1c8;
        box-shadow:0 2px 10px rgba(0,0,0,0.1);
      }
      #${FLOAT_BTN_ID}:hover, #${FLOAT_BTN_ID}.__fp-active__ { background:#e8e4dc;color:#1a1a1a; }
    `;
    document.head.appendChild(s);
  }

  const btn = document.createElement('div');
  btn.id = FLOAT_BTN_ID;
  btn.title = '个人面板';
  btn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;display:block">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"/>
      <line x1="9" y1="9" x2="9" y2="21" stroke="currentColor" stroke-width="1.8"/>
    </svg>
    <span>个人面板</span>`;
  btn.addEventListener('click', togglePanel);
  document.body.appendChild(btn);
}

// ── 侧边栏按钮（用文字定位，找"搜索"或"主页"锚点）──────────────────
function findSidebarAnchor() {
  // 方法1：搜索框 input placeholder
  for (const input of document.querySelectorAll('input')) {
    const ph = input.placeholder || '';
    if (/搜|search/i.test(ph)) {
      const r = input.getBoundingClientRect();
      if (r.left < 280 && r.top < 300) {
        let el = input;
        for (let i = 0; i < 5; i++) {
          if (!el.parentElement) break;
          el = el.parentElement;
          if (el.offsetWidth > 80 && el.offsetHeight > 20) break;
        }
        return el;
      }
    }
  }

  // 方法2：文字节点 "搜索"
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent.trim();
    if (t === '搜索' || t === 'Search') {
      const el = walker.currentNode.parentElement;
      const r = el.getBoundingClientRect();
      if (r.left < 280 && r.top < 300) {
        let anchor = el;
        for (let i = 0; i < 6; i++) {
          if (!anchor.parentElement) break;
          anchor = anchor.parentElement;
          if (anchor.offsetWidth > 80 && anchor.offsetHeight > 20) break;
        }
        return anchor;
      }
    }
  }

  // 方法3：文字节点 "主页"，插到它之前
  const walker2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker2.nextNode()) {
    const t = walker2.currentNode.textContent.trim();
    if (t === '主页' || t === 'Home') {
      const el = walker2.currentNode.parentElement;
      const r = el.getBoundingClientRect();
      if (r.left < 280) {
        let anchor = el;
        for (let i = 0; i < 8; i++) {
          if (!anchor.parentElement) break;
          if (anchor.parentElement.children.length >= 3) return { el: anchor, before: true };
          anchor = anchor.parentElement;
        }
      }
    }
  }

  return null;
}

function injectSidebarBtn() {
  if (document.getElementById(BTN_ID)) return;
  const result = findSidebarAnchor();
  if (!result) return;

  const btn = document.createElement('div');
  btn.id = BTN_ID;
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;display:block">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"/>
      <line x1="9" y1="9" x2="9" y2="21" stroke="currentColor" stroke-width="1.8"/>
    </svg>
    <span>个人面板</span>`;
  btn.addEventListener('click', togglePanel);

  if (result.before) {
    result.el.parentElement.insertBefore(btn, result.el);
  } else {
    const anchor = result.el || result;
    anchor.parentElement?.insertBefore(btn, anchor.nextSibling);
  }
}

// 浮动按钮显隐：仅当侧边栏按钮真实存在时才隐藏，否则一定可见
function syncFloatVisibility() {
  const float = document.getElementById(FLOAT_BTN_ID);
  if (!float) return;
  const hasSidebarBtn = !!document.getElementById(BTN_ID);
  float.style.display = hasSidebarBtn ? 'none' : 'flex';
}

// ── 启动 ─────────────────────────────────────────────────────────
function startInjection() {
  injectFloatBtn();
  injectSidebarBtn();

  // 防抖：React 重渲染结束后再重新注入，避免和 React reconciler 打架
  let debounceTimer = null;
  const obs = new MutationObserver(() => {
    // 被冲掉时快速补回浮动按钮（不走防抖，保证入口不丢）
    if (!document.getElementById(FLOAT_BTN_ID)) injectFloatBtn();
    syncFloatVisibility();
    // 侧边栏按钮等 React 稳定后再插
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      injectSidebarBtn();
      syncFloatVisibility();
    }, 200);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // 兜底心跳：每秒检查一次，处理 Observer 遗漏的情况
  setInterval(() => {
    if (!document.getElementById(FLOAT_BTN_ID)) injectFloatBtn();
    injectSidebarBtn();
    syncFloatVisibility();
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startInjection);
} else {
  startInjection();
}
