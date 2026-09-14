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
            while (this.buffer.length >= 4) {
                // Read 4-byte LittleEndian length
                const length = this.buffer.readInt32LE(0);
                
                // Heartbeat message
                if (length === 0) {
                    this.buffer = this.buffer.subarray(4);
                    this.emit('message', { type: 'event', action: 'Heartbeat' });
                    continue;
                }
                
                const totalLength = 4 + length;
                if (this.buffer.length < totalLength) {
                    // Not enough data yet
                    break;
                }

                // Extract payload
                const payloadBuffer = this.buffer.subarray(4, totalLength);
                this.buffer = this.buffer.subarray(totalLength);
                
                const jsonStr = payloadBuffer.toString('utf8');
                const message = JSON.parse(jsonStr);
                
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
            const header = Buffer.alloc(4);
            header.writeInt32LE(0, 0);
            this.socket.write(header);
            return;
        }

        const jsonStr = JSON.stringify(message);
        const payloadBuffer = Buffer.from(jsonStr, 'utf8');
        
        const header = Buffer.alloc(4);
        header.writeInt32LE(payloadBuffer.length, 0);
        
        this.socket.write(Buffer.concat([header, payloadBuffer]));
    }
}

module.exports = { PipeProtocol };
