const assert = require('assert');
const { WinFormsSession, Form, Button, Label, TextBox, MessageBox } = require('../node-windows-forms');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function runTests() {
    console.log("=== TESTING MULTI-WINDOW AND DIALOGS ===");

    // Automatically uses ../bin/node-windows-forms.exe
    const session = new WinFormsSession();

    session.on('error', (err) => console.error("[CRITICAL IPC ERROR]:", err));
    session.on('disconnected', () => console.log("[OK] Application closed."));

    try {
        await session.start();
        console.log("[OK] Connection established.");

        // Bind to main form first so it's not orphaned
        const mainForm = new Form(session, 'Form1');
        mainForm.Text = "Main Window";
        mainForm.Width = 400;
        mainForm.Height = 300;
        await mainForm.show();

        // Create new form
        const form2 = new Form(session);
        form2.Text = "Second Window";
        form2.Width = 300;
        form2.Height = 200;

        const lbl = new Label(session, form2);
        lbl.Text = "I am a second window created from Node.js!";
        lbl.Top = 20;
        lbl.Left = 20;
        lbl.Width = 250;

        const btn = new Button(session, form2);
        btn.Text = "Show MessageBox";
        btn.Top = 60;
        btn.Left = 20;
        btn.Width = 150;

        btn.OnClick.Attach(async () => {
            console.log("[JS] Button clicked, showing MessageBox...");
            // Async in JS, doesn't block Node event loop
            const result = await MessageBox.show(session, "Hello from Node.js!", "Title", "YesNo", "Information");
            console.log(`[JS] User clicked: ${result}`);

            // Close second form
            await form2.close();
            console.log("[PASS] Second form closed");
        });

        // Show second form
        await form2.show();
        console.log("  => [PASS] Second form created and shown");

        console.log("\n[!] Please click 'Show MessageBox' in second window...");

    } catch (e) {
        console.error("\n[FAIL] TESTS FAILED!");
        console.error(e);
        process.exit(1);
    }
}

runTests();
