const Control = require('./Control');


class CheckBox extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('Checked');
        this.on('CheckedChanged', () => {}).catch(console.error);
    }
}
module.exports = CheckBox;
