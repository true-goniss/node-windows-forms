public static class Scripts
{
    public static string scriptWebsocket(int port)
    {
        return @"
            const WebSocketServer = require(`ws`);
            const wss = new WebSocketServer.Server({ port: " + port + @" });

            const clients = new Set();

            wss.on(`connection`,  (ws, request)  => {

            clients.add(ws);

            console.log(`form connected`);
            socket = ws;
            ws.send(`Welcome, you are connected!`);
            ws.on(`message`, data => {

                if ( data.toString().includes(`nwfEventEmit`) ){

                    {{eventEmittersJS}}

                }

            });

            ws.on(`close`, () => {
                console.log(`form has disconnected`);
            });

            ws.onerror = function()
            {
                console.log(`Some Error occurred`);
            }
            });
            console.log(`The WebSocket server is running`);

            async function setStringVariable(name, value){

                return new Promise((resolve, reject) => {

                    try {
                        clients.forEach((client) => {

                            client.send(`nwfSetStrVarName:` + name + `nwfSetStrVarVal:` + value, () => { });
                            resolve(true);
                        });

                    }
                    catch(ee){ reject(new Error('WebSocket connection is not open')); }

                });
            }

            async function getStringVariable(name) {

            return new Promise((resolve, reject) => {

                let responseReceived = false; 

                try {
                    clients.forEach((client) => {

                        client.send(`nwfGetStrVarName:` + name, (response) => {

                        });

                        client.on('message', (response) => {
                            if (responseReceived) return;

                            const responseStr = response.toString();

                            if( responseStr.includes(`nwfGetStrVarName:` + name) ){ 
                                responseReceived = true;
                                clearTimeout(timeout);
                                resolve(responseStr.split('nwfGetStrVarVal:')[1]);
                            }
                        });

                        const timeout = setTimeout(() => {
                            reject(new Error(`Timeout: No response received`));
                        }, 5000);

                    });

                }
                catch(ee){ reject(new Error('WebSocket connection is not open')); }

            });
            }

            async function getControlProperty(name, property, value) {

            return new Promise((resolve, reject) => {

                let responseReceived = false; 

                try {
                    clients.forEach((client) => {

                        client.send(`getControlProperty:` + name + `.` + property, (response) => {

                        });

                        client.on('message', (response) => {
                            if (responseReceived) return;

                            const responseStr = response.toString();

                            if( responseStr.includes(property) && responseStr.includes(name) ){ 
                                responseReceived = true;
                                clearTimeout(timeout);
                                resolve(responseStr.split('nwfPropertyValue:')[1]);
                            }
                        });


                        const timeout = setTimeout(() => {
                            reject(new Error(`Timeout: No response received`));
                        }, 5000);

                    });

                }
                catch(ee){ reject(new Error('WebSocket connection is not open')); }

            });
            }

            async function Exit(){
                    clients.forEach((client) => {
                        client.send(`nwfApplicationExit`, () => {

                        });
                    });
            };

            async function invokeControlMethod(name, methodName, value) {

            return new Promise((resolve, reject) => {


                try {
                    clients.forEach((client) => {

                        client.send(`invokeControlMethod:` + name + `.` + methodName + `(` + value + `)`, (response) => {

                        });

                        client.once('message', (response) => {
                            resolve(response.toString());
                        });


                        const timeout = setTimeout(() => {
                            reject(new Error(`Timeout: No response received`));
                        }, 5000);

                        client.once('message', () => {
                            clearTimeout(timeout);
                        });
                    });

                }
                catch(ee){ reject(new Error('WebSocket connection is not open')); }

            });
            }

            async function setControlProperty(name, property, value){
    
            return new Promise((resolve, reject) => {


                try {
                    clients.forEach((client) => {

                        client.send(`setControlProperty:` + name + `.` + property + `:` + value, () => { });
                        resolve(true);
                    });

                }
                catch(ee){ reject(new Error('WebSocket connection is not open')); }

            });
            }

            //module.exports = { wss, socket, getControlProperty }; ";
    }
}