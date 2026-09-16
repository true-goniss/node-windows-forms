const {
    WinFormsSession,
    Form,
    MessageBox,
    NotifyIcon,
    ContextMenuStrip,
    MenuStrip,
    DataGridView
} = require('../node-windows-forms');

async function run() {
    const session = new WinFormsSession();
    try {
        await session.start();

        // --- 1. Main Form ---
        const mainForm = new Form(session, 'Form1');
        await mainForm.setTitle("Advanced Demo");
        mainForm.Width = 800;
        mainForm.Height = 500;
        mainForm.StartPosition = "CenterScreen";

        // --- 2. System Tray (NotifyIcon) ---
        const trayIcon = new NotifyIcon(session);
        trayIcon.Text = "Node.js WinForms App";
        trayIcon.Icon = "default"; // Use default application icon
        trayIcon.Visible = true;

        const trayMenu = new ContextMenuStrip(session);
        const trayRestoreItem = trayMenu.addMenu("Restore Window");
        const trayExitItem = trayMenu.addMenu("Exit");
        trayIcon.ContextMenuStrip = trayMenu;

        trayRestoreItem.OnClick.Attach(() => {
            mainForm.setProperty('WindowState', 'Normal');
        });

        trayExitItem.OnClick.Attach(() => {
            trayIcon.Visible = false;
            session.stop();
            process.exit(0);
        });

        trayIcon.OnDoubleClick.Attach(() => {
            mainForm.setProperty('WindowState', 'Normal');
        });

        // --- 3. Top Menu (MenuStrip) ---
        const menuStrip = new MenuStrip(session, mainForm);
        const fileMenu = menuStrip.addMenu("File");
        const helpMenu = menuStrip.addMenu("Help");

        const btnAddRow = fileMenu.addMenuItem("Add Random User");
        const btnReadRow = fileMenu.addMenuItem("Read Selected User");
        fileMenu.addMenuItem("-"); // Separator (renders as divider line when text = "-")
        const btnExit = fileMenu.addMenuItem("Exit App");

        const btnAbout = helpMenu.addMenuItem("About");

        btnExit.OnClick.Attach(() => {
            trayIcon.Visible = false;
            session.stop();
            process.exit(0);
        });

        btnAbout.OnClick.Attach(() => {
            MessageBox.show(session, {
                text: "This is a demonstration of DataGridView, MenuStrip and NotifyIcon in Node.js!",
                caption: "About",
                buttons: "OK",
                icon: "Information"
            });
        });

        // --- 4. Data Table (DataGridView) ---
        const grid = new DataGridView(session, mainForm);
        grid.Dock = "Fill"; // Fill remaining area below menu
        grid.AllowUserToAddRows = false;

        // Add columns
        grid.addColumn("id", "ID");
        grid.addColumn("name", "Name");
        grid.addColumn("role", "Role");
        grid.addColumn("status", "Status");

        // Add initial dataset
        let userId = 1;
        grid.addRow([userId++, "Alice", "Admin", "Active"]);
        grid.addRow([userId++, "Bob", "User", "Inactive"]);
        grid.addRow([userId++, "Charlie", "Moderator", "Active"]);

        // Handle menu command to add rows
        btnAddRow.OnClick.Attach(() => {
            const roles = ["User", "Admin", "Moderator", "Guest"];
            const statuses = ["Active", "Inactive", "Banned"];

            const randomRole = roles[Math.floor(Math.random() * roles.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            grid.addRow([userId++, `User_${userId}`, randomRole, randomStatus]);
        });

        // Handle menu command to read selected row
        btnReadRow.OnClick.Attach(async () => {
            const selected = await grid.getSelectedRows();
            if (selected.length === 0) {
                MessageBox.show(session, "No row selected!");
                return;
            }

            const rowIndex = selected[0];
            const name = await grid.getValue(rowIndex, 1); // 1 = Name column
            const role = await grid.getValue(rowIndex, 2); // 2 = Role column

            MessageBox.show(session, `Selected User: ${name} (${role})`);
        });

        // Handle cell click
        grid.OnCellClick.Attach((e) => {
            console.log(`Cell clicked: Row ${e.rowIndex}, Col ${e.columnIndex}`);
        });

        // Handle cell value edits
        grid.OnCellValueChanged.Attach(async (e) => {
            const newValue = await grid.getValue(e.rowIndex, e.columnIndex);
            console.log(`[EDIT] Cell (${e.rowIndex}, ${e.columnIndex}) changed to: ${newValue}`);
        });

        // Handle selection change
        grid.OnSelectionChanged.Attach(async () => {
            const selected = await grid.getSelectedRows();
            console.log(`[SELECTION] Selected rows: ${selected.join(', ')}`);
        });

        // FormClosing disabled temporarily as e.Cancel is async

        console.log("Demo running!");

    } catch (err) {
        console.error("Initialization error:", err);
    }
}

run();
