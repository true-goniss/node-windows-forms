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

    async getAllowDrop(){
        const value = Boolean( await this._GetProperty('AllowDrop') );
        return value;
    }

    async setAllowDrop(AllowDrop){
        const value = Boolean( AllowDrop );
        await this._SetProperty('AllowDrop', value );
    }

    async getHasChildren(){
        const value = Boolean( await this._GetProperty('HasChildren') );
        return value;
    }

    async getIsHandleCreated(){
        const value = Boolean( await this._GetProperty('IsHandleCreated') );
        return value;
    }

    async getInvokeRequired(){
        const value = Boolean( await this._GetProperty('InvokeRequired') );
        return value;
    }
    
    async getIsAccessible(){
        const value = Boolean( await this._GetProperty('IsAccessible') );
        return value;
    }

    async setIsAccessible(IsAccessible){
        const value = Boolean( IsAccessible );
        await this._SetProperty('IsAccessible', value );
    }

    async getIsAncestorSiteInDesignMode(){
        const value = Boolean( await this._GetProperty('IsAncestorSiteInDesignMode') );
        return value;
    }

    async getIsMirrored(){
        const value = Boolean( await this._GetProperty('IsMirrored') );
        return value;
    }

    async getRecreatingHandle(){
        const value = Boolean( await this._GetProperty('RecreatingHandle') );
        return value;
    }

    async getEnabled(){
        const value = Boolean( await this._GetProperty('Enabled') );
        return value;
    }

    async setEnabled(enabled){
        const value = Boolean( enabled );
        await this._SetProperty('Enabled', value );
    }

    async getDisposing(){
        const value = Boolean( await this._GetProperty('Disposing') );
        return value;
    }

    async getCanFocus(){
        const value = Boolean( await this._GetProperty('CanFocus') );
        return value;
    }

    async getCanSelect(){
        const value = Boolean( await this._GetProperty('CanSelect') );
        return value;
    }

    async getCapture(){
        const value = Boolean( await this._GetProperty('Capture') );
        return value;
    }

    async setCapture(Capture){
        const value = Boolean( Capture );
        await this._SetProperty('Capture', value );
    }

    async getCausesValidation(){
        const value = Boolean( await this._GetProperty('CausesValidation') );
        return value;
    }

    async setCausesValidation(CausesValidation){
        const value = Boolean( CausesValidation );
        await this._SetProperty('CausesValidation', value );
    }

    async getContainsFocus(){
        const value = Boolean( await this._GetProperty('ContainsFocus') );
        return value;
    }

    async getCreated(){
        const value = Boolean( await this._GetProperty('Created') );
        return value;
    }

    async getIsDisposed(){
        const value = Boolean( await this._GetProperty('IsDisposed') );
        return value;
    }

    async getTabStop(){
        const value = Boolean( await this._GetProperty('TabStop') );
        return value;
    }

    async setTabStop(TabStop){
        const value = Boolean( TabStop );
        await this._SetProperty('TabStop', value );
    }

    async getVisible() {
        const value = Boolean( await this._GetProperty('Visible') );
        return value;
    }

    async setVisible(visible) {
        const value = Boolean( visible );
        return await this._SetProperty('Visible', value );
    }

    async getUseWaitCursor(){
        const value = Boolean( await this._GetProperty('UseWaitCursor') );
        return value;
    }

    async setUseWaitCursor(UseWaitCursor){
        const value = Boolean( UseWaitCursor );
        await this._SetProperty('UseWaitCursor', value );
    }

    async getFocused(){
        const value = Boolean( await this._GetProperty('Focused') );
        return value;
    }

    async getAutoSize(){
        const value = Boolean( await this._GetProperty('AutoSize') );
        return value;
    }

    async setAutoSize(AutoSize){
        const value = Boolean( AutoSize );
        await this._SetProperty('AutoSize', value );
    }

    async getText() {
        return await this._GetProperty('Text');
    }

    async setText(text) {
        return await this._SetProperty('Text', text);
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
        const value = Boolean( useSystemPasswordChar );
        return await this._SetProperty('UseSystemPasswordChar', value );
    }

    async getUsePasswordChar() {
        const value = Boolean( await this._GetProperty('UseSystemPasswordChar') );
        return value;
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

function Boolean(value) {
    if (typeof value === 'boolean') {
        return value;
    } else if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    } else {
        return false;
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