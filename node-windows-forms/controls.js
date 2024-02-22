/*

by gon_iss (c) 2o24

*/

'use strict';


class Control {

    constructor(name, text, getTextCallback, setTextCallback) {
        this.Name = name;
        this.Text = text || '';

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

    async setLocation(x, y){
        return await this._SetProperty('Location', 'x:' + x.toString() + 'y:' + y.toString());
    }

    async getLocation(){
        const location = JSON.parse( await this._GetProperty('Location') );
        return { x: Number( location.x ), y: Number( location.y ), isEmpty: Boolean( location.isEmpty ) } ;
    }

    async setSize(width, height){
        return await this._SetProperty('Size', 'w:' + width.toString() + 'h:' + height.toString());
    }

    async getSize(){
        const size = JSON.parse( await this._GetProperty('Size') );
        return { width: Number( size.width ), height: Number( size.height ) } ;
    }
}

class TextBox extends Control {
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

        this.textWasChanged = true;
        this._textChangedHandlers = [];
    }

    OnTextChanged(handler){
        this.textWasChanged = true;
        if (!this._textChangedHandlers.includes(handler)) this._textChangedHandlers.push(handler);
    }

    TextChanged(){
        this.textWasChanged = true;
        this._textChangedHandlers.forEach(handler => handler());
    }

    async getText(){
        if( this.textWasChanged ){
            this.lastText = await super.getText();
            this.textWasChanged = false;
            return this.lastText;
        }
        
        return this.lastText;
    }

    async setText(text){
        this.lastText = text;
        this.textWasChanged = false;

        super.setText();
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
    }*/
}

class ClickableControl extends Control{
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

class Button extends ClickableControl {
    
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

    }

}

class Label extends ClickableControl {
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

    }

}

class CheckableButton extends Button {
    constructor(name, text, getTextCallback, setTextCallback) {
        super(name, text, getTextCallback, setTextCallback);
        //this.checked = false;
    }

    async setChecked(checked) {
        return await this._SetProperty('Checked', Boolean( checked ) );
    }

    async getChecked() {
        return Boolean( await this._GetProperty('Checked') );
    }

    async setAppearance(appearance){
        return await this._SetProperty('Appearance', appearance );
    }

    async getAppearance() {
        return Number( await this._GetProperty('Appearance') );
    }

    async setAppearanceNormal(){
        return await setAppearance(AppearanceCheckable.NORMAL);
    }

    async setAppearanceButton(){
        return await setAppearance(AppearanceCheckable.BUTTON);
    }

}

const AppearanceCheckable = {
    NORMAL: 0,
    BUTTON: 1
};

class RadioButton extends CheckableButton {

    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

    }

}

class CheckBox extends CheckableButton {

    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

    }

}



module.exports = {
    TextBox,
    Button,
    Label,
    RadioButton,
    CheckBox,

    AppearanceCheckable
};