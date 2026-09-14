<p align="center">
    <img src="https://raw.githubusercontent.com/true-goniss/node-windows-forms/main/assets/logo.png" alt="node-windows-forms logo" width="250"
</p>
<br/>
    
# node-windows-forms



A lightweight Node.js wrapper for native Windows Forms. Build blazing-fast, native Windows desktop GUIs directly from Node.js with virtually zero overhead.

---

## Why node-windows-forms?

If you want to build a desktop app with Node.js, your default choice is usually Electron. But Electron ships a full Chromium browser, making even a "Hello World" app consume 100+ MB of RAM and hundreds of megabytes of disk space.

**node-windows-forms** solves this by using an isolated C# IPC host. 
- **Lightweight:** Uses only ~30 MB of RAM.
- **Native UX:** Access real Windows native controls (System Tray, MessageBox, DataGridView, etc.).
- **Reliable Architecture:** Node.js communicates with a pre-built C# `.exe` via Named Pipes. No fragile C++ native modules (addons) that break every time you update Node.js!
- **Zero Config:** The C# host is pre-compiled as a tiny single-file executable. Just `npm install` and go.

## Installation

```bash
npm install node-windows-forms
```

*Note: The package includes a pre-built .NET 10 Framework-dependent executable. If the end-user doesn't have the .NET Desktop Runtime installed, Windows will safely prompt them to download it on the first run.*

## Quick Start (Hello World)

```javascript
const { WinFormsSession, Form, Button, MessageBox } = require('node-windows-forms');

async function main() {
    // 1. Initialize the session
    const session = new WinFormsSession();
    await session.start();

    // 2. Create a Window (Form)
    const form = new Form(session);
    form.Text = "My First App";
    form.Width = 300;
    form.Height = 200;

    // 3. Create a Button
    const btn = new Button(session, form);
    btn.Text = "Click Me!";
    btn.Width = 100;
    btn.Height = 40;
    btn.Left = 90;
    btn.Top = 50;

    // 4. Listen to events
    btn.OnClick.Attach(() => {
        MessageBox.show(session, "Hello from Node.js!", "Success", "OK", "Information");
    });

    // 5. Show the window
    await form.show();
}

main().catch(console.error);
```

## Features

- **Standard Controls:** `Form`, `Button`, `TextBox`, `Label`, `ComboBox`, `CheckBox`, `Panel`, `FlowLayoutPanel`, `ListBox`, `PictureBox`, `ProgressBar`, `TabControl`.
- **Advanced Controls:** `DataGridView` (Bidirectional data access), `MenuStrip`, `ContextMenuStrip`.
- **System Tray:** `NotifyIcon` allows your Node.js apps to live silently in the taskbar.
- **Native Dialogs:** `MessageBox`, `OpenFileDialog`, `SaveFileDialog`, `FolderBrowserDialog`.

## System Tray Example

```javascript
const { WinFormsSession, NotifyIcon, ContextMenuStrip, Form } = require('node-windows-forms');

async function run() {
    const session = new WinFormsSession();
    await session.start();

    // Create a tray icon
    const trayIcon = new NotifyIcon(session);
    trayIcon.Text = "My Node.js App";
    trayIcon.Icon = "default"; 
    trayIcon.Visible = true;

    // Add a right-click menu
    const contextMenu = new ContextMenuStrip(session);
    const exitItem = contextMenu.addMenuItem("Exit");
    
    exitItem.OnClick.Attach(() => {
        trayIcon.Visible = false;
        session.stop();
        process.exit(0);
    });

    trayIcon.ContextMenuStrip = contextMenu.id;
}

run();
```

## How it works

1. When you call `new WinFormsSession().start()`, Node.js spawns a lightweight, pre-compiled C# application (`node-windows-forms.exe`).
2. Node.js generates a unique Named Pipe and passes it to the C# process.
3. Node.js sends JSON commands over the pipe to create components (`{"action": "create", "type": "Button", ...}`).
4. The C# process renders the actual native WinForms components.
5. When a user clicks a button, C# sends a JSON event back to Node.js.

## License

ISC License.

---
> 🇷🇺 **Русская версия:** [README.ru.md](README.ru.md)
