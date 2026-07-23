// @environment
// axon-desktop — An modern glassmorphic desktop environment for Axon Kernel.
// Features: Window manager, shelf, app launcher, virtual File Explorer, 
// and a Windows Registry-style Key Editor (RegEdit).

(function (Kernel, ready) {
  const root = Kernel.root;

  // ---------------------------------------------------------------
  // STYLES — Scoped under #ax-root
  // ---------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    #ax-root {
      --ax-cyan: #00F2FE;
      --ax-blue: #4FACFE;
      --ax-accent-glow: rgba(0, 242, 254, 0.25);
      --ax-surface: rgba(15, 23, 42, 0.85);
      --ax-surface-solid: #0F172A;
      --ax-surface-hover: rgba(255, 255, 255, 0.08);
      --ax-card: rgba(30, 41, 59, 0.7);
      --ax-text: #F8FAFC;
      --ax-text-muted: #94A3B8;
      --ax-border: rgba(255, 255, 255, 0.12);
      --ax-danger: #EF4444;
      --ax-shelf-h: 52px;

      position: fixed; inset: 0; overflow: hidden;
      font-family: 'Inter', sans-serif;
      color: var(--ax-text);
      user-select: none;
    }
    #ax-root * { box-sizing: border-box; }
    #ax-root .ax-mono { font-family: 'JetBrains Mono', monospace; }

    #ax-desktop {
      position: absolute; inset: 0; bottom: var(--ax-shelf-h);
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 60%, #020617 100%);
      overflow: hidden;
    }

    /* ---- Windows ---- */
    .ax-window {
      position: absolute;
      min-width: 320px; min-height: 220px;
      background: var(--ax-surface);
      backdrop-filter: blur(20px);
      border: 1px solid var(--ax-border);
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px var(--ax-accent-glow);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .ax-window.ax-maximized { border-radius: 0; inset: 0 !important; width: auto !important; height: auto !important; }
    .ax-titlebar {
      height: 42px; flex: 0 0 auto;
      display: flex; align-items: center; gap: 10px;
      padding: 0 12px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--ax-border);
      cursor: grab;
    }
    .ax-titlebar:active { cursor: grabbing; }
    .ax-window-title { font-size: 13px; font-weight: 600; color: var(--ax-text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ax-window-controls { display: flex; gap: 6px; }
    .ax-win-btn {
      width: 26px; height: 26px; border: none; background: rgba(255,255,255,0.05); border-radius: 6px;
      color: var(--ax-text-muted); font-size: 13px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .ax-win-btn:hover { background: var(--ax-surface-hover); color: var(--ax-text); }
    .ax-win-btn.ax-close:hover { background: var(--ax-danger); color: #fff; }
    .ax-window-body { flex: 1; overflow: auto; background: rgba(15, 23, 42, 0.6); }
    .ax-resize-handle { position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize; }
    .ax-window.ax-focused { border-color: rgba(0, 242, 254, 0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.7), 0 0 25px var(--ax-accent-glow); }

    /* ---- Shelf ---- */
    #ax-shelf {
      position: absolute; left: 0; right: 0; bottom: 0; height: var(--ax-shelf-h);
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(24px);
      border-top: 1px solid var(--ax-border);
      display: flex; align-items: center; padding: 0 12px; gap: 8px;
    }
    #ax-launcher-btn {
      width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--ax-border); cursor: pointer;
      background: linear-gradient(135deg, var(--ax-cyan), var(--ax-blue));
      color: #0f172a; font-weight: 700; font-size: 16px; flex: 0 0 auto;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 12px var(--ax-accent-glow);
    }
    #ax-shelf-apps { flex: 1; display: flex; align-items: center; gap: 6px; height: 100%; overflow-x: auto; }
    .ax-shelf-icon {
      position: relative; width: 42px; height: 42px; border-radius: 10px; border: 1px solid transparent;
      background: transparent; cursor: pointer; font-size: 20px;
      display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
      transition: all 0.2s;
    }
    .ax-shelf-icon:hover { background: var(--ax-surface-hover); border-color: var(--ax-border); }
    .ax-shelf-icon .ax-dot {
      position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
      width: 4px; height: 4px; border-radius: 50%; background: var(--ax-cyan);
      box-shadow: 0 0 6px var(--ax-cyan);
    }
    #ax-tray {
      flex: 0 0 auto; display: flex; align-items: center; gap: 12px;
      padding: 6px 14px; border-radius: 10px; border: 1px solid var(--ax-border);
      background: rgba(255,255,255,0.03); cursor: pointer; font-size: 12px;
    }
    #ax-tray:hover { background: var(--ax-surface-hover); }

    /* ---- Launcher Drawer ---- */
    #ax-drawer {
      display: none; position: absolute; left: 12px; bottom: calc(var(--ax-shelf-h) + 12px);
      width: 380px; max-height: 460px;
      background: var(--ax-surface); backdrop-filter: blur(24px);
      border: 1px solid var(--ax-border); border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6); padding: 16px;
      flex-direction: column; gap: 12px;
    }
    #ax-drawer.ax-open { display: flex; }
    #ax-drawer input {
      width: 100%; padding: 10px 14px; border-radius: 10px;
      border: 1px solid var(--ax-border); background: rgba(0,0,0,0.3);
      color: #fff; font-size: 13px; outline: none;
    }
    #ax-drawer input:focus { border-color: var(--ax-cyan); }
    #ax-drawer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; overflow-y: auto; }
    .ax-app-tile {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px 6px; border-radius: 10px; border: 1px solid transparent;
      background: transparent; cursor: pointer; color: var(--ax-text);
    }
    .ax-app-tile:hover { background: var(--ax-surface-hover); border-color: var(--ax-border); }

    /* ---- Shared UI Elements ---- */
    .ax-app { padding: 16px; font-size: 13px; height: 100%; display: flex; flex-direction: column; }
    .ax-app h2 { font-size: 18px; font-weight: 600; margin: 0 0 12px; color: var(--ax-cyan); }
    .ax-btn { padding: 6px 14px; border-radius: 6px; border: none; background: linear-gradient(135deg, var(--ax-cyan), var(--ax-blue)); color: #0f172a; font-weight: 600; font-size: 12px; cursor: pointer; }
    .ax-btn-outline { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--ax-border); background: rgba(255,255,255,0.05); color: var(--ax-text); font-size: 12px; cursor: pointer; }
    .ax-btn-outline:hover { background: var(--ax-surface-hover); }
    .ax-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--ax-border); font-size: 12px; }

    /* ---- Terminal ---- */
    .ax-term { height: 100%; background: #020617; color: #38BDF8; padding: 14px; overflow-y: auto; font: 13px 'JetBrains Mono', monospace; }
    .ax-term-line { white-space: pre-wrap; margin-bottom: 4px; }
    .ax-term-prompt { display: flex; gap: 8px; }
    .ax-term-prompt input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font: inherit; }

    /* ---- File Explorer ---- */
    .ax-explorer { display: flex; flex-direction: column; height: 100%; }
    .ax-explorer-bar { display: flex; gap: 8px; padding: 8px; border-bottom: 1px solid var(--ax-border); background: rgba(0,0,0,0.2); }
    .ax-explorer-bar input { flex: 1; background: rgba(0,0,0,0.4); border: 1px solid var(--ax-border); border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 12px; }
    .ax-explorer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; padding: 12px; overflow-y: auto; flex: 1; }
    .ax-file-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px; border-radius: 8px; cursor: pointer; text-align: center; }
    .ax-file-item:hover { background: var(--ax-surface-hover); }
    .ax-file-icon { font-size: 28px; }
    .ax-file-name { font-size: 11px; word-break: break-all; color: var(--ax-text); }

    /* ---- RegEdit (Registry Editor) ---- */
    .ax-regedit { display: flex; height: 100%; }
    .ax-reg-tree { width: 200px; border-right: 1px solid var(--ax-border); padding: 8px; overflow-y: auto; background: rgba(0,0,0,0.2); font-size: 12px; }
    .ax-reg-node { padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--ax-text-muted); }
    .ax-reg-node:hover, .ax-reg-node.active { background: var(--ax-surface-hover); color: var(--ax-cyan); }
    .ax-reg-main { flex: 1; display: flex; flex-direction: column; }
    .ax-reg-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    .ax-reg-table th, .ax-reg-table td { padding: 8px 12px; border-bottom: 1px solid var(--ax-border); }
    .ax-reg-table th { background: rgba(0,0,0,0.3); color: var(--ax-text-muted); font-weight: 500; }
  `;
  root.appendChild(style);

  // ---------------------------------------------------------------
  // DOM SKELETON
  // ---------------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.id = 'ax-root';
  wrap.innerHTML = `
    <div id="ax-desktop"></div>
    <div id="ax-drawer">
      <input id="ax-drawer-search" type="text" placeholder="Search Axon apps..." autocomplete="off">
      <div id="ax-drawer-grid"></div>
    </div>
    <div id="ax-shelf">
      <button id="ax-launcher-btn" title="Axon Launcher">AX</button>
      <div id="ax-shelf-apps"></div>
      <button id="ax-tray">
        <span id="ax-tray-stats" style="color: var(--ax-cyan);"></span>
        <span id="ax-tray-clock" class="ax-mono"></span>
      </button>
    </div>
  `;
  root.appendChild(wrap);

  const desktop = wrap.querySelector('#ax-desktop');
  const drawer = wrap.querySelector('#ax-drawer');
  const drawerGrid = wrap.querySelector('#ax-drawer-grid');
  const drawerSearch = wrap.querySelector('#ax-drawer-search');
  const shelfApps = wrap.querySelector('#ax-shelf-apps');
  const launcherBtn = wrap.querySelector('#ax-launcher-btn');
  const trayBtn = wrap.querySelector('#ax-tray');
  const trayClock = wrap.querySelector('#ax-tray-clock');
  const trayStats = wrap.querySelector('#ax-tray-stats');

  // ---------------------------------------------------------------
  // BUILT-IN APPLICATIONS
  // ---------------------------------------------------------------
  const PINNED = ['terminal', 'files', 'regedit', 'settings'];

  const builtInApps = {
    terminal: {
      name: 'Terminal', icon: '⚡', description: 'Axon System Shell',
      launch(container) {
        container.innerHTML = `<div class="ax-term"><div id="t-out"></div><div class="ax-term-prompt">axon&gt;&nbsp;<input id="t-in" autocomplete="off" spellcheck="false"></div></div>`;
        const out = container.querySelector('#t-out');
        const input = container.querySelector('#t-in');
        const term = container.querySelector('.ax-term');
        const print = (t) => { const d = document.createElement('div'); d.className = 'ax-term-line'; d.textContent = t; out.appendChild(d); term.scrollTop = term.scrollHeight; };
        print('Axon OS Shell v2.0 — Type "help" for kernel commands.');
        input.addEventListener('keydown', async (e) => {
          if (e.key !== 'Enter') return;
          const val = input.value; input.value = '';
          if (!val.trim()) return;
          print('axon> ' + val);
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

    // --- NEW VIRTUAL FILE EXPLORER ---
    files: {
      name: 'File Explorer', icon: '📁', description: 'Browse virtual file structure',
      launch(container) {
        let currentPath = '/';

        function getStorageFiles() {
          const files = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('axon_fs:')) {
              files.push({ fullPath: key.replace('axon_fs:', ''), rawKey: key });
            }
          }
          // Default mock structure if empty
          if (!files.length) {
            localStorage.setItem('axon_fs:/Documents/welcome.txt', 'Welcome to Axon OS File System!');
            localStorage.setItem('axon_fs:/System/config.json', '{"theme":"dark"}');
            return getStorageFiles();
          }
          return files;
        }

        function renderExplorer() {
          const files = getStorageFiles();
          container.innerHTML = `
            <div class="ax-explorer">
              <div class="ax-explorer-bar">
                <button class="ax-btn-outline" id="f-back">⬆ Up</button>
                <input type="text" id="f-path" value="${currentPath}" readonly>
                <button class="ax-btn" id="f-newfile">+ New File</button>
              </div>
              <div class="ax-explorer-grid" id="f-grid"></div>
            </div>
          `;

          const grid = container.querySelector('#f-grid');
          const currentNodes = new Set();
          const items = [];

          files.forEach(f => {
            if (!f.fullPath.startsWith(currentPath)) return;
            const sub = f.fullPath.slice(currentPath === '/' ? 1 : currentPath.length + 1);
            const parts = sub.split('/');
            
            if (parts.length > 1) {
              const dirName = parts[0];
              if (!currentNodes.has('dir:' + dirName)) {
                currentNodes.add('dir:' + dirName);
                items.push({ type: 'dir', name: dirName });
              }
            } else if (parts[0]) {
              items.push({ type: 'file', name: parts[0], key: f.rawKey });
            }
          });

          if (!items.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;color:var(--ax-text-muted);padding:20px;text-align:center;">Directory is empty</div>';
          }

          items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'ax-file-item';
            el.innerHTML = `
              <div class="ax-file-icon">${item.type === 'dir' ? '📂' : '📄'}</div>
              <div class="ax-file-name">${item.name}</div>
            `;

            el.addEventListener('dblclick', () => {
              if (item.type === 'dir') {
                currentPath = currentPath === '/' ? '/' + item.name : `${currentPath}/${item.name}`;
                renderExplorer();
              } else {
                const val = localStorage.getItem(item.key);
                const newVal = prompt(`Editing ${item.name}:`, val);
                if (newVal !== null) {
                  localStorage.setItem(item.key, newVal);
                  renderExplorer();
                }
              }
            });

            grid.appendChild(el);
          });

          container.querySelector('#f-back').addEventListener('click', () => {
            if (currentPath === '/') return;
            const parts = currentPath.split('/').filter(Boolean);
            parts.pop();
            currentPath = '/' + parts.join('/');
            renderExplorer();
          });

          container.querySelector('#f-newfile').addEventListener('click', () => {
            const name = prompt('Enter filename:');
            if (name) {
              const full = (currentPath === '/' ? '' : currentPath) + '/' + name;
              localStorage.setItem('axon_fs:' + full, '');
              renderExplorer();
            }
          });
        }

        renderExplorer();
      }
    },

    // --- NEW REGISTRY EDITOR (REGEDIT) ---
    regedit: {
      name: 'Registry Editor', icon: '🎛️', description: 'System key/value editor',
      launch(container) {
        let activeHive = 'HKEY_LOCAL_MACHINE';

        function renderRegEdit() {
          container.innerHTML = `
            <div class="ax-regedit">
              <div class="ax-reg-tree">
                <div style="font-weight:600;margin-bottom:8px;color:var(--ax-text-muted);">Registry Hives</div>
                <div class="ax-reg-node ${activeHive === 'HKEY_LOCAL_MACHINE' ? 'active' : ''}" data-hive="HKEY_LOCAL_MACHINE">📂 HKEY_LOCAL_MACHINE</div>
                <div class="ax-reg-node ${activeHive === 'HKEY_CURRENT_USER' ? 'active' : ''}" data-hive="HKEY_CURRENT_USER">📂 HKEY_CURRENT_USER</div>
                <div class="ax-reg-node ${activeHive === 'HKEY_CONFIG' ? 'active' : ''}" data-hive="HKEY_CONFIG">📂 HKEY_CONFIG</div>
                <div class="ax-reg-node ${activeHive === 'HKEY_STORAGE' ? 'active' : ''}" data-hive="HKEY_STORAGE">📂 HKEY_STORAGE</div>
              </div>
              <div class="ax-reg-main">
                <div class="ax-explorer-bar">
                  <button class="ax-btn" id="reg-add">+ New Key Value</button>
                </div>
                <div style="flex:1;overflow:auto;">
                  <table class="ax-reg-table">
                    <thead>
                      <tr><th>Name</th><th>Type</th><th>Data</th><th>Actions</th></tr>
                    </thead>
                    <tbody id="reg-body"></tbody>
                  </table>
                </div>
              </div>
            </div>
          `;

          const tbody = container.querySelector('#reg-body');
          
          // Filter storage keys based on selected hive namespace
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            keys.push(k);
          }

          keys.forEach(k => {
            const val = localStorage.getItem(k);
            let type = 'REG_SZ';
            if (!isNaN(val)) type = 'REG_DWORD';
            else if (val.startsWith('{') || val.startsWith('[')) type = 'REG_JSON';

            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="ax-mono" style="color:var(--ax-cyan);">${k}</td>
              <td class="ax-mono" style="color:var(--ax-text-muted);">${type}</td>
              <td class="ax-mono" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${val}</td>
              <td>
                <button class="ax-btn-outline edit-btn" style="padding:2px 6px;">Edit</button>
                <button class="ax-btn-outline del-btn" style="padding:2px 6px;color:var(--ax-danger);">Del</button>
              </td>
            `;

            tr.querySelector('.edit-btn').addEventListener('click', () => {
              const newVal = prompt(`Edit value for ${k}:`, val);
              if (newVal !== null) {
                localStorage.setItem(k, newVal);
                renderRegEdit();
              }
            });

            tr.querySelector('.del-btn').addEventListener('click', () => {
              if (confirm(`Delete key ${k}?`)) {
                localStorage.removeItem(k);
                renderRegEdit();
              }
            });

            tbody.appendChild(tr);
          });

          container.querySelectorAll('.ax-reg-node').forEach(node => {
            node.addEventListener('click', () => {
              activeHive = node.dataset.hive;
              renderRegEdit();
            });
          });

          container.querySelector('#reg-add').addEventListener('click', () => {
            const key = prompt('Enter key name:');
            if (key) {
              const val = prompt('Enter value:') || '';
              localStorage.setItem(key, val);
              renderRegEdit();
            }
          });
        }

        renderRegEdit();
      }
    },

    settings: {
      name: 'Settings', icon: '⚙️', description: 'Axon Configuration',
      launch(container) {
        const cfg = Kernel.config.get();
        container.innerHTML = `
          <div class="ax-app">
            <h2>Axon OS Settings</h2>
            <div class="ax-row"><span>Kernel Version</span><span class="ax-mono">${Kernel.version}</span></div>
            <div class="ax-row"><span>Hardware ID</span><span class="ax-mono">${Kernel.hwid}</span></div>
            <div class="ax-row"><span>Active Environment</span><span class="ax-mono">${cfg.environment || 'axon-desktop'}</span></div>
            <h3 style="font-size:13px;margin-top:16px;">Power Controls</h3>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="ax-btn-outline" id="s-reboot">Reboot</button>
              <button class="ax-btn-outline" id="s-wipe" style="color:var(--ax-danger);">Wipe System</button>
            </div>
          </div>
        `;
        container.querySelector('#s-reboot').addEventListener('click', () => Kernel.call('reboot'));
        container.querySelector('#s-wipe').addEventListener('click', () => { if (confirm('Wipe system data?')) Kernel.call('wipe'); });
      }
    }
  };

  function getAllApps() { return { ...builtInApps, ...Kernel.apps }; }

  // ---------------------------------------------------------------
  // WINDOW MANAGER
  // ---------------------------------------------------------------
  let zCounter = 10;
  let winCounter = 0;
  const windows = new Map();
  const lastWindowByApp = new Map();

  function focusWindow(winId) {
    const w = windows.get(winId);
    if (!w) return;
    for (const other of windows.values()) other.el.classList.remove('ax-focused');
    w.el.style.zIndex = ++zCounter;
    w.el.classList.add('ax-focused');
    lastWindowByApp.set(w.appId, winId);
  }

  function openApp(appId) {
    const app = getAllApps()[appId];
    if (!app) return;

    const existing = lastWindowByApp.get(appId);
    if (existing && windows.has(existing) && windows.get(existing).minimized) {
      restoreWindow(existing);
      return;
    }

    const winId = 'w' + (++winCounter);
    const el = document.createElement('div');
    el.className = 'ax-window';
    const w = 500, h = 360;
    const left = 80 + (winCounter % 6) * 24, top = 60 + (winCounter % 6) * 20;
    el.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`;
    el.innerHTML = `
      <div class="ax-titlebar">
        <span>${app.icon || '📱'}</span>
        <span class="ax-window-title">${app.name}</span>
        <div class="ax-window-controls">
          <button class="ax-win-btn ax-min">&#8211;</button>
          <button class="ax-win-btn ax-max">&#9633;</button>
          <button class="ax-win-btn ax-close">&times;</button>
        </div>
      </div>
      <div class="ax-window-body"></div>
      <div class="ax-resize-handle"></div>
    `;
    desktop.appendChild(el);
    windows.set(winId, { el, appId, minimized: false, maximized: false });

    const body = el.querySelector('.ax-window-body');
    try { app.launch(body, { id: winId, close: () => closeWindow(winId) }); }
    catch (e) { body.innerHTML = `<div class="ax-app">App Error: ${e.message}</div>`; }

    wireWindowChrome(el, winId);
    focusWindow(winId);
    renderShelf();
  }

  function closeWindow(winId) {
    const w = windows.get(winId);
    if (!w) return;
    w.el.remove();
    windows.delete(winId);
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

  function wireWindowChrome(el, winId) {
    const titlebar = el.querySelector('.ax-titlebar');
    el.addEventListener('mousedown', () => focusWindow(winId));
    el.querySelector('.ax-min').addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(winId); });
    el.querySelector('.ax-close').addEventListener('click', (e) => { e.stopPropagation(); closeWindow(winId); });

    // Window Dragging
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ax-win-btn')) return;
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
  }

  // ---------------------------------------------------------------
  // SHELF & LAUNCHER RENDERERS
  // ---------------------------------------------------------------
  function renderShelf() {
    const apps = getAllApps();
    const runningAppIds = new Set([...windows.values()].map((w) => w.appId));
    const shelfIds = [...new Set([...PINNED, ...runningAppIds])].filter((id) => apps[id]);

    shelfApps.innerHTML = '';
    shelfIds.forEach((id) => {
      const app = apps[id];
      const btn = document.createElement('button');
      btn.className = 'ax-shelf-icon';
      btn.title = app.name;
      btn.innerHTML = app.icon || app.name[0];
      if (runningAppIds.has(id)) {
        const dot = document.createElement('span');
        dot.className = 'ax-dot';
        btn.appendChild(dot);
      }
      btn.addEventListener('click', () => {
        const winId = lastWindowByApp.get(id);
        if (winId && windows.has(winId)) {
          const w = windows.get(winId);
          if (w.minimized) restoreWindow(winId);
          else focusWindow(winId);
        } else {
          openApp(id);
        }
      });
      shelfApps.appendChild(btn);
    });
  }

  function renderDrawer(filter = '') {
    const apps = getAllApps();
    const entries = Object.entries(apps).filter(([, app]) => app.name.toLowerCase().includes(filter.toLowerCase()));
    drawerGrid.innerHTML = '';
    entries.forEach(([id, app]) => {
      const tile = document.createElement('button');
      tile.className = 'ax-app-tile';
      tile.innerHTML = `<span style="font-size:24px;">${app.icon || '📱'}</span><span style="font-size:11px;">${app.name}</span>`;
      tile.addEventListener('click', () => { openApp(id); drawer.classList.remove('ax-open'); });
      drawerGrid.appendChild(tile);
    });
  }

  launcherBtn.addEventListener('click', () => {
    drawer.classList.toggle('ax-open');
    if (drawer.classList.contains('ax-open')) renderDrawer();
  });

  // Clock
  setInterval(() => {
    trayClock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, 1000);

  trayStats.textContent = 'ONLINE';

  renderShelf();
  ready();
})(Kernel, ready);
