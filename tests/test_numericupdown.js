const { WinFormsSession, Form, NumericUpDown } = require('./node-windows-forms');

async function main() {
    const session = new WinFormsSession();
    await session.start();

    const form = new Form(session, 'Form1');
    form.Text = 'NumericUpDown Test';
    form.Width = 300;
    form.Height = 200;

    const nud = new NumericUpDown(session, form);
    nud.Left = 50;
    nud.Top = 50;
    nud.Width = 100;
    
    // Set properties
    nud.Minimum = 0;
    nud.Maximum = 100;
    nud.Value = 50;
    nud.DecimalPlaces = 2;
    nud.Increment = 0.5;
    nud.ThousandsSeparator = true;
    nud.Hexadecimal = false;
    nud.ReadOnly = false;
    nud.UpDownAlign = 'Left';
    nud.InterceptArrowKeys = true;

    nud.on('ValueChanged', async (e) => {
        console.log('Value changed to:', await nud.Value);
    });

    console.log('Initial value:', await nud.Value);

    setTimeout(async () => {
        nud.Value = 75.5;
        console.log('Set value to 75.5');
    }, 2000);

    // Keep it running for a bit then close
    setTimeout(() => {
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
