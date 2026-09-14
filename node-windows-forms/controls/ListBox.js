const Control = require('./Control');


class ListBox extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('SelectedIndex');
        this._createPropertyAccessor('Items');
        this.on('SelectedIndexChanged', () => {}).catch(console.error);
    }
}
module.exports = ListBox;
