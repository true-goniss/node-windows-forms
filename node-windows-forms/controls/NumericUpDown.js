const Control = require('./Control');

class NumericUpDown extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('Value');
        this._createPropertyAccessor('Minimum');
        this._createPropertyAccessor('Maximum');
        this._createPropertyAccessor('DecimalPlaces');
        this._createPropertyAccessor('Increment');
        this._createPropertyAccessor('Hexadecimal');
        this._createPropertyAccessor('ThousandsSeparator');
        this._createPropertyAccessor('ReadOnly');
        this._createPropertyAccessor('UpDownAlign');
        this._createPropertyAccessor('InterceptArrowKeys');

        // Trigger subscription to keep state in sync
        this.on('ValueChanged', () => {}).catch(console.error);
    }
}

module.exports = NumericUpDown;
