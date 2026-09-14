const Control = require('./Control');

class ToolStripMenuItem extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
    }

    get Text() { return this._state['Text']; }
    set Text(val) { this.setProperty('Text', val); }

    get ShortcutKeys() { return this._state['ShortcutKeys']; }
    set ShortcutKeys(val) { this.setProperty('ShortcutKeys', val); }

    addMenuItem(text) {
        const item = new ToolStripMenuItem(this.session, this);
        item.Text = text;
        return item;
    }
}

Object.defineProperty(ToolStripMenuItem.prototype, 'OnClick', ToolStripMenuItem.prototype._createEventHandlerGetter('Click'));

module.exports = ToolStripMenuItem;
