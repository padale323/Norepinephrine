# Norepinephrine

A lightweight, hackable browser terminal with a plugin system. Built as a single HTML file, hosted on GitHub Pages.

> **Current version:** Release Canidate 2

---

## Features

- Plugin system with install/remove/list management
- Visual plugin installer for browsing official plugins
- Safe Mode to recover from bad plugins
- Analytics showing live terminal connections
- TOS system with version checking
- Cache-busted plugin loading — always gets the latest version

---

## Using the Terminal

Visit the terminal at:

```
https://padale323.github.io/Norepinephrine
```

To boot into Safe Mode (skips all plugins):

```
https://padale323.github.io/Norepinephrine?safe
```
---

## Built-in Commands

| Command | Description |
|---|---|
| `help` | List all commands |
| `plugin add <url>` | Install a plugin |
| `plugin list` | List installed plugins |
| `plugin remove <index>` | Remove a plugin by index |
| `installer` | Launch the visual plugin installer |
| `safemode` | Reboot into safe mode |
| `loadplugins` | Load plugins while in safe mode |
| `stats` | Show live terminal connections |
| `version` | Show version info |
| `changelog` | Show recent changes |
| `tos` | View Terms of Service |
| `accept` | Accept Terms of Service |
| `reboot` | Reload the terminal |
| `reinstall` | Wipe all local data and reload |
| `clear` | Clear the screen |

---

## Plugins

Plugins are JavaScript files hosted anywhere online. They are fetched and executed at boot.

### The Installer

The easiest way to browse and install plugins is the visual installer. Type `installer` in the terminal to launch it. It reboots into a graphical interface where you can browse all official plugins, read descriptions, and install them in one click. After installing, it reboots back into the normal terminal with your new plugins active.

### Installing a plugin manually

```
plugin add https://example.com/my-plugin.js
```

You will be shown a security warning and a list of any dependencies before confirming. Type `y` to confirm or anything else to cancel.

### Managing plugins

```
plugin list              — show all installed plugins with their index numbers
plugin remove <index>    — remove a plugin by its index from plugin list
```

Plugins take effect on the next reboot. Use `reboot` after adding or removing.

### Official plugins

Official plugins are available through the visual installer (`installer` command) or from the [Norepinephrine-Installer](https://github.com/padale323/Norepinephrine-Installer) repository.

---

## Safe Mode

Safe Mode skips all plugin loading on boot. Use it to recover if a plugin is breaking the terminal.

**How to enter Safe Mode:**
- Add `?safe` to the URL
- Run the `safemode` command

**While in Safe Mode:**
- All built-in commands still work
- `plugin list` and `plugin remove` work normally so you can manage plugins
- Type `loadplugins` to load plugins without rebooting

---

## Terms of Service

Norepinephrine fetches its Terms of Service remotely on every boot from:

```
https://raw.githubusercontent.com/Norepinephrine-Tools/Terms/refs/heads/main/TOS.txt
```

On first launch you must read and accept the TOS before using the terminal. If the TOS is updated, you will be prompted to re-accept before any commands become available. You can view the TOS at any time with the `tos` command.

---

## Building a Plugin

See the full [Plugin Development Guide](./plugin-dev-guide.md).

---

## Changelog

See the `changelog` command inside the terminal for the full version history.
