'use strict';

class TextBox {
    constructor(name, text, getTextCallback) {
        this.formTextChanged = true;

        this.Name = name;
        this._text = text || '';

        this._textChangedHandlers = [];
        this.getTextCallback = getTextCallback;
    }

    OnTextChanged(handler){
        this.formTextChanged = true;
        if (!this._textChangedHandlers.includes(handler)) this._textChangedHandlers.push(handler);
    }

    TextChanged(){
        this.formTextChanged = true;
        this._textChangedHandlers.forEach(handler => handler());
    }

    async getText() {
        if (this.formTextChanged) {
            const text = await this.getTextCallback(this.Name);
            this._text = text;
            this.formTextChanged = false;
        }
        return this._text;
    }

    async setText(text) {
        this._text = text;   
        await this.setTextCallback(this.Name, `Text`, text);
    }

    //AppendText(newText) {
    //    this.text += newText;
    //}
}

/* TODO AppendProperty */

class Button {
    
    constructor(name, text) {
        this.Name = name;
        this.Text = text || '';
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