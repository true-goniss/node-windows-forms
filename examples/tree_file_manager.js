// File manager on a TreeView with lazy directory loading.
// Directories get a placeholder child so the [+] expander shows immediately;
// on AfterExpand the placeholder is replaced with real directory contents.
// Double-click a file to preview it in the right pane.
let nodeWinForms;
try {
    nodeWinForms = require('../node-windows-forms');
} catch (e) {
    nodeWinForms = require('node-windows-forms');
}
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const { WinFormsSession, Form, TreeView, TextBox } = nodeWinForms;

const LOADING_TAG = '__loading__';

async function readEntries(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
        .filter(e => !e.name.startsWith('.'))
        .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
}

// Adds directory contents under a node; each directory also gets a placeholder child
async function populateDirectory(tree, parentNode, dirPath) {
    const entries = await readEntries(dirPath);
    await parentNode.addNodes(entries.map(e => ({
        text: e.name,
        tag: path.join(dirPath, e.name),
        // only directories get a placeholder to hint the expander
        nodes: e.isDirectory() ? [{ text: '…', tag: LOADING_TAG }] : undefined
    })));
}

async function previewFile(filePath, output) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        output.Text = `${filePath}\r\n${'-'.repeat(60)}\r\n${content.slice(0, 10000)}`;
    } catch (e) {
        output.Text = `${filePath}\r\n\r\n(Could not read as text: ${e.message})`;
    }
}

async function run() {
    const session = new WinFormsSession();
    try {
        await session.start();

        const form = new Form(session, 'Form1');
        form.Text = 'Tree File Manager — node-windows-forms';
        form.Width = 950;
        form.Height = 600;
        form.StartPosition = 'CenterScreen';

        // Right pane: file preview
        const preview = new TextBox(session, form);
        preview.Dock = 'Fill';
        preview.Multiline = true;
        preview.ReadOnly = true;
        preview.ScrollBars = 'Both';

        // Left pane: directory tree
        const tree = new TreeView(session, form);
        tree.Dock = 'Left';
        tree.Width = 380;
        tree.FullRowSelect = true;
        tree.HideSelection = false;
        tree.PathSeparator = '\\';

        // Root = user home directory
        const homePath = os.homedir();
        const root = await tree.addNode({ text: `🏠 ${path.basename(homePath)}`, tag: homePath });
        await root.addNode({ text: '…', tag: LOADING_TAG });
        await root.expand();

        // Lazy loading: replace the placeholder with real contents on first expand
        tree.OnAfterExpand.Attach(async (e) => {
            if (!e.node.tag || e.node.tag === LOADING_TAG) return;
            const handle = tree.nodeFromDescriptor(e.node);
            const children = await handle.nodes();
            if (children.length === 1 && children[0].tag === LOADING_TAG) {
                await children[0].remove();
                await populateDirectory(tree, handle, e.node.tag);
            }
        });

        // Double-click: preview files
        tree.OnNodeMouseDoubleClick.Attach(async (e) => {
            if (!e.node.tag || e.node.tag === LOADING_TAG) return;
            try {
                const stat = await fs.stat(e.node.tag);
                if (stat.isFile()) {
                    await previewFile(e.node.tag, preview);
                }
            } catch { /* deleted between click and stat — ignore */ }
        });

        console.log(`Starting directory: ${homePath}`);
        console.log('Expand directories on the left, double-click a file to preview it on the right.');
        console.log('Close the window to exit.');
    } catch (error) {
        console.error('Error:', error);
        if (session.process) session.stop();
    }
}

run();
