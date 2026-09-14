const Control = require('./Control');


class Button extends Control {
    // Overloaded constructor: checks if the second argument is a parent control (for creation)
    constructor(session, idOrParent) {

        super(session, idOrParent); 
    }
}

module.exports = Button;