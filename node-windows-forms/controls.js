/*

by gon_iss (c) 2o24

*/

'use strict';


class Control {
    constructor(name, text, getTextCallback, setTextCallback) {
        this.Name = name;
        this.Text = text || '';
        this.formTextChanged = true;

        this.getTextCallback = getTextCallback;
        this.setTextCallback = setTextCallback;
    }

    async _SetProperty(property, text){
        this._text = text;   
        await this.setTextCallback(this.Name, property, text);
    }

    async _GetProperty(property){
        if (this.formTextChanged) {
            const text = await this.getTextCallback(this.Name, property);
            this._text = text;
            this.formTextChanged = false;
        }
        return this._text;
    }

    async getText() {
        return await this._GetProperty('Text');
    }

    async setText(text) {
        await this._SetProperty('Text', text);
    }

}

class TextBox extends Control {
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

        this._textChangedHandlers = [];

    }

    OnTextChanged(handler){
        this.formTextChanged = true;
        if (!this._textChangedHandlers.includes(handler)) this._textChangedHandlers.push(handler);
    }

    TextChanged(){
        this.formTextChanged = true;
        this._textChangedHandlers.forEach(handler => handler());
    }

}

class Button extends Control {
    
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

        this._clickHandlers = [];
    }

    OnClick(handler) {
        if (!this._clickHandlers.includes(handler)) this._clickHandlers.push(handler);
    }

    Click() {
        this._clickHandlers.forEach(handler => handler());
    }

}

module.exports = {
    TextBox,
    Button
};