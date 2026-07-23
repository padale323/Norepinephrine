// Liquid Glass macOS Environment for Norepinephrine Kernel
// Pushing the limits of VFS, PIDs, and the DOM

(async function(Kernel, ready) {
  const WALLPAPER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

  // 1. Inject Advanced Glassmorphism CSS
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --glass-bg: rgba(255, 255, 255, 0.15);
      --glass-border: rgba(255, 255, 255, 0.25);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      --blur: blur(20px);
      --text: #ffffff;
      --highlight: rgba(255, 255, 255, 0.1);
    }
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    #desktop {
      position: absolute; inset: 0; z-index: 1;
      background: url('${WALLPAPER}') no-repeat center center fixed;
      background-size: cover;
      color: var(--text);
    }

    /* Menu Bar */
    #menubar {
      position: absolute; top: 0; left: 0; right: 0; height: 28px;
      background: rgba(0, 0, 0, 0.2); backdrop-filter: var(--blur);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 16px; font-size: 13px; font-weight: 500;
      z-index: 10000; user-select: none;
    }
    .menu-left, .menu-right { display: flex; gap: 16px; align-items: center; }
    .menu-item { cursor: pointer; transition: opacity 0.2s; }
    .menu-item:hover { opacity: 0.7; }

    /* Liquid Dock */
    #dock-container {
      position: absolute; bottom: 12px; left: 0; right: 0;
      display: flex; justify-content: center;
      z-index: 9999; pointer-events: none;
    }
    #dock {
      pointer-events: auto;
      background: var(--glass-bg); backdrop-filter: var(--blur);
      border: 1px solid var(--glass-border); border-radius: 24px;
      padding: 8px 12px; display: flex; gap: 12px; align-items: flex-end;
      box-shadow: var(--glass-shadow);
    }
    .dock-icon {
      width: 48px; height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px; border: 1px solid var(--glass-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .dock-icon:hover {
      transform: scale(1.25) translateY(-10px);
      background: rgba(255, 255, 255, 0.3);
      z-index: 2;
    }
    .dock-icon::after { /* Active indicator dot */
      content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
      width: 4px; height: 4px; background: rgba(255,255,255,0.8); border-radius: 50%; opacity: 0;
    }
    .dock-icon.active::after { opacity: 1; }

    /* Window Manager */
    .window {
      position: absolute; width: 600px; height: 400px;
      background: rgba(20, 20, 20, 0.6); backdrop-filter: var(--blur);
      border: 1px solid var(--glass-border); border-radius: 12px;
      box-shadow: var(--glass-shadow); display: flex; flex-direction: column;
      overflow: hidden; transition: transform 0.1s, opacity 0.1s;
    }
    .window.maximized { top: 28px !important; left: 0 !important; width: 100% !important; height: calc(100% - 28px) !important; border-radius: 0; }
    .window-header {
      height: 38px; background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; padding: 0 12px;
      user-select: none;
    }
    .window-controls { display: flex; gap: 8px; width: 60px; }
    .win-btn { width: 12px; height: 12px; border-radius: 50%; cursor: pointer; border: none; }
    .win-close { background: #ff5f56; } .win-close:hover { background: #ff3b30; }
    .win-min { background: #ffbd2e; } .win-min:hover { background: #e2a000; }
    .win-max { background: #27c93f; } .win-max:hover { background: #18a92e; }
    .window-title { flex: 1; text-align: center; font-size: 13px; font-weight: 600; opacity: 0.9; margin-right: 60px; }
    .window-content { flex: 1; position: relative; overflow: auto; display: flex; flex-direction: column; }

    /* Apps Inner Styling */
    .terminal-app { padding: 8px; font-family: monospace; font-size: 13px; color: #00ff00; background: rgba(0,0,0,0.4); height: 100%; overflow-y: auto; }
    .terminal-out { white-space: pre-wrap; margin-bottom: 4px; }
    .terminal-in { display: flex; }
    .terminal-in input { flex: 1; background: transparent; border: none; color: inherit; font: inherit; outline: none; margin-left: 8px; }
    
    .finder-app { display: flex; height: 100%; background: rgba(255,255,255,0.02); }
    .finder-sidebar { width: 150px; border-right: 1px solid var(--glass-border); padding: 12px; background: rgba(0,0,0,0.2); }
    .finder-main { flex: 1; padding: 16px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 16px; align-content: flex-start; }
    .file-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; text-align: center; font-size: 12px; word-break: break-all; }
    .file-item:hover { background: var(--highlight); }
    .file-icon { font-size: 36px; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }
  `;
  document.head.appendChild(style);

  // 2. Build Desktop DOM
  Kernel.root.innerHTML = `
    <div id="desktop">
      <div id="menubar">
        <div class="menu-left">
          <div class="menu-item" style="font-weight: 800;"> Norepinephrine</div>
          <div class="menu-item">File</div>
          <div class="menu-item">Edit</div>
          <div class="menu-item">Kernel v${Kernel.version}</div>
        </div>
        <div class="menu-right">
          <div class="menu-item" id="sys-pids">PIDs: 0</div>
          <div class="menu-item" id="sys-clock">--:--</div>
        </div>
      </div>
      <div id="window-container"></div>
      <div id="dock-container">
        <div id="dock"></div>
      </div>
    </div>
  `;

  const winContainer = document.getElementById('window-container');
  const dock = document.getElementById('dock');
  let topZ = 100;

  // 3. Advanced Window Manager
  class Window {
    constructor(title, appHtml) {
      this.el = document.createElement('div');
      this.el.className = 'window';
      this.el.style.zIndex = ++topZ;
      this.el.style.left = (Math.random() * 100 + 50) + 'px';
      this.el.style.top = (Math.random() * 100 + 50) + 'px';

      this.el.innerHTML = `
        <div class="window-header">
          <div class="window-controls">
            <button class="win-btn win-close"></button>
            <button class="win-btn win-min"></button>
            <button class="win-btn win-max"></button>
          </div>
          <div class="window-title">${title}</div>
        </div>
        <div class="window-content">${appHtml}</div>
      `;

      this.header = this.el.querySelector('.window-header');
      this.content = this.el.querySelector('.window-content');
      
      this._bindEvents();
      winContainer.appendChild(this.el);
    }

    _bindEvents() {
      // Focus
      this.el.addEventListener('mousedown', () => this.el.style.zIndex = ++topZ);

      // Controls
      this.el.querySelector('.win-close').onclick = () => this.el.remove();
      this.el.querySelector('.win-max').onclick = () => this.el.classList.toggle('maximized');

      // Dragging
      let isDragging = false, startX, startY, startLeft, startTop;
      this.header.addEventListener('mousedown', (e) => {
        if(e.target.classList.contains('win-btn')) return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        startLeft = parseInt(this.el.style.left || 0);
        startTop = parseInt(this.el.style.top || 0);
        this.el.style.transition = 'none';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging || this.el.classList.contains('maximized')) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.el.style.left = startLeft + dx + 'px';
        this.el.style.top = Math.max(28, startTop + dy) + 'px';
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
        this.el.style.transition = 'transform 0.1s, opacity 0.1s';
      });
    }
  }

  // 4. Register System Apps
  Kernel.registerApp('terminal', {
    name: 'Terminal', icon: '💻',
    launch: () => {
      const win = new Window('Terminal', `<div class="terminal-app"><div class="terminal-out"></div><div class="terminal-in"><span>root@nore:~#</span><input type="text" autocomplete="off"></div></div>`);
      const out = win.content.querySelector('.terminal-out');
      const input = win.content.querySelector('input');
      
      out.innerText += `Norepinephrine v${Kernel.version}\nHWID: ${Kernel.hwid}\nType 'help' for commands.\n\n`;
      input.focus();

      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value;
          input.value = '';
          out.innerText += `root@nore:~# ${cmd}\n`;
          win.content.scrollTop = win.content.scrollHeight;
          
          if(cmd.trim()) {
            // Hook into Kernel command runner, capturing output instead of console.log
            let output = '';
            const captureFn = (t) => { output += (typeof t === 'string' ? t : JSON.stringify(t, null, 2)) + '\n'; };
            
            // Bypass Kernel.run to inject our own print function
            const args = cmd.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/(^"|"$)/g, ''));
            const name = args.shift();
            const c = Kernel.commands[name.toLowerCase()];
            
            if (!c) {
              out.innerText += `Command not found: ${name}\n`;
            } else {
              try {
                const res = await c.fn(...args);
                if (res !== undefined) captureFn(res);
              } catch(err) { captureFn("Error: " + err.message); }
              out.innerText += output;
            }
          }
          win.content.scrollTop = win.content.scrollHeight;
        }
      });
    }
  });

  Kernel.registerApp('finder', {
    name: 'Finder', icon: '📁',
    launch: async () => {
      const win = new Window('Finder', `
        <div class="finder-app">
          <div class="finder-sidebar">
            <div style="font-weight: bold; margin-bottom: 10px;">Favorites</div>
            <div style="opacity: 0.8; margin-bottom: 5px;">🏠 root</div>
            <div style="opacity: 0.8;">⚙️ system</div>
          </div>
          <div class="finder-main"></div>
        </div>
      `);
      
      const main = win.content.querySelector('.finder-main');
      const renderDir = async (path) => {
        main.innerHTML = '';
        const files = await Kernel.vfs.list(path);
        if(files.length === 0) { main.innerHTML = '<div style="opacity: 0.5; grid-column: 1/-1;">Folder is empty</div>'; return; }
        
        files.forEach(f => {
          const isDir = f.endsWith('/');
          const el = document.createElement('div');
          el.className = 'file-item';
          el.innerHTML = `<div class="file-icon">${isDir ? '🗂️' : '📄'}</div><div>${f.replace('/','')}</div>`;
          el.onclick = async () => {
            if(isDir) renderDir(path + f);
            else {
               const content = await Kernel.vfs.read(path + f);
               new Window(`TextEdit - ${f}`, `<textarea style="width:100%;height:100%;background:rgba(0,0,0,0.5);color:#fff;border:none;padding:10px;resize:none;">${content}</textarea>`);
            }
          };
          main.appendChild(el);
        });
      };
      await renderDir('/root/');
    }
  });

  Kernel.registerApp('sysmon', {
    name: 'SysMon', icon: '📊',
    launch: () => {
      const win = new Window('System Monitor', `<div style="padding:15px; font-family:monospace;"></div>`);
      const container = win.content.querySelector('div');
      
      // Spawn a kernel PID to update the monitor UI
      Kernel.sys.spawn('sysmon_ui', () => {
        const updateInterval = setInterval(() => {
          if(!document.body.contains(win.el)) {
             clearInterval(updateInterval);
             return; // Let PID die if window closed
          }
          const pids = Kernel.pids.list();
          let html = `<b>Active Processes (${pids.length})</b><br><br>`;
          html += `<table style="width:100%; text-align:left;"><tr><th>PID</th><th>NAME</th><th>STATE</th></tr>`;
          pids.forEach(p => { html += `<tr><td>${p.pid}</td><td>${p.name}</td><td>${p.state}</td></tr>`; });
          html += `</table>`;
          container.innerHTML = html;
        }, 1000);
      });
    }
  });

  // 5. Populate Dock
  Object.values(Kernel.apps).forEach(app => {
    const icon = document.createElement('div');
    icon.className = 'dock-icon';
    icon.innerText = app.icon;
    icon.title = app.name;
    icon.onclick = () => {
      icon.classList.add('active');
      app.launch();
    };
    dock.appendChild(icon);
  });

  // 6. Spawn Background Daemons via Kernel.pids
  Kernel.sys.spawn('clock_daemon', () => {
    const clockEl = document.getElementById('sys-clock');
    const pidEl = document.getElementById('sys-pids');
    setInterval(() => {
      const d = new Date();
      clockEl.innerText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      pidEl.innerText = `PIDs: ${Kernel.pids.list().length}`;
    }, 1000);
  });

  // Boot sequence complete
  if (ready) ready();

})(window.Kernel, ready);
