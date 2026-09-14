const Control = require('./Control');

class Form extends Control {
    constructor(session, idOrOptions) {
        super(session, idOrOptions, 'Form');
        // Automatic subscription to Resize to keep Width and Height synchronized
        this.on('Resize', () => {}).catch(e => console.error("Form Resize subscribe error:", e));
    }
    setTitle(text) { return this.setProperty('Text', text); }
    async show() { return this.session.send(this.id, 'invokeMethod', { method: 'Show' }); }
    async showDialog() { return this.session.send(this.id, 'invokeMethod', { method: 'ShowDialog' }); }
    async hide() { return this.session.send(this.id, 'invokeMethod', { method: 'Hide' }); }
    async close() { return this.session.send(this.id, 'invokeMethod', { method: 'Close' }); }

    // --- Form Specific Properties ---
    set StartPosition(val) { this._SetProperty('StartPosition', val); }
    get StartPosition() { return this._GetProperty('StartPosition'); }

    set WindowState(val) { this._SetProperty('WindowState', val); }
    get WindowState() { return this._GetProperty('WindowState'); }

    set FormBorderStyle(val) { this._SetProperty('FormBorderStyle', val); }
    get FormBorderStyle() { return this._GetProperty('FormBorderStyle'); }

    set TopMost(val) { this._SetProperty('TopMost', val); }
    get TopMost() { return this._GetProperty('TopMost').then(res => res === 'True' || res === true); }
}

module.exports = Form;