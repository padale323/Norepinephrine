// @environment
// Terminal Environment — a minimal CLI that draws into Kernel.root.
// This is a demo of the environment contract: take Kernel.root, render
// whatever you want, drive it entirely off Kernel.commands / Kernel.call.
// Loaded via: Kernel.call('setenv', '<url-to-this-file>') then reboot,
// or by editing kernel_config in localStorage directly.

(function (Kernel) {
  const root = Kernel.root;
  root.innerHTML = `
    <style>
      #te-wrap{height:100%;box-sizing:border-box;padding:16px;font:14px 'JetBrains Mono',monospace;
        background:#0F1115;color:#E2E8F0;overflow-y:auto;}
      #te-out .line{white-space:pre-wrap;margin-bottom:4px;}
      #te-prompt{display:flex;gap:8px;margin-top:6px;}
      #te-label{color:#818CF8;white-space:nowrap;}
      #te-in{flex:1;background:transparent;border:none;outline:none;color:#fff;font:inherit;caret-color:#818CF8;}
      .te-cmd{color:#818CF8;font-weight:600;}
      .te-dim{color:#64748B;}
    </style>
    <div id="te-wrap">
      <div id="te-out"></div>
      <div id="te-prompt"><span id="te-label">nore@terminal:~$</span><input id="te-in" autocomplete="off" spellcheck="false"></div>
    </div>
  `;

  const wrap = root.querySelector('#te-wrap');
  const out = root.querySelector('#te-out');
  const input = root.querySelector('#te-in');

  function print(text) {
    const d = document.createElement('div');
    d.className = 'line';
    d.textContent = text;
    out.appendChild(d);
    wrap.scrollTop = wrap.scrollHeight;
  }

  print('Terminal Environment loaded on NoreKernel v' + Kernel.version);
  print('Type "help" to list commands.');

  let history = Kernel.storage.getJSON('te_history', []);
  let histIdx = history.length;

  async function handle(line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    print('/ ' + trimmed);
    history.push(trimmed);
    Kernel.storage.setJSON('te_history', history.slice(-50));
    histIdx = history.length;

    const [name, ...args] = trimmed.split(/\s+/);

    if (!Kernel.tos.accepted && !['tos', 'accept'].includes(name.toLowerCase())) {
      print('You must accept the Terms of Service. Type "tos" then "accept".');
      return;
    }

    if (name.toLowerCase() === 'clear') { out.innerHTML = ''; return; }

    try {
      const result = await Kernel.call(name, ...args);
      if (result !== undefined) print(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (e) {
      print(`Unknown or failed command: ${name} (${e.message})`);
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { handle(input.value); input.value = ''; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); histIdx = Math.max(0, histIdx - 1); input.value = history[histIdx] || ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); histIdx = Math.min(history.length, histIdx + 1); input.value = history[histIdx] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (!val) return;
      const matches = Object.keys(Kernel.commands).filter((c) => c.startsWith(val));
      if (matches.length === 1) input.value = matches[0];
      else if (matches.length > 1) print('Suggestions: ' + matches.join(', '));
    }
  });
  root.addEventListener('click', () => input.focus());
  input.focus();
})(Kernel);
