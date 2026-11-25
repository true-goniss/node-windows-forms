const Control = require('./Control');
const TreeNode = require('./TreeNode');

// Node spec: { text: string, tag?: string, nodes?: NodeSpec[] }
class TreeView extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);

        // TreeView-specific properties
        this._createPropertyAccessor('CheckBoxes');
        this._createPropertyAccessor('ShowLines');
        this._createPropertyAccessor('ShowRootLines');
        this._createPropertyAccessor('ShowPlusMinus');
        this._createPropertyAccessor('FullRowSelect');
        this._createPropertyAccessor('Scrollable');
        this._createPropertyAccessor('HideSelection');
        this._createPropertyAccessor('Indent');
        this._createPropertyAccessor('ItemHeight');
        this._createPropertyAccessor('PathSeparator');
    }

    // --- Node operations (TreeViewBridge pseudo-methods on the C# side) ---

    async addNode(textOrSpec) {
        const spec = typeof textOrSpec === 'string' ? { text: textOrSpec } : textOrSpec;
        const id = await this.invokeMethod('AddNode', { text: spec.text, tag: spec.tag });
        return new TreeNode(this.session, id, this);
    }

    async addNodes(nodes) {
        const ids = await this.invokeMethod('AddNodes', { nodes });
        return ids.map(id => new TreeNode(this.session, id, this));
    }

    async clearNodes() {
        return this.invokeMethod('ClearNodes');
    }

    async getNodes(parentId) {
        const args = parentId ? { parentId } : {};
        const descriptors = await this.invokeMethod('GetNodes', args);
        return descriptors.map(d => new TreeNode(this.session, d.id, this, d));
    }

    async getSelectedNode() {
        const desc = await this.invokeMethod('GetSelectedNode');
        return desc ? new TreeNode(this.session, desc.id, this, desc) : null;
    }

    async setSelectedNode(nodeOrId) {
        const nodeId = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.id;
        return this.invokeMethod('SetSelectedNode', { nodeId });
    }

    async expandAll() { return this.invokeMethod('ExpandAll'); }
    async collapseAll() { return this.invokeMethod('CollapseAll'); }

    // Wrap a descriptor received from an event payload into a node handle
    nodeFromDescriptor(descriptor) {
        return descriptor ? new TreeNode(this.session, descriptor.id, this, descriptor) : null;
    }
}

Object.defineProperty(TreeView.prototype, 'OnAfterSelect', TreeView.prototype._createEventHandlerGetter('AfterSelect'));
Object.defineProperty(TreeView.prototype, 'OnBeforeExpand', TreeView.prototype._createEventHandlerGetter('BeforeExpand'));
Object.defineProperty(TreeView.prototype, 'OnAfterExpand', TreeView.prototype._createEventHandlerGetter('AfterExpand'));
Object.defineProperty(TreeView.prototype, 'OnAfterCollapse', TreeView.prototype._createEventHandlerGetter('AfterCollapse'));
Object.defineProperty(TreeView.prototype, 'OnNodeMouseClick', TreeView.prototype._createEventHandlerGetter('NodeMouseClick'));
Object.defineProperty(TreeView.prototype, 'OnNodeMouseDoubleClick', TreeView.prototype._createEventHandlerGetter('NodeMouseDoubleClick'));

module.exports = TreeView;
