const { WinFormsSession, Form, TrackBar, Label } = require('../node-windows-forms');

async function main() {
    const session = new WinFormsSession();
    await session.start();

    const form = new Form(session, 'Form1');
    form.Text = 'TrackBar Test';
    form.Width = 300;
    form.Height = 250;

    const trackbar = new TrackBar(session, form);
    trackbar.Top = 20;
    trackbar.Left = 20;
    trackbar.Width = 200;
    trackbar.Minimum = 0;
    trackbar.Maximum = 100;
    trackbar.Value = 50;
    trackbar.TickFrequency = 10;
    trackbar.SmallChange = 1;
    trackbar.LargeChange = 10;

    const lbl = new Label(session, form);
    lbl.Top = 70;
    lbl.Left = 20;
    lbl.Width = 200;
    lbl.Text = 'Value: 50';

    trackbar.on('ValueChanged', async () => {
        const val = await trackbar.Value;
        console.log('Value changed to:', val);
        lbl.Text = 'Value: ' + val;
    });

    trackbar.on('Scroll', async () => {
        console.log('Scroll event fired!');
    });

    setTimeout(async () => {
        console.log('Programmatically changing value to 75...');
        trackbar.Value = 75;
    }, 1500);

    setTimeout(() => {
        console.log('Test complete. Exiting.');
        process.exit(0);
    }, 3000);
}

main().catch(console.error);
