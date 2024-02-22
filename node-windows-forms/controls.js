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

        this.Properties = {};
    }

    async _SetProperty(property, value){

        this.Properties[property] = value; 
        await this.setTextCallback(this.Name, property, value);
    }

    async _GetProperty(property){
        let value = null;

        //if (this.formTextChanged) {
        //this.Properties['Text'] = text;
        //this.formTextChanged = false;
        //}

        value = await this.getTextCallback(this.Name, property);
        this.Properties[property] = value; 

        return value;
    }
    

    async getText() {
        return await this._GetProperty('Text');
    }

    async setText(text) {
        return await this._SetProperty('Text', text);
    }

    async setVisible(visible) {
        return await this._SetProperty('Visible', Boolean( visible ) );
    }

    async getVisible() {
        return Boolean( await this._GetProperty('Visible') );
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

    async setUseSystemPasswordChar(useSystemPasswordChar) {
        return await this._SetProperty('UseSystemPasswordChar', Boolean( useSystemPasswordChar ) );
    }

    async getUsePasswordChar() {
        return Boolean( await this._GetProperty('UseSystemPasswordChar') );
    }

    /*
    async setPasswordChar(passwordChar) {
        return await this._SetProperty('PasswordChar', passwordChar );
    }

    async getPasswordChar() {
        return await this._GetProperty('PasswordChar');
    }
    */
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