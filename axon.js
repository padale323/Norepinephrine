(function (Kernel, ready) {
  'use strict';

  // 1. Inject Stylesheet for Spatial Vector UI
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; user-select: none; }
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #06080e; font-family: 'Courier New', monospace; color: #76f2ff; }
    
    /* Infinite Canvas Background Grid */
    #spatial-canvas {
      position: absolute; inset: 0;
      background-image: 
        radial-gradient(circle at 50% 50%, rgba(18, 30, 49, 0.5) 0%, rgba(6, 8, 14, 1) 100%),
        linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
      background-size: 100% 100%, 40px 40px, 40px 40px;
      z-index: 1;
    }

    /* Node Window Containers */
    .node-window {
      position: absolute;
      min-width: 280px; min-height: 200px;
      background: rgba(10, 16, 26, 0.85);
      border: 1px solid #00f0ff;
      border-radius: 8px;
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.15), inset 0 0 10px rgba(0, 240, 255, 0.05);
      backdrop-filter: blur(8px);
      z-index: 10;
      display: flex; flex-direction: column;
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .node-window.active {
      border-color: #ff0077;
      box-shadow: 0 0 25px rgba(255, 0, 119, 0.3), inset 0 0 10px rgba(255, 0, 119, 0.1);
      z-index: 100;
    }

    /* Node Header */
    .node-header {
      padding: 10px 14px;
      background: rgba(0, 240, 255, 0.08);
      border-bottom: 1px solid rgba(0, 240, 255, 0.2);
      display: flex; justify-content: space-between; align-items: center;
      cursor: grab;
      font-weight: bold; font-size: 12px; letter-spacing: 1px;
    }
    .node-window.active .node-header {
      background: rgba(255, 0, 119, 0.15);
      border-bottom-color: rgba(255, 0, 119, 0.3);
      color: #fff;
    }

    .node-controls span {
      cursor: pointer; margin-left: 8px; font-size: 14px;
      opacity: 0.7; transition: opacity 0.2s;
    }
    .node-controls span:hover { opacity: 1; color: #ff0077; }

    /* Node Body */
    .node-body {
      padding: 12px; flex: 1; overflow: auto;
      font-size: 13px; color: #a5cbf5;
    }

    /* System Telemetry HUD */
    #system-hud {
      position: fixed; top: 16px; left: 16px; z-index: 1000;
      background: rgba(6, 8, 14, 0.8);
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 8px 16px; border-radius: 20px;
      font-size: 11px; letter-spacing: 1px;
      pointer-events: none; display: flex; gap: 16px;
    }

    /* Radial Quick Dial */
    #radial-dial {
      position: fixed; z-index: 9999;
      width: 160px; height: 160px;
      margin-left: -80px; margin-top: -80px;
      border-radius: 50%;
      border: 1px solid #00f0ff;
      background: rgba(6, 8, 14, 0.9);
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
      display: none; align-items: center; justify-content: center;
    }
    .dial-btn {
      position: absolute;
      width: 40px; height: 40px; border-radius: 50%;
      background: #0a101a; border: 1px solid #00f0ff;
      color: #00f0ff; display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 10px; font-weight: bold;
      transition: all 0.2s;
    }
    .dial-btn:hover { background: #00f0ff; color: #000; box-shadow: 0 0 10px #00f0ff; }
  `;
  document.head.appendChild(style);

  // 2. Build DOM Canvas Architecture
  const root = Kernel.root;
  root.innerHTML = `
    <div id="spatial-canvas"></div>
    <div id="system-hud">
      <div>KERNEL: v${Kernel.version}</div>
      <div>HWID: ${Kernel.hwid.slice(0, 10)}...</div>
      <div id="hud-procs">ACTIVE NODES: 0</div>
    </div>
    <div id="radial-dial">
      <div class="dial-btn" style="top: 10px;" id="dial-file">VFS</div>
      <div class="dial-btn" style="right: 10px;" id="dial-proc">PROC</div>
      <div class="dial-btn" style="bottom: 10px;" id="dial-term">CLI</div>
      <div class="dial-btn" style="left: 10px;" id="dial-reboot">RBT</div>
    </div>
  `;

  const canvas = document.getElementById('spatial-canvas');
  const dial = document.getElementById('radial-dial');
  const hudProcs = document.getElementById('hud-procs');

  // 3. Node / Window Engine
  let activeWindow = null;

  function createNodeWindow(title, contentFn) {
    const pid = Kernel.sys.spawn(title, (proc) => {
      const win = document.createElement('div');
      win.className = 'node-window';
      win.style.left = Math.max(50, Math.random() * (window.innerWidth - 350)) + 'px';
      win.style.top = Math.max(50, Math.random() * (window.innerHeight - 300)) + 'px';

      win.innerHTML = `
        <div class="node-header">
          <span>// ${title.toUpperCase()} [PID:${proc.pid}]</span>
          <div class="node-controls">
            <span class="close-btn">✕</span>
          </div>
        </div>
        <div class="node-body"></div>
      `;

      const body = win.querySelector('.node-body');
      canvas.appendChild(win);

      // Focus handling
      const focus = () => {
        document.querySelectorAll('.node-window').forEach(w => w.classList.remove('active'));
        win.classList.add('active');
        activeWindow = win;
      };
      win.addEventListener('mousedown', focus);
      focus();

      // Dragging logic
      const header = win.querySelector('.node-header');
      let isDragging = false, startX, startY, initialX, initialY;

      header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('close-btn')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = win.offsetLeft;
        initialY = win.offsetTop;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        win.style.left = (initialX + (e.clientX - startX)) + 'px';
        win.style.top = (initialY + (e.clientY - startY)) + 'px';
      });

      window.addEventListener('mouseup', () => { isDragging = false; });

      // Close handler
      win.querySelector('.close-btn').onclick = () => {
        win.remove();
        Kernel.sys.kill(proc.pid, 'SIGKILL');
        updateHUD();
      };

      // Populate content
      contentFn(body, proc);
      updateHUD();
    });

    return pid;
  }

  function updateHUD() {
    hudProcs.textContent = `ACTIVE NODES: ${Kernel.pids.list().length}`;
  }

  // 4. Built-in Core Nodes

  // Node 1: Terminal/CLI Node
  function openTerminalNode() {
    createNodeWindow('Terminal Stream', async (body, proc) => {
      body.innerHTML = `
        <div id="term-out-${proc.pid}" style="height: 180px; overflow-y: auto; font-size: 11px; margin-bottom: 8px;"></div>
        <input id="term-in-${proc.pid}" type="text" style="width:100%; background:transparent; border:none; border-bottom:1px solid #00f0ff; color:#76f2ff; font:inherit; outline:none;" placeholder="Type kernel command..." />
      `;
      const out = body.querySelector(`#term-out-${proc.pid}`);
      const input = body.querySelector(`#term-in-${proc.pid}`);

      const print = (txt) => {
        const d = document.createElement('div');
        d.textContent = txt;
        out.appendChild(d);
        out.scrollTop = out.scrollHeight;
      };

      print(`Spatial Stream Node initialized on PID ${proc.pid}.`);
      print(`Type 'help' for available system calls.`);

      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value;
          input.value = '';
          print('> ' + cmd);
          try {
            const parts = cmd.split(' ');
            const res = await Kernel.run(cmd);
          } catch (err) {
            print('Error: ' + err.message);
          }
        }
      });
    });
  }

  // Node 2: IndexedDB VFS Explorer Node
  function openVFSNode() {
    createNodeWindow('VFS Node Inspector', async (body) => {
      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <button id="vfs-refresh" style="background:#0a101a; border:1px solid #00f0ff; color:#00f0ff; cursor:pointer;">Refresh Root</button>
          <button id="vfs-mkfile" style="background:#0a101a; border:1px solid #00f0ff; color:#00f0ff; cursor:pointer;">+ New File</button>
        </div>
        <div id="vfs-tree" style="font-size: 12px; line-height: 1.6;"></div>
      `;

      const tree = body.querySelector('#vfs-tree');
      const loadTree = async () => {
        tree.innerHTML = 'Scanning /root/...';
        const files = await Kernel.sys.read('/root/') || [];
        const fileList = await Kernel.vfs.list('/root/');
        
        if (fileList.length === 0) {
          tree.innerHTML = '<i>Directory empty</i>';
          return;
        }

        tree.innerHTML = fileList.map(f => `<div>📄 /root/${f}</div>`).join('');
      };

      body.querySelector('#vfs-refresh').onclick = loadTree;
      body.querySelector('#vfs-mkfile').onclick = async () => {
        const name = prompt('File name:', 'sample.json');
        if (name) {
          await Kernel.sys.write(`/root/${name}`, { createdBy: "NodeOS", timestamp: Date.now() });
          loadTree();
        }
      };

      loadTree();
    });
  }

  // Node 3: Process Scheduler Node
  function openProcNode() {
    createNodeWindow('Process Scheduler', (body) => {
      const render = () => {
        const procs = Kernel.pids.list();
        body.innerHTML = `
          <table style="width:100%; text-align:left; font-size:11px; border-collapse:collapse;">
            <tr style="border-bottom:1px solid #00f0ff;"><th>PID</th><th>NAME</th><th>STATE</th></tr>
            ${procs.map(p => `<tr><td>${p.pid}</td><td>${p.name}</td><td>${p.state}</td></tr>`).join('')}
          </table>
        `;
      };
      render();
      setInterval(render, 2000);
    });
  }

  // 5. Radial Interaction Engine
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    dial.style.left = e.clientX + 'px';
    dial.style.top = e.clientY + 'px';
    dial.style.display = 'flex';
  });

  window.addEventListener('click', (e) => {
    if (!dial.contains(e.target)) dial.style.display = 'none';
  });

  document.getElementById('dial-term').onclick = () => { dial.style.display = 'none'; openTerminalNode(); };
  document.getElementById('dial-file').onclick = () => { dial.style.display = 'none'; openVFSNode(); };
  document.getElementById('dial-proc').onclick = () => { dial.style.display = 'none'; openProcNode(); };
  document.getElementById('dial-reboot').onclick = () => location.reload();

  // 6. Launch Initial Core Nodes
  openTerminalNode();

  // Confirm ready state to Norepinephrine Bootloader
  if (typeof ready === 'function') ready();

})(window.Kernel, window.ready);
