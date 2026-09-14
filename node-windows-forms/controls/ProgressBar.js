const Control = require('./Control');


class ProgressBar extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
        this._createPropertyAccessor('Value');
    }
}
module.exports = ProgressBar;
