const Control = require('./Control');

class NotifyIcon extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
    }

    get Text() { return this._state['Text']; }
    set Text(val) { this.setProperty('Text', val); }

    get Visible() { return this._state['Visible']; }
    set Visible(val) { this.setProperty('Visible', val); }

    get Icon() { return this._state['Icon']; }
    // set Icon accepts a file path (or 'default' for app icon)
    set Icon(val) { this.setProperty('Icon', val); }

    get ContextMenuStrip() { return this._state['ContextMenuStrip']; }
    // set ContextMenuStrip accepts a MenuStrip or ContextMenuStrip control object
    set ContextMenuStrip(val) { 
        if (val && val.id) {
            this.setProperty('ContextMenuStrip', val.id); 
        } else {
            this.setProperty('ContextMenuStrip', null);
        }
    }

}

Object.defineProperty(NotifyIcon.prototype, 'OnClick', NotifyIcon.prototype._createEventHandlerGetter('Click'));
Object.defineProperty(NotifyIcon.prototype, 'OnDoubleClick', NotifyIcon.prototype._createEventHandlerGetter('DoubleClick'));

module.exports = NotifyIcon;
