/*

by gon_iss (c) 2o24

*/

'use strict';

class Point {

    isEmpty = true;

    constructor(x, y){
        this.x = Number( x );
        this.y = Number( y );
        this.isEmpty = false;
    }

    toString() {
        return 'x:' + this.x.toString() + 'y:' + this.y.toString();
    }
}

class Size {
    constructor(width, height){
        this.width = Number( width );
        this.height = Number( height );
    }

    toString() {
        return 'w:' + this.width.toString() + 'h:' + this.height.toString()
    }
}

module.exports = {
    Point,
    Size
}