const Control = require('./Control');

class MenuStrip extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
    }

    addMenu(text) {
        // Required strictly here to avoid circular dependency
        const ToolStripMenuItem = require('./ToolStripMenuItem');
        const item = new ToolStripMenuItem(this.session, this);
        item.Text = text;
        return item;
    }
}

module.exports = MenuStrip;
