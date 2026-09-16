const { spawn } = require('child_process');
const net = require('net');
const { EventEmitter } = require('events');
const { PipeProtocol } = require('./utils/PipeProtocol');
const { Control, Form, Button, Label, TextBox  } = require('./controls');
const { getId } = require('./utils/uuid');

class WinFormsSession extends EventEmitter {
    constructor(options) {
        super();
        if (typeof options === 'string') {
            this.executablePath = options; // For backwards compatibility
        } else {
            const path = require('path');
            const fs = require('fs');
            
            const possiblePaths = [
                path.join(__dirname, '..', 'bin', 'node-windows-forms.exe'),
                path.join(__dirname, 'node-windows-forms.exe'),
                path.join(__dirname, 'bin', 'node-windows-forms.exe')
            ];
            
            let defaultPath = possiblePaths[0];
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    defaultPath = p;
                    break;
                }
            }
            
            this.executablePath = options?.executablePath || defaultPath;
            this.pipeName = options?.pipeName;
        }
        
        this.pendingRequests = new Map();
        this.process = null;
        this.controls = new Map();
        this.existingControlsByName = {}; 
        this.protocol = null;
        this._startResolve = null;
    }

    start() {
        return new Promise((resolve, reject) => {
            let pipeId = this.pipeName;
            
            if (this.executablePath) {
                // Spawn mode
                pipeId = pipeId || `NodeWinForms_${getId()}`;
                this.process = spawn(this.executablePath, [pipeId, '--spawn'], {
                    stdio: 'inherit' // Only log, we don't use stdio for IPC anymore
                });
                
                this.process.on('close', (code) => this.emit('exit', code));
                this.process.on('error', (err) => {
                    if (err.code === 'ENOENT') {
                        const customErr = new Error(`Cannot find the C# executable at ${this.executablePath}.\nIf you are running from the source repository, please build the C# project first (e.g. 'dotnet build').`);
                        customErr.code = 'ENOENT';
                        return reject(customErr);
                    }
                    reject(err);
                });
                
                // Give the C# process a moment to start the named pipe server
                setTimeout(() => this._connectPipe(pipeId, resolve, reject), 500);
            } else if (this.pipeName) {
                // Attach mode
                this._connectPipe(this.pipeName, resolve, reject);
            } else {
                reject(new Error("Must provide either executablePath or pipeName"));
            }
        });
    }

    _connectPipe(pipeId, resolve, reject, retries = 10) {
        const pipePath = `\\\\.\\pipe\\${pipeId}`;
        let isConnected = false;
        
        const socket = net.createConnection(pipePath, () => {
            isConnected = true;
            this.protocol = new PipeProtocol(socket);
            
            // Handshake (Register = 0)
            this.protocol.send({
                id: getId(),
                type: 0,
                targetId: 'nodejs_client'
            });

            this._startResolve = resolve;
            
            // Start heartbeat
            this._heartbeatInterval = setInterval(() => {
                this.protocol.send({ action: 'Heartbeat' });
            }, 3000);
            
            this.protocol.on('message', (msg) => this._handleMessage(msg));
            this.protocol.on('error', (err) => this.emit('error', err));
        });
        
        socket.on('error', (err) => {
            if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
            if (!isConnected && err.code === 'ENOENT' && retries > 0) {
                // Retry in 500ms
                setTimeout(() => this._connectPipe(pipeId, resolve, reject, retries - 1), 500);
            } else if (!isConnected) {
                reject(err);
            }
        });

        socket.on('close', () => {
            if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
            if (isConnected) {
                this.emit('disconnected');
            }
        });
    }

    send(targetId, action, args = {}, options = {}) {
        if (!this.protocol) throw new Error("Not connected");
        
        const requestId = getId();
        // Construct PipeMessage format matching C# PipeModels.cs
        const packet = { 
            id: requestId, 
            type: 1, // Command = 1
            targetId: targetId, 
            action: action, 
            payload: args 
        };
        
        this.protocol.send(packet);

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            
            const timeoutMs = options.timeout !== undefined ? options.timeout : 5000;
            if (timeoutMs > 0) {
                setTimeout(() => {
                    if (this.pendingRequests.has(requestId)) {
                        this.pendingRequests.delete(requestId);
                        reject(new Error(`Timeout waiting for response to ${action}`));
                    }
                }, timeoutMs);
            }
        });
    }

    _handleMessage(rawMsg) {
        try {
            const action = rawMsg.action || rawMsg.Action;
            const type = rawMsg.type !== undefined ? rawMsg.type : rawMsg.Type;
            const payload = rawMsg.payload !== undefined ? rawMsg.payload : rawMsg.Payload;
            const id = rawMsg.id || rawMsg.Id;
            const targetId = rawMsg.targetId || rawMsg.TargetId;

            if (action === 'systemReady') {
                this._processManifest(payload);
                if (this._startResolve) {
                    this._startResolve(this.existingControlsByName);
                    this._startResolve = null;
                }
                return;
            }

            // Response = 2, Error = 4
            if (type === 2 || type === 4 || type === 'response' || type === 'error') {
                const req = this.pendingRequests.get(id);
                if (req) {
                    this.pendingRequests.delete(id);
                    if (type === 4 || type === 'error') req.reject(new Error(payload));
                    else req.resolve(payload);
                }
            } 
            // Event = 3
            else if (type === 3 || type === 'event') {
                // If using PipeMessage format directly: targetId is on root, action is eventName, payload is data
                // For backwards compatibility, fallback to msg.payload.target etc.
                const target = targetId || payload?.target;
                const name = action || payload?.name;
                const data = (targetId) ? payload : payload?.data;
                
                const control = this.controls.get(target);
                if (control) {
                    const jsEventName = name; 
                    control.emit(jsEventName, data);
                }
            }
        } catch (e) {
            console.error("Failed to process C# message:", msg, e);
        }
    }

    _processManifest(manifest) {
        manifest.forEach(item => {
            let controlInstance;
            
            // Fix: Use the correct class for the C# type
            // IMPORTANT: item.id (e.g. 'Form1', 'button1') is passed as the ONLY ID argument.
            switch (item.type) {
                case 'Button':
                    controlInstance = new Button(this, item.id);
                    break;
                case 'Label':
                    controlInstance = new Label(this, item.id);
                    break;
                // case 'Form': // form is a special occasion
                // case 'Form1':
                //     break;
                default:
                    controlInstance = new Control(this, item.id);
                    break;
            }

            // form is a special occasion
            if(item.type.includes('Form')){
                controlInstance = new Form(this, item.id);
            }
            // item.name is the friendly name used for controls.Form1, controls.button1
            this.controls.set(item.id, controlInstance);
            this.existingControlsByName[item.name] = controlInstance;
        });
    }
}


module.exports = { WinFormsSession };