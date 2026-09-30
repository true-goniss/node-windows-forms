let nodeWinForms;
try {
    nodeWinForms = require('../node-windows-forms');
} catch (e) {
    nodeWinForms = require('node-windows-forms');
}
const { WinFormsSession, Form, Button, MessageBox } = nodeWinForms;

async function run() {
    console.log("[Node] Starting in Attach Mode to pipe: TestPipeName...");
    const session = new WinFormsSession({ pipeName: 'TestPipeName' });

    session.on('error', (err) => console.error("Session Error:", err));
    session.on('disconnected', () => console.log("Session Disconnected."));

    try {
        const controls = await session.start();
        console.log("[Node] Attached successfully! Received manifest controls:", Object.keys(controls));

        // Use the existing Form1 if it exists, otherwise create a new one (or attach to an existing ID)
        // Usually, in attach mode, the C# app already has a Form (Form1).
        let mainForm = controls.Form1;
        if (!mainForm) {
            console.log("No Form1 in manifest, creating new Form reference...");
            mainForm = new Form(session, 'Form1');
        }

        await mainForm.setTitle("Attached Node.js");
        mainForm.Width = 300;
        mainForm.Height = 200;

        // Add a button dynamically via Node
        const btn = new Button(session, mainForm);
        btn.Text = "Hello from Node (Attached)";
        btn.Top = 50;
        btn.Left = 50;
        btn.Width = 180;
        btn.Height = 40;

        btn.OnClick.Attach(async () => {
            console.log("Button clicked!");
            await MessageBox.show(session, "Node is driving this!", "Attach Mode", "OK", "Information");
        });

        console.log("[Node] Setup complete. Awaiting user interaction...");
        
        // Let's close it after a few seconds so the test finishes automatically
        setTimeout(() => {
            console.log("[Node] Auto-closing test...");
            process.exit(0);
        }, 3000);

    } catch (e) {
        console.error("[Node] Failed to attach:", e);
        process.exit(1);
    }
}

run();
