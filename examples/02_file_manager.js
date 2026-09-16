const fs = require('fs');
const path = require('path');
const { WinFormsSession, Form, Button, Label, TextBox, ListBox, Panel } = require('../node-windows-forms');

async function run() {
    console.log("Starting File Manager Demo...");

    // Automatically uses ../bin/node-windows-forms.exe
    const session = new WinFormsSession();

    session.on('error', (err) => console.error("[IPC ERROR]:", err));

    let mainForm;
    try {
        await session.start();

        mainForm = new Form(session, 'Form1');
        await mainForm.setTitle("File Manager (Powered by Node.js)");
        mainForm.Width = 800;
        mainForm.Height = 600;
        mainForm.StartPosition = "CenterScreen";
        mainForm.Font = "Segoe UI, 10pt";
        mainForm.Icon = path.join(__dirname, '../assets/logo.ico');

        // 1. Content preview box (Right)
        const previewBox = new TextBox(session, mainForm);
        previewBox.Dock = "Fill";
        previewBox.Multiline = true;
        previewBox.ScrollBars = "Vertical";
        previewBox.ReadOnly = true;
        previewBox.Font = "Consolas, 10pt";

        // 2. File list (Left)
        const listBox = new ListBox(session, mainForm);
        listBox.Dock = "Left";
        listBox.Width = 250;

        // 3. Top control panel
        const topPanel = new Panel(session, mainForm);
        topPanel.Dock = "Top";
        topPanel.Height = 40;

        const pathLabel = new Label(session, topPanel);
        pathLabel.Text = "Path:";
        pathLabel.Top = 12;
        pathLabel.Left = 10;
        pathLabel.Width = 40;

        const pathTextBox = new TextBox(session, topPanel);
        pathTextBox.Top = 10;
        pathTextBox.Left = 50;
        pathTextBox.Width = 470;
        pathTextBox.Anchor = "Top, Left, Right"; // Auto stretch

        const btnGo = new Button(session, topPanel);
        btnGo.Text = "Go";
        btnGo.Top = 8;
        btnGo.Left = 530;
        btnGo.Width = 80;
        btnGo.Anchor = "Top, Right"; // Anchor to right edge

        const btnUp = new Button(session, topPanel);
        btnUp.Text = "Up";
        btnUp.Top = 8;
        btnUp.Left = 620;
        btnUp.Width = 80;
        btnUp.Anchor = "Top, Right"; // Anchor to right edge

        const btnSave = new Button(session, topPanel);
        btnSave.Text = "Save";
        btnSave.Top = 8;
        btnSave.Left = 710;
        btnSave.Width = 60;
        btnSave.Anchor = "Top, Right"; // Anchor to right edge

        let currentPath = "C:\\";
        let openedFile = null;

        // Directory loading function
        const loadDirectory = async (dirPath) => {
            try {
                // Read file content if target is a file
                const stat = fs.statSync(dirPath);
                if (stat.isFile()) {
                    if (stat.size > 1024 * 512) {
                        previewBox.Text = "File too large for preview ( > 512 KB )";
                        previewBox.ReadOnly = true;
                        openedFile = null;
                    } else {
                        let content = fs.readFileSync(dirPath, 'utf8');
                        // Convert newlines for WinForms TextBox compatibility (\r\n)
                        content = content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
                        previewBox.Text = content;
                        previewBox.ReadOnly = false;
                        openedFile = dirPath;
                    }
                    return;
                }

                // Target is a directory
                currentPath = dirPath;
                pathTextBox.Text = currentPath;
                previewBox.Text = ""; // Clear preview box
                previewBox.ReadOnly = true;
                openedFile = null;

                const entries = fs.readdirSync(currentPath, { withFileTypes: true });
                const items = [];
                for (let entry of entries) {
                    const prefix = entry.isDirectory() ? "[Folder] " : "[File] ";
                    items.push(prefix + entry.name);
                }

                // Sort folders to the top
                items.sort((a, b) => {
                    const aIsDir = a.startsWith("[Folder]");
                    const bIsDir = b.startsWith("[Folder]");
                    if (aIsDir && !bIsDir) return -1;
                    if (!aIsDir && bIsDir) return 1;
                    return a.localeCompare(b);
                });

                listBox.Items = items;
            } catch (err) {
                console.error("Load error:", err);
                previewBox.Text = "Access error: " + err.message;
                previewBox.ReadOnly = true;
                openedFile = null;
            }
        };

        btnGo.OnClick.Attach(() => {
            loadDirectory(pathTextBox.Text);
        });

        btnUp.OnClick.Attach(() => {
            const parentDir = path.dirname(currentPath);
            loadDirectory(parentDir);
        });

        btnSave.OnClick.Attach(() => {
            if (openedFile) {
                // Extract text from TextBox and normalize \r\n to \n
                let textToSave = previewBox.Text;
                textToSave = textToSave.replace(/\r\n/g, '\n');
                try {
                    fs.writeFileSync(openedFile, textToSave, 'utf8');
                    console.log(`[JS] File saved: ${openedFile}`);
                } catch (e) {
                    console.error(`[JS] Save error: ${e}`);
                }
            }
        });

        listBox.OnSelectedIndexChanged.Attach(() => {
            session.send(listBox.id, 'getProperty', { name: 'SelectedItem' }).then(selectedItem => {
                if (!selectedItem) return;
                const name = selectedItem.replace("[Folder] ", "").replace("[File] ", "");
                const targetPath = path.join(currentPath, name);
                loadDirectory(targetPath);
            });
        });

        const { FolderBrowserDialog } = require('../node-windows-forms');

        // Display initial folder picker dialog
        const initialFolder = await FolderBrowserDialog.show(session, {
            description: "Select initial folder for File Manager",
            showNewFolderButton: false
        });

        if (initialFolder) {
            pathTextBox.Text = initialFolder;
            loadDirectory(initialFolder);
        } else {
            pathTextBox.Text = __dirname;
            loadDirectory(__dirname);
        }

        console.log("Demo started!");

    } catch (e) {
        console.error("Launch error:", e);
        process.exit(1);
    }
}

run();
