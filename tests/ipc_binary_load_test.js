const { WinFormsSession, Form, PictureBox } = require('../node-windows-forms');

function generateNoiseFrame(width, height) {
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    const buffer = Buffer.allocUnsafe(fileSize);
    

    buffer.write('BM', 0);
    buffer.writeUInt32LE(fileSize, 2);
    buffer.writeUInt32LE(0, 6);
    buffer.writeUInt32LE(54, 10);
    

    buffer.writeUInt32LE(40, 14);
    buffer.writeInt32LE(width, 18);
    buffer.writeInt32LE(-height, 22); 
    buffer.writeUInt16LE(1, 26);
    buffer.writeUInt16LE(24, 28);
    buffer.writeUInt32LE(0, 30);
    buffer.writeUInt32LE(pixelArraySize, 34);
    buffer.writeInt32LE(2835, 38);
    buffer.writeInt32LE(2835, 42);
    buffer.writeUInt32LE(0, 46);
    buffer.writeUInt32LE(0, 50);
    
    let offset = 54;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            buffer[offset++] = Math.random() * 255; // B
            buffer[offset++] = Math.random() * 255; // G
            buffer[offset++] = Math.random() * 255; // R
        }
        offset += rowSize - (width * 3);
    }
    return buffer;
}

async function main() {
    console.log("Starting Load Test (10 seconds)...");
    const app = new WinFormsSession();
    await app.start();
    const form = new Form(app, 'Form1');
    
    await form.setText("IPC Binary Load Test");
    await form.setSize(800, 600);

    const pic = new PictureBox(app, form);
    await pic.setLocation(0, 0);
    await pic.setSize(780, 560);

    await form.show();

    let framesSent = 0;
    const startTime = Date.now();
    let isRunning = true;


    const loop = async () => {
        if (!isRunning || form.isDisposed) return;

        const bmpBuffer = generateNoiseFrame(780, 560);
        
        try {
            await pic.setImage(bmpBuffer);
            framesSent++;
        } catch (e) {
            console.error("Frame dropped:", e.stack);
        }

        setImmediate(loop);
    };

    loop();

    const memLogger = setInterval(() => {
        const usage = process.memoryUsage();
        console.log(`[${Math.floor((Date.now() - startTime) / 1000)}s] Frames: ${framesSent}, RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    }, 1000);

    setTimeout(() => {
        isRunning = false;
        clearInterval(memLogger);
        
        const duration = (Date.now() - startTime) / 1000;
        const fps = (framesSent / duration).toFixed(2);
        
        console.log(`\n--- Test Complete ---`);
        console.log(`Total Frames Sent: ${framesSent}`);
        console.log(`Duration: ${duration} seconds`);
        console.log(`Average FPS: ${fps}`);
        console.log(`Final Node Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`C# Memory should also be stable (check Task Manager)`);
        
        setTimeout(() => process.exit(0), 1000);
    }, 10000);
}

main().catch(console.error);
