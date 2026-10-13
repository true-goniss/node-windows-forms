
using System.Collections.Concurrent;
using System.Text.Json;

using static EventManager<PipeMessage>;

public class ServerSender : IDisposable
{
	private readonly PipeServer _pipeServer;
	private readonly ConcurrentDictionary<string, TaskCompletionSource<PipeMessage>> _pendingRequests = new();

	// Events for BrowserSession notification
	public event Action<string> ClientConnected;
	public event Action<string> ClientDisconnected;

	// receive any message from client
	public event Action<string, PipeMessage> OnMessage;

	// for incoming message events
	private static EventManager<PipeMessage> _eventManager = new();

	private const string OnLogReceivedLiteral = "OnLogReceived";

	// Last argument - callback for sending response.
	public event Action<string, string, object, Action<object>> OnClientCommand;

	public ServerSender(string pipeName)
	{
		_pipeServer = new PipeServer(pipeName);
		_pipeServer.OnClientConnected += (id) => ClientConnected?.Invoke(id);
		_pipeServer.OnClientDisconnected += (id) => ClientDisconnected?.Invoke(id);
		_pipeServer.OnMessageReceived += HandleMessage;
	}

	public event MyEventHandler OnLogReceived
	{
		add
		{
			_eventManager.AddEventHandler(OnLogReceivedLiteral, value);
		}
		remove
		{
			_eventManager.RemoveEventHandler(OnLogReceivedLiteral, value);
		}
	}

	/// <summary>
	/// Sends command and awaits response.
	/// </summary>
	public async Task<CommandResult<T>> SendCommandAsync<T>(string clientId, string action, object payload, int timeoutMs = 10000)
	{
		var msg = new PipeMessage
		{
			Type = MessageType.Command,
			Action = action,
			Payload = payload,
			TargetId = clientId
		};

		var tcs = new TaskCompletionSource<PipeMessage>(TaskCreationOptions.RunContinuationsAsynchronously);

		if (!_pendingRequests.TryAdd(msg.Id, tcs))
			return new CommandResult<T>(false, default, "ID Collision");

		try
		{
			// Send to transport
			bool sent = await _pipeServer.SendToClientAsync(clientId, msg);
			if (!sent)
				return new CommandResult<T>(false, default, "Transport failed (Client offline?)");

			try
			{
				var response = await tcs.Task.WaitAsync(TimeSpan.FromMilliseconds(timeoutMs));

				if (response.Type == MessageType.Error)
					return new CommandResult<T>(false, default, response.Payload?.ToString() ?? "Unknown error");

			// Deserialize result
			T resultData = default;
			if (response.Payload is JsonElement jsonEl)
				resultData = jsonEl.Deserialize<T>();
			else if (response.Payload is T tPayload)
				resultData = tPayload;

			return new CommandResult<T>(true, resultData, null);
			}
			catch (TimeoutException)
			{
				return new CommandResult<T>(false, default, PipeExceptions.SERVER_COMMAND_TIMEOUT);
			}
		}
		catch (Exception ex)
		{
			return new CommandResult<T>(false, default, ex.Message);
		}
		finally
		{
			_pendingRequests.TryRemove(msg.Id, out _);
		}
	}

	private void HandleMessage(string clientId, PipeMessage msg)
	{
		// Response to command
		if ((msg.Type == MessageType.Response || msg.Type == MessageType.Error) &&
			!string.IsNullOrEmpty(msg.CorrelationId))
		{
			if (_pendingRequests.TryGetValue(msg.CorrelationId, out var tcs))
			{
				tcs.TrySetResult(msg);
			}

			return;
		}

		// Handle Client-initiated command
		if (msg.Type == MessageType.Command)
		{
			// Function subscriber invokes to send response
			Action<object> sendResponse = (result) =>
			{
				Task.Run(async () =>
				{
					try
					{
						var responseMsg = new PipeMessage
						{
							Type = MessageType.Response,
							CorrelationId = msg.Id, // Client request ID
							TargetId = clientId,
							Payload = result
						};
						await _pipeServer.SendToClientAsync(clientId, responseMsg);
					}
					catch (Exception ex)
					{
						// Error sending response
					}
				});
			};

			// Invoke event for subscribers with data and sendResponse callback
			OnClientCommand?.Invoke(clientId, msg.Action, msg.Payload, sendResponse);

			return;
		}

		// Handle logs and events
		msg.Tag = clientId;
		if (msg.Action == PipeActions.Log)
		{
			_eventManager.TriggerEvents(OnLogReceivedLiteral, msg);
		}

		OnMessage?.Invoke(clientId, msg);
	}



	public void Dispose()
	{
		_pipeServer.Stop();
	}
}
