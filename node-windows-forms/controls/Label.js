const Control = require('./Control');


class Label extends Control {
    constructor(session, idOrParent) {
        
        super(session, idOrParent);

        this._createPropertyAccessor('Text');
    }
    //setText(text) { return this.setProperty('Text', text); }
}

module.exports = Label;