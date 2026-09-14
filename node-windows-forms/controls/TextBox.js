const Control = require('./Control');


class TextBox extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('Text');
        this._createPropertyAccessor('Multiline');
        this._createPropertyAccessor('ScrollBars');
        this._createPropertyAccessor('ReadOnly');
        // Force subscription to TextChanged to keep state in sync
        this.on('TextChanged', () => {}).catch(console.error);
    }


}

module.exports = TextBox;