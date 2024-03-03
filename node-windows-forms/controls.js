/*

by gon_iss (c) 2o24

*/

'use strict';

const { Point, Size, Color } = require('./csharpTypes');

class Control {

    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {
        this.Name = name;
        this.Text = text || '';

        this.getTextCallback = getTextCallback;
        this.setTextCallback = setTextCallback;
        this.invokeMethodCallback = invokeMethodCallback;
        
        this._Properties = {};

        this._eventHandlers = {};
    }

    OnAutoSizeChanged(handler) {
        this._AddEventHandler('AutoSizeChanged', handler);
    }
    _AutoSizeChanged(eventArgs) {
        this._FireEvent('AutoSizeChanged', eventArgs);
    }
    OnBackColorChanged(handler) {
        this._AddEventHandler('BackColorChanged', handler);
    }
    _BackColorChanged(eventArgs) {
        this._FireEvent('BackColorChanged', eventArgs);
    }
    OnBackgroundImageChanged(handler) {
        this._AddEventHandler('BackgroundImageChanged', handler);
    }
    _BackgroundImageChanged(eventArgs) {
        this._FireEvent('BackgroundImageChanged', eventArgs);
    }
    OnBackgroundImageLayoutChanged(handler) {
        this._AddEventHandler('BackgroundImageLayoutChanged', handler);
    }
    _BackgroundImageLayoutChanged(eventArgs) {
        this._FireEvent('BackgroundImageLayoutChanged', eventArgs);
    }
    OnBindingContextChanged(handler) {
        this._AddEventHandler('BindingContextChanged', handler);
    }
    _BindingContextChanged(eventArgs) {
        this._FireEvent('BindingContextChanged', eventArgs);
    }
    OnCausesValidationChanged(handler) {
        this._AddEventHandler('CausesValidationChanged', handler);
    }
    _CausesValidationChanged(eventArgs) {
        this._FireEvent('CausesValidationChanged', eventArgs);
    }
    OnChangeUICues(handler) {
        this._AddEventHandler('ChangeUICues', handler);
    }
    _ChangeUICues(eventArgs) {
        this._FireEvent('ChangeUICues', eventArgs);
    }
    OnClick(handler) {
        this._AddEventHandler('Click', handler);
    }
    _Click(eventArgs) {
        this._FireEvent('Click', eventArgs);
    }
    OnClientSizeChanged(handler) {
        this._AddEventHandler('ClientSizeChanged', handler);
    }
    _ClientSizeChanged(eventArgs) {
        this._FireEvent('ClientSizeChanged', eventArgs);
    }
    OnContextMenuStripChanged(handler) {
        this._AddEventHandler('ContextMenuStripChanged', handler);
    }
    _ContextMenuStripChanged(eventArgs) {
        this._FireEvent('ContextMenuStripChanged', eventArgs);
    }
    OnControlAdded(handler) {
        this._AddEventHandler('ControlAdded', handler);
    }
    _ControlAdded(eventArgs) {
        this._FireEvent('ControlAdded', eventArgs);
    }
    OnControlRemoved(handler) {
        this._AddEventHandler('ControlRemoved', handler);
    }
    _ControlRemoved(eventArgs) {
        this._FireEvent('ControlRemoved', eventArgs);
    }
    OnCreateControl(handler) {
        this._AddEventHandler('CreateControl', handler);
    }
    _CreateControl(eventArgs) {
        this._FireEvent('CreateControl', eventArgs);
    }
    OnCursorChanged(handler) {
        this._AddEventHandler('CursorChanged', handler);
    }
    _CursorChanged(eventArgs) {
        this._FireEvent('CursorChanged', eventArgs);
    }
    OnDockChanged(handler) {
        this._AddEventHandler('DockChanged', handler);
    }
    _DockChanged(eventArgs) {
        this._FireEvent('DockChanged', eventArgs);
    }
    OnDoubleClick(handler) {
        this._AddEventHandler('DoubleClick', handler);
    }
    _DoubleClick(eventArgs) {
        this._FireEvent('DoubleClick', eventArgs);
    }
    OnDpiChangedAfterParent(handler) {
        this._AddEventHandler('DpiChangedAfterParent', handler);
    }
    _DpiChangedAfterParent(eventArgs) {
        this._FireEvent('DpiChangedAfterParent', eventArgs);
    }
    OnDpiChangedBeforeParent(handler) {
        this._AddEventHandler('DpiChangedBeforeParent', handler);
    }
    _DpiChangedBeforeParent(eventArgs) {
        this._FireEvent('DpiChangedBeforeParent', eventArgs);
    }
    OnDragDrop(handler) {
        this._AddEventHandler('DragDrop', handler);
    }
    _DragDrop(eventArgs) {
        this._FireEvent('DragDrop', eventArgs);
    }
    OnDragEnter(handler) {
        this._AddEventHandler('DragEnter', handler);
    }
    _DragEnter(eventArgs) {
        this._FireEvent('DragEnter', eventArgs);
    }
    OnDragLeave(handler) {
        this._AddEventHandler('DragLeave', handler);
    }
    _DragLeave(eventArgs) {
        this._FireEvent('DragLeave', eventArgs);
    }
    OnDragOver(handler) {
        this._AddEventHandler('DragOver', handler);
    }
    _DragOver(eventArgs) {
        this._FireEvent('DragOver', eventArgs);
    }
    OnEnabledChanged(handler) {
        this._AddEventHandler('EnabledChanged', handler);
    }
    _EnabledChanged(eventArgs) {
        this._FireEvent('EnabledChanged', eventArgs);
    }
    OnEnter(handler) {
        this._AddEventHandler('Enter', handler);
    }
    _Enter(eventArgs) {
        this._FireEvent('Enter', eventArgs);
    }
    OnFontChanged(handler) {
        this._AddEventHandler('FontChanged', handler);
    }
    _FontChanged(eventArgs) {
        this._FireEvent('FontChanged', eventArgs);
    }
    OnForeColorChanged(handler) {
        this._AddEventHandler('ForeColorChanged', handler);
    }
    _ForeColorChanged(eventArgs) {
        this._FireEvent('ForeColorChanged', eventArgs);
    }
    OnGiveFeedback(handler) {
        this._AddEventHandler('GiveFeedback', handler);
    }
    _GiveFeedback(eventArgs) {
        this._FireEvent('GiveFeedback', eventArgs);
    }
    OnGotFocus(handler) {
        this._AddEventHandler('GotFocus', handler);
    }
    _GotFocus(eventArgs) {
        this._FireEvent('GotFocus', eventArgs);
    }
    OnHandleCreated(handler) {
        this._AddEventHandler('HandleCreated', handler);
    }
    _HandleCreated(eventArgs) {
        this._FireEvent('HandleCreated', eventArgs);
    }
    OnHandleDestroyed(handler) {
        this._AddEventHandler('HandleDestroyed', handler);
    }
    _HandleDestroyed(eventArgs) {
        this._FireEvent('HandleDestroyed', eventArgs);
    }
    OnHelpRequested(handler) {
        this._AddEventHandler('HelpRequested', handler);
    }
    _HelpRequested(eventArgs) {
        this._FireEvent('HelpRequested', eventArgs);
    }
    OnImeModeChanged(handler) {
        this._AddEventHandler('ImeModeChanged', handler);
    }
    _ImeModeChanged(eventArgs) {
        this._FireEvent('ImeModeChanged', eventArgs);
    }
    OnInvalidated(handler) {
        this._AddEventHandler('Invalidated', handler);
    }
    _Invalidated(eventArgs) {
        this._FireEvent('Invalidated', eventArgs);
    }
    OnKeyDown(handler) {
        this._AddEventHandler('KeyDown', handler);
    }
    _KeyDown(eventArgs) {
        this._FireEvent('KeyDown', eventArgs);
    }
    OnKeyPress(handler) {
        this._AddEventHandler('KeyPress', handler);
    }
    _KeyPress(eventArgs) {
        this._FireEvent('KeyPress', eventArgs);
    }
    OnKeyUp(handler) {
        this._AddEventHandler('KeyUp', handler);
    }
    _KeyUp(eventArgs) {
        this._FireEvent('KeyUp', eventArgs);
    }
    OnLayout(handler) {
        this._AddEventHandler('Layout', handler);
    }
    _Layout(eventArgs) {
        this._FireEvent('Layout', eventArgs);
    }
    OnLeave(handler) {
        this._AddEventHandler('Leave', handler);
    }
    _Leave(eventArgs) {
        this._FireEvent('Leave', eventArgs);
    }
    OnLocationChanged(handler) {
        this._AddEventHandler('LocationChanged', handler);
    }
    _LocationChanged(eventArgs) {
        this._FireEvent('LocationChanged', eventArgs);
    }
    OnLostFocus(handler) {
        this._AddEventHandler('LostFocus', handler);
    }
    _LostFocus(eventArgs) {
        this._FireEvent('LostFocus', eventArgs);
    }
    OnMarginChanged(handler) {
        this._AddEventHandler('MarginChanged', handler);
    }
    _MarginChanged(eventArgs) {
        this._FireEvent('MarginChanged', eventArgs);
    }
    OnMouseCaptureChanged(handler) {
        this._AddEventHandler('MouseCaptureChanged', handler);
    }
    _MouseCaptureChanged(eventArgs) {
        this._FireEvent('MouseCaptureChanged', eventArgs);
    }
    OnMouseClick(handler) {
        this._AddEventHandler('MouseClick', handler);
    }
    _MouseClick(eventArgs) {
        this._FireEvent('MouseClick', eventArgs);
    }
    OnMouseDoubleClick(handler) {
        this._AddEventHandler('MouseDoubleClick', handler);
    }
    _MouseDoubleClick(eventArgs) {
        this._FireEvent('MouseDoubleClick', eventArgs);
    }
    OnMouseDown(handler) {
        this._AddEventHandler('MouseDown', handler);
    }
    _MouseDown(eventArgs) {
        this._FireEvent('MouseDown', eventArgs);
    }
    OnMouseEnter(handler) {
        this._AddEventHandler('MouseEnter', handler);
    }
    _MouseEnter(eventArgs) {
        this._FireEvent('MouseEnter', eventArgs);
    }
    OnMouseHover(handler) {
        this._AddEventHandler('MouseHover', handler);
    }
    _MouseHover(eventArgs) {
        this._FireEvent('MouseHover', eventArgs);
    }
    OnMouseLeave(handler) {
        this._AddEventHandler('MouseLeave', handler);
    }
    _MouseLeave(eventArgs) {
        this._FireEvent('MouseLeave', eventArgs);
    }
    OnMouseMove(handler) {
        this._AddEventHandler('MouseMove', handler);
    }
    _MouseMove(eventArgs) {
        this._FireEvent('MouseMove', eventArgs);
    }
    OnMouseUp(handler) {
        this._AddEventHandler('MouseUp', handler);
    }
    _MouseUp(eventArgs) {
        this._FireEvent('MouseUp', eventArgs);
    }
    OnMouseWheel(handler) {
        this._AddEventHandler('MouseWheel', handler);
    }
    _MouseWheel(eventArgs) {
        this._FireEvent('MouseWheel', eventArgs);
    }
    OnMove(handler) {
        this._AddEventHandler('Move', handler);
    }
    _Move(eventArgs) {
        this._FireEvent('Move', eventArgs);
    }
    OnPaddingChanged(handler) {
        this._AddEventHandler('PaddingChanged', handler);
    }
    _PaddingChanged(eventArgs) {
        this._FireEvent('PaddingChanged', eventArgs);
    }
    OnPaint(handler) {
        this._AddEventHandler('Paint', handler);
    }
    _Paint(eventArgs) {
        this._FireEvent('Paint', eventArgs);
    }
    OnPaintBackground(handler) {
        this._AddEventHandler('PaintBackground', handler);
    }
    _PaintBackground(eventArgs) {
        this._FireEvent('PaintBackground', eventArgs);
    }
    OnParentBackColorChanged(handler) {
        this._AddEventHandler('ParentBackColorChanged', handler);
    }
    _ParentBackColorChanged(eventArgs) {
        this._FireEvent('ParentBackColorChanged', eventArgs);
    }
    OnParentBackgroundImageChanged(handler) {
        this._AddEventHandler('ParentBackgroundImageChanged', handler);
    }
    _ParentBackgroundImageChanged(eventArgs) {
        this._FireEvent('ParentBackgroundImageChanged', eventArgs);
    }
    OnParentBindingContextChanged(handler) {
        this._AddEventHandler('ParentBindingContextChanged', handler);
    }
    _ParentBindingContextChanged(eventArgs) {
        this._FireEvent('ParentBindingContextChanged', eventArgs);
    }
    OnParentChanged(handler) {
        this._AddEventHandler('ParentChanged', handler);
    }
    _ParentChanged(eventArgs) {
        this._FireEvent('ParentChanged', eventArgs);
    }
    OnParentCursorChanged(handler) {
        this._AddEventHandler('ParentCursorChanged', handler);
    }
    _ParentCursorChanged(eventArgs) {
        this._FireEvent('ParentCursorChanged', eventArgs);
    }
    OnParentEnabledChanged(handler) {
        this._AddEventHandler('ParentEnabledChanged', handler);
    }
    _ParentEnabledChanged(eventArgs) {
        this._FireEvent('ParentEnabledChanged', eventArgs);
    }
    OnParentFontChanged(handler) {
        this._AddEventHandler('ParentFontChanged', handler);
    }
    _ParentFontChanged(eventArgs) {
        this._FireEvent('ParentFontChanged', eventArgs);
    }
    OnParentForeColorChanged(handler) {
        this._AddEventHandler('ParentForeColorChanged', handler);
    }
    _ParentForeColorChanged(eventArgs) {
        this._FireEvent('ParentForeColorChanged', eventArgs);
    }
    OnParentRightToLeftChanged(handler) {
        this._AddEventHandler('ParentRightToLeftChanged', handler);
    }
    _ParentRightToLeftChanged(eventArgs) {
        this._FireEvent('ParentRightToLeftChanged', eventArgs);
    }
    OnParentVisibleChanged(handler) {
        this._AddEventHandler('ParentVisibleChanged', handler);
    }
    _ParentVisibleChanged(eventArgs) {
        this._FireEvent('ParentVisibleChanged', eventArgs);
    }
    OnPreviewKeyDown(handler) {
        this._AddEventHandler('PreviewKeyDown', handler);
    }
    _PreviewKeyDown(eventArgs) {
        this._FireEvent('PreviewKeyDown', eventArgs);
    }
    OnPrint(handler) {
        this._AddEventHandler('Print', handler);
    }
    _Print(eventArgs) {
        this._FireEvent('Print', eventArgs);
    }
    OnQueryContinueDrag(handler) {
        this._AddEventHandler('QueryContinueDrag', handler);
    }
    _QueryContinueDrag(eventArgs) {
        this._FireEvent('QueryContinueDrag', eventArgs);
    }
    OnRegionChanged(handler) {
        this._AddEventHandler('RegionChanged', handler);
    }
    _RegionChanged(eventArgs) {
        this._FireEvent('RegionChanged', eventArgs);
    }
    OnResize(handler) {
        this._AddEventHandler('Resize', handler);
    }
    _Resize(eventArgs) {
        this._FireEvent('Resize', eventArgs);
    }
    OnRightToLeftChanged(handler) {
        this._AddEventHandler('RightToLeftChanged', handler);
    }
    _RightToLeftChanged(eventArgs) {
        this._FireEvent('RightToLeftChanged', eventArgs);
    }
    OnSizeChanged(handler) {
        this._AddEventHandler('SizeChanged', handler);
    }
    _SizeChanged(eventArgs) {
        this._FireEvent('SizeChanged', eventArgs);
    }
    OnStyleChanged(handler) {
        this._AddEventHandler('StyleChanged', handler);
    }
    _StyleChanged(eventArgs) {
        this._FireEvent('StyleChanged', eventArgs);
    }
    OnSystemColorsChanged(handler) {
        this._AddEventHandler('SystemColorsChanged', handler);
    }
    _SystemColorsChanged(eventArgs) {
        this._FireEvent('SystemColorsChanged', eventArgs);
    }
    OnTabIndexChanged(handler) {
        this._AddEventHandler('TabIndexChanged', handler);
    }
    _TabIndexChanged(eventArgs) {
        this._FireEvent('TabIndexChanged', eventArgs);
    }
    OnTabStopChanged(handler) {
        this._AddEventHandler('TabStopChanged', handler);
    }
    _TabStopChanged(eventArgs) {
        this._FireEvent('TabStopChanged', eventArgs);
    }
    OnTextChanged(handler) {
        this._AddEventHandler('TextChanged', handler);
    }
    _TextChanged(eventArgs) {
        this._FireEvent('TextChanged', eventArgs);
    }
    OnValidated(handler) {
        this._AddEventHandler('Validated', handler);
    }
    _Validated(eventArgs) {
        this._FireEvent('Validated', eventArgs);
    }
    OnValidating(handler) {
        this._AddEventHandler('Validating', handler);
    }
    _Validating(eventArgs) {
        this._FireEvent('Validating', eventArgs);
    }
    OnVisibleChanged(handler) {
        this._AddEventHandler('VisibleChanged', handler);
    }
    _VisibleChanged(eventArgs) {
        this._FireEvent('VisibleChanged', eventArgs);
    }

    async _SetProperty(property, value){

        this._Properties[property] = value; 
        await this.setTextCallback(this.Name, property, value);
        return true;
    }

    async _GetProperty(property){
        let value = null;
        value = await this.getTextCallback(this.Name, property);
        this._Properties[property] = value; 

        return value;
    }

    async _SetBooleanProperty(property, value){
        const _value = Boolean( value );
        await this._SetProperty(property, _value );
    }

    async _GetBooleanProperty(property){
        const value = Boolean( await this._GetProperty( property ) );
        return value;
    }

    async _GetSetBooleanProperty(property, value){
        if(value !== null && value !== undefined) {
            return await this._SetBooleanProperty(property, value);
        }
        else{
            return await this._GetBooleanProperty(property);
        }
    }

    async _GetColorProperty(property){
        const color = JSON.parse( await this._GetProperty( property ) );
        return new Color(color.a, color.r, color.g, color.b);
    }

    async _SetColorProperty(property, a, r, g, b){
        if(a instanceof Color){
            return await this._SetProperty( property, a.toString() );
        }
        else{
            return await this._SetProperty( property, new Color(a, r, g, b).toString() );
        }
    }

    async _InvokeMethod(methodName, value){
        let result = null;
        result = await this.invokeMethodCallback(this.Name, methodName, value);

        return result;
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

    async Focus(){
        return Boolean( await this._InvokeMethod('Focus', '') );
    }

    async getText() {
        return await this._GetProperty('Text');
    }

    async setText(text) {
        return await this._SetProperty('Text', text);
    }

    async setBackColor(a, r, g, b){
        return await this._SetColorProperty('BackColor', a, r, g, b);
    }

    async getBackColor(){
        return await this._GetColorProperty('BackColor');
    }

    async setForeColor(a, r, g, b){
        return await this._SetColorProperty('ForeColor', a, r, g, b);
    }

    async getForeColor(){
        return await this._GetColorProperty('ForeColor');
    }

    async setLocation(x, y){
        if(x instanceof Point){
            const point = x;
            return await this._SetProperty('Location', point.toString());
        }
        else{
            const point = new Point(x, y);
            return await this._SetProperty('Location', point.toString());
        }
    }

    async getLocation(){
        const location = JSON.parse( await this._GetProperty('Location') );
        const point = new Point( location.x, location.y );
        point.isEmpty = Boolean( location.isEmpty );

        return point;
    }

    async setSize(width, height){
        if(width instanceof Size){
            const size = width;
            return await this._SetProperty('Size', size.toString());
        }
        else{
            const size = new Size(width, height); 
            return await this._SetProperty('Size', size.toString());
        }
    }

    async getSize(){
        const size = JSON.parse( await this._GetProperty('Size') );
        return new Size(size.width, size.height);
    }

    // --------- Boolean { get; set; } properties --------- //     

    async getAllowDrop(){
        return await this._GetSetBooleanProperty('AllowDrop');
    }

    async setAllowDrop(AllowDrop){
        return await this._GetSetBooleanProperty('AllowDrop', AllowDrop);
    }

    async getHasChildren(){
        return await this._GetSetBooleanProperty('HasChildren');
    }

    async getIsHandleCreated(){
        return await this._GetSetBooleanProperty('IsHandleCreated');
    }

    async getInvokeRequired(){
        return await this._GetSetBooleanProperty('InvokeRequired');
    }
    
    async getIsAccessible(){
        return await this._GetSetBooleanProperty('IsAccessible');
    }

    async setIsAccessible(IsAccessible){
        return await this._GetSetBooleanProperty('IsAccessible', IsAccessible);
    }

    async getIsAncestorSiteInDesignMode(){
        return await this._GetSetBooleanProperty('IsAncestorSiteInDesignMode');
    }

    async getIsMirrored(){
        return await this._GetSetBooleanProperty('IsMirrored');
    }

    async getRecreatingHandle(){
        return await this._GetSetBooleanProperty('RecreatingHandle');
    }

    async getEnabled(){
        return await this._GetSetBooleanProperty('Enabled');
    }

    async setEnabled(Enabled){
        return await this._GetSetBooleanProperty('Enabled', Enabled);
    }

    async getDisposing(){
        return await this._GetSetBooleanProperty('Disposing');
    }

    async getCanFocus(){
        return await this._GetSetBooleanProperty('CanFocus');
    }

    async getCanSelect(){
        return await this._GetSetBooleanProperty('CanSelect');
    }

    async getCapture(){
        return await this._GetSetBooleanProperty('Capture');
    }

    async setCapture(Capture){
        return await this._GetSetBooleanProperty('Capture', Capture);
    }

    async getCausesValidation(){
        return await this._GetSetBooleanProperty('CausesValidation');
    }

    async setCausesValidation(CausesValidation){
        return await this._GetSetBooleanProperty('CausesValidation', CausesValidation);
    }

    async getContainsFocus(){
        return await this._GetSetBooleanProperty('ContainsFocus');
    }

    async getCreated(){
        return await this._GetSetBooleanProperty('Created');
    }

    async getIsDisposed(){
        return await this._GetSetBooleanProperty('IsDisposed');
    }

    async getTabStop(){
        return await this._GetSetBooleanProperty('TabStop');
    }

    async setTabStop(TabStop){
        return await this._GetSetBooleanProperty('TabStop', TabStop);
    }

    async getVisible() {
        return await this._GetSetBooleanProperty('Visible');
    }

    async setVisible(Visible) {
        return await this._GetSetBooleanProperty('Visible', Visible);
    }

    async getUseWaitCursor(){
        return await this._GetSetBooleanProperty('UseWaitCursor');
    }

    async setUseWaitCursor(UseWaitCursor){
        return await this._GetSetBooleanProperty('UseWaitCursor', UseWaitCursor);
    }

    async getFocused(){
        return await this._GetSetBooleanProperty('Focused');
    }

    async getAutoSize(){
        return await this._GetSetBooleanProperty('AutoSize');
    }

    async setAutoSize(AutoSize){
        return await this._GetSetBooleanProperty('AutoSize', AutoSize);
    }
}

class ClickableControl extends Control {
    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

        this._clickHandlers = [];
    }

    OnClick(handler) {
        super._AddEventHandler('Click', handler);
    }

    _Click(eventArgs) {
        super._FireEvent('Click', eventArgs);
    }
}

class TextBox extends ClickableControl {
    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

        this.textWasChanged = true;
        this.lastText = text;
    }

    AppendText(text){
        super._InvokeMethod('AppendText', text.toString());
    }

    OnTextChanged(handler){
        this.textWasChanged = true;
        super._AddEventHandler('TextChanged', handler);
    }

    _TextChanged(eventArgs){
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

    // --------- Boolean { get; set; } properties --------- // 

    async getAcceptsTab(){
        return await this._GetSetBooleanProperty('AcceptsTab');
    }

    async setAcceptsTab(AcceptsTab){
        return await this._GetSetBooleanProperty('AcceptsTab', AcceptsTab);
    }

    async getCanUndo(){
        return await this._GetSetBooleanProperty('CanUndo');
    }

    async getHideSelection(){
        return await this._GetSetBooleanProperty('HideSelection');
    }

    async setHideSelection(HideSelection){
        return await this._GetSetBooleanProperty('HideSelection', HideSelection);
    }

    async getModified(){
        return await this._GetSetBooleanProperty('Modified');
    }

    async setModified(Modified){
        return await this._GetSetBooleanProperty('Modified', Modified);
    }

    async getMultiline(){
        return await this._GetSetBooleanProperty('Multiline');
    }

    async setMultiline(Multiline){
        return await this._GetSetBooleanProperty('Multiline', Multiline);
    }

    async getShortcutsEnabled(){
        return await this._GetSetBooleanProperty('ShortcutsEnabled');
    }

    async setShortcutsEnabled(ShortcutsEnabled){
        return await this._GetSetBooleanProperty('ShortcutsEnabled', ShortcutsEnabled);
    }

    async getReadOnly(){
        return await this._GetSetBooleanProperty('ReadOnly');
    }

    async setReadOnly(ReadOnly){
        return await this._GetSetBooleanProperty('ReadOnly', ReadOnly);
    }

    async getWordWrap(){
        return await this._GetSetBooleanProperty('WordWrap');
    }

    async setWordWrap(WordWrap){
        return await this._GetSetBooleanProperty('WordWrap', WordWrap);
    }

    async getDoubleBuffered(){
        return await this._GetSetBooleanProperty('DoubleBuffered');
    }

    async setDoubleBuffered(DoubleBuffered){
        return await this._GetSetBooleanProperty('DoubleBuffered', DoubleBuffered);
    }

    async getCanEnableIme(){
        return await this._GetSetBooleanProperty('CanEnableIme');
    }

    async getUsePasswordChar() {
        return await this._GetSetBooleanProperty('UsePasswordChar');
    }

    async setUseSystemPasswordChar(UseSystemPasswordChar) {
        return await this._GetSetBooleanProperty('UseSystemPasswordChar', UseSystemPasswordChar);
    }

    async getAcceptsReturn(){
        return await this._GetSetBooleanProperty('AcceptsReturn');
    }

    async setAcceptsReturn(AcceptsReturn){
        return await this._GetSetBooleanProperty('AcceptsReturn', AcceptsReturn);
    }
}



class Button extends ClickableControl {
    
    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

    }

    // --------- Boolean { get; set; } properties --------- //     

    async getUseMnemonic(){
        return await this._GetSetBooleanProperty('UseMnemonic');
    }

    async setUseMnemonic(UseMnemonic){
        return await this._GetSetBooleanProperty('UseMnemonic', UseMnemonic);
    }

    async getUseCompatibleTextRendering(){
        return await this._GetSetBooleanProperty('UseCompatibleTextRendering');
    }

    async setUseCompatibleTextRendering(UseCompatibleTextRendering){
        return await this._GetSetBooleanProperty('UseCompatibleTextRendering', UseCompatibleTextRendering);
    }

    async getUseVisualStyleBackColor(){
        return await this._GetSetBooleanProperty('UseVisualStyleBackColor');
    }

    async setUseVisualStyleBackColor(UseVisualStyleBackColor){
        return await this._GetSetBooleanProperty('UseVisualStyleBackColor', UseVisualStyleBackColor);
    }

    async getAutoEllipsis(){
        return await this._GetSetBooleanProperty('AutoEllipsis');
    }

    async setAutoEllipsis(AutoEllipsis){
        return await this._GetSetBooleanProperty('AutoEllipsis', AutoEllipsis);
    }

    async getIsDefault(){
        return await this._GetSetBooleanProperty('IsDefault');
    }

    async setIsDefault(IsDefault){
        return await this._GetSetBooleanProperty('IsDefault', IsDefault);
    }
}

class Label extends ClickableControl {
    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

    }

    // --------- Boolean { get; set; } properties --------- // 

    async getAutoEllipsis(){
        return await this._GetSetBooleanProperty('AutoEllipsis');
    }

    async setAutoEllipsis(AutoEllipsis){
        return await this._GetSetBooleanProperty('AutoEllipsis', AutoEllipsis);
    }

    async getUseMnemonic(){
        return await this._GetSetBooleanProperty('UseMnemonic');
    }

    async setUseMnemonic(UseMnemonic){
        return await this._GetSetBooleanProperty('UseMnemonic', UseMnemonic);
    }

    async getUseCompatibleTextRendering(){
        return await this._GetSetBooleanProperty('UseCompatibleTextRendering');
    }

    async setUseCompatibleTextRendering(UseCompatibleTextRendering){
        return await this._GetSetBooleanProperty('UseCompatibleTextRendering', UseCompatibleTextRendering);
    }

    async getRenderTransparent(){
        return await this._GetSetBooleanProperty('RenderTransparent');
    }

    async setRenderTransparent(RenderTransparent){
        return await this._GetSetBooleanProperty('RenderTransparent', RenderTransparent);
    }
}

class CheckableButton extends Button {
    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {
        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

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

    _CheckedChanged(eventArgs){
        super._FireEvent('CheckedChanged', eventArgs);
    }

    // --------- Boolean { get; set; } properties --------- // 

    async getChecked() {
        return await this._GetSetBooleanProperty('Checked');
    }

    async setChecked(Checked) {
        return await this._GetSetBooleanProperty('Checked', Checked);
    }

    async getAutoCheck(){
        return await this._GetSetBooleanProperty('AutoCheck');
    }

    async setAutoCheck(AutoCheck){
        return await this._GetSetBooleanProperty('AutoCheck', AutoCheck);
    }

}

const AppearanceCheckable = {
    NORMAL: 0,
    BUTTON: 1
};

class RadioButton extends CheckableButton {

    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

    }

}

class CheckBox extends CheckableButton {

    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

    }

    // --------- Boolean { get; set; } properties --------- // 

    async getThreeState(){
        return await this._GetSetBooleanProperty('ThreeState');
    }

    async setThreeState(ThreeState){
        return await this._GetSetBooleanProperty('ThreeState', ThreeState);
    }

}

class UpDownAbleControl extends ClickableControl {
    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

    }

    // --------- Boolean { get; set; } properties --------- // 

    async getFocused(){
        return await this._GetSetBooleanProperty('Focused');
    }

    async getInterceptArrowKeys(){
        return await this._GetSetBooleanProperty('InterceptArrowKeys');
    }

    async setInterceptArrowKeys(InterceptArrowKeys){
        return await this._GetSetBooleanProperty('InterceptArrowKeys', InterceptArrowKeys);
    }

    async getReadOnly(){
        return await this._GetSetBooleanProperty('ReadOnly');
    }

    async setReadOnly(ReadOnly){
        return await this._GetSetBooleanProperty('ReadOnly', ReadOnly);
    }

    async getAutoScroll(){
        return await this._GetSetBooleanProperty('AutoScroll');
    }

    async setAutoScroll(AutoScroll){
        return await this._GetSetBooleanProperty('AutoScroll', AutoScroll);
    }

    async getChangingText(){
        return await this._GetSetBooleanProperty('ChangingText');
    }

    async setChangingText(ChangingText){
        return await this._GetSetBooleanProperty('ChangingText', ChangingText);
    }

    async getUserEdit(){
        return await this._GetSetBooleanProperty('UserEdit');
    }

    async setUserEdit(UserEdit){
        return await this._GetSetBooleanProperty('UserEdit', UserEdit);
    }
}

class NumericUpDown extends UpDownAbleControl {

    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

    }

    _parseNumberString(numberString) {
        let withoutThousandsSeparators = numberString.replace(/\./g, '');
        let parsedNumber = parseFloat(withoutThousandsSeparators.replace(',', '.'));
        return parsedNumber;
    }

    async getValue(){
        return this._parseNumberString( await super._GetProperty('Value') );
    }

    async setValue(value){
        super._SetProperty('Value', value)
    }

    OnValueChanged(handler){
        super._AddEventHandler('ValueChanged', handler);
    }

    _ValueChanged(eventArgs){
        super._FireEvent('ValueChanged', eventArgs);
    }
    
    // --------- Boolean { get; set; } properties --------- // 

    async getThousandsSeparator(){
        return await this._GetSetBooleanProperty('ThousandsSeparator');
    }

    async setThousandsSeparator(ThousandsSeparator){
        return await this._GetSetBooleanProperty('ThousandsSeparator', ThousandsSeparator);
    }

    async getHexadecimal(){
        return await this._GetSetBooleanProperty('Hexadecimal');
    }

    async setHexadecimal(Hexadecimal){
        return await this._GetSetBooleanProperty('Hexadecimal', Hexadecimal);
    }
}

class Form extends ClickableControl {

    constructor(name, text, getTextCallback, setTextCallback, invokeMethodCallback) {

        super(name, text, getTextCallback, setTextCallback, invokeMethodCallback);

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
    Form,
    
    AppearanceCheckable
};