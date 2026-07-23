/**
 * Norepinephrine Environment Engine (Index-23 Adaptation)
 * Target: Norepinephrine Kernel v3.x
 */
((Kernel, ready) => {
    'use strict';

    // Inject Styles into the Parent Document
    const style = document.createElement('style');
    style.textContent = `
        :root { --glow: #ffffff; --bg: #0a0c10; --dim: #8b949e; --blue: #58a6ff; --warn: #ffcc00; --danger: #ff4444; }
        
        .nore-env-container {
            margin: 0;
            background: var(--bg);
            color: var(--glow);
            font-family: 'Consolas', 'Courier New', monospace;
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        #output {
            flex: 1;
            padding: 15px 20px;
            overflow-y: auto;
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.6;
            word-break: break-word;
            -webkit-overflow-scrolling: touch;
        }

        .input-row {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            background: #000;
            border-top: 1px solid #21262d;
            position: sticky;
            bottom: 0;
        }

        #tIn {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--glow);
            outline: none;
            font-family: inherit;
            font-size: 16px;
            margin-left: 10px;
            -webkit-appearance: none;
            border-radius: 0;
        }

        .prompt { color: var(--blue); font-weight: bold; }
        .cmd { color: #d2a8ff; font-weight: bold; }
        .warning-text { color: var(--warn); }
        .danger-text { color: var(--danger); font-weight: bold; }
        .dim { color: var(--dim); }
        hr { border: 0; border-top: 1px solid #21262d; margin: 10px 0; }

        #banner { line-height: 1.2; font-size: clamp(2px, 1.1vw, 13px); }

        #nore-app-overlay {
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: var(--bg);
            z-index: 9999;
            overflow: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            color: var(--glow);
        }
        #nore-app-overlay.active { display: block; }
    `;
    document.head.appendChild(style);

    // Build Environment DOM in Kernel Root Element
    Kernel.root.innerHTML = `
        <div class="nore-env-container">
            <div id="nore-app-overlay"></div>
            <div id="output"></div>
            <div class="input-row" id="input-container">
                <span class="prompt">></span>
                <input id="tIn" autocomplete="off" autocorrect="off" autocapitalize="off" autofocus spellcheck="false" enterkeyhint="send">
            </div>
        </div>
    `;

    // Local Variables & Setup
    const out = document.getElementById("output");
    const tin = document.getElementById("tIn");
    const _appOverlay = document.getElementById("nore-app-overlay");

    let history = [];
    let historyIndex = -1;
    let _awaitingConfirm = false;
    let _confirmCallback = null;
    let _usersOnlineDiv = null;
    let _appActive = false;

    const ASCII_ART = `
███╗   ██╗ ██████╗ ██████╗ ███████╗██████╗ ██╗███╗   ██╗███████╗██████╗ ██╗  ██╗██████╗ ██╗███╗   ██╗███████╗
████╗  ██║██╔═══██╗██╔══██╗██╔════╝██╔══██╗██║████╗  ██║██╔════╝██╔══██╗██║  ██║██╔══██╗██║████╗  ██║██╔════╝
██╔██╗ ██║██║   ██║██████╔╝█████╗  ██████╔╝██║██╔██╗ ██║█████╗  ██████╔╝███████║██████╔╝██║██╔██╗ ██║█████╗  
██║╚██╗██║██║   ██║██╔══██╗██╔══╝  ██╔═══╝ ██║██║╚██╗██║██╔══╝  ██╔═══╝ ██╔══██║██╔══██╗██║██║╚██╗██║██╔══╝  
██║ ╚████║╚██████╔╝██║  ██║███████╗██║     ██║██║ ╚████║███████╗██║     ██║  ██║██║  ██║██║██║ ╚████║███████╗
╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝
`;
    const VERSION_STRING = `v1.1 Build 3 (Kernel ${Kernel.version})`;

    window.customCommands = {};
    window.customHelp = {};

    window.registerCommand = function(cmdName, description, handlerFunction) {
        window.customCommands[cmdName.toLowerCase()] = handlerFunction;
        window.customHelp[cmdName.toLowerCase()] = description;
    };

    const print = (t, html = false) => {
        const div = document.createElement("div");
        if (t === undefined) return;
        const textContent = typeof t === 'object' ? JSON.stringify(t, null, 2) : String(t);
        html ? div.innerHTML = textContent : div.textContent = textContent;
        out.appendChild(div);
        out.scrollTop = out.scrollHeight;
    };

    function printUsersOnline(count) {
        if (!_usersOnlineDiv) {
            _usersOnlineDiv = document.createElement("div");
            out.appendChild(_usersOnlineDiv);
        }
        _usersOnlineDiv.innerHTML = `<span class="dim">${count} user${count === 1 ? "" : "s"} online</span>`;
        out.scrollTop = out.scrollHeight;
    }

    function printBanner() {
        const art = document.createElement("div");
        art.id = "banner";
        art.textContent = ASCII_ART;
        out.appendChild(art);

        const ver = document.createElement("div");
        ver.textContent = VERSION_STRING;
        out.appendChild(ver);

        out.scrollTop = out.scrollHeight;
    }

    // Command Handlers Mapping To Kernel Actions
    const commands = {
        "installer": "Launch visual plugin installer.",
        "plugin": "Manage plugins (add <url> | list | remove <index>).",
        "safemode": "Reboot into kernel safe recovery shell.",
        "version": "Show current version info.",
        "changelog": "Show recent updates.",
        "tos": "Display Terms of Service.",
        "accept": "Accept current Terms of Service.",
        "stats": "View current users.",
        "reboot": "Reloads Norepinephrine Kernel.",
        "reinstall": "Wipe all local data and reload fresh.",
        "clear": "Clear screen.",
        "help": "Show this menu."
    };

    async function handle(input) {
        const raw = input.trim();
        if (!raw) return;

        if (_awaitingConfirm) {
            print(`\n> ${raw}`);
            const choice = raw.toLowerCase();
            if (choice === 'y') {
                const cb = _confirmCallback;
                _awaitingConfirm = false;
                _confirmCallback = null;
                await cb();
            } else {
                print("Cancelled.");
                _awaitingConfirm = false;
                _confirmCallback = null;
            }
            return;
        }

        print(`\n> ${raw}`);
        history.push(raw);
        historyIndex = history.length;

        const parts = raw.split(" ");
        const cmd = parts[0].toLowerCase();
        const subCmd = parts[1] ? parts[1].toLowerCase() : "";
        const args = parts.slice(2).join(" ");

        if (!Kernel.tos.accepted && cmd !== "tos" && cmd !== "accept") {
            return print("You must accept the Terms of Service. Type 'tos' to read, then 'accept'.");
        }

        if (window.customCommands[cmd]) {
            try {
                await window.customCommands[cmd](parts.slice(1).join(" "));
            } catch (e) {
                print(`Plugin Command Error: ${e.message}`);
            }
            return;
        }

        switch(cmd) {
            case 'safemode':
                print("Rebooting into recovery shell...");
                setTimeout(() => Kernel.commands['safemode'].fn(), 500);
                break;

            case 'reboot':
                print("Rebooting Kernel...");
                setTimeout(() => Kernel.commands['reboot'].fn(), 500);
                break;

            case 'reinstall':
                print("Wiping Kernel VFS & storage data...");
                setTimeout(() => Kernel.commands['wipe'].fn(), 800);
                break;

            case 'version':
                print("<hr>", true);
                printBanner();
                print(`Kernel Version: ${Kernel.version}`);
                print("<hr>", true);
                break;

            case 'tos':
                print("<hr>", true);
                print(Kernel.tos.content || "Standard terms apply. Respect user privacy and run safe code.");
                print("<hr>", true);
                break;

            case 'accept':
                Kernel.tos.accept();
                print("TOS accepted. You may now use the terminal.");
                break;

            case 'stats':
                print("<hr>", true);
                print(`Terminal HWID: <span class="dim">${Kernel.hwid}</span>`, true);
                print("<hr>", true);
                break;

            case 'help':
                print("<hr>", true);
                print("--- Built-in Commands ---");
                for (let c in commands) print(`<span class="cmd">${c}</span>: ${commands[c]}`, true);
                if (Object.keys(window.customHelp).length > 0) {
                    print("\n--- Plugin Commands ---");
                    for (let c in window.customHelp) print(`<span class="cmd">${c}</span>: ${window.customHelp[c]}`, true);
                }
                print("<hr>", true);
                break;

            case 'clear':
                out.innerHTML = "";
                _usersOnlineDiv = null;
                break;

            default:
                // Check if Kernel handles this built-in command directly
                if (Kernel.commands[cmd]) {
                    try {
                        const res = await Kernel.commands[cmd].fn(parts.slice(1).join(" "));
                        if (res) print(res);
                    } catch (err) {
                        print(`Command Error: ${err.message}`);
                    }
                } else {
                    print(`Unknown command: '${cmd}'. Type 'help'.`);
                }
        }
    }

    tin.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handle(tin.value);
            tin.value = "";
        } else if (e.key === "ArrowUp") {
            if (historyIndex > 0) {
                historyIndex--;
                tin.value = history[historyIndex];
            }
            e.preventDefault();
        } else if (e.key === "ArrowDown") {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                tin.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                tin.value = "";
            }
            e.preventDefault();
        }
    });

    document.addEventListener("click", () => {
        if (document.activeElement !== tin && !_appActive) tin.focus();
    });

    // Expose NoreAPI for Plugins inside Environment
    window.NoreAPI = {
        version: "1.0",
        print,
        getStorage: Kernel.storage.get,
        setStorage: Kernel.storage.set,
        launchApp(builder) {
            if (_appActive) return false;
            _appActive = true;
            _appOverlay.innerHTML = "";
            const container = document.createElement("div");
            container.style.cssText = "width:100%;min-height:100%;box-sizing:border-box;";
            _appOverlay.appendChild(container);
            _appOverlay.classList.add("active");
            tin.disabled = true;
            try {
                builder(container);
            } catch(e) {
                print('<span class="danger-text">[NoreAPI] App error: ' + e.message + '</span>', true);
                this.exitApp();
                return false;
            }
            return true;
        },
        exitApp() {
            if (!_appActive) return;
            _appActive = false;
            _appOverlay.classList.remove("active");
            _appOverlay.innerHTML = "";
            tin.disabled = false;
            tin.focus();
        },
        isAppActive() { return _appActive; }
    };

    // Boot Environment Sequence
    printBanner();
    printUsersOnline("1");
    print("<hr>", true);

    if (!Kernel.tos.accepted) {
        print("You must accept the Terms of Service. Type 'tos' to view.");
    } else {
        print("Type 'help' for available operations.");
    }

    // Signal kernel that environment execution ready
    if (typeof ready === 'function') ready();

})(window.Kernel, ready);
