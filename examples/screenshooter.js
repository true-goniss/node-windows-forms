const { WinFormsSession, Form, PictureBox, Button } = require('../node-windows-forms');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

async function captureScreenToBuffer() {
    const tmpFile = path.join(__dirname, 'temp_screenshot.bmp');
    
    // Run PowerShell script to capture screen
    const psScript = `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($screen.X, $screen.Y, 0, 0, $bmp.Size); $bmp.Save('${tmpFile.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Bmp); $g.Dispose(); $bmp.Dispose();`;

    // Run powershell
    await execAsync(`powershell -NoProfile -Command "${psScript}"`);

    // Read the generated bitmap
    if (fs.existsSync(tmpFile)) {
        const buffer = fs.readFileSync(tmpFile);
        fs.unlinkSync(tmpFile); // Clean up
        return buffer;
    }
    
    throw new Error("Failed to capture screenshot");
}

async function main() {
    console.log("Starting screenshooter...");
    const app = new WinFormsSession();
    await app.start();

    const form = new Form(app, 'Form1');
    await form.setText("Screenshooter");
    await form.setSize(900, 700);

    const btn = new Button(app, form);
    await btn.setText("Take Screenshot");
    await btn.setLocation(10, 10);
    await btn.setSize(150, 40);

    const pic = new PictureBox(app, form);
    await pic.setLocation(10, 60);
    await pic.setSize(860, 590);
    await pic.setProperty('SizeMode', 'Zoom'); // Scale image to fit PictureBox

    btn.on('Click', async () => {
        try {
            await btn.setText("Capturing...");
            await btn.setProperty('Enabled', false);
            
            const start = Date.now();
            const bmpBuffer = await captureScreenToBuffer();
            
            console.log(`Captured ${bmpBuffer.length} bytes in ${Date.now() - start}ms. Sending via IPC...`);
            
            // Send binary buffer directly to PictureBox
            await pic.setImage(bmpBuffer);
            
            console.log(`Done. Total cycle time: ${Date.now() - start}ms`);
        } catch (err) {
            console.error(err);
        } finally {
            await btn.setText("Take Screenshot");
            await btn.setProperty('Enabled', true);
        }
    });

    form.on('Closed', () => {
        console.log("Form closed.");
        process.exit(0);
    });

    await form.show();
}

main().catch(console.error);
