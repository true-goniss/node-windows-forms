const { WinFormsSession, Form, PictureBox, Label } = require('../node-windows-forms');

// Generate an uncompressed 24-bit BMP frame dynamically
function generateFrame(width, height, frameIndex) {
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    const buffer = Buffer.allocUnsafe(fileSize);
    
    // BMP Header
    buffer.write('BM', 0);
    buffer.writeUInt32LE(fileSize, 2);
    buffer.writeUInt32LE(0, 6);
    buffer.writeUInt32LE(54, 10);
    
    // DIB Header
    buffer.writeUInt32LE(40, 14);
    buffer.writeInt32LE(width, 18);
    buffer.writeInt32LE(-height, 22); // Negative height means top-down BMP (much easier to draw)
    buffer.writeUInt16LE(1, 26);
    buffer.writeUInt16LE(24, 28);
    buffer.writeUInt32LE(0, 30);
    buffer.writeUInt32LE(pixelArraySize, 34);
    buffer.writeInt32LE(2835, 38);
    buffer.writeInt32LE(2835, 42);
    buffer.writeUInt32LE(0, 46);
    buffer.writeUInt32LE(0, 50);
    
    // Draw bouncing circle on a gradient
    const cx = width / 2 + Math.sin(frameIndex * 0.1) * (width / 3);
    const cy = height / 2 + Math.cos(frameIndex * 0.15) * (height / 3);
    const rSq = 40 * 40;

    let offset = 54;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const isCircle = (dx * dx + dy * dy) < rSq;

            if (isCircle) {
                // Red circle
                buffer[offset++] = 50;  // B
                buffer[offset++] = 50;  // G
                buffer[offset++] = 250; // R
            } else {
                // Moving gradient background
                buffer[offset++] = (x + frameIndex) % 255; // B
                buffer[offset++] = (y + frameIndex) % 255; // G
                buffer[offset++] = 40;                     // R
            }
        }
        // Padding
        const padding = rowSize - (width * 3);
        offset += padding;
    }

    return buffer;
}

async function main() {
    console.log("Starting animation...");
    const app = new WinFormsSession();
    await app.start();
    const form = new Form(app, 'Form1');
    
    await form.setText("Animation Window");
    await form.setSize(600, 450);

    const lbl = new Label(app, form);
    await lbl.setText("This animation is rendered in Node.js and sent frame-by-frame via binary IPC.");
    await lbl.setLocation(10, 10);
    await lbl.setSize(500, 20);

    const pic = new PictureBox(app, form);
    await pic.setLocation(10, 40);
    await pic.setSize(560, 350);

    await form.show();

    const FPS = 60;
    const frameInterval = 1000 / FPS;
    let frameIndex = 0;

    let isRunning = true;
    const loop = async () => {
        if (!isRunning || form.isDisposed) return;
        const start = Date.now();

        const bmpBuffer = generateFrame(560, 350, frameIndex);
        frameIndex++;

        // Send binary buffer directly to PictureBox
        await pic.setImage(bmpBuffer).catch(console.error);

        const elapsed = Date.now() - start;
        const delay = Math.max(0, frameInterval - elapsed);
        setTimeout(loop, delay);
    };
    
    loop();

    form.on('Closed', () => {
        console.log("Form closed.");
        isRunning = false;
        process.exit(0);
    });
}

main().catch(console.error);
