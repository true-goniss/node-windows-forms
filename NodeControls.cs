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

    public static async void Generate(Form form, string tag, string outputPath)
    {
        controls = TraverseSubControlsWithTag(form, "null");

        string script = "`use strict`;" + newLineDouble();

        socketPort = 12000;

        if (websocket == null)
        {
            initializeWebsocket(socketPort);
        }

        script += scriptWebsocket(socketPort) + newLineDouble();

        script += "const { TextBox, Button } = require(`./controls`);" + newLineDouble();

        string eventsEmitClick = "";
        string eventsEmitTextBoxTextChanged = "";

        string usedNames = "";

        foreach (Control control in controls.Values)
        {
            if (control is CheckBox)
            {
                    CheckBox checkbox = control as CheckBox;
            }

            if (control is RadioButton)
            {
                    RadioButton radiobutton = control as RadioButton;
            }

            if (control is TextBox)
            {
                TextBox textbox = control as TextBox;

                if (!addedTextboxTextChangedEventNames.Contains(textbox.Name))
                {
                    textbox.TextChanged += TextBox_TextChanged;
                }

                string eventName = GetEventName(textbox, "TextChanged");
                if (eventName != null)
                {
                    script += "function " + eventName + "() { }" + newLineDouble();
                    script += "const " + textbox.Name + " = new TextBox(`" + control.Name + "`,`" + control.Text + "`, async (name, property) => { return await getControlProperty(`" + control.Name + "`, property); }, async (name, property) => { return await setControlProperty(`" + control.Name + "`, property, " + control.Name + "._text" + "); }); " + newLineDouble();
                    //script += textbox.Name + "." + "setTextCallback = ;" + newLineDouble();

                    script += textbox.Name + ".OnTextChanged(" + eventName + ");" + newLineDouble();

                    eventsEmitTextBoxTextChanged += "if (data.includes(`" + eventName + "`)) { " + textbox.Name + ".TextChanged(); " + textbox.Name + ".formTextChanged = true;" + " }" + newLineDouble();

                    usedNames += eventName.ToString() + "," + newLineDouble();
                }
                //eventEmitTextBoxTextChanged


                usedNames += textbox.Name + "," + Environment.NewLine;
            }

            if (control is NumericUpDown)
            {
                    NumericUpDown numericupdown = control as NumericUpDown;
            }

            if (control is Button)
            {
                Button button = control as Button;

                if(!addedButtonClickEventNames.Contains(button.Name))
                {
                    addedButtonClickEventNames += button.Name + ";";
                    button.Click += Button_Click;
                }

                string click = GetEventName(button, "Click");
                if(click != null)
                {
                    script += "function " + click + "() { }" + newLineDouble();
                    script += "const " + button.Name + " = new Button(`" + control.Name + "`,`" + control.Text + "`, async (name, property) => { return await getControlProperty(`" + control.Name + "`, property); }, async (name, property) => { return await setControlProperty(`" + control.Name + "`, property, " + control.Name + "._text" + "); });" + newLineDouble();
                    script += button.Name + ".OnClick(" + click + ");" + newLineDouble();

                    eventsEmitClick += "if (data.includes(`" + click + "`))" + button.Name + ".Click();" + newLineDouble();

                    usedNames += click.ToString() + "," + newLineDouble();
                }

                usedNames += button.Name + "," + newLineDouble();
            }
        }

        usedNames += "getControlProperty,";

        usedNames = DeleteLastSymbol(usedNames, ',');

        script += Environment.NewLine + "module.exports = {" + newLineDouble();
        script += usedNames + Environment.NewLine + "};";

        script = script.Replace("{{eventsEmitClick}}", eventsEmitClick);

        script = script.Replace("{{eventsEmitTextBoxTextChanged}}", eventsEmitTextBoxTextChanged);

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
                catch(Exception ee2) { 
                    tries++; await Task.Delay(1000); }
            } 
            while (!accessSuccess && tries <= 5);
        }
        catch(Exception ee) { 
            MessageBox.Show("NodeControls: error while saving"); }

        //if(accessSuccess) MessageBox.Show("NodeControls: nodejs script of controls saved"); 
    }

    static string addedButtonClickEventNames = "";
    static string addedTextboxTextChangedEventNames = "";

    private static void Button_Click(object? sender, EventArgs e)
    {
        string eventName = GetEventName(sender as Control, "Click");

        if (websocket == null || (websocket.State != WebSocketState.Open && websocket.State != WebSocketState.Connecting))
        {
            initializeWebsocket(socketPort);
        }

        websocket.Send( "eventEmitClick: " + eventName );
    }

    private static void TextBox_TextChanged(object? sender, EventArgs e)
    {
        Control txtBox = sender as Control;
        string eventName = GetEventName(txtBox, "TextChanged");

        if (websocket == null || (websocket.State != WebSocketState.Open && websocket.State != WebSocketState.Connecting))
        {
            initializeWebsocket(socketPort);
        }

        websocket.Send("eventEmitTextBoxTextChanged: " + eventName);
    }

    static string scriptWebsocket(int port)
    {
        return @"
const WebSocketServer = require(`ws`);
const wss = new WebSocketServer.Server({ port: " + port + @" });

const clients = new Set();

wss.on(`connection`,  (ws, request)  => {

clients.add(ws);

console.log(`new client connected`);
        socket = ws;
        ws.send(`Welcome, you are connected!`);
        ws.on(`message`, data => {

        //console.log(`Client has sent us: ${data}`);
        if ( data.toString().includes(`eventEmitClick`) ){

            {{eventsEmitClick}}

        }

        if ( data.toString().includes(`eventEmitTextBoxTextChanged`) ){

            {{eventsEmitTextBoxTextChanged}}

        }
});

ws.on(`close`, () => {
    console.log(`the client has connected`);
});

ws.onerror = function()
{
    console.log(`Some Error occurred`)
}
});
console.log(`The WebSocket server is running`);



async function getControlProperty(name, property, value) {

return new Promise((resolve, reject) => {


    try {
        clients.forEach((client) => {

            client.send(`getControlProperty:` + name + `.` + property, (response) => {

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
        websocket.Open();
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

            if (message.Contains("getControlProperty:"))
            {
                string controlName = message.Split("getControlProperty:")[1].Split(".")[0];
                string propertyName = message.Split("getControlProperty:")[1].Split(".")[1];

                if (controls.TryGetValue(controlName, out Control control))
                {
                    var property = control.GetType().GetProperty(propertyName);
                    if (property != null)
                    {
                        string propertyValue = property.GetValue(control).ToString();
                        websocket.Send(propertyValue);
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
                    if (property != null)
                    {
                        string propertyValue = message.Split(':')[2];

                        control.Invoke((MethodInvoker)delegate
                        {
                            // Convert propertyValue to the appropriate type if needed
                            object convertedValue = Convert.ChangeType(propertyValue, property.PropertyType);
                            property.SetValue(control, convertedValue);
                        });
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


            /*
            this.BeginInvoke(new Action(async () =>
            {
                label10.Text = "buysocket rcv: " + DateTime.Now.ToString("HH:mm:ss") + " sessionId " + sessionId + " currency " + accountCurrency;
            }));*/
        }
        catch (Exception ee) {
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
                controlsWithTag.Add(childCtrl.Name, childCtrl);
            }

            controlsWithTag.Concat(TraverseSubControlsWithTag(childCtrl, tag));
        }

        return controlsWithTag;
    }
}