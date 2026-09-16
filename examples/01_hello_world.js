const { WinFormsSession, Form, Button, MessageBox } = require('../node-windows-forms');

async function run() {
    console.log("Starting node-windows-forms Hello World...");

    // 1. Initialize the session. It will automatically spawn the bundled C# executable.
    const session = new WinFormsSession();
    await session.start();

    // 2. Create the main form
    const mainForm = new Form(session, 'Form1');
    await mainForm.setTitle("Hello World - Node.js WinForms");
    mainForm.Width = 400;
    mainForm.Height = 250;
    mainForm.StartPosition = "CenterScreen";

    // 3. Create a button
    const btn = new Button(session, mainForm);
    btn.Text = "Click Me!";
    btn.Width = 150;
    btn.Height = 40;
    btn.Top = 80;
    btn.Left = 115;

    // 4. Attach an event listener using Node.js syntax
    btn.OnClick.Attach(async () => {
        console.log("Button was clicked!");
        await MessageBox.show(session, "Hello from Node.js!", "Native MessageBox", "OK", "Information");
    });

    console.log("Application is running. Close the window to exit.");
}

run().catch(console.error);
