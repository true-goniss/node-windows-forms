const { EventEmitter } = require('events');

class PipeProtocol extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.buffer = Buffer.alloc(0);
        this.isProcessing = false;

        this.socket.on('data', (data) => {
            this.buffer = Buffer.concat([this.buffer, data]);
            this.processBuffer();
        });
        
        this.socket.on('error', (err) => this.emit('error', err));
        this.socket.on('close', () => this.emit('close'));
    }

    processBuffer() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            while (this.buffer.length >= 8) {
                // Read 4-byte LittleEndian lengths
                const length = this.buffer.readInt32LE(0);
                const binaryLength = this.buffer.readInt32LE(4);
                
                // Heartbeat message
                if (length === 0 && binaryLength === 0) {
                    this.buffer = this.buffer.subarray(8);
                    this.emit('message', { type: 'event', action: 'Heartbeat' });
                    continue;
                }
                
                const totalLength = 8 + length + binaryLength;
                if (this.buffer.length < totalLength) {
                    // Not enough data yet
                    break;
                }

                // Extract payloads
                const jsonBuffer = this.buffer.subarray(8, 8 + length);
                let binaryBuffer = null;
                if (binaryLength > 0) {
                    binaryBuffer = this.buffer.subarray(8 + length, totalLength);
                }
                this.buffer = this.buffer.subarray(totalLength);
                
                const jsonStr = jsonBuffer.toString('utf8');
                const message = JSON.parse(jsonStr);
                if (binaryBuffer) {
                    message.binaryPayload = binaryBuffer;
                }
                
                this.emit('message', message);
            }
        } catch (err) {
            this.emit('error', err);
        } finally {
            this.isProcessing = false;
        }
    }

    send(message) {
        if (message.action === 'Heartbeat') {
            const header = Buffer.alloc(8);
            header.writeInt32LE(0, 0);
            header.writeInt32LE(0, 4);
            this.socket.write(header);
            return;
        }

        const binaryPayload = message.binaryPayload;
        const binaryLen = binaryPayload ? binaryPayload.length : 0;
        
        // Remove binaryPayload from message to avoid large JSON serialization
        const oldBinaryPayload = message.binaryPayload;
        delete message.binaryPayload; 
        
        const jsonStr = JSON.stringify(message);
        const payloadBuffer = Buffer.from(jsonStr, 'utf8');
        
        if (oldBinaryPayload) message.binaryPayload = oldBinaryPayload;
        
        const header = Buffer.alloc(8);
        header.writeInt32LE(payloadBuffer.length, 0);
        header.writeInt32LE(binaryLen, 4);
        
        const buffers = [header, payloadBuffer];
        if (binaryLen > 0) buffers.push(binaryPayload);
        
        this.socket.write(Buffer.concat(buffers));
    }
}

module.exports = { PipeProtocol };
