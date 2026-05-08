/**
 * Norepinephrine NoreAPI Test App 2
 * Tests the Screen API added in v1.1.
 * Usage: testapp2
 */
(function () {

    window.registerCommand("testapp2", "Launch a test app to verify the Screen API.", function () {

        window.NoreAPI.launchApp(function (container) {
            container.style.cssText = "padding:30px;font-family:'Consolas',monospace;color:#fff;background:#0a0c10;min-height:100vh;box-sizing:border-box;";

            function el(tag, styles, text) {
                var e = document.createElement(tag);
                if (styles) e.style.cssText = styles;
                if (text !== undefined) e.textContent = text;
                return e;
            }

            function btn(label, danger) {
                var b = document.createElement("button");
                b.textContent = label;
                b.style.cssText = "background:transparent;border:1px solid " + (danger ? "#ff4444" : "#21262d") + ";color:" + (danger ? "#ff4444" : "#fff") + ";font-family:inherit;font-size:13px;padding:6px 14px;cursor:pointer;margin:4px 4px 4px 0;";
                return b;
            }

            function hr() {
                var h = document.createElement("hr");
                h.style.cssText = "border:0;border-top:1px solid #21262d;margin:16px 0;";
                return h;
            }

            var log = el("div", "margin-top:12px;font-size:12px;color:#8b949e;line-height:1.8;max-height:200px;overflow-y:auto;");

            function addLog(msg) {
                var line = el("div", null, "> " + msg);
                log.appendChild(line);
                log.scrollTop = log.scrollHeight;
            }

            container.appendChild(el("h1", "color:#58a6ff;margin:0 0 4px 0;font-size:18px;", "NoreAPI Screen API — Test App 2"));
            container.appendChild(el("p", "color:#8b949e;margin:0 0 16px 0;font-size:13px;", "Tests getScreen, getScreenText, getScreenHTML, watchScreen, lineCount, removeLastLines, replaceLastLine, clearScreen, scrollToTop, scrollToBottom."));
            container.appendChild(hr());

            var btnGetScreen = btn("getScreen()");
            btnGetScreen.onclick = function () {
                var lines = window.NoreAPI.getScreen();
                addLog("getScreen() returned " + lines.length + " lines");
                if (lines.length > 0) addLog('Last line: "' + lines[lines.length - 1].text.trim().slice(0, 60) + '"');
            };

            var btnGetText = btn("getScreenText()");
            btnGetText.onclick = function () {
                var text = window.NoreAPI.getScreenText();
                addLog("getScreenText() length: " + text.length + " chars");
                addLog('First 80: "' + text.slice(0, 80).replace(/\n/g, "\\n") + '"');
            };

            var btnGetHTML = btn("getScreenHTML()");
            btnGetHTML.onclick = function () {
                addLog("getScreenHTML() length: " + window.NoreAPI.getScreenHTML().length + " chars");
            };

            var btnLineCount = btn("lineCount()");
            btnLineCount.onclick = function () {
                addLog("lineCount(): " + window.NoreAPI.lineCount() + " lines");
            };

            var btnRemove = btn("removeLastLines(2)");
            btnRemove.onclick = function () {
                var before = window.NoreAPI.lineCount();
                window.NoreAPI.removeLastLines(2);
                addLog("removeLastLines(2): " + before + " → " + window.NoreAPI.lineCount() + " lines");
            };

            var btnReplace = btn("replaceLastLine()");
            btnReplace.onclick = function () {
                window.NoreAPI.print("← this line will be replaced in 600ms");
                setTimeout(function () {
                    window.NoreAPI.replaceLastLine('<span style="color:#ffcc00">← replaced at ' + new Date().toLocaleTimeString() + '</span>', true);
                    addLog("replaceLastLine() applied");
                }, 600);
            };

            var btnTop = btn("scrollToTop()");
            btnTop.onclick = function () { window.NoreAPI.scrollToTop(); addLog("scrollToTop() called"); };

            var btnBottom = btn("scrollToBottom()");
            btnBottom.onclick = function () { window.NoreAPI.scrollToBottom(); addLog("scrollToBottom() called"); };

            var btnClear = btn("clearScreen()");
            btnClear.onclick = function () {
                addLog("clearScreen() called — output will clear in 500ms");
                setTimeout(function () { window.NoreAPI.clearScreen(); }, 500);
            };

            var _unsub = null;
            var btnWatch = btn("watchScreen() start");
            var btnUnwatch = btn("watchScreen() stop");
            btnUnwatch.disabled = true;
            btnUnwatch.style.opacity = "0.4";

            btnWatch.onclick = function () {
                if (_unsub) return;
                _unsub = window.NoreAPI.watchScreen(function (line) {
                    addLog('watchScreen caught: "' + line.text.trim().slice(0, 50) + '"');
                });
                btnWatch.disabled = true; btnWatch.style.opacity = "0.4";
                btnUnwatch.disabled = false; btnUnwatch.style.opacity = "1";
                addLog("watchScreen() started");
            };

            btnUnwatch.onclick = function () {
                if (_unsub) { _unsub(); _unsub = null; }
                btnWatch.disabled = false; btnWatch.style.opacity = "1";
                btnUnwatch.disabled = true; btnUnwatch.style.opacity = "0.4";
                addLog("watchScreen() unsubscribed");
            };

            container.appendChild(btnGetScreen);
            container.appendChild(btnGetText);
            container.appendChild(btnGetHTML);
            container.appendChild(btnLineCount);
            container.appendChild(btnRemove);
            container.appendChild(btnReplace);
            container.appendChild(btnTop);
            container.appendChild(btnBottom);
            container.appendChild(btnClear);
            container.appendChild(el("div", "margin-top:8px;"));
            container.appendChild(btnWatch);
            container.appendChild(btnUnwatch);
            container.appendChild(hr());

            var btnExit = btn("Exit App", true);
            btnExit.onclick = function () { if (_unsub) _unsub(); window.NoreAPI.exitApp(); };
            container.appendChild(btnExit);
            container.appendChild(log);
        });
    });

    console.log("[testapp2] Plugin ready. Type 'testapp2' to launch.");

})();
