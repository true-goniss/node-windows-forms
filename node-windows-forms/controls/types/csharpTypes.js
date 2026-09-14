
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isEmpty = (x === undefined || y === undefined);
    }
    // Use camelCase when sending to C# (as expected in C# Dispatcher)
    toJSON() {
        return { x: this.x, y: this.y, isEmpty: this.isEmpty };
    }
    toString() {
        return JSON.stringify(this.toJSON());
    }
}

class Size {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.isEmpty = (width === undefined || height === undefined);
    }
    toJSON() {
        return { width: this.width, height: this.height, isEmpty: this.isEmpty };
    }
    toString() {
        return JSON.stringify(this.toJSON());
    }
}

class Color {
    constructor(alpha, red, green, blue) {
        this._correctAndSetColors(alpha, red, green, blue);
    }

    FromArgb(alpha, red, green, blue) {
        this._correctAndSetColors(alpha, red, green, blue);
    }

    _correctAndSetColors(alpha, red, green, blue) {
        this.alpha = alpha;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    _correctColorValue(val) {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 255) {
            return 255;
        }
        return Math.round(num);
    }

    toString() {
        const a = this._correctColorValue(this.alpha);
        const r = this._correctColorValue(this.red);
        const g = this._correctColorValue(this.green);
        const b = this._correctColorValue(this.blue);

        // Use custom format: a:Xr:Yg:Zb:W
        return `a:${a}r:${r}g:${g}b:${b}`;
    }
}

module.exports = {
    Point,
    Size,
    Color
}