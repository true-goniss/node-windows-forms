/*

 (с) gon_iss  2o24

 */

using System.Text;
using System.Reflection;

using static Utils;
using static FileSystemFuncs;
using static CsharpEventHandlers;

static class NodeControls
{
    static int socketPort = 1000;

    static string script = "`use strict`;" + newLineDouble();
    static string eventEmittersJS = "";
    static string usedNames = "";

    static Dictionary<string, Control> controls;
    static Dictionary<string, string> stringVariables = new Dictionary<string, string>();

    static WebsocketClient client;

    public static async void Generate(Form form, string tag, string outputPath)
    {
        controls = TraverseSubControlsWithTag(form, tag);

        script = "`use strict`;" + newLineDouble();
        eventEmittersJS = "";
        usedNames = "";

        string socketPortFilePath = Path.Combine(outputPath, "tmp", "socketPort.dat");
        socketPort = await FileSystemFuncs.FileReadInt(socketPortFilePath);
        
        if(socketPort == 0)
        {
            socketPort = FindFreePort();
        }

        FileSystemFuncs.FileWriteInt(socketPortFilePath, socketPort);

        if (client == null || client.isInactive())
        {
            initializeWebsocket(socketPort);
        }

        script += scriptWebsocket(socketPort) + newLineDouble();

        script += "const { TextBox, Button, Label, RadioButton, CheckBox, NumericUpDown, TabControl, Panel, TabPage, GroupBox, TrackBar, Form } = require(`./controls`);" + newLineDouble();
        script += "const { exec } = require('child_process');" + Environment.NewLine;
        script += "const ExecutablePath = `" + Path.GetFullPath(Application.ExecutablePath).Replace(@"\", @"\\").Replace(@"/", @"\\") + "`;" + Environment.NewLine;

        script += "const Run = () => { try { ";
        script += "const childProcess = exec(ExecutablePath); ";
        script += "childProcess.on('exit', (code) => { process.exit(code); }); ";
        script += "process.on('exit', (code) => { Exit(); }); ";
        script += "process.on('SIGINT', (code) => { Exit(); }); ";
        script += "process.on('SIGHUP', (code) => { Exit(); }); ";
        script += "process.on('SIGTERM', (code) => { Exit(); }); } catch(err) {} }; " + newLineDouble();

        usedNames += "Run," + Environment.NewLine;

        script += "let variables = [];" + Environment.NewLine;

        controls.Add(form.Name, form);

        foreach (Control control in controls.Values)
        {
            bool includedControl = false;

            eventEmittersJS += tabSeveralTimesString(2) + "if(data.toString().includes(`" + control.Name + "`)) { " + newLineDouble();

            if(control is Form)
            {
                DefineJS_Control(control, "Form");
                includedControl = true;
            }

            if (control is GroupBox)
            {
                DefineJS_Control(control, "GroupBox");
                includedControl = true;
            }

            if (control is TrackBar)
            {
                DefineJS_Control(control, "TrackBar");

                LinkJS_Event(control, "ValueChanged");
                LinkJS_Event(control, "Scroll");
                LinkJS_Event(control, "RightToLeftLayoutChanged");
                LinkJS_Event(control, "SystemColorsChanged");

                includedControl = true;
            }

            if (control is TabControl)
            {
                DefineJS_Control(control, "TabControl");
                includedControl = true;
            }
            
            if (control is Panel && !(control is TabPage))
            {
                DefineJS_Control(control, "Panel");
                includedControl = true;
            }

            if (control is TabPage)
            {
                TabPage tabPage = (TabPage)control;

                DefineJS_Control(control, "TabPage");
                includedControl = true;
            }

            if (control is System.Windows.Forms.Label)
            {
                DefineJS_Control(control, "Label");
                includedControl = true;
            }

            if (control is CheckBox)
            {

                DefineJS_Control(control, "CheckBox");

                LinkJS_Event(control, "CheckedChanged");
                includedControl = true;
            }

            if (control is RadioButton)
            {
                DefineJS_Control(control, "RadioButton");

                LinkJS_Event(control, "CheckedChanged");
                includedControl = true;
            }

            if (control is TextBox)
            {
                DefineJS_Control(control, "TextBox");
                includedControl = true;
            }

            if (control is NumericUpDown)
            {
                DefineJS_Control(control, "NumericUpDown");

                LinkJS_Event(control, "ValueChanged");
                includedControl = true;
            }

            if (control is Button)
            {
                DefineJS_Control(control, "Button");
                includedControl = true;
            }

            if (includedControl) LinkControlJSCommonEvents(control);

            eventEmittersJS += tabSeveralTimesString(2) + "return; " +  newLineDouble() + tabSeveralTimesString(2) + "}" + newLineDouble();
        }

        //AddJS_ControlsIterator();

        usedNames += "getControlProperty," + Environment.NewLine;
        usedNames += "setStringVariable," + Environment.NewLine;
        usedNames += "getStringVariable," + Environment.NewLine;


        usedNames = DeleteLastSymbol(usedNames, ',');

        script += Environment.NewLine + "module.exports = {" + newLineDouble();
        script += usedNames + Environment.NewLine + "};";

        script = script.Replace("{{eventEmittersJS}}", eventEmittersJS);

        bool accessSuccess = false;

        try
        {
            int tries = 1;
            do
            {
                try
                {
                    WriteTextToFile(Path.Combine(outputPath, "form.js"), script, Encoding.UTF8);
                    accessSuccess = true;
                }
                catch (Exception ee2)
                {
                    tries++; await Task.Delay(1000);
                }
            }
            while (!accessSuccess && tries <= 5);
        }
        catch (Exception ee)
        {
            MessageBox.Show("NodeControls: error while saving");
        }

        //if(accessSuccess) MessageBox.Show("NodeControls: nodejs script of controls saved"); 

        //CsharpEventHandlers.delegatesRunnerGenerated
        //CsharpEventHandlers.delegatesGenerated
    }

    public static void SendToSocket(string message)
    {
        client.Send(message);
    }

    public static bool setStringVariable(string variableName, string value)
    {
        try
        {
            if (stringVariables.ContainsKey(variableName))
            {
                stringVariables[variableName] = value;
            }
            else
            {
                stringVariables.Add(variableName, value);
            }
        }
        catch (Exception)
        {
            return false;
        }

        return true;
    }

    public static string getStringVariable(string variableName)
    {
        if (stringVariables.ContainsKey(variableName)) return stringVariables[variableName];

        return "null";
    }

    static string generatedJsControlClassEvents = ""; // i use this string to generate JS event names and then paste them into controls class manually

    static string[] commonEventNames = {
        "AutoSizeChanged",
        "BackColorChanged",
        "BackgroundImageChanged",
        "BackgroundImageLayoutChanged",
        "BindingContextChanged",
        "CausesValidationChanged",
        "ChangeUICues",
        "Click",
        "ClientSizeChanged",
        "ContextMenuStripChanged",
        "ControlAdded",
        "ControlRemoved",
        "CreateControl",
        "CursorChanged",
        "DockChanged",
        "DoubleClick",
        "DpiChangedAfterParent",
        "DpiChangedBeforeParent",
        "DragDrop",
        "DragEnter",
        "DragLeave",
        "DragOver",
        "EnabledChanged",
        "Enter",
        "FontChanged",
        "ForeColorChanged",
        "GiveFeedback",
        "GotFocus",
        "HandleCreated",
        "HandleDestroyed",
        "HelpRequested",
        "ImeModeChanged",
        "Invalidated",
        "KeyDown",
        "KeyPress",
        "KeyUp",
        "Layout",
        "Leave",
        "LocationChanged",
        "LostFocus",
        "MarginChanged",
        "MouseCaptureChanged",
        "MouseClick",
        "MouseDoubleClick",
        "MouseDown",
        "MouseEnter",
        "MouseHover",
        "MouseLeave",
        "MouseMove",
        "MouseUp",
        "MouseWheel",
        "Move",
        //"NotifyMessage",
        "PaddingChanged",
        "Paint",
        "PaintBackground",
        "ParentBackColorChanged",
        "ParentBackgroundImageChanged",
        "ParentBindingContextChanged",
        "ParentChanged",
        "ParentCursorChanged",
        "ParentEnabledChanged",
        "ParentFontChanged",
        "ParentForeColorChanged",
        "ParentRightToLeftChanged",
        "ParentVisibleChanged",
        "PreviewKeyDown",
        "Print",
        "QueryContinueDrag",
        "RegionChanged",
        "Resize",
        "RightToLeftChanged",
        "SizeChanged",
        "StyleChanged",
        "SystemColorsChanged",
        "TabIndexChanged",
        "TabStopChanged",
        "TextChanged",
        "Validated",
        "Validating",
        "VisibleChanged"
    };

    static void LinkControlJSCommonEvents(Control control)
    {
        foreach (var eventName in commonEventNames)
        {

            bool cont = generatedJsControlClassEvents.Contains("'" + eventName + "'");
            if (!cont)
            {

                    generatedJsControlClassEvents += @"    On" + eventName + @"(handler){
                    this._AddEventHandler('" + eventName + @"', handler);
                }

                _" + eventName + @"(eventArgs){
                    this._FireEvent('" + eventName + @"', eventArgs);
                }" + newLineDouble();
            }

            LinkJS_Event(control, eventName);
        }

    }

    static int FindFreePort()
    {
        System.Net.Sockets.TcpListener listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();
        int port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    static void DefineJS_Control(Control control, string classname)
    {
        if (control is TabPage)
        {
            script += control.Parent.Name + "." + control.Name + " = new " + classname + "(`" + control.Name + "`,`" + control.Text + "`, async (name, property) => { return await getControlProperty(`" + control.Name + "`, property); }, async (name, property, value) => { return await setControlProperty(`" + control.Name + "`, property, value" + "); }, async (name, methodName, value) => { return await invokeControlMethod(`" + control.Name + "`, methodName, value) }); " + newLineDouble();
        }
        else
        {
            script += "const " + control.Name + " = new " + classname + "(`" + control.Name + "`,`" + control.Text + "`, async (name, property) => { return await getControlProperty(`" + control.Name + "`, property); }, async (name, property, value) => { return await setControlProperty(`" + control.Name + "`, property, value" + "); }, async (name, methodName, value) => { return await invokeControlMethod(`" + control.Name + "`, methodName, value) }); " + newLineDouble();
            usedNames += control.Name + "," + Environment.NewLine;
        }
    }

    static void LinkJS_Event(Control control, string eventName)
    {
        try
        {
            string fullEventName = CsharpEventHandlers.GetEventName(control, eventName);

            CsharpEventHandlers.CreateAndAttachDynamicEventHandler(control, eventName);

            if (fullEventName != null)
            {

                if(control is TabPage)
                {
                    eventEmittersJS += tabSeveralTimesString(3) + "if (data.toString().includes(`" + fullEventName + "`)){ " + control.Parent.Name + "." + control.Name + "._" + eventName + "(JSON.parse(data.toString().split('nwfEventArgs:')[1])); return; }" + newLineDouble();
                }
                else
                {
                    eventEmittersJS += tabSeveralTimesString(3) + "if (data.toString().includes(`" + fullEventName + "`)){ " + control.Name + "._" + eventName + "(JSON.parse(data.toString().split('nwfEventArgs:')[1])); return; }" + newLineDouble();
                }
                //script += "function " + fullEventName + "() { }" + newLineDouble() + control.Name + ".On" + eventName + "(" + fullEventName + ");" + newLineDouble();
                //usedNames += fullEventName.ToString() + "," + newLineDouble();
            }
        }
        catch (Exception addingEx) { }
    }


    public static void ReconnectSocketOnDisconnect()
    {
        if (client.isInactive())
        {
            initializeWebsocket(socketPort);
        }
    }

    static void initializeWebsocket(int port, string ip = "localhost")
    {
        client = new WebsocketClient(ip, port);
        client.OnMessage += websocket_MessageReceived;
    }

    static string scriptWebsocket(int port)
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

        //console.log(`form has sent us: ${data}`);
    if ( data.toString().includes(`nwfEventEmit`) ){

{{eventEmittersJS}}

    }

});

ws.on(`close`, () => {
    console.log(`form has disconnected`);
});

ws.onerror = function()
{
    console.log(`Some Error occurred`)
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





    static async void websocket_MessageReceived(string message)
    {

        if (message == "nwfApplicationExit") Environment.Exit(0);

        try
        {

            Console.WriteLine(message);

            if (message.Contains("invokeControlMethod:"))
            {
                string str = message.Split("invokeControlMethod:")[1];
                string controlName = str.Split('.')[0];
                string methodName = str.Split('.')[1].Split("(")[0];
                string value = str.Split('.')[1].Split('(')[1].Split(')')[0];



                if (controls.TryGetValue(controlName, out Control control))
                {
                    Type controlType = control.GetType();
                    MethodInfo methodInfo = controlType.GetMethod(methodName);

                    if (value == "" || value == "null")
                    {
                        control.Invoke((MethodInvoker)delegate
                        {
                            object returnValue = methodInfo.Invoke(control, null);
                            client.Send(returnValue.ToString());
                        });
                    }

                    if(controlType.Name == "TextBox" && methodName == "AppendText")
                    {
                        control.Invoke((MethodInvoker)delegate
                        {
                            object returnValue = methodInfo.Invoke(control, new string[] { value });
                        });
                    }
                }
            }

            if (message.Contains("getControlProperty:"))
            {
                string controlName = message.Split("getControlProperty:")[1].Split(".")[0];
                string propertyName = message.Split("getControlProperty:")[1].Split(".")[1];

                if (controls.TryGetValue(controlName, out Control control))
                {
                    var property = control.GetType().GetProperty(propertyName);
                    if (property != null)
                    {
                        string propertyValue = "";

                        if (property.PropertyType.IsEnum)
                        {
                            control.Invoke((MethodInvoker)delegate
                            {
                                object enumValue = property.GetValue(control);

                                Type underlyingType = Enum.GetUnderlyingType(property.PropertyType);

                                if (enumValue.GetType() != underlyingType)
                                {
                                    enumValue = Convert.ChangeType(enumValue, underlyingType);
                                }

                                propertyValue = enumValue.ToString();
                                client.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                            });
                        }
                        else if (propertyName == "Size")
                        {
                            control.Invoke((MethodInvoker)delegate
                            {
                                Size size = (Size)property.GetValue(control);
                                propertyValue = "{ \"width\": " + size.Width + ", \"height\": " + size.Height + " }";
                                client.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                            });
                        }
                        else if (property.PropertyType.Name == "Point")
                        {
                            control.Invoke((MethodInvoker)delegate
                            {
                                Point point = (Point)property.GetValue(control);
                                propertyValue = "{ \"x\": " + point.X + ", \"y\": " + point.Y + ", \"isEmpty\": " + point.IsEmpty.ToString().ToLower() + " }";
                                client.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                            });
                        }
                        else if (property.PropertyType.Name == "Color")
                        {
                            control.Invoke((MethodInvoker)delegate
                            {
                                Color color = (Color)property.GetValue(control);
                                propertyValue = "{ \"a\": " + color.A + ", \"r\": " + color.R + ", \"g\": " + color.G + ", \"b\": " + color.B + " }";
                                client.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                            });
                        }
                        else
                        {
                            control.Invoke((MethodInvoker)delegate
                            {
                                propertyValue = property.GetValue(control).ToString();
                            });

                            client.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                        }

                    }
                    else
                    {
                        client.Send("Property not found");
                    }
                }
                else
                {
                    client.Send("Control not found");
                }
            }

            if (message.Contains("setControlProperty:"))
            {
                string controlName = message.Split("setControlProperty:")[1].Split(".")[0];
                string propertyName = message.Split(":")[1].Split(".")[1];

                if (controls.TryGetValue(controlName, out Control control))
                {
                    var property = control.GetType().GetProperty(propertyName);
                    if (property == null) { client.Send("Property not found"); return; }
                    object convertedValue = null;

                    string propertyValue = message.Split(':')[2];

                    if (property.PropertyType.IsEnum)
                    {
                        convertedValue = Enum.Parse(property.PropertyType, propertyValue);
                    }
                    else if (property.PropertyType.Name == "Decimal")
                    {
                        System.Globalization.CultureInfo culture = System.Globalization.CultureInfo.InvariantCulture;
                        decimal number = decimal.Parse(propertyValue.Replace(",", culture.NumberFormat.NumberDecimalSeparator), culture);
                        convertedValue = number;
                    }
                    else if (property.PropertyType.Name == "Point")
                    {
                        string splitted = message.Split("x:")[1];
                        string x = splitted.Split("y:")[0];
                        string y = splitted.Split("y:")[1];
                        Point point = new Point(Convert.ToInt32(x), Convert.ToInt32(y));
                        convertedValue = point;
                    }
                    else if (property.PropertyType.Name == "Color")
                    {
                        string splitted = message.Split("a:")[1];
                        string a = splitted.Split("r:")[0];
                        string r = splitted.Split("r:")[1].Split("g:")[0];
                        string g = splitted.Split("g:")[1].Split("b:")[0];
                        string b = splitted.Split("b:")[1];
                        Color color = Color.FromArgb(Convert.ToInt32(a), Convert.ToInt32(r), Convert.ToInt32(g), Convert.ToInt32(b));
                        convertedValue = color;
                    }
                    else if (propertyName == "Size")
                    {
                        string splitted = message.Split("w:")[1];
                        string width = splitted.Split("h:")[0];
                        string height = splitted.Split("h:")[1];

                        Size size = new Size(Convert.ToInt32(width), Convert.ToInt32(height));
                        convertedValue = size;
                    }
                    else
                    {
                        convertedValue = Convert.ChangeType(propertyValue, property.PropertyType);
                    }

                    control.Invoke((MethodInvoker)delegate
                    {
                        // Convert propertyValue to the appropriate type if needed
                        property.SetValue(control, convertedValue);
                    });
                }
                else
                {
                    client.Send("Control not found");
                }
            }

            if (message.Contains("nwfGetStrVarName:"))
            {
                string varName = message.Split("nwfGetStrVarName:")[1].Split("nwfGetStrVarVal:")[0];

                client.Send("nwfGetStrVarName:"+ varName + "nwfGetStrVarVal:" + getStringVariable(varName));
            }

            if (message.Contains("nwfSetStrVarName:"))
            {
                string varName = message.Split("nwfSetStrVarName:")[1].Split("nwfSetStrVarVal:")[0];
                string varVal = message.Split("nwfSetStrVarVal:")[1];

                setStringVariable(varName, varVal);
            }
        }
        catch (Exception ee)
        {
            string h = "";
        }


    }
}