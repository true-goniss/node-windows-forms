const { WinFormsSession, Form, TextBox, Label } = require('../node-windows-forms');

async function main() {
    const session = new WinFormsSession();
    await session.start();

    const form = new Form(session);
    form.Text = "Keyboard Event Test";
    form.Width = 400;
    form.Height = 300;

    const label = new Label(session, form);
    label.Text = "Type below and watch the console!";
    label.Top = 20;
    label.Left = 20;
    label.Width = 350;

    const textBox = new TextBox(session, form);
    textBox.Top = 50;
    textBox.Left = 20;
    textBox.Width = 300;

    // Attach KeyDown
    textBox.OnKeyDown.Attach((e) => {
        console.log(`[KeyDown] KeyCode: ${e.keyCode}, KeyValue: ${e.keyValue}, Modifiers: ${e.modifiers}`);
    });

    // Attach KeyPress
    textBox.OnKeyPress.Attach((e) => {
        console.log(`[KeyPress] KeyChar: ${e.keyChar}`);
    });

    // Attach KeyUp
    textBox.OnKeyUp.Attach((e) => {
        console.log(`[KeyUp] KeyCode: ${e.keyCode}, Modifiers: ${e.modifiers}`);
        
        if (e.keyCode === 'Escape') {
            console.log('Escape pressed. Closing session...');
            session.stop ? session.stop() : process.exit(0);
        }
    });

    console.log("Form created. Type in the text box to test events.");
    await form.show();
}

main().catch(console.error);
