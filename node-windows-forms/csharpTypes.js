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

class Color {

    constructor(alpha, red, green, blue){
        this._correctAndSetColors(alpha, red, green, blue);
    }

    FromArgb(alpha, red, green, blue){
        this._correctAndSetColors(alpha, red, green, blue);
    }

    _correctAndSetColors(alpha, red, green, blue){
        this.alpha = this._correctColorValue(alpha);
        this.red = this._correctColorValue(red);
        this.green = this._correctColorValue(green);
        this.blue = this._correctColorValue(blue);

        this.alpha = alpha;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    _correctColorValue(val){
        if(val < 0 || val > 255){
            return 255;
        }

        return val;
    }

    toString(){
        this.alpha = this._correctColorValue(this.alpha);
        this.red = this._correctColorValue(this.red);
        this.green = this._correctColorValue(this.green);
        this.blue = this._correctColorValue(this.blue);

        return 'a:' + this.alpha.toString() + 'r:' + this.red.toString()+ 'g:' + this.green.toString() + 'b:' + this.blue.toString();
    }
}

module.exports = {
    Point,
    Size,
    Color
}