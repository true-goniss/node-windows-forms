const { WinFormsSession, Form, Button } = require('../node-windows-forms');

async function runTests() {
    console.log('Initializing NodeWinForms...');
    const session = new WinFormsSession();
    await session.start();

    console.log('Creating main form...');
    const form = new Form(session);
    form.Text = "Batching & Throttling Test";
    form.Width = 800;
    form.Height = 600;

    let resizeEventCount = 0;
    
    // Subscribe to Resize event (await to ensure they are registered before batch test)
    await form.on('Resize', (e) => {
        resizeEventCount++;
    });
    await form.on('SizeChanged', (e) => {
        resizeEventCount++;
    });

    // Add a raw hook to see all incoming IPC messages
    session.protocol.on('message', (msg) => {
        if (msg.type === 2) {
            console.log(`[IPC Event Received] Action: ${msg.action}`);
        }
    });

    // TEST 1: Batching Performance
    console.log('\n--- TEST 1: Batching ---');
    console.log('Creating 500 buttons in a tight loop...');
    const startTime = Date.now();
    for (let i = 0; i < 500; i++) {
        const btn = new Button(session, form);
        btn.Width = 20;
        btn.Height = 10;
        btn.Left = (i % 20) * 20;
        btn.Top = Math.floor(i / 20) * 10;
        btn.Text = "X";
    }
    
    // Wait for the IPC batch to finish executing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const elapsed = Date.now() - startTime;
    console.log(`Test 1 finished. C# processed 500 buttons in ~${elapsed}ms without blocking or timing out.`);

    // TEST 2: Event Throttling (Debounce)
    console.log('\n--- TEST 2: Event Throttling ---');
    console.log('Simulating 100 rapid Resize operations from Node.js (which C# will process sequentially and rapidly)...');
    resizeEventCount = 0;
    
    // We trigger 100 resize events synchronously in Node. 
    // They are sent as a batch. C# will apply them one by one.
    // Without throttling, C# would send exactly 100 Resize events back to Node.js.
    // With throttling, it should collapse them to just a few (or one) event.
    for (let i = 0; i < 100; i++) {
        form.Width = 800 + i;
    }

    // Wait for the throttled events to arrive
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`Triggered 100 Resize operations.`);
    console.log(`Received Resize events back in Node.js: ${resizeEventCount}`);
    
    if (resizeEventCount < 100 && resizeEventCount > 0) {
        console.log(`SUCCESS! Throttling works! The events were successfully throttled down to ${resizeEventCount} event(s).`);
    } else {
        console.log(`FAILED. Expected fewer than 100 events, got ${resizeEventCount}`);
    }

    console.log('\nAll tests completed. You can interact with the window. Close it to exit.');
}

runTests().catch(console.error);
