const Control = require('./Control');

class TabControl extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('SelectedIndex');
        this.on('SelectedIndexChanged', () => {}).catch(console.error);
    }
}
module.exports = TabControl;
