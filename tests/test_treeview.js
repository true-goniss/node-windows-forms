const { WinFormsSession, Form, TreeView } = require('../node-windows-forms');

async function main() {
    const session = new WinFormsSession();
    await session.start();

    const form = new Form(session, 'Form1');
    form.Text = 'TreeView Test';
    form.Width = 400;
    form.Height = 500;

    const tree = new TreeView(session, form);
    tree.Dock = 'Fill';
    tree.CheckBoxes = true;
    tree.FullRowSelect = true;

    // --- 1. Bulk declarative population (3 levels) ---
    const roots = await tree.addNodes([
        {
            text: 'Documents',
            nodes: [
                { text: 'resume.docx', tag: 'file' },
                { text: 'budget.xlsx', tag: 'file' }
            ]
        },
        {
            text: 'Pictures',
            nodes: [
                { text: 'vacation.png', tag: 'file' }
            ]
        },
        { text: 'readme.md', tag: 'file' }
    ]);
    console.log(`✅ addNodes: ${roots.length} root handles, ids assigned: ${roots.every(r => r.id)}`);

    // --- 2. Imperative addNode with tag ---
    const docs = roots[0];
    const extra = await docs.addNode({ text: 'notes.txt', tag: 'file' });
    console.log(`✅ node.addNode: id=${extra.id.slice(0, 8)}...`);

    // --- 3. Reading structure back ---
    const docChildren = await docs.nodes();
    console.log(`✅ node.nodes(): Documents has ${docChildren.length} children (expected 3)`);

    const rootDescs = await tree.getNodes();
    console.log(`✅ tree.getNodes(): ${rootDescs.length} roots (expected 3)`);
    console.log(`   - "${rootDescs[1].info.text}" tag=${rootDescs[2].tag}, childCount=${rootDescs[0].info.childCount}`);

    // --- 4. Expand / collapse ---
    await docs.expand();
    const refreshed = await docs.refresh();
    console.log(`✅ expand + refresh: Documents isExpanded=${refreshed.isExpanded}, fullPath="${refreshed.fullPath}"`);

    await tree.expandAll();
    console.log('✅ expandAll (visual check: all branches open)');

    // --- 5. Events ---
    tree.OnAfterSelect.Attach((e) => {
        console.log(`✅ AfterSelect: "${e.node.text}" (tag=${e.node.tag}, level=${e.node.level})`);
    });
    tree.OnNodeMouseDoubleClick.Attach((e) => {
        console.log(`✅ NodeMouseDoubleClick: "${e.node.text}"`);
    });

    // --- 6. Programmatic selection roundtrip ---
    await extra.select();
    const selected = await tree.getSelectedNode();
    console.log(`✅ select + getSelectedNode: "${selected.info.text}" (expected notes.txt), parentId matches: ${selected.info.parentId === docs.id}`);

    // --- 7. Node property setters ---
    extra.Text = 'NOTES.txt';
    extra.Checked = true;
    const checkedNow = await extra.isChecked();
    const textNow = await extra.getText();
    console.log(`✅ node props: Text="${textNow}" (expected NOTES.txt), Checked=${checkedNow}`);

    await extra.setTag('important');
    const tagged = await extra.refresh();
    console.log(`✅ setTag: tag="${tagged.tag}" (expected important)`);

    // --- 8. Remove + clear ---
    await extra.remove();
    const afterRemove = await docs.nodes();
    console.log(`✅ remove: Documents has ${afterRemove.length} children (expected 2)`);

    setTimeout(async () => {
        await tree.clearNodes();
        const empty = await tree.getNodes();
        console.log(`✅ clearNodes: ${empty.length} roots left (expected 0). Test complete, exiting.`);
        process.exit(0);
    }, 3000);
}

main().catch(console.error);
