let nodeWinForms;
try {
    nodeWinForms = require('../../node-windows-forms');
} catch (e) {
    nodeWinForms = require('node-windows-forms');
}
const { WinFormsSession, MessageBox } = nodeWinForms;

async function run() {
    console.log("[Node] Connecting to Visual Studio Designer app...");
    
    // Attach to the running C# application using the same pipe name
    const session = new WinFormsSession({ pipeName: 'DesignerAppPipe' });
    
    session.on('error', (err) => {
        console.error("Session Error:", err);
    });
    
    session.on('disconnected', () => {
        console.log("C# Application closed.");
    });

    try {
        const controls = await session.start();
        console.log("[Node] Attached successfully! Controls discovered in VS Designer:", Object.keys(controls));

        const mainForm = controls.Form1;
        const button1 = controls.button1;
        
        // We can manipulate the properties of controls created in C#
        await mainForm.setTitle("Node.js Attached to VS Designer!");
        
        button1.Text = "Modified by Node.js";
        
        // We can attach event listeners to designer controls natively!
        button1.OnClick.Attach(async () => {
            console.log("Button clicked!");
            await MessageBox.show(
                session, 
                "You clicked the button that was created in Visual Studio's Designer, but this event was handled in Node.js!", 
                "Magic of Attach Mode", 
                "OK", 
                "Information"
            );
        });
        
        console.log("[Node] Setup complete. Try clicking the button in the window!");

    } catch (e) {
        console.error("[Node] Failed to attach:", e);
        process.exit(1);
    }
}

run();
