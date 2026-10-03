const Control = require('./Control');

class RadioButton extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('Checked');
        
        // Ensure state is updated correctly by subscribing to event
        this.on('CheckedChanged', () => {}).catch(console.error);
    }
}
module.exports = RadioButton;
