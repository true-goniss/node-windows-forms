using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using static EventManager<string>;

public class WebsocketClient
{
    private ClientWebSocket websocket = null;
    private string _uri;
    private DateTime lastMessageTime;
    private System.Timers.Timer reconnectTimer = null;
    private EventManager<string> _eventManager = new();

    public WebsocketClient(string ip, int port)
    {
        _uri = "ws://" + ip + ":" + port + "/";
        ConnectAsync();
    }

    private async void ConnectAsync()
    {
        try
        {
            websocket = new ClientWebSocket();
            await websocket.ConnectAsync(new Uri(_uri), CancellationToken.None);
            lastMessageTime = DateTime.Now;
            _ = ReceiveLoop();
        }
        catch
        {
            HandleClose();
        }
    }

    private async Task ReceiveLoop()
    {
        var buffer = new byte[8192];
        try
        {
            while (websocket.State == WebSocketState.Open)
            {
                var result = await websocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await websocket.CloseAsync(WebSocketCloseStatus.NormalClosure, string.Empty, CancellationToken.None);
                    HandleClose();
                    break;
                }
                
                string message = Encoding.UTF8.GetString(buffer, 0, result.Count).Trim();
                _eventManager.TriggerEvents("OnMessage", message);
            }
        }
        catch
        {
            HandleClose();
        }
    }

    private void HandleClose()
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

    private void ReconnectTimer_Elapsed(object? sender, System.Timers.ElapsedEventArgs e)
    {
        if (websocket != null && (websocket.State == WebSocketState.Connecting || websocket.State == WebSocketState.Open)) return;
        ConnectAsync();
    }

    public void Send(string message)
    {
        if (websocket != null && websocket.State == WebSocketState.Open)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            websocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None).Wait();
        }
    }

    public event MyEventHandler OnMessage
    {
        add { _eventManager.AddEventHandler("OnMessage", value); }
        remove { _eventManager.RemoveEventHandler("OnMessage", value); }
    }

    public event MyEventHandler OnClosed
    {
        add { _eventManager.AddEventHandler("OnClosed", value); }
        remove { _eventManager.RemoveEventHandler("OnClosed", value); }
    }

    public bool isInactive()
    {
        return websocket == null || (websocket.State != WebSocketState.Open && websocket.State != WebSocketState.Connecting);
    }
}