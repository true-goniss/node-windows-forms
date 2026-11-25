// Lightweight handle for a TreeView node living in the C# host.
// Not a Control: nodes are not created via the generic 'create' action and
// never receive events on their own — node operations route through the
// owning TreeView (the C# intercept only matches TreeView targets).
class TreeNode {
    constructor(session, id, treeView, descriptor = null) {
        this.session = session;
        this.id = id;
        this.treeView = treeView;
        this.info = descriptor;
    }

    // --- Direct node properties (node is in the C# ObjectStore) ---

    get Text() { return this._text; }
    set Text(value) {
        this._text = value;
        this.session.send(this.id, 'setProperty', { name: 'Text', value }).catch(console.error);
    }

    get Checked() { return this._checked; }
    set Checked(value) {
        this._checked = value;
        this.session.send(this.id, 'setProperty', { name: 'Checked', value }).catch(console.error);
    }

    async getText() { return this.session.send(this.id, 'getProperty', { name: 'Text' }); }
    async isChecked() { return this.session.send(this.id, 'getProperty', { name: 'Checked' }); }

    async setTag(tag) {
        return this.treeView.invokeMethod('SetNodeTag', { nodeId: this.id, tag });
    }

    // --- Structure (routed through the owning TreeView) ---

    async addNode(textOrSpec) {
        const spec = typeof textOrSpec === 'string' ? { text: textOrSpec } : textOrSpec;
        const id = await this.treeView.invokeMethod('AddNode', { parentId: this.id, text: spec.text, tag: spec.tag });
        return new TreeNode(this.session, id, this.treeView);
    }

    async addNodes(nodes) {
        const ids = await this.treeView.invokeMethod('AddNodes', { parentId: this.id, nodes });
        return ids.map(id => new TreeNode(this.session, id, this.treeView));
    }

    async nodes() {
        const descriptors = await this.treeView.invokeMethod('GetNodes', { parentId: this.id });
        return descriptors.map(d => new TreeNode(this.session, d.id, this.treeView, d));
    }

    async getParent() {
        const info = await this.refresh();
        return info.parentId ? new TreeNode(this.session, info.parentId, this.treeView) : null;
    }

    async remove() { return this.treeView.invokeMethod('RemoveNode', { nodeId: this.id }); }

    async expand() { return this.treeView.invokeMethod('ExpandNode', { nodeId: this.id }); }
    async expandAll() { return this.treeView.invokeMethod('ExpandNode', { nodeId: this.id, all: true }); }
    async collapse() { return this.treeView.invokeMethod('CollapseNode', { nodeId: this.id }); }

    async select() { return this.treeView.invokeMethod('SetSelectedNode', { nodeId: this.id }); }

    // Fetch the current descriptor from C# and cache it in this.info
    async refresh() {
        this.info = await this.treeView.invokeMethod('GetNode', { nodeId: this.id });
        return this.info;
    }

    get tag() { return this.info ? this.info.tag : undefined; }
    get level() { return this.info ? this.info.level : undefined; }
    get fullPath() { return this.info ? this.info.fullPath : undefined; }
}

module.exports = TreeNode;
