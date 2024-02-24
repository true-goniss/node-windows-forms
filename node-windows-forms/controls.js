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

        this._eventHandlers = {};
    }

    async _SetProperty(property, value){

        this.Properties[property] = value; 
        await this.setTextCallback(this.Name, property, value);
    }

    async _GetProperty(property){
        let value = null;
        value = await this.getTextCallback(this.Name, property);
        this.Properties[property] = value; 

        return value;
    }

    _FireEvent(eventName, eventArgs) {
        if (this._eventHandlers[eventName]) {
            this._eventHandlers[eventName].forEach(handler => handler(eventArgs));
        }
    }

    _AddEventHandler(eventName, handler) {
        if (!this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = [];
        }
        if( !this._eventHandlers[eventName].includes(handler)) this._eventHandlers[eventName].push(handler);
    }

    _RemoveEventHandler(eventName, handler) {
        if (this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = this._eventHandlers[eventName].filter(h => h !== handler);
        }
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

class ClickableControl extends Control{
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

        this._clickHandlers = [];
    }

    OnClick(handler) {
        super._AddEventHandler('Click', handler);
    }

    Click(eventArgs) {
        super._FireEvent('Click', eventArgs);
    }
}

class TextBox extends ClickableControl {
    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

        this.textWasChanged = true;
        this.lastText = text;
    }

    OnTextChanged(handler){
        this.textWasChanged = true;
        super._AddEventHandler('TextChanged', handler);
    }

    TextChanged(eventArgs){
        this.textWasChanged = true;
        super._FireEvent('TextChanged', eventArgs);
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

        super.setText(text);
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

    OnCheckedChanged(handler){
        super._AddEventHandler('CheckedChanged', handler);
    }

    CheckedChanged(eventArgs){
        super._FireEvent('CheckedChanged', eventArgs);
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

class NumericUpDown extends ClickableControl {

    constructor(name, text, getTextCallback, setTextCallback) {

        super(name, text, getTextCallback, setTextCallback);

    }

    _parseNumberString(numberString) {
        let withoutThousandsSeparators = numberString.replace(/\./g, '');
        let parsedNumber = parseFloat(withoutThousandsSeparators.replace(',', '.'));
        return parsedNumber;
    }

    async getValue(){
        console.log(await super._GetProperty('Value'));
        return this._parseNumberString( await super._GetProperty('Value') );
    }

    async setValue(value){
        super._SetProperty('Value', value)
    }

    OnValueChanged(handler){
        super._AddEventHandler('ValueChanged', handler);
    }

    ValueChanged(eventArgs){
        super._FireEvent('ValueChanged', eventArgs);
    }
    
    
}

module.exports = {
    TextBox,
    Button,
    Label,
    RadioButton,
    CheckBox,
    NumericUpDown,

    AppearanceCheckable
};