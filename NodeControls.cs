/*

 (с) gon_iss  2o24

 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using WebSocket4Net;



static class NodeControls
{
    static int socketPort = 1000;

    static Dictionary<string, Control> controls;

    static string script = "`use strict`;" + newLineDouble();
    static string eventEmittersJS = "";
    static string eventsEmitTextBoxTextChanged = "";
    static string usedNames = "";

    public static async void Generate(Form form, string tag, string outputPath)
    {
        controls = TraverseSubControlsWithTag(form, "null");

        script = "`use strict`;" + newLineDouble();
        eventEmittersJS = "";
        eventsEmitTextBoxTextChanged = "";
        usedNames = "";

        socketPort = FindFreePort();

        if (websocket == null)
        {
            initializeWebsocket(socketPort);
        }

        script += scriptWebsocket(socketPort) + newLineDouble();

        script += "const { TextBox, Button, Label, RadioButton, CheckBox, NumericUpDown, Form } = require(`./controls`);" + newLineDouble();
        script += "let variables = [];" + Environment.NewLine;

        DefineJS_Control(form as Control, "Form");
        //LinkJS_Event(form as Control, "Click");
        
        controls.Add(form.Name, form);

        foreach (Control control in controls.Values)
        {
            if (control is PictureBox)
            {
                continue;
            }

            if (control is Label)
            {
                DefineJS_Control(control, "Label");
            }

            if (control is CheckBox)
            {

                DefineJS_Control(control, "CheckBox");

                LinkJS_Event(control, "CheckedChanged");
            }

            if (control is RadioButton)
            {
                DefineJS_Control(control, "RadioButton");

                LinkJS_Event(control, "CheckedChanged");
            }

            if (control is TextBox)
            {
                DefineJS_Control(control, "TextBox");
            }

            if (control is NumericUpDown)
            {
                DefineJS_Control(control, "NumericUpDown");

                LinkJS_Event(control, "ValueChanged");
            }

            if (control is Button)
            {
                DefineJS_Control(control, "Button");
            }

            LinkControlJSCommonEvents(control);
        }

        //AddJS_ControlsIterator();

        usedNames += "getControlProperty,";


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
    }

    static string[] commonEventNames = {
        "Click",
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
        // "OnNotifyMessage" is not added
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
        "VisibleChanged",
        "GotFocus"
    };

    public static void LinkControlJSCommonEvents(Control control)
    {
        string generatedJsControlClassEvents = ""; // i use this string to generate event names and then paste them into controls class manually

        foreach (var eventName in commonEventNames)
        {
            LinkJS_Event(control, eventName);

            generatedJsControlClassEvents += @"    On" + eventName + @"(handler){
                this._AddEventHandler('" + eventName + @"', handler);
            }

            " + eventName + @"(eventArgs){
                this._FireEvent('" + eventName + @"', eventArgs);
            }" + newLineDouble();
        }

        string h = generatedJsControlClassEvents;
    }

    public static int FindFreePort()
    {
        System.Net.Sockets.TcpListener listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();
        int port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    /*
    static void AddJS_ControlsIterator()
    {
        string returners = "";

        foreach(Control control in controls.Values)
        {
            script += "variables.push('" + control.Name + "');" + newLineDouble();
            returners += "if ( name == '" + control.Name + "') return " + control.Name + ";" + newLineDouble();
        }
        script += "function getVariable(name) {" + newLineDouble() + returners + Environment.NewLine + "}" + newLineDouble();

        script += newLineDouble() + @"
let Controls = {

    [Symbol.iterator]: function() {
        let index = 0;

        let iterator = {

            next: function() {

                if (index < variables.length) {

                    return { value: getVariable(variables[index++]), done: false };
                } else {

                    return { done: true };
                }
            }
        };
        return iterator;
    }
};
" + newLineDouble();

        usedNames += "Controls,";
    }*/

    static void DefineJS_Control(Control control, string classname)
    {
        script += "const " + control.Name + " = new " + classname + "(`" + control.Name + "`,`" + control.Text + "`, async (name, property) => { return await getControlProperty(`" + control.Name + "`, property); }, async (name, property, value) => { return await setControlProperty(`" + control.Name + "`, property, value" + "); }, async (name, methodName, value) => { return await invokeControlMethod(`" + control.Name + "`, methodName, value) }); " + newLineDouble();
        usedNames += control.Name + "," + newLineDouble();
    }

    static void LinkJS_Event(Control control, string eventName)
    {
        try
        {
            string fullEventName = GetEventName(control, eventName);

            CreateAndAttachDynamicEventHandler(control, eventName);

            if (fullEventName != null)
            {
                script += "function " + fullEventName + "() { }" + newLineDouble() + control.Name + ".On" + eventName + "(" + fullEventName + ");" + newLineDouble();
                eventEmittersJS += "if (data.toString().includes(`" + fullEventName + "`))" + control.Name + "." + eventName + "(JSON.parse(data.toString().split('nwfEventArgs:')[1]));" + newLineDouble();
                usedNames += fullEventName.ToString() + "," + newLineDouble();
            }
        }
        catch(Exception addingEx) { }
    }

    static string addedEventNames = "";
    static string addedTextboxTextChangedEventNames = "";

    private static void CreateAndAttachDynamicEventHandler(Control control, string eventName)
    {
        string fullEventName = GetEventName(control, eventName);

        if (!addedEventNames.Contains(fullEventName))
        {
            addedEventNames += fullEventName + ";";
            EventInfo eventInfo = control.GetType().GetEvent(eventName);
            if (eventInfo != null)
            {
                if (eventName == "KeyDown")
                {
                    string h = "";
                }

                eventInfo.AddEventHandler(control, DynamicEventHandler(eventName));
            }
        }
    }

    static EventHandler DynamicEventHandler(string eventName)
    {
#pragma warning disable CS8622 // Nullability of reference types in type of parameter doesn't match the target delegate (possibly because of nullability attributes).
        return delegate (object sender, EventArgs e)
        {
            ReconnectSocketOnDisconnect();
            string eventArgs = ConvertPropertiesToJson(e);
            websocket.Send("nwfEventEmit: " + (sender as Control).Name + "_" + eventName + "nwfEventArgs:" + eventArgs);
        };
#pragma warning restore CS8622 // Nullability of reference types in type of parameter doesn't match the target delegate (possibly because of nullability attributes).
    }

    static string ConvertPropertiesToJson(object obj)
    {
        StringBuilder jsonBuilder = new StringBuilder("{");
        Type type = obj.GetType();
        PropertyInfo[] properties = type.GetProperties();

        bool commaNeeded = false;

        foreach (var property in properties)
        {
            object value = property.GetValue(obj);

            if (commaNeeded) jsonBuilder.Append(",");

            jsonBuilder.AppendFormat("\"{0}\":", property.Name);

            if (value != null && property.PropertyType.Namespace != "System")
            {
                jsonBuilder.Append(ConvertPropertiesToJson(value));
            }
            else
            {
                jsonBuilder.AppendFormat("\"{0}\"", value);
            }

            commaNeeded = true;
        }

        jsonBuilder.Append("}");

        return jsonBuilder.ToString();
    }

    static void ReconnectSocketOnDisconnect()
    {
        if (websocket == null || (websocket.State != WebSocketState.Open && websocket.State != WebSocketState.Connecting))
        {
            initializeWebsocket(socketPort);
        }
    }



    private static void Control_TextChanged(object? sender, EventArgs e)
    {
        string eventName = GetEventName(sender as Control, "TextChanged");
        ReconnectSocketOnDisconnect();
        string eventArgs = ConvertPropertiesToJson(e);
        websocket.Send("nwfEventEmit: " + eventName + "nwfEventArgs:" + eventArgs);
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


    static WebSocket websocket = null;
    static void initializeWebsocket(int port)
    {
        string ip = "localhost";

        websocket = new WebSocket("ws://" + ip + ":" + port + "/");

        websocket.Opened += new EventHandler(websocket_Opened);
        websocket.MessageReceived += websocket_MessageReceived;
        websocket.Closed += Websocket_Closed;
        websocket.Open();
    }

    static System.Timers.Timer reconnectTimer = null;

    private static void Websocket_Closed(object? sender, EventArgs e)
    {
        if (reconnectTimer == null)
        {
            reconnectTimer = new System.Timers.Timer(1000);
            reconnectTimer.Elapsed += ReconnectTimer_Elapsed;
            reconnectTimer.AutoReset = true;
            reconnectTimer.Start();
        }

    }

    private static void ReconnectTimer_Elapsed(object? sender, System.Timers.ElapsedEventArgs e)
    {
        if (websocket.State == WebSocketState.Connecting || websocket.State == WebSocketState.Open) return;

        try
        {
            websocket.Open();
        }
        catch (Exception ex) { }
    }

    static DateTime lastMessageTime;

    static void websocket_Opened(object sender, EventArgs e)
    {
        lastMessageTime = DateTime.Now;
    }

    static async void websocket_MessageReceived(object sender, MessageReceivedEventArgs e)
    {
        string message = e.Message.ToString().Trim().Trim();



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
                            websocket.Send(returnValue.ToString());
                        });

                        //
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
                            object enumValue = property.GetValue(control);

                            Type underlyingType = Enum.GetUnderlyingType(property.PropertyType);

                            if (enumValue.GetType() != underlyingType)
                            {
                                enumValue = Convert.ChangeType(enumValue, underlyingType);
                            }

                            propertyValue = enumValue.ToString();
                            websocket.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                        }
                        else if (propertyName == "Size")
                        {
                            Size size = (Size)property.GetValue(control);
                            propertyValue = "{ \"width\": " + size.Width + ", \"height\": " + size.Height + " }";
                            websocket.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                        }
                        else if (property.PropertyType.Name == "Point")
                        {
                            Point point = (Point)property.GetValue(control);
                            propertyValue = "{ \"x\": " + point.X + ", \"y\": " + point.Y + ", \"isEmpty\": " + point.IsEmpty.ToString().ToLower() + " }";
                            websocket.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                        }
                        else if (property.PropertyType.Name == "Color")
                        {
                            Color color = (Color)property.GetValue(control);
                            propertyValue = "{ \"a\": " + color.A + ", \"r\": " + color.R + ", \"g\": " + color.G + ", \"b\": " + color.B + " }";
                            websocket.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                        }
                        else
                        {
                            propertyValue = property.GetValue(control).ToString();
                            websocket.Send(controlName + "." + propertyName + "nwfPropertyValue:" + propertyValue);
                        }


                    }
                    else
                    {
                        websocket.Send("Property not found");
                    }
                }
                else
                {
                    websocket.Send("Control not found");
                }
            }

            if (message.Contains("setControlProperty:"))
            {
                string controlName = message.Split("setControlProperty:")[1].Split(".")[0];
                string propertyName = message.Split(":")[1].Split(".")[1];

                if (controls.TryGetValue(controlName, out Control control))
                {
                    var property = control.GetType().GetProperty(propertyName);
                    if (property == null) { websocket.Send("Property not found"); return; }
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
                    websocket.Send("Control not found");
                }
            }


            /*
            this.BeginInvoke(new Action(async () =>
            {
                label10.Text = "buysocket rcv: " + DateTime.Now.ToString("HH:mm:ss") + " sessionId " + sessionId + " currency " + accountCurrency;
            }));*/
        }
        catch (Exception ee)
        {
            string h = "";
        }


    }

    static string GetEventName(Control control, string eventName)
    {
        EventInfo eventInfo = control.GetType().GetEvent(eventName);

        if (eventInfo != null)
        {
            return $"{control.Name}_{eventInfo.Name}";
        }
        else
        {
            return null;
        }
    }

    static string newLineDouble()
    {
        return Environment.NewLine + Environment.NewLine;
    }

    static void WriteTextToFile(string filePath, string text, Encoding encoding)
    {
        using (StreamWriter writer = new StreamWriter(filePath, false, encoding))
        {
            writer.Write(text);
        }
    }

    static string DeleteLastSymbol(string input, char symbol)
    {
        int lastIndex = input.LastIndexOf(symbol);
        if (lastIndex >= 0)
        {
            return input.Remove(lastIndex, 1);
        }
        else
        {
            return input;
        }
    }

    static Dictionary<string, Control> TraverseSubControlsWithTag(Control ctrl, string tag)
    {
        Dictionary<string, Control> controlsWithTag = new Dictionary<string, Control>();

        foreach (Control childCtrl in ctrl.Controls)
        {
            string controlTag = (childCtrl.Tag == null) ? "null" : childCtrl.Tag.ToString();

            if (controlTag == tag)
            {
                try
                {
                    controlsWithTag.Add(childCtrl.Name, childCtrl);
                }
                catch (Exception ee) { }
            }

            controlsWithTag.Concat(TraverseSubControlsWithTag(childCtrl, tag));
        }

        return controlsWithTag;
    }
}