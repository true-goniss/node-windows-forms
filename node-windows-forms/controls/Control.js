const { EventEmitter } = require('events');
const { Size, Point, Color } = require('./types/csharpTypes');

// Base class for EXISTING controls loaded from the manifest
class Control extends EventEmitter {

    //_subscribedEvents = new Set();

    constructor(session, idOrParent, controlType = null) {
        super();
        this.session = session;
        this._subscribedEvents = new Set();
        this._state = {};

        if (idOrParent instanceof Control) {
            this.id = require('../utils/uuid').getId();
            const parentId = idOrParent.id;
            const type = controlType || this.constructor.name;
            
            this.session.send('system', 'create', {
                type: type,
                id: this.id,
                parent: parentId
            }).catch(console.error);
        } else if (typeof idOrParent === 'string') {
            // The ID is the C# control name/key (e.g., 'Form1', 'panel1')
            this.id = idOrParent; 
        } else if (idOrParent === undefined) {
            // Create a new control dynamically without a parent (e.g., a new Form)
            this.id = require('../utils/uuid').getId();
            const type = controlType || this.constructor.name;
            this.session.send('system', 'create', {
                type: type,
                id: this.id
            }).catch(console.error);
        } else {
            this.id = idOrParent;
        }

        this.session.controls.set(this.id, this);

        // Built-in listeners to update local state from C# events
        // Use super.on to avoid sending addEvent request for every control
        super.on('destroyed', () => this._handleDestroyed());
        
        // Automatically update cached dimensions when changed in C#
        super.on('Resize', (data) => {
            if (data && data.width !== undefined && data.height !== undefined) {
                this._state['Width'] = data.width;
                this._state['Height'] = data.height;
            }
        });
        
        // We still need to tell C# to send Resize events, but we only want to do it if someone needs it.
        // Actually, Form should probably just always subscribe to Resize so JS always has correct Window size.

        super.on('TextChanged', (data) => {
            if (data && data.value !== undefined) {
                this._state['Text'] = data.value;
            }
        });
        
        super.on('CheckedChanged', (data) => {
            if (data && data.value !== undefined) {
                this._state['Checked'] = data.value;
            }
        });
        
        super.on('SelectedIndexChanged', (data) => {
            if (data && data.value !== undefined) {
                this._state['SelectedIndex'] = data.value;
            }
        });

        // Layout & Styling properties
        this._createPropertyAccessor('Dock');
        this._createPropertyAccessor('Anchor');
        this._createPropertyAccessor('Margin');
        this._createPropertyAccessor('Padding');
        this._createPropertyAccessor('Top');
        this._createPropertyAccessor('Left');
        this._createPropertyAccessor('Width');
        this._createPropertyAccessor('Height');
        this._createPropertyAccessor('Visible');
        this._createPropertyAccessor('Enabled');
        this._createPropertyAccessor('Text');
    }

    // Generic method to create 'OnEventName' getter
    _createEventHandlerGetter(eventName) {
        const jsEventName = eventName;//.toLowerCase(); // 'mousemove'
        const csharpEventName = eventName; // 'MouseMove'

        // FIX: Use Function Expression (function) for getter,
        // so 'this' inside getter refers to Control instance.
        return {
            get: function() { 
                const controlInstance = this; // controlInstance = Control instance

                return {
                    Attach: (handler) => {
                        controlInstance.on(jsEventName, handler); // Use instance
                        
                        if (!controlInstance._subscribedEvents.has(csharpEventName)) {
                            controlInstance._subscribedEvents.add(csharpEventName);
                            
                            // FIX: Use controlInstance.session.send
                            controlInstance.session.send(controlInstance.id, 'addEvent', { name: csharpEventName })
                                .catch(console.error);
                        }
                    },
                    Remove: (handler) => {
                        controlInstance.removeListener(jsEventName, handler);
                    },
                    // Option 2: Simulated event trigger
                    Invoke: (data) => {
                        controlInstance.emit(jsEventName, data);
                    }
                };
            }
        };
    }

    async _SetProperty(name, value) {
        if (this.isDisposed) throw new Error(`Cannot set property ${name} on disposed control ${this.id}`);
        // [FIX] Send value directly. 
        // If Point/Size, external JSON.stringify will invoke toJSON() and embed object.
        return this.session.send(this.id, 'setProperty', { name, value: value });
    }

    async _GetProperty(name) {
        if (this.isDisposed) throw new Error(`Cannot get property ${name} on disposed control ${this.id}`);
        return this.session.send(this.id, 'getProperty', { name });
    }

    async invokeMethod(methodName, args = {}) {
        if (this.isDisposed) throw new Error(`Cannot invoke method ${methodName} on disposed control ${this.id}`);
        return this.session.send(this.id, 'invokeMethod', { method: methodName, args: args });
    }

    async setLocation(x, y) {
        let point;
        if (x instanceof Point) {
            point = x;
        } else {
            point = new Point(x, y);
        }
        return await this._SetProperty('Location', point); // Point.toString() will be called in _SetProperty
    }

    async getLocation() {
        // C# returns JSON string with PascalCase properties (X, Y)
        const locationJson = await this._GetProperty('Location');
        const location = JSON.parse(locationJson);
        
        const point = new Point(location.X, location.Y);
        point.isEmpty = Boolean(location.IsEmpty);

        return point;
    }

    async setSize(width, height) {
        let size;
        if (width instanceof Size) {
            size = width;
        } else {
            size = new Size(width, height);
        }
        return await this._SetProperty('Size', size); // Size.toString() will be called in _SetProperty
    }

    async getSize() {
        const sizeJson = await this._GetProperty('Size');
        const size = JSON.parse(sizeJson);
        
        const jsSize = new Size(size.Width, size.Height);
        jsSize.isEmpty = Boolean(size.IsEmpty);
        
        return jsSize;
    }

    async setBackColor(arg1, r, g, b) {
        let color;
        if (arg1 instanceof Color) {
            color = arg1;
        } else {
            // Support setBackColor(r, g, b) or setBackColor(a, r, g, b)
            let a = 255;
            if (r === undefined) { 
                b = g;
                g = r;
                r = arg1;
            } else { 
                a = arg1;
            }
            color = new Color(a, r, g, b);
        }
        
        // _SetProperty will call color.toString() and send string
        return await this._SetProperty('BackColor', color.toString());
    }

    async getBackColor() {
        const colorString = await this._GetProperty('BackColor'); 
        
        const match = colorString.match(/a:(\d+)r:(\d+)g:(\d+)b:(\d+)/);
        
        if (match && match.length === 5) {
            const [, a, r, g, b] = match.map(Number);
            return new Color(a, r, g, b);
        }
        throw new Error(`Failed to parse color string received from C#: ${colorString}`);
    }

    async getText() {
        return await this._GetProperty('Text');
    }

    async setText(text) {
        return await this._SetProperty('Text', text);
    }

    async setProperty(name, value) { return this._SetProperty(name, value); }
    async getProperty(name) { return this._GetProperty(name); }
    
    /**
     * Creates a synchronous accessor (getter/setter) for a C# property.
     * @param {string} propName Property name in PascalCase (e.g., 'Text', 'Top').
     */
    _createPropertyAccessor(propName) {
        // Query initial property value from C# and cache it
        this._GetProperty(propName).then(val => {
            if (this._state[propName] === undefined) {
                this._state[propName] = val;
            }
        }).catch(() => {});

        // Use Object.defineProperty to create accessor
        Object.defineProperty(this, propName, {
            // 1. SETTER (textBox1.Text = 'value')
            // Operates synchronously (updates cache), firing IPC request "fire-and-forget".
            set: function(value) {
                if (value === undefined) return;
                this._state[propName] = value;
                // Call async property setter
                this._SetProperty(propName, value).catch(error => {
                    console.error(`[IPC Set Error] Setting property ${propName} on ${this.id}:`, error);
                });
            },

            // 2. GETTER (const text = textBox1.Text)
            // Returns cached value synchronously
            get: function() {
                return this._state[propName];
            },
            enumerable: true,
            configurable: true
        });
    }

    _handleDestroyed() {
        if (this.isDisposed) return;
        this.isDisposed = true;
        this.session.controls.delete(this.id);
        this.removeAllListeners();
    }

    async dispose() {
        if (this.isDisposed) return;
        try {
            await this.session.send(this.id, 'dispose', {});
        } catch(e) {
            console.error(`Failed to dispose control ${this.id}:`, e);
        }
        this._handleDestroyed();
    }

    async on(eventName, handler) {
        super.on(eventName, handler);
        if (eventName === 'destroyed') return;
        if (!this._subscribedEvents.has(eventName)) {
            this._subscribedEvents.add(eventName);
            try {
                await this.session.send(this.id, 'addEvent', { name: eventName });
            } catch (error) {
                this._subscribedEvents.delete(eventName);
                console.error(`Failed to subscribe to event ${eventName} on ${this.id}:`, error);
            }
        }
    }
}

// Определяем OnMouseMove
Object.defineProperty(Control.prototype, 'OnMouseMove', 
    Control.prototype._createEventHandlerGetter('MouseMove'));

// Определяем OnClick
Object.defineProperty(Control.prototype, 'OnClick', 
    Control.prototype._createEventHandlerGetter('Click'));

// Additional event definitions can be added here, for example:
// Define OnKeyDown
Object.defineProperty(Control.prototype, 'OnKeyDown', 
    Control.prototype._createEventHandlerGetter('KeyDown'));

Object.defineProperty(Control.prototype, 'OnTextChanged', 
    Control.prototype._createEventHandlerGetter('TextChanged'));

Object.defineProperty(Control.prototype, 'OnSelectedIndexChanged', 
    Control.prototype._createEventHandlerGetter('SelectedIndexChanged'));

// Note: Ensure this getter is accessible on control instances.
// Adding via Object.defineProperty on Control.prototype works for all controls.

module.exports = Control;
