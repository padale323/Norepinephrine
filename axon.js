// @environment
// axon-desktop — Advanced Glassmorphic Desktop Environment for Axon Kernel.
// Features: Window Manager, Command Palette (Ctrl+Space), Task Manager, 
// Notification System, Virtual File Explorer, Axon Edit, and Key Editor.

(function (Kernel, ready) {
  const root = Kernel.root;

  // ---------------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    #ax-root {
      --ax-cyan: #00F2FE;
      --ax-blue: #4FACFE;
      --ax-accent-glow: rgba(0, 242, 254, 0.25);
      --ax-surface: rgba(15, 23, 42, 0.88);
      --ax-surface-solid: #0F172A;
      --ax-surface-hover: rgba(255, 255, 255, 0.08);
      --ax-text: #F8FAFC;
      --ax-text-muted: #94A3B8;
      --ax-border: rgba(255, 255, 255, 0.12);
      --ax-danger: #EF4444;
      --ax-success: #10B981;
      --ax-shelf-h: 52px;

      position: fixed; inset: 0; overflow: hidden;
      font-family: 'Inter', sans-serif; color: var(--ax-text); user-select: none;
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
      position: absolute; min-width: 340px; min-height: 240px;
      background: var(--ax-surface); backdrop-filter: blur(20px);
      border: 1px solid var(--ax-border); border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px var(--ax-accent-glow);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .ax-titlebar {
      height: 42px; flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
      padding: 0 12px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--ax-border); cursor: grab;
    }
    .ax-titlebar:active { cursor: grabbing; }
    .ax-window-title { font-size: 13px; font-weight: 600; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ax-window-controls { display: flex; gap: 6px; }
    .ax-win-btn {
      width: 26px; height: 26px; border: none; background: rgba(255,255,255,0.05); border-radius: 6px;
      color: var(--ax-text-muted); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .ax-win-btn:hover { background: var(--ax-surface-hover); color: var(--ax-text); }
    .ax-win-btn.ax-close:hover { background: var(--ax-danger); color: #fff; }
    .ax-window-body { flex: 1; overflow: auto; background: rgba(15, 23, 42, 0.6); }
    .ax-resize-handle { position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize; }
    .ax-window.ax-focused { border-color: rgba(0, 242, 254, 0.4); box-shadow: 0 20px 50px rgba(0,0,0,0.7), 0 0 25px var(--ax-accent-glow); }

    /* ---- Shelf ---- */
    #ax-shelf {
      position: absolute; left: 0; right: 0; bottom: 0; height: var(--ax-shelf-h);
      background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(24px); border-top: 1px solid var(--ax-border);
      display: flex; align-items: center; padding: 0 12px; gap: 8px; z-index: 9999;
    }
    #ax-launcher-btn {
      width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--ax-border); cursor: pointer;
      background: linear-gradient(135deg, var(--ax-cyan), var(--ax-blue)); color: #0f172a; font-weight: 700; font-size: 15px;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px var(--ax-accent-glow);
    }
    #ax-shelf-apps { flex: 1; display: flex; align-items: center; gap: 6px; height: 100%; overflow-x: auto; }
    .ax-shelf-icon {
      position: relative; width: 42px; height: 42px; border-radius: 10px; border: 1px solid transparent;
      background: transparent; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
    }
    .ax-shelf-icon:hover { background: var(--ax-surface-hover); border-color: var(--ax-border); }
    .ax-shelf-icon .ax-dot {
      position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
      width: 4px; height: 4px; border-radius: 50%; background: var(--ax-cyan); box-shadow: 0 0 6px var(--ax-cyan);
    }
    #ax-tray {
      display: flex; align-items: center; gap: 12px; padding: 6px 14px; border-radius: 10px;
      border: 1px solid var(--ax-border); background: rgba(255,255,255,0.03); cursor: pointer; font-size: 12px;
    }

    /* ---- Command Palette ---- */
    #ax-cmd-palette {
      display: none; position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
      width: 520px; max-width: 90vw; background: var(--ax-surface-solid); border: 1px solid var(--ax-cyan);
      border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 30px var(--ax-accent-glow);
      padding: 14px; z-index: 100000; flex-direction: column; gap: 10px;
    }
    #ax-cmd-palette.ax-open { display: flex; }
    #ax-cmd-input {
      width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--ax-border);
      background: rgba(0,0,0,0.5); color: #fff; font-size: 14px; outline: none;
    }
    #ax-cmd-results { max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .ax-cmd-item {
      padding: 10px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 13px;
    }
    .ax-cmd-item:hover, .ax-cmd-item.selected { background: var(--ax-surface-hover); color: var(--ax-cyan); }

    /* ---- Notifications ---- */
    #ax-toast-container {
      position: fixed; right: 16px; bottom: calc(var(--ax-shelf-h) + 16px);
      display: flex; flex-direction: column; gap: 8px; z-index: 99999; pointer-events: none;
    }
    .ax-toast {
      pointer-events: auto; width: 300px; padding: 12px 16px; border-radius: 10px;
      background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-left: 4px solid var(--ax-cyan);
      box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-size: 12px; animation: axSlideIn 0.25s ease-out;
    }
    @keyframes axSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* ---- Launcher Drawer ---- */
    #ax-drawer {
      display: none; position: absolute; left: 12px; bottom: calc(var(--ax-shelf-h) + 12px);
      width: 380px; max-height: 460px; background: var(--ax-surface); backdrop-filter: blur(24px);
      border: 1px solid var(--ax-border); border-radius: 16px; padding: 16px; flex-direction: column; gap: 12px; z-index: 9998;
    }
    #ax-drawer.ax-open { display: flex; }
    #ax-drawer input {
      width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--ax-border);
      background: rgba(0,0,0,0.3); color: #fff; font-size: 13px; outline: none;
    }
    #ax-drawer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; overflow-y: auto; }
    .ax-app-tile {
      display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 6px;
      border-radius: 10px; border: 1px solid transparent; background: transparent; cursor: pointer; color: var(--ax-text);
    }
    .ax-app-tile:hover { background: var(--ax-surface-hover); border-color: var(--ax-border); }

    /* ---- UI Components ---- */
    .ax-app { padding: 16px; font-size: 13px; height: 100%; display: flex; flex-direction: column; }
    .ax-btn { padding: 6px 14px; border-radius: 6px; border: none; background: linear-gradient(135deg, var(--ax-cyan), var(--ax-blue)); color: #0f172a; font-weight: 600; font-size: 12px; cursor: pointer; }
    .ax-btn-outline { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--ax-border); background: rgba(255,255,255,0.05); color: var(--ax-text); font-size: 12px; cursor: pointer; }
    .ax-btn-outline:hover { background: var(--ax-surface-hover); }

    /* ---- App Specific Views ---- */
    .ax-term { height: 100%; background: #020617; color: #38BDF8; padding: 14px; overflow-y: auto; font: 13px 'JetBrains Mono', monospace; }
    .ax-term-prompt { display: flex; gap: 8px; }
    .ax-term-prompt input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font: inherit; }

    .ax-editor { display: flex; flex-direction: column; height: 100%; }
    .ax-editor-tabs { display: flex; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--ax-border); overflow-x: auto; }
    .ax-tab { padding: 8px 16px; font-size: 12px; border-right: 1px solid var(--ax-border); cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--ax-text-muted); }
    .ax-tab.active { background: var(--ax-surface-hover); color: var(--ax-cyan); font-weight: 500; }
    .ax-editor-textarea { flex: 1; background: #020617; color: #f8fafc; border: none; outline: none; padding: 14px; font: 13px 'JetBrains Mono', monospace; resize: none; line-height: 1.5; }

    .ax-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    .ax-table th, .ax-table td { padding: 8px 12px; border-bottom: 1px solid var(--ax-border); }
    .ax-table th { background: rgba(0,0,0,0.3); color: var(--ax-text-muted); font-weight: 500; }
  `;
  root.appendChild(style);

  // ---------------------------------------------------------------
  // DOM SKELETON
  // ---------------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.id = 'ax-root';
  wrap.innerHTML = `
    <div id="ax-desktop"></div>
    <div id="ax-cmd-palette">
      <input id="ax-cmd-input" type="text" placeholder="Type a command or app name... (Esc to close)" autocomplete="off">
      <div id="ax-cmd-results"></div>
    </div>
    <div id="ax-toast-container"></div>
    <div id="ax-drawer">
      <input id="ax-drawer-search" type="text" placeholder="Search Axon apps..." autocomplete="off">
      <div id="ax-drawer-grid"></div>
    </div>
    <div id="ax-shelf">
      <button id="ax-launcher-btn" title="Axon Launcher (Ctrl+Space)">AX</button>
      <div id="ax-shelf-apps"></div>
      <button id="ax-tray">
        <span id="ax-tray-notif">🔔</span>
        <span id="ax-tray-stats" style="color: var(--ax-cyan);">ONLINE</span>
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
  const trayClock = wrap.querySelector('#ax-tray-clock');
  const cmdPalette = wrap.querySelector('#ax-cmd-palette');
  const cmdInput = wrap.querySelector('#ax-cmd-input');
  const cmdResults = wrap.querySelector('#ax-cmd-results');
  const toastContainer = wrap.querySelector('#ax-toast-container');

  // ---------------------------------------------------------------
  // NOTIFICATION SYSTEM
  // ---------------------------------------------------------------
  const notificationHistory = [];
  function showNotification(title, message, type = 'info') {
    notificationHistory.push({ title, message, time: new Date() });
    const toast = document.createElement('div');
    toast.className = 'ax-toast';
    toast.innerHTML = `<div style="font-weight:600;color:var(--ax-cyan);">${title}</div><div style="color:var(--ax-text-muted);margin-top:2px;">${message}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ---------------------------------------------------------------
  // BUILT-IN APPLICATIONS
  // ---------------------------------------------------------------
  const PINNED = ['terminal', 'files', 'editor', 'taskmgr', 'keyeditor', 'settings'];

  const builtInApps = {
    terminal: {
      name: 'Terminal', icon: '⚡', description: 'Axon Shell',
      launch(container) {
        container.innerHTML = `<div class="ax-term"><div id="t-out"></div><div class="ax-term-prompt">axon&gt;&nbsp;<input id="t-in" autocomplete="off" spellcheck="false"></div></div>`;
        const out = container.querySelector('#t-out');
        const input = container.querySelector('#t-in');
        const term = container.querySelector('.ax-term');
        const print = (t) => { const d = document.createElement('div'); d.textContent = t; out.appendChild(d); term.scrollTop = term.scrollHeight; };
        print('Axon OS Shell v2.5 — Type "help" for kernel commands.');
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

    // --- AXON EDIT (CODE / TEXT EDITOR) ---
    editor: {
      name: 'Axon Edit', icon: '📝', description: 'Tabbed Code Editor',
      launch(container) {
        let activeTab = 'untitled.txt';
        const files = { 'untitled.txt': '// Welcome to Axon Edit\nconsole.log("Hello Axon OS!");' };

        function renderEditor() {
          container.innerHTML = `
            <div class="ax-editor">
              <div class="ax-editor-tabs" id="ed-tabs">
                ${Object.keys(files).map(name => `
                  <div class="ax-tab ${name === activeTab ? 'active' : ''}" data-file="${name}">${name}</div>
                `).join('')}
                <div class="ax-tab" id="ed-new-tab">+ New</div>
              </div>
              <textarea class="ax-editor-textarea" id="ed-content" spellcheck="false">${files[activeTab] || ''}</textarea>
              <div style="padding:6px 12px;background:rgba(0,0,0,0.4);border-top:1px solid var(--ax-border);display:flex;justify-content:space-between;font-size:11px;color:var(--ax-text-muted);">
                <span id="ed-stats">Lines: 0 | Chars: 0</span>
                <button class="ax-btn" id="ed-save">Save to Filesystem</button>
              </div>
            </div>
          `;

          const textarea = container.querySelector('#ed-content');
          const stats = container.querySelector('#ed-stats');

          const updateStats = () => {
            const lines = textarea.value.split('\n').length;
            stats.textContent = `Lines: ${lines} | Chars: ${textarea.value.length}`;
          };
          textarea.addEventListener('input', () => {
            files[activeTab] = textarea.value;
            updateStats();
          });
          updateStats();

          container.querySelectorAll('.ax-tab[data-file]').forEach(tab => {
            tab.addEventListener('click', () => {
              activeTab = tab.dataset.file;
              renderEditor();
            });
          });

          container.querySelector('#ed-new-tab').addEventListener('click', () => {
            const filename = prompt('Enter new filename:', `file_${Object.keys(files).length + 1}.txt`);
            if (filename) {
              files[filename] = '';
              activeTab = filename;
              renderEditor();
            }
          });

          container.querySelector('#ed-save').addEventListener('click', () => {
            localStorage.setItem('axon_fs:/' + activeTab, files[activeTab]);
            showNotification('File Saved', `Saved ${activeTab} to virtual filesystem.`);
          });
        }

        renderEditor();
      }
    },

    // --- TASK MANAGER ---
    taskmgr: {
      name: 'Task Manager', icon: '📊', description: 'Monitor System Processes',
      launch(container) {
        function renderTaskMgr() {
          container.innerHTML = `
            <div class="ax-app">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h2 style="margin:0;font-size:16px;color:var(--ax-cyan);">Process & Window Monitor</h2>
                <button class="ax-btn-outline" id="tm-refresh">Refresh</button>
              </div>
              <div style="flex:1;overflow:auto;">
                <table class="ax-table">
                  <thead>
                    <tr><th>Window ID</th><th>App</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody id="tm-list"></tbody>
                </table>
              </div>
            </div>
          `;

          const tbody = container.querySelector('#tm-list');
          tbody.innerHTML = '';

          if (!windows.size) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--ax-text-muted);">No active window processes running.</td></tr>';
            return;
          }

          windows.forEach((win, id) => {
            const app = getAllApps()[win.appId];
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="ax-mono" style="color:var(--ax-cyan);">${id}</td>
              <td>${app ? app.name : win.appId}</td>
              <td><span style="color:${win.minimized ? 'var(--ax-text-muted)' : 'var(--ax-success)'}">${win.minimized ? 'Minimized' : 'Active'}</span></td>
              <td><button class="ax-btn-outline end-btn" style="color:var(--ax-danger);padding:2px 8px;">End Task</button></td>
            `;

            tr.querySelector('.end-btn').addEventListener('click', () => {
              closeWindow(id);
              renderTaskMgr();
              showNotification('Process Terminated', `Force closed process ${id}`);
            });

            tbody.appendChild(tr);
          });

          container.querySelector('#tm-refresh').addEventListener('click', renderTaskMgr);
        }

        renderTaskMgr();
      }
    },

    // --- KEY EDITOR (CLEAN PARSING & INSPECTION) ---
    keyeditor: {
      name: 'Key Editor', icon: '🔑', description: 'System Key/Value Registry',
      launch(container) {
        function renderKeyEditor() {
          container.innerHTML = `
            <div class="ax-app">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h2 style="margin:0;font-size:16px;color:var(--ax-cyan);">Key-Value Registry</h2>
                <button class="ax-btn" id="ke-add">+ Add Key</button>
              </div>
              <div style="flex:1;overflow:auto;">
                <table class="ax-table">
                  <thead>
                    <tr><th>Key Name</th><th>Inferred Type</th><th>Parsed Value</th><th>Actions</th></tr>
                  </thead>
                  <tbody id="ke-body"></tbody>
                </table>
              </div>
            </div>
          `;

          const tbody = container.querySelector('#ke-body');
          tbody.innerHTML = '';

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const rawVal = localStorage.getItem(key);
            let displayVal = rawVal;
            let type = 'STRING';

            // Cleanly parse JSON or numbers instead of ugly raw string output
            try {
              if (!isNaN(rawVal) && rawVal.trim() !== '') {
                type = 'NUMBER';
              } else if (rawVal === 'true' || rawVal === 'false') {
                type = 'BOOLEAN';
              } else {
                const parsed = JSON.parse(rawVal);
                if (typeof parsed === 'object' && parsed !== null) {
                  type = 'OBJECT / JSON';
                  displayVal = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' | ');
                }
              }
            } catch (e) {
              type = 'STRING';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="ax-mono" style="color:var(--ax-cyan);font-weight:500;">${key}</td>
              <td><span class="ax-mono" style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.06);">${type}</span></td>
              <td class="ax-mono" style="color:var(--ax-text-muted);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayVal}</td>
              <td>
                <button class="ax-btn-outline edit-btn" style="padding:2px 6px;">Edit</button>
                <button class="ax-btn-outline del-btn" style="padding:2px 6px;color:var(--ax-danger);">Del</button>
              </td>
            `;

            tr.querySelector('.edit-btn').addEventListener('click', () => {
              const val = prompt(`Edit Key: ${key}`, rawVal);
              if (val !== null) {
                localStorage.setItem(key, val);
                renderKeyEditor();
                showNotification('Registry Updated', `Key ${key} modified.`);
              }
            });

            tr.querySelector('.del-btn').addEventListener('click', () => {
              if (confirm(`Delete key ${key}?`)) {
                localStorage.removeItem(key);
                renderKeyEditor();
              }
            });

            tbody.appendChild(tr);
          }

          container.querySelector('#ke-add').addEventListener('click', () => {
            const k = prompt('Enter Key Name:');
            if (k) {
              const v = prompt('Enter Value:') || '';
              localStorage.setItem(k, v);
              renderKeyEditor();
            }
          });
        }

        renderKeyEditor();
      }
    },

    files: {
      name: 'Files', icon: '📂', description: 'Virtual Explorer',
      launch(container) {
        container.innerHTML = `<div class="ax-app"><h2 style="font-size:16px;">Virtual Local Files</h2><div id="f-list"></div></div>`;
        const list = container.querySelector('#f-list');
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ax-border);';
          row.innerHTML = `<span class="ax-mono">${k}</span><span style="color:var(--ax-text-muted);">${localStorage.getItem(k).length} B</span>`;
          list.appendChild(row);
        }
      }
    },

    settings: {
      name: 'Settings', icon: '⚙️', description: 'System Config',
      launch(container) {
        container.innerHTML = `
          <div class="ax-app">
            <h2 style="font-size:16px;">Axon OS System Info</h2>
            <div style="margin-top:10px;">Kernel: <span class="ax-mono">${Kernel.version}</span></div>
            <div style="margin-top:6px;">Hardware ID: <span class="ax-mono">${Kernel.hwid}</span></div>
            <div style="margin-top:20px;display:flex;gap:8px;">
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
  // COMMAND PALETTE LOGIC (Ctrl + Space)
  // ---------------------------------------------------------------
  function toggleCommandPalette() {
    cmdPalette.classList.toggle('ax-open');
    if (cmdPalette.classList.contains('ax-open')) {
      cmdInput.value = '';
      cmdInput.focus();
      renderCmdResults();
    }
  }

  function renderCmdResults(query = '') {
    cmdResults.innerHTML = '';
    const apps = getAllApps();
    const matches = Object.entries(apps).filter(([id, app]) => 
      app.name.toLowerCase().includes(query.toLowerCase()) || id.includes(query.toLowerCase())
    );

    matches.forEach(([id, app]) => {
      const item = document.createElement('div');
      item.className = 'ax-cmd-item';
      item.innerHTML = `<span>${app.icon || '📱'}</span><span style="font-weight:500;">${app.name}</span><span style="color:var(--ax-text-muted);font-size:11px;">— Launch App</span>`;
      item.addEventListener('click', () => {
        openApp(id);
        toggleCommandPalette();
      });
      cmdResults.appendChild(item);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      toggleCommandPalette();
    } else if (e.key === 'Escape' && cmdPalette.classList.contains('ax-open')) {
      toggleCommandPalette();
    }
  });

  cmdInput.addEventListener('input', () => renderCmdResults(cmdInput.value));

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

    const winId = 'w' + (++winCounter);
    const el = document.createElement('div');
    el.className = 'ax-window';
    const w = 540, h = 380;
    const left = 80 + (winCounter % 6) * 24, top = 60 + (winCounter % 6) * 20;
    el.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`;
    el.innerHTML = `
      <div class="ax-titlebar">
        <span>${app.icon || '📱'}</span>
        <span class="ax-window-title">${app.name}</span>
        <div class="ax-window-controls">
          <button class="ax-win-btn ax-min">&#8211;</button>
          <button class="ax-win-btn ax-close">&times;</button>
        </div>
      </div>
      <div class="ax-window-body"></div>
      <div class="ax-resize-handle"></div>
    `;
    desktop.appendChild(el);
    windows.set(winId, { el, appId, minimized: false });

    const body = el.querySelector('.ax-window-body');
    try { app.launch(body, { id: winId, close: () => closeWindow(winId) }); }
    catch (e) { body.innerHTML = `<div class="ax-app">App Error: ${e.message}</div>`; }

    el.addEventListener('mousedown', () => focusWindow(winId));
    el.querySelector('.ax-min').addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(winId); });
    el.querySelector('.ax-close').addEventListener('click', (e) => { e.stopPropagation(); closeWindow(winId); });

    // Dragging
    const titlebar = el.querySelector('.ax-titlebar');
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

  setInterval(() => {
    trayClock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, 1000);

  showNotification('Axon OS Ready', 'Press Ctrl + Space to open Command Palette.');

  renderShelf();
  ready();
})(Kernel, ready);
