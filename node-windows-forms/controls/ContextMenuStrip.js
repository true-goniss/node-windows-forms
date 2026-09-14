const Control = require('./Control');

class ContextMenuStrip extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
    }

    addMenu(text) {
        const ToolStripMenuItem = require('./ToolStripMenuItem');
        const item = new ToolStripMenuItem(this.session, this);
        item.Text = text;
        return item;
    }
}

module.exports = ContextMenuStrip;
