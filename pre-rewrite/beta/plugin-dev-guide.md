# Norepinephrine Plugin Development Guide

## Overview

Plugins are plain JavaScript files that are fetched and executed by Norepinephrine at boot. They have full access to the terminal's `print` function, command registration API, and `localStorage`. This guide covers everything you need to know to build one.

---

## Basic Structure

Every plugin should be wrapped in an IIFE (Immediately Invoked Function Expression) to avoid polluting the global scope:

```js
(function () {
    // your plugin code here
})();
```

---

## Registering Commands

Use `window.registerCommand` to add commands to the terminal:

```js
window.registerCommand(name, description, handler);
```

| Parameter     | Type       | Description                                              |
|---------------|------------|----------------------------------------------------------|
| `name`        | `string`   | The command name users will type (case-insensitive)      |
| `description` | `string`   | Short description shown in `help`                        |
| `handler`     | `function` | Called when the command is run, receives args as a string |

### Example

```js
(function () {
    window.registerCommand("greet", "Say hello. Usage: greet <name>", function (args) {
        if (!args) return print("Usage: greet <name>");
        print("Hello, " + args + "!");
    });
})();
```

Running `greet World` will print `Hello, World!`.

---

## The `print` Function

`print` is available globally and is how you output text to the terminal.

```js
print(text);           // plain text
print(html, true);     // rendered HTML
```

### Styled output using CSS classes

| Class            | Color  | Use for              |
|------------------|--------|----------------------|
| `danger-text`    | Red    | Errors               |
| `warning-text`   | Yellow | Warnings             |
| `cmd`            | Purple | Commands / values    |
| `dim`            | Grey   | Secondary info       |

```js
print(`<span class="danger-text">Something went wrong.</span>`, true);
print(`<span class="warning-text">Be careful.</span>`, true);
print(`<span class="cmd">Important value</span>`, true);
print(`<span class="dim">Extra info</span>`, true);
```

### Horizontal rule

```js
print("<hr>", true);
```

---

## Async Commands

Handlers can be `async` — Norepinephrine will `await` them correctly:

```js
window.registerCommand("fetch-something", "Fetch data from an API.", async function (args) {
    print("Loading...");
    try {
        const r = await fetch("https://api.example.com/data");
        const data = await r.json();
        print(data.result);
    } catch (e) {
        print(`<span class="danger-text">Error: ${e.message}</span>`, true);
    }
});
```

---

## Storage

Plugins have direct access to `localStorage`. There are no namespaces enforced, so use a unique prefix for your keys to avoid collisions with other plugins.

```js
// Save data
localStorage.setItem("myplugin_settings", JSON.stringify({ theme: "dark" }));

// Load data
const raw = localStorage.getItem("myplugin_settings");
const settings = raw ? JSON.parse(raw) : {};

// Remove data
localStorage.removeItem("myplugin_settings");
```

---

## Declaring Dependencies

If your plugin requires another plugin to be loaded first, declare it at the very top of your file using `// @requires`:

```js
// @requires https://example.com/some-other-plugin.js

(function () {
    // your plugin that depends on the above
})();
```

### How it works

- Norepinephrine reads `@requires` lines before executing your plugin
- Each dependency is fetched and executed first, in order
- If the dependency is already loaded (by another plugin or a previous `@requires`), it is skipped — no duplicates
- When a user runs `plugin add` on your plugin, the required URLs are shown in the confirmation prompt so the user knows what will be installed

### Multiple dependencies

```js
// @requires https://example.com/plugin-a.js
// @requires https://example.com/plugin-b.js
```

---

## Wrapping `handle` for Aliases or Intercepts

If your plugin needs to intercept all terminal input before dispatch (e.g. for an alias system), wrap `window.handle`:

```js
const _original = window.handle;
window.handle = async function (input) {
    const parts = input.trim().split(" ");
    const cmd = parts[0];

    // intercept specific input
    if (cmd === "myalias") {
        return _original("actualcommand " + parts.slice(1).join(" "));
    }

    return _original(input);
};
```

