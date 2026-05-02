/**
 * Norepinephrine NoreAPI Test Plugin
 * Launches a simple app to test the NoreAPI launchApp/exitApp system.
 * Usage: testapp
 */
(function () {

    window.registerCommand("testapp", "Launch a test app to verify NoreAPI.", function () {

        const launched = window.NoreAPI.launchApp(`
            <style>
                #testapp-root {
                    padding: 30px;
                    font-family: 'Consolas', 'Courier New', monospace;
                    color: #ffffff;
                    background: #0a0c10;
                    min-height: 100vh;
                    box-sizing: border-box;
                }
                #testapp-root h1 { color: #58a6ff; margin-bottom: 5px; }
                #testapp-root p  { color: #8b949e; margin: 5px 0; }
                #testapp-root hr { border: 0; border-top: 1px solid #21262d; margin: 20px 0; }
                .testapp-btn {
                    background: transparent;
                    border: 1px solid #21262d;
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

                <button class="testapp-btn" onclick="testappLog('Storage write: ' + (window.NoreAPI.setStorage('testapp_test', 'hello') !== undefined ? 'ok' : 'done'))">
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

            <script>
                function testappLog(msg) {
                    const log = document.getElementById("testapp-log");
                    if (log) log.innerHTML += "> " + msg + "<br>";
                }

                function testappTryDouble() {
                    const result = window.NoreAPI.launchApp("<p>This should not appear.</p>");
                    testappLog("Second launchApp returned: " + result + " (should be false)");
                }
            <\/script>
        `);

        if (!launched) {
            print("Could not launch testapp — another app is already running.");
        }
    });

    console.log("[testapp] Plugin ready. Type 'testapp' to launch.");

})();
