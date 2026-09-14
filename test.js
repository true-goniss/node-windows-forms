const { WinFormsSession, Form } = require('./node-windows-forms');

async function runTests() {
    console.log("Running basic integration test...");
    
    let session;
    try {
        session = new WinFormsSession();
        await session.start();
        console.log("✅ Session started successfully.");
        
        const form = new Form(session, 'Form1');
        await form.setTitle("Automated Test Form");
        console.log("✅ Form created and title set.");
        
        // Let it live for 2 seconds to ensure no crashes
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("✅ All tests passed. Exiting.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Test failed:", e);
        process.exit(1);
    }
}

runTests();