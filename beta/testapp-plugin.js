/**
 * Norepinephrine NoreAPI Test Plugin
 * Tests the NoreAPI launchApp builder function pattern.
 * Usage: testapp
 */
(function () {

    window.registerCommand("testapp", "Launch a test app to verify NoreAPI.", function () {

        const launched = window.NoreAPI.launchApp(function (container) {

            // Apply styles
            container.style.cssText = "padding:30px;font-family:'Consolas','Courier New',monospace;color:#fff;background:#0a0c10;min-height:100vh;box-sizing:border-box;";

            // Build UI with createElement — no strings, no scope issues
            function el(tag, styles, text) {
                const e = document.createElement(tag);
                if (styles) e.style.cssText = styles;
                if (text) e.textContent = text;
                return e;
            }

            function btn(label, danger) {
                const b = document.createElement("button");
                b.textContent = label;
                b.style.cssText = `background:transparent;border:1px solid ${danger ? "#ff4444" : "#21262d"};color:${danger ? "#ff4444" : "#fff"};font-family:inherit;font-size:14px;padding:8px 18px;cursor:pointer;margin:5px 5px 5px 0;`;
                b.onmouseover = () => b.style.borderColor = danger ? "#ff6666" : "#58a6ff";
                b.onmouseout  = () => b.style.borderColor = danger ? "#ff4444" : "#21262d";
                return b;
            }

            const log = el("div", "margin-top:15px;color:#8b949e;font-size:13px;line-height:1.8;");

            function addLog(msg) {
                const line = document.createElement("div");
                line.textContent = "> " + msg;
                log.appendChild(line);
            }

            const hr = () => {
                const h = document.createElement("hr");
                h.style.cssText = "border:0;border-top:1px solid #21262d;margin:20px 0;";
                return h;
            };

            const title = el("h1", "color:#58a6ff;margin-bottom:5px;", "NoreAPI Test App");
            const sub1  = el("p",  "color:#8b949e;margin:5px 0;", "Launched via NoreAPI.launchApp(builder).");
            const sub2  = el("p",  "color:#8b949e;margin:5px 0;", "The terminal is hidden behind this overlay.");

            const btnWrite  = btn("Test Storage Write");
            const btnRead   = btn("Test Storage Read");
            const btnVer    = btn("Check Version");
            const btnActive = btn("Check isAppActive");
            const btnDouble = btn("Try Launch Second App");
            const btnExit   = btn("Exit App", true);

            btnWrite.onclick  = () => { window.NoreAPI.setStorage("testapp_test", "hello"); addLog("Storage write: ok"); };
            btnRead.onclick   = () => addLog("Storage read: " + window.NoreAPI.getStorage("testapp_test"));
            btnVer.onclick    = () => addLog("NoreAPI version: " + window.NoreAPI.version);
            btnActive.onclick = () => addLog("App active: " + window.NoreAPI.isAppActive());
            btnDouble.onclick = () => addLog("Second launchApp returned: " + window.NoreAPI.launchApp(function(){}) + " (should be false)");
            btnExit.onclick   = () => window.NoreAPI.exitApp();

            container.appendChild(title);
            container.appendChild(sub1);
            container.appendChild(sub2);
            container.appendChild(hr());
            container.appendChild(btnWrite);
            container.appendChild(btnRead);
            container.appendChild(btnVer);
            container.appendChild(btnActive);
            container.appendChild(btnDouble);
            container.appendChild(hr());
            container.appendChild(btnExit);
            container.appendChild(log);
        });

        if (!launched) {
            print("Could not launch testapp — another app is already running.");
        }
    });

    console.log("[testapp] Plugin ready. Type 'testapp' to launch.");

})();                    border: 1px solid #21262d;
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 14px;
                    padding: 8px 18px;
                    cursor: pointer;
                    margin: 5px 5px 5px 0;
                }
                .testapp-btn:hover { border-color: #58a6ff; color: #58a6ff; }
                .testapp-btn.danger { border-color: #ff4444; color: #ff4444; }
                #testapp-log {
                    margin-top: 15px;
                    color: #8b949e;
                    font-size: 13px;
                    line-height: 1.8;
                }
            </style>
            <div id="testapp-root">
                <h1>NoreAPI Test App</h1>
                <p>This app was launched via <span style="color:#d2a8ff">NoreAPI.launchApp()</span>.</p>
                <p>The terminal is hidden behind this overlay.</p>
                <hr>

                <button class="testapp-btn" onclick="testappLog('Storage write ok'); window.NoreAPI.setStorage('testapp_test', 'hello');">
                    Test Storage Write
                </button>

                <button class="testapp-btn" onclick="testappLog('Storage read: ' + window.NoreAPI.getStorage('testapp_test'))">
                    Test Storage Read
                </button>

                <button class="testapp-btn" onclick="testappLog('NoreAPI version: ' + window.NoreAPI.version)">
                    Check Version
                </button>

                <button class="testapp-btn" onclick="testappLog('App active: ' + window.NoreAPI.isAppActive())">
                    Check isAppActive
                </button>

                <button class="testapp-btn" onclick="testappTryDouble()">
                    Try Launch Second App
                </button>

                <hr>

                <button class="testapp-btn danger" onclick="window.NoreAPI.exitApp()">
                    Exit App
                </button>

                <div id="testapp-log"></div>
            </div>
        `);

        if (!launched) {
            print("Could not launch testapp — another app is already running.");
        }
    });

    console.log("[testapp] Plugin ready. Type 'testapp' to launch.");

})();
