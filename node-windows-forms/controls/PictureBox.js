const Control = require('./Control');


class PictureBox extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
    }

    async setImage(buffer) {
        // Send a dummy property value ('BinaryImage') and the actual image in binary payload
        return await this._SetProperty('Image', 'BinaryImage', buffer);
    }
}
module.exports = PictureBox;