Always store and call the original `handle` — don't replace it entirely or you'll break all built-in commands.

---

## Safe Mode Awareness

When Norepinephrine boots in safe mode, plugins are not loaded at all. There is nothing special you need to do — your plugin simply won't run. If the user types `loadplugins`, all plugins load normally.

If your plugin stores state in `localStorage` and relies on being loaded every boot, this is fine — data persists, it just won't be active until plugins load.

---

## Full Example Plugin

```js
// @requires https://example.com/some-dependency.js

/**
 * My Example Plugin
 * Usage: shout <text>
 */
(function () {

    function loadData() {
        try {
            const raw = localStorage.getItem("shout_data");
            return raw ? JSON.parse(raw) : { count: 0 };
        } catch {
            return { count: 0 };
        }
    }

    function saveData(data) {
        localStorage.setItem("shout_data", JSON.stringify(data));
    }

    let data = loadData();

    window.registerCommand("shout", "Shout text in uppercase. Usage: shout <text>", function (args) {
        if (!args) return print("Usage: shout <text>");
        data.count++;
        saveData(data);
        print(args.toUpperCase() + "!!!");
        print(`<span class="dim">(Shouted ${data.count} time(s) total)</span>`, true);
    });

    console.log("[shout] Plugin ready.");

})();
```

---

## Tips

- Always wrap in an IIFE to avoid global leaks
- Use a unique prefix for all your `localStorage` keys
- Handle errors gracefully — a thrown error in a command will print `Plugin Command Error: ...` to the terminal
- Use `console.log("[myplugin] Plugin ready.")` at the end so users can confirm it loaded (visible if the console-redirect plugin is active)
- Test in safe mode to make sure your plugin degrades cleanly when not loaded

---

## Launching Full-Page Apps with NoreAPI

Norepinephrine exposes `window.NoreAPI` which lets your plugin take over the full page to render a custom UI, then return cleanly to the terminal when done — the same way the visual installer works.

### API Reference

```js
window.NoreAPI.launchApp(html)   // Launch an app with HTML content
window.NoreAPI.exitApp()         // Return to the terminal
window.NoreAPI.isAppActive()     // Returns true if an app is running
window.NoreAPI.print             // Same as the terminal print function
window.NoreAPI.getStorage        // Same as getStorage
window.NoreAPI.setStorage        // Same as setStorage
window.NoreAPI.version           // Norepinephrine version string
```

### Basic Example

```js
window.registerCommand("myapp", "Launch my app.", function () {
    window.NoreAPI.launchApp(`
        <div style="padding: 30px; color: white; font-family: monospace;">
            <h2>My App</h2>
            <p>This is a full-page app.</p>
            <button onclick="window.NoreAPI.exitApp()">Back to terminal</button>
        </div>
    `);
});
```

### Notes

- Only one app can run at a time. `launchApp` returns `false` and prints an error if an app is already active.
- The terminal input is hidden while an app is running so keyboard shortcuts don't interfere.
- `exitApp()` restores the terminal, clears the app overlay, refocuses the input, and prints `[App exited]`.
- Your app HTML runs in the same page context as the terminal, so it has full access to `window.NoreAPI`, `localStorage`, `window.customCommands` etc.
- The overlay inherits the terminal's background color and font — style from there.
- Always provide a way for the user to call `NoreAPI.exitApp()`. If you don't, the user is stuck until they reload.

### Using NoreAPI Storage in Your App

Since `NoreAPI.getStorage` and `NoreAPI.setStorage` are just references to the terminal's own storage helpers, you can use them directly inside your app's inline event handlers:

```html
<button onclick="
    window.NoreAPI.setStorage('myapp_setting', 'value');
    window.NoreAPI.exitApp();
">Save and Exit</button>
```
