using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NodeWindowsForms.Core
{
    public class IpcHost
    {
        private readonly Dispatcher _dispatcher;
        private readonly PipeServer _pipeServer;

        // Make IpcHost a static instance so we can easily call SendEvent from anywhere
        public static IpcHost Instance { get; private set; }

        private readonly bool _isSpawnMode;
        
        public IpcHost(Form mainForm, string pipeName, bool isSpawnMode = false)
        {
            ObjectStore.RegisterStartForm(mainForm);
            _dispatcher = new Dispatcher(mainForm);
            _isSpawnMode = isSpawnMode;
            
            _pipeServer = new PipeServer(pipeName);
            _pipeServer.OnClientConnected += OnClientConnected;
            _pipeServer.OnClientDisconnected += OnClientDisconnected;
            _pipeServer.OnMessageReceived += OnMessageReceived;
            
            Instance = this;
        }

        private void OnClientDisconnected(string clientId)
        {
            if (_isSpawnMode)
            {
                // In spawn mode, if Node.js disconnects, terminate the application to prevent zombie processes.
                Environment.Exit(0); 
            }
        }

        public void StartLoop()
        {
            // The PipeServer starts its own tasks in its constructor, 
            // but we can just leave it as is.
        }

        private async void OnClientConnected(string clientId)
        {
            // Handshake
            var readyMsg = new PipeMessage
            {
                Type = MessageType.Response,
                Action = "systemReady",
                Payload = ObjectStore.GetControlManifest()
            };
            
            await _pipeServer.SendToClientAsync(clientId, readyMsg);
        }

        private async void OnMessageReceived(string clientId, PipeMessage msg)
        {
            try
            {
                // Process only Command type (1)
                if (msg.Type != MessageType.Command) return;

                JsonElement argsElement = default;
                if (msg.Payload is JsonElement je) {
                    argsElement = je;
                } else if (msg.Payload != null) {
                    argsElement = JsonSerializer.SerializeToElement(msg.Payload);
                }

                var inbound = new InboundMessage 
                {
                    Id = msg.Id,
                    Action = msg.Action,
                    TargetId = msg.TargetId,
                    Args = argsElement
                };
                
                object result = await _dispatcher.DispatchAsync(inbound);
                
                if (!string.IsNullOrEmpty(msg.Id))
                {
                    await _pipeServer.SendToClientAsync(clientId, new PipeMessage
                    {
                        Id = msg.Id,
                        Type = MessageType.Response,
                        Payload = result
                    });
                }
            }
            catch (Exception ex)
            {
                if (!string.IsNullOrEmpty(msg.Id))
                {
                    await _pipeServer.SendToClientAsync(clientId, new PipeMessage
                    {
                        Id = msg.Id,
                        Type = MessageType.Error,
                        Payload = ex.Message + " " + ex.StackTrace
                    });
                }
            }
        }

        public static void SendEvent(string targetId, string eventName, object data)
        {
            if (Instance?._pipeServer == null) return;

            var msg = new PipeMessage
            {
                Type = MessageType.Event,
                TargetId = targetId,
                Action = eventName,
                Payload = data == null ? null : JsonSerializer.SerializeToElement(data, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
            };
            
            // Broadcast to all clients (usually there's only one nodejs client)
            _ = Instance._pipeServer.SendToClientAsync("nodejs_client", msg);
        }
    }
}