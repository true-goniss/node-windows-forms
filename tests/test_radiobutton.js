const { WinFormsSession, Form, RadioButton } = require('../node-windows-forms');

async function main() {
    const session = new WinFormsSession();
    await session.start();

    const form = new Form(session, 'Form1');
    form.Text = 'RadioButton Test';
    form.Width = 300;
    form.Height = 250;

    const radio1 = new RadioButton(session, form);
    radio1.Text = 'Option A';
    radio1.Top = 20;
    radio1.Left = 20;
    radio1.Checked = true;

    const radio2 = new RadioButton(session, form);
    radio2.Text = 'Option B';
    radio2.Top = 60;
    radio2.Left = 20;

    const radio3 = new RadioButton(session, form);
    radio3.Text = 'Option C';
    radio3.Top = 100;
    radio3.Left = 20;

    radio1.on('CheckedChanged', async () => {
        console.log(`Option A checked:`, await radio1.Checked);
    });

    radio2.on('CheckedChanged', async () => {
        console.log(`Option B checked:`, await radio2.Checked);
    });

    radio3.on('CheckedChanged', async () => {
        console.log(`Option C checked:`, await radio3.Checked);
    });

    console.log('Testing programmatically changing Checked state...');
    
    // Test logic
    setTimeout(async () => {
        console.log('Programmatically selecting Option B...');
        radio2.Checked = true;
    }, 1500);

    setTimeout(async () => {
        console.log('Programmatically selecting Option C...');
        radio3.Checked = true;
    }, 3000);

    setTimeout(() => {
        console.log('Test complete. Exiting.');
        process.exit(0);
    }, 4500);
}

main().catch(console.error);
