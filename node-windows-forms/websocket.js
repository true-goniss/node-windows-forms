
'use strict';

const WebSocketServer = require('ws');

const wss = new WebSocketServer.Server({ port: 12000 });
const clients = new Set();

wss.on('connection', (ws, request) => {
    clients.add(ws);

    console.log('New client connected');

    ws.send('Welcome, you are connected!');

    ws.on('message', (data) => {
        console.log(`Client has sent us: ${data}`);
        // Handle client messages here
    });

    ws.on('close', () => {
        console.log('The client has disconnected');
        clients.delete(ws);
    });

    ws.onerror = function() {
        console.log('Some error occurred');
    };
});

console.log('The WebSocket server is running');

module.exports = {
    clients
};