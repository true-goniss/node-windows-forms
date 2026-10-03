const Control = require('./Control');

class TrackBar extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('Value');
        this._createPropertyAccessor('Minimum');
        this._createPropertyAccessor('Maximum');
        this._createPropertyAccessor('TickFrequency');
        this._createPropertyAccessor('Orientation');
        this._createPropertyAccessor('SmallChange');
        this._createPropertyAccessor('LargeChange');

        // Ensure state is updated correctly by subscribing to events
        this.on('ValueChanged', () => {}).catch(console.error);
        this.on('Scroll', () => {}).catch(console.error);
    }
}

module.exports = TrackBar;
