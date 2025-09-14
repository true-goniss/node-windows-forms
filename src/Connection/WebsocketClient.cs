using WebSocket4Net;
using static EventManager<string>;

public class WebsocketClient
{
    WebSocket websocket = null;

    DateTime lastMessageTime;
    System.Timers.Timer reconnectTimer = null;

    EventManager<string> _eventManager = new();

    public WebsocketClient(string ip, int port)
    {
        this.websocket = new WebSocket("ws://" + ip + ":" + port + "/");

        websocket.Opened += new EventHandler(websocket_Opened);
        websocket.MessageReceived += websocket_MessageReceived;
        websocket.Closed += Websocket_Closed;
        websocket.Open();
    }

    void websocket_Opened(object sender, EventArgs e)
    {
        lastMessageTime = DateTime.Now;
    }

    void Websocket_Closed(object? sender, EventArgs e)
    {
        _eventManager.TriggerEvents("OnClosed", "closed");

        if (reconnectTimer == null)
        {
            reconnectTimer = new System.Timers.Timer(1000);
            reconnectTimer.Elapsed += ReconnectTimer_Elapsed;
            reconnectTimer.AutoReset = true;
            reconnectTimer.Start();
        }
    }

    void ReconnectTimer_Elapsed(object? sender, System.Timers.ElapsedEventArgs e)
    {
        if (websocket.State == WebSocketState.Connecting || websocket.State == WebSocketState.Open) return;

        try
        {
            websocket.Open();
        }
        catch (Exception ex) { }
    }

    async void websocket_MessageReceived(object sender, MessageReceivedEventArgs e)
    {
        string message = e.Message.ToString().Trim().Trim();

        _eventManager.TriggerEvents("OnMessage", message);
    }

    public void Send(string message)
    {
        websocket.Send(message);
    }

    public event MyEventHandler OnMessage
    {
        add
        {
            _eventManager.AddEventHandler("OnMessage", value);
        }
        remove
        {
            _eventManager.RemoveEventHandler("OnMessage", value);
        }
    }

    public event MyEventHandler OnClosed
    {
        add
        {
            _eventManager.AddEventHandler("OnClosed", value);
        }
        remove
        {
            _eventManager.RemoveEventHandler("OnClosed", value);
        }
    }

    public bool isInactive()
    {
        return websocket == null || 
                    (
                        websocket.State != WebSocketState.Open 
                        && websocket.State != WebSocketState.Connecting
                    );
    }
}