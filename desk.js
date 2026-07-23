// @environment
// norepinephrine-b — a ChromeOS-styled desktop environment.
// Draws a full window manager into Kernel.root: a bottom shelf, an app
// launcher, draggable/resizable/maximizable windows, and a status tray
// with a live clock. Built-in apps: Terminal, Files, Settings, About.
// Any app a plugin registers via Kernel.registerApp(id, {...}) shows up
// automatically in the launcher and shelf — this environment never
// hardcodes "the" app list, it always reads Kernel.apps live.
// Loaded via: Kernel.call('setenv', '<url-to-this-file>') then reboot.

(function (Kernel, ready) {
  const root = Kernel.root;

  // ---------------------------------------------------------------
  // STYLES — scoped under #co-root so nothing leaks onto the host page.
  // ---------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap');

    #co-root {
      --co-blue: #1A73E8;
      --co-blue-dark: #174EA6;
      --co-surface: #FFFFFF;
      --co-text: #202124;
      --co-text-secondary: #5F6368;
      --co-border: #DADCE0;
      --co-hover: #F1F3F4;
      --co-danger: #D93025;
      --co-shelf-h: 48px;
      position: fixed; inset: 0; overflow: hidden;
      font-family: 'Roboto', sans-serif;
      color: var(--co-text);
      user-select: none;
    }
    #co-root * { box-sizing: border-box; }
    #co-root .co-mono { font-family: 'Roboto Mono', monospace; }

    #co-desktop {
      position: absolute; inset: 0; bottom: var(--co-shelf-h);
      background: linear-gradient(135deg, #6EC6CA 0%, #4A90D9 55%, #174EA6 100%);
      overflow: hidden;
    }

    /* ---- Windows ---- */
    .co-window {
      position: absolute;
      min-width: 280px; min-height: 180px;
      background: var(--co-surface);
      border-radius: 12px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.15);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .co-window.co-maximized { border-radius: 0; inset: 0 !important; width: auto !important; height: auto !important; }
    .co-titlebar {
      height: 40px; flex: 0 0 auto;
      display: flex; align-items: center; gap: 8px;
      padding: 0 8px 0 14px;
      background: var(--co-surface);
      border-bottom: 1px solid var(--co-border);
      cursor: grab;
      font-family: 'Google Sans', 'Roboto', sans-serif;
    }
    .co-titlebar:active { cursor: grabbing; }
    .co-window-icon { font-size: 16px; line-height: 1; }
    .co-window-title { font-size: 13px; font-weight: 500; color: var(--co-text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .co-window-controls { display: flex; gap: 2px; }
    .co-win-btn {
      width: 28px; height: 28px; border: none; background: transparent; border-radius: 6px;
      color: var(--co-text-secondary); font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .co-win-btn:hover { background: var(--co-hover); }
    .co-win-btn.co-close:hover { background: var(--co-danger); color: #fff; }
    .co-window-body { flex: 1; overflow: auto; background: var(--co-surface); }
    .co-resize-handle {
      position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize;
    }
    .co-window.co-focused { box-shadow: 0 12px 36px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.2); }

    /* ---- Shelf ---- */
    #co-shelf {
      position: absolute; left: 0; right: 0; bottom: 0; height: var(--co-shelf-h);
      background: rgba(255,255,255,0.82); backdrop-filter: blur(12px);
      border-top: 1px solid rgba(0,0,0,0.06);
      display: flex; align-items: center; padding: 0 8px;
      font-family: 'Google Sans', 'Roboto', sans-serif;
    }
    #co-launcher-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--co-blue); color: #fff; font-size: 18px; flex: 0 0 auto;
      display: flex; align-items: center; justify-content: center; margin-right: 8px;
    }
    #co-launcher-btn:hover { background: var(--co-blue-dark); }
    #co-shelf-apps { flex: 1; display: flex; align-items: center; gap: 4px; height: 100%; overflow-x: auto; }
    .co-shelf-icon {
      position: relative; width: 40px; height: 40px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer; font-size: 20px;
      display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
    }
    .co-shelf-icon:hover { background: var(--co-hover); }
    .co-shelf-icon .co-dot {
      position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
      width: 4px; height: 4px; border-radius: 50%; background: var(--co-blue);
    }
    #co-tray {
      flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
      padding: 6px 12px; border-radius: 18px; border: none; background: transparent; cursor: pointer;
      font-size: 12px; color: var(--co-text);
    }
    #co-tray:hover { background: var(--co-hover); }
    #co-tray-clock { font-weight: 500; }
    #co-tray-stats { color: var(--co-text-secondary); }

    /* ---- Launcher / app drawer ---- */
    #co-drawer {
      display: none;
      position: absolute; left: 8px; bottom: calc(var(--co-shelf-h) + 8px);
      width: 360px; max-height: 420px;
      background: rgba(255,255,255,0.97); backdrop-filter: blur(16px);
      border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      padding: 14px; flex-direction: column; gap: 10px;
    }
    #co-drawer.co-open { display: flex; }
    #co-drawer input {
      width: 100%; padding: 9px 12px; border-radius: 20px; border: 1px solid var(--co-border);
      font: 13px 'Roboto', sans-serif; outline: none;
    }
    #co-drawer input:focus { border-color: var(--co-blue); }
    #co-drawer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; overflow-y: auto; }
    .co-app-tile {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 10px 4px; border-radius: 10px; border: none; background: transparent; cursor: pointer;
    }
    .co-app-tile:hover { background: var(--co-hover); }
    .co-app-tile .co-tile-icon { font-size: 26px; }
    .co-app-tile .co-tile-name { font-size: 11px; color: var(--co-text); text-align: center; line-height: 1.2; }
    #co-drawer-empty { font-size: 12px; color: var(--co-text-secondary); text-align: center; padding: 20px 0; }

    /* ---- Quick panel ---- */
    #co-quickpanel {
      display: none;
      position: absolute; right: 8px; bottom: calc(var(--co-shelf-h) + 8px);
      width: 260px;
      background: rgba(255,255,255,0.97); backdrop-filter: blur(16px);
      border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      padding: 14px; flex-direction: column; gap: 10px; font-size: 12px;
    }
    #co-quickpanel.co-open { display: flex; }
    #co-quickpanel button {
      padding: 8px 10px; border-radius: 8px; border: 1px solid var(--co-border); background: #fff;
      cursor: pointer; font: 12px 'Roboto', sans-serif; text-align: left;
    }
    #co-quickpanel button:hover { background: var(--co-hover); }

    /* ---- Shared app content styling ---- */
    .co-app { padding: 16px; font-size: 13px; line-height: 1.5; }
    .co-app h2 { font-family: 'Google Sans', sans-serif; font-size: 16px; margin: 0 0 12px; }
    .co-app h3 { font-size: 13px; margin: 18px 0 8px; color: var(--co-text-secondary); text-transform: uppercase; letter-spacing: .04em; }
    .co-app label { display: block; font-size: 12px; color: var(--co-text-secondary); margin-bottom: 4px; }
    .co-app input[type=text] { width: 100%; padding: 7px 10px; border: 1px solid var(--co-border); border-radius: 6px; font: 12px 'Roboto', sans-serif; margin-bottom: 8px; }
    .co-app button.co-btn { padding: 7px 14px; border-radius: 6px; border: none; background: var(--co-blue); color: #fff; font: 12px 'Google Sans', sans-serif; cursor: pointer; }
    .co-app button.co-btn:hover { background: var(--co-blue-dark); }
    .co-app button.co-btn-outline { padding: 7px 14px; border-radius: 6px; border: 1px solid var(--co-border); background: #fff; cursor: pointer; font: 12px 'Roboto', sans-serif; }
    .co-app button.co-btn-outline:hover { background: var(--co-hover); }
    .co-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--co-hover); font-size: 12px; }
    .co-row:last-child { border-bottom: none; }

    /* ---- Terminal app ---- */
    .co-term { height: 100%; background: #0F1115; color: #E2E8F0; padding: 12px; overflow-y: auto; font: 13px 'Roboto Mono', monospace; }
    .co-term .co-term-line { white-space: pre-wrap; margin-bottom: 4px; }
    .co-term-prompt { display: flex; gap: 8px; }
    .co-term-prompt input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font: inherit; }
  `;
  root.appendChild(style);

  // ---------------------------------------------------------------
  // DOM SKELETON
  // ---------------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.id = 'co-root';
  wrap.innerHTML = `
    <div id="co-desktop"></div>
    <div id="co-drawer">
      <input id="co-drawer-search" type="text" placeholder="Search apps" autocomplete="off" spellcheck="false">
      <div id="co-drawer-grid"></div>
    </div>
    <div id="co-quickpanel">
      <div class="co-row"><span>Norepinephrine</span><span class="co-mono">v${Kernel.version}</span></div>
      <div class="co-row"><span>Connections</span><span id="co-qp-stats" class="co-mono">…</span></div>
      <button id="co-qp-settings">Settings</button>
      <button id="co-qp-recovery">Restart into recovery</button>
      <button id="co-qp-reboot">Reboot</button>
    </div>
    <div id="co-shelf">
      <button id="co-launcher-btn" title="Launcher">&#9679;&#9679;&#9679;</button>
      <div id="co-shelf-apps"></div>
      <button id="co-tray">
        <span id="co-tray-stats"></span>
        <span id="co-tray-clock" class="co-mono"></span>
      </button>
    </div>
  `;
  root.appendChild(wrap);

  const desktop = wrap.querySelector('#co-desktop');
  const drawer = wrap.querySelector('#co-drawer');
  const drawerGrid = wrap.querySelector('#co-drawer-grid');
  const drawerSearch = wrap.querySelector('#co-drawer-search');
  const quickpanel = wrap.querySelector('#co-quickpanel');
  const shelfApps = wrap.querySelector('#co-shelf-apps');
  const launcherBtn = wrap.querySelector('#co-launcher-btn');
  const trayBtn = wrap.querySelector('#co-tray');
  const trayClock = wrap.querySelector('#co-tray-clock');
  const trayStats = wrap.querySelector('#co-tray-stats');
  const qpStats = wrap.querySelector('#co-qp-stats');

  // ---------------------------------------------------------------
  // BUILT-IN APPS
  // Same shape as Kernel.registerApp: { name, icon, description, launch(container, win) }
  // Anything a plugin registers via Kernel.registerApp shows up right
  // alongside these — getAllApps() always reads Kernel.apps live.
  // ---------------------------------------------------------------
  const PINNED = ['terminal', 'files', 'settings'];

  const builtInApps = {
    terminal: {
      name: 'Terminal', icon: '⌨️', description: 'Command line access to Norepinephrine.',
      launch(container) {
        container.innerHTML = `<div class="co-term"><div id="t-out"></div><div class="co-term-prompt">&gt;&nbsp;<input id="t-in" autocomplete="off" spellcheck="false"></div></div>`;
        const out = container.querySelector('#t-out');
        const input = container.querySelector('#t-in');
        const term = container.querySelector('.co-term');
        const print = (t) => { const d = document.createElement('div'); d.className = 'co-term-line'; d.textContent = t; out.appendChild(d); term.scrollTop = term.scrollHeight; };
        print('Norepinephrine terminal — type "help" for commands.');
        input.addEventListener('keydown', async (e) => {
          if (e.key !== 'Enter') return;
          const val = input.value; input.value = '';
          if (!val.trim()) return;
          print('> ' + val);
          const [name, ...args] = val.trim().split(/\s+/);
          try {
            const c = Kernel.commands[name.toLowerCase()];
            if (!c) { print('Unknown command: ' + name); return; }
            const result = await c.fn(...args);
            if (result !== undefined) print(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
          } catch (err) { print('Error: ' + err.message); }
        });
        setTimeout(() => input.focus(), 0);
      }
    },
    files: {
      name: 'Files', icon: '🗂️', description: 'Browse local storage.',
      launch(container) {
        function render() {
          const keys = Object.keys(localStorage).sort();
          container.innerHTML = `<div class="co-app"><h2>Files</h2><p style="color:var(--co-text-secondary);margin-top:-6px;">This device's local storage — the closest thing this OS has to a filesystem.</p><div id="f-list"></div></div>`;
          const list = container.querySelector('#f-list');
          if (!keys.length) { list.innerHTML = '<div style="color:var(--co-text-secondary);">No stored data.</div>'; return; }
          keys.forEach((k) => {
            const row = document.createElement('div');
            row.className = 'co-row';
            const val = localStorage.getItem(k) || '';
            row.innerHTML = `<span class="co-mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%;">${k}</span><span style="color:var(--co-text-secondary);">${val.length}B</span>`;
            const del = document.createElement('button');
            del.className = 'co-btn-outline'; del.textContent = 'Delete'; del.style.marginLeft = '8px';
            del.addEventListener('click', () => { localStorage.removeItem(k); render(); });
            row.appendChild(del);
            list.appendChild(row);
          });
        }
        render();
      }
    },
    settings: {
      name: 'Settings', icon: '⚙️', description: 'Norepinephrine settings.',
      launch(container) {
        function render() {
          const cfg = Kernel.config.get();
          container.innerHTML = `
            <div class="co-app">
              <h2>Settings</h2>
              <div class="co-row"><span>Version</span><span class="co-mono">${Kernel.version}</span></div>
              <div class="co-row"><span>Device ID</span><span class="co-mono">${Kernel.hwid}</span></div>
              <div class="co-row"><span>Environment</span><span class="co-mono" style="max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${cfg.environment || '—'}</span></div>
              <div class="co-row"><span>Terms of Service</span><span>${Kernel.tos.accepted ? 'Accepted' : 'Not accepted'}</span></div>
              <h3>Power</h3>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="co-btn-outline" id="s-reboot">Reboot</button>
                <button class="co-btn-outline" id="s-recovery">Recovery</button>
                <button class="co-btn-outline" id="s-safemode">Safe mode</button>
                <button class="co-btn-outline" id="s-wipe" style="color:var(--co-danger);">Wipe data</button>
              </div>
              <h3>Plugins</h3>
              <div id="s-plugins"></div>
              <label style="margin-top:10px;">Add plugin URL</label>
              <input type="text" id="s-plugin-url" placeholder="https://…">
              <button class="co-btn" id="s-plugin-add">Add plugin</button>
            </div>`;
          const plist = container.querySelector('#s-plugins');
          const all = [...cfg.plugins.map((u) => ({ url: u, early: false })), ...cfg.early_plugins.map((u) => ({ url: u, early: true }))];
          if (!all.length) plist.innerHTML = '<div style="color:var(--co-text-secondary);font-size:12px;">No plugins installed.</div>';
          all.forEach((p) => {
            const row = document.createElement('div');
            row.className = 'co-row';
            row.innerHTML = `<span class="co-mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%;">${p.url}${p.early ? ' (early)' : ''}</span>`;
            const rm = document.createElement('button');
            rm.className = 'co-btn-outline'; rm.textContent = 'Remove';
            rm.addEventListener('click', async () => { await Kernel.call('plugin.remove', p.url); render(); });
            row.appendChild(rm);
            plist.appendChild(row);
          });
          container.querySelector('#s-reboot').addEventListener('click', () => Kernel.call('reboot'));
          container.querySelector('#s-recovery').addEventListener('click', () => Kernel.call('recovery'));
          container.querySelector('#s-safemode').addEventListener('click', () => Kernel.call('safemode'));
          container.querySelector('#s-wipe').addEventListener('click', () => { if (confirm('Wipe all local data? This cannot be undone.')) Kernel.call('wipe'); });
          container.querySelector('#s-plugin-add').addEventListener('click', async () => {
            const urlInput = container.querySelector('#s-plugin-url');
            if (!urlInput.value.trim()) return;
            await Kernel.call('plugin.add', urlInput.value.trim());
            render();
          });
        }
        render();
      }
    },
    about: {
      name: 'About', icon: 'ℹ️', description: 'About this device.',
      launch(container) {
        container.innerHTML = `
          <div class="co-app">
            <h2>Norepinephrine</h2>
            <p>You're running the <strong>norepinephrine-b</strong> desktop environment on top of the Norepinephrine kernel.</p>
            <div class="co-row"><span>Kernel version</span><span class="co-mono">${Kernel.version}</span></div>
            <div class="co-row"><span>Device ID</span><span class="co-mono">${Kernel.hwid}</span></div>
          </div>`;
      }
    }
  };

  function getAllApps() {
    return { ...builtInApps, ...Kernel.apps };
  }

  // ---------------------------------------------------------------
  // WINDOW MANAGER
  // ---------------------------------------------------------------
  let zCounter = 10;
  let winCounter = 0;
  const windows = new Map(); // winId -> { el, appId, minimized }
  const lastWindowByApp = new Map(); // appId -> winId (most recently focused)

  function focusWindow(winId) {
    const w = windows.get(winId);
    if (!w) return;
    for (const other of windows.values()) other.el.classList.remove('co-focused');
    w.el.style.zIndex = ++zCounter;
    w.el.classList.add('co-focused');
    lastWindowByApp.set(w.appId, winId);
  }

  function openApp(appId) {
    const app = getAllApps()[appId];
    if (!app) return;

    // If minimized, restore instead of opening a fresh instance.
    const existing = lastWindowByApp.get(appId);
    if (existing && windows.has(existing) && windows.get(existing).minimized) {
      restoreWindow(existing);
      return;
    }

    const winId = 'w' + (++winCounter);
    const el = document.createElement('div');
    el.className = 'co-window';
    const w = 420 + Math.random() * 60 | 0, h = 320;
    const left = 60 + (winCounter % 6) * 24, top = 40 + (winCounter % 6) * 20;
    el.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`;
    el.innerHTML = `
      <div class="co-titlebar">
        <span class="co-window-icon">${app.icon || ''}</span>
        <span class="co-window-title">${app.name}</span>
        <div class="co-window-controls">
          <button class="co-win-btn co-min" title="Minimize">&#8211;</button>
          <button class="co-win-btn co-max" title="Maximize">&#9633;</button>
          <button class="co-win-btn co-close" title="Close">&times;</button>
        </div>
      </div>
      <div class="co-window-body"></div>
      <div class="co-resize-handle"></div>
    `;
    desktop.appendChild(el);
    windows.set(winId, { el, appId, minimized: false, maximized: false });

    const body = el.querySelector('.co-window-body');
    try { app.launch(body, { id: winId, close: () => closeWindow(winId), setTitle: (t) => { el.querySelector('.co-window-title').textContent = t; } }); }
    catch (e) { body.innerHTML = `<div class="co-app">App failed to load: ${e.message}</div>`; }

    wireWindowChrome(el, winId);
    focusWindow(winId);
    renderShelf();
  }

  function closeWindow(winId) {
    const w = windows.get(winId);
    if (!w) return;
    w.el.remove();
    windows.delete(winId);
    if (lastWindowByApp.get(w.appId) === winId) lastWindowByApp.delete(w.appId);
    renderShelf();
  }

  function minimizeWindow(winId) {
    const w = windows.get(winId);
    if (!w) return;
    w.minimized = true;
    w.el.style.display = 'none';
    renderShelf();
  }

  function restoreWindow(winId) {
    const w = windows.get(winId);
    if (!w) return;
    w.minimized = false;
    w.el.style.display = 'flex';
    focusWindow(winId);
    renderShelf();
  }

  function toggleMaximize(winId) {
    const w = windows.get(winId);
    if (!w) return;
    if (!w.maximized) {
      w.prevRect = w.el.style.cssText;
      w.el.classList.add('co-maximized');
      w.maximized = true;
    } else {
      w.el.classList.remove('co-maximized');
      w.el.style.cssText = w.prevRect || '';
      w.maximized = false;
    }
    focusWindow(winId);
  }

  function wireWindowChrome(el, winId) {
    const titlebar = el.querySelector('.co-titlebar');
    el.addEventListener('mousedown', () => focusWindow(winId));

    el.querySelector('.co-min').addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(winId); });
    el.querySelector('.co-max').addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(winId); });
    el.querySelector('.co-close').addEventListener('click', (e) => { e.stopPropagation(); closeWindow(winId); });
    titlebar.addEventListener('dblclick', () => toggleMaximize(winId));

    // Drag
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.co-win-btn')) return;
      const w = windows.get(winId);
      if (w.maximized) return;
      const startX = e.clientX, startY = e.clientY;
      const rect = el.getBoundingClientRect();
      const deskRect = desktop.getBoundingClientRect();
      const startLeft = rect.left - deskRect.left, startTop = rect.top - deskRect.top;
      function onMove(ev) {
        el.style.left = (startLeft + ev.clientX - startX) + 'px';
        el.style.top = Math.max(0, startTop + ev.clientY - startY) + 'px';
      }
      function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Resize
    el.querySelector('.co-resize-handle').addEventListener('mousedown', (e) => {
      e.stopPropagation();
      focusWindow(winId);
      const w = windows.get(winId);
      if (w.maximized) return;
      const startX = e.clientX, startY = e.clientY;
      const rect = el.getBoundingClientRect();
      const startW = rect.width, startH = rect.height;
      function onMove(ev) {
        el.style.width = Math.max(280, startW + ev.clientX - startX) + 'px';
        el.style.height = Math.max(180, startH + ev.clientY - startY) + 'px';
      }
      function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ---------------------------------------------------------------
  // SHELF
  // ---------------------------------------------------------------
  function renderShelf() {
    const apps = getAllApps();
    const runningAppIds = new Set([...windows.values()].map((w) => w.appId));
    const shelfIds = [...new Set([...PINNED, ...runningAppIds])].filter((id) => apps[id]);

    shelfApps.innerHTML = '';
    shelfIds.forEach((id) => {
      const app = apps[id];
      const btn = document.createElement('button');
      btn.className = 'co-shelf-icon';
      btn.title = app.name;
      btn.innerHTML = app.icon || app.name[0];
      if (runningAppIds.has(id)) {
        const dot = document.createElement('span');
        dot.className = 'co-dot';
        btn.appendChild(dot);
      }
      btn.addEventListener('click', () => {
        const winId = lastWindowByApp.get(id);
        if (winId && windows.has(winId)) {
          const w = windows.get(winId);
          if (w.minimized) restoreWindow(winId);
          else if (w.el.classList.contains('co-focused')) minimizeWindow(winId);
          else focusWindow(winId);
        } else {
          openApp(id);
        }
      });
      shelfApps.appendChild(btn);
    });
  }

  // ---------------------------------------------------------------
  // LAUNCHER / APP DRAWER
  // ---------------------------------------------------------------
  function renderDrawer(filter = '') {
    const apps = getAllApps();
    const entries = Object.entries(apps).filter(([, app]) => app.name.toLowerCase().includes(filter.toLowerCase()));
    drawerGrid.innerHTML = '';
    if (!entries.length) { drawerGrid.innerHTML = '<div id="co-drawer-empty">No apps match.</div>'; return; }
    entries.forEach(([id, app]) => {
      const tile = document.createElement('button');
      tile.className = 'co-app-tile';
      tile.innerHTML = `<span class="co-tile-icon">${app.icon || app.name[0]}</span><span class="co-tile-name">${app.name}</span>`;
      tile.addEventListener('click', () => { openApp(id); closeDrawer(); });
      drawerGrid.appendChild(tile);
    });
  }
  function openDrawer() { drawer.classList.add('co-open'); quickpanel.classList.remove('co-open'); renderDrawer(drawerSearch.value); drawerSearch.focus(); }
  function closeDrawer() { drawer.classList.remove('co-open'); drawerSearch.value = ''; }
  launcherBtn.addEventListener('click', () => { drawer.classList.contains('co-open') ? closeDrawer() : openDrawer(); });
  drawerSearch.addEventListener('input', () => renderDrawer(drawerSearch.value));

  // ---------------------------------------------------------------
  // QUICK PANEL / STATUS TRAY
  // ---------------------------------------------------------------
  function openQuickPanel() { quickpanel.classList.add('co-open'); closeDrawer(); }
  function closeQuickPanel() { quickpanel.classList.remove('co-open'); }
  trayBtn.addEventListener('click', () => { quickpanel.classList.contains('co-open') ? closeQuickPanel() : openQuickPanel(); });
  wrap.querySelector('#co-qp-settings').addEventListener('click', () => { openApp('settings'); closeQuickPanel(); });
  wrap.querySelector('#co-qp-recovery').addEventListener('click', () => Kernel.call('recovery'));
  wrap.querySelector('#co-qp-reboot').addEventListener('click', () => Kernel.call('reboot'));

  // Click on empty desktop closes drawer/quickpanel.
  desktop.addEventListener('mousedown', (e) => { if (e.target === desktop) { closeDrawer(); closeQuickPanel(); } });

  function updateClock() {
    const now = new Date();
    trayClock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  updateClock();
  setInterval(updateClock, 1000);

  function updateStats(s) {
    const active = (s && s.active !== undefined) ? s.active : Kernel.stats.active;
    trayStats.textContent = active + ' online';
    qpStats.textContent = active;
  }
  updateStats();
  Kernel.events.on('stats', updateStats);

  // Live-update shelf/launcher when a plugin registers or removes an app.
  Kernel.events.on('app-registered', () => { renderShelf(); if (drawer.classList.contains('co-open')) renderDrawer(drawerSearch.value); });
  Kernel.events.on('app-unregistered', () => { renderShelf(); if (drawer.classList.contains('co-open')) renderDrawer(drawerSearch.value); });

  renderShelf();
  ready();
})(Kernel, ready);
