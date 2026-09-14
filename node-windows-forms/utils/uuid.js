let uuidv4;

try {
    const uuidLib = require('uuid');
    uuidv4 = uuidLib.v4;
} catch (e) {
    uuidv4 = require('uuidv4').uuid || require('uuidv4'); 
}

const getId = () => {
    return uuidv4();
};

module.exports = {
    getId
}