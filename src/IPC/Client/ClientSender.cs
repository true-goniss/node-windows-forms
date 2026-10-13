
using System.Collections.Concurrent;
using System.Text.Json;

using static Shared.Utils;
public class ClientSender : IDisposable
{
	private readonly PipeClient _pipeClient;

	// External command handler
	// Func<Action, Payload, Task<Result>>
	public Func<string, object, Task<object>> CommandHandler { get; set; }
	private readonly CancellationTokenSource _cts = new CancellationTokenSource();

	// For client-to-server requests
	private readonly ConcurrentDictionary<string, TaskCompletionSource<PipeMessage>> _pendingRequests = new();

	public ClientSender(string pipeName, string myClientId)
	{
		_pipeClient = new PipeClient(pipeName, myClientId);
		_pipeClient.OnMessageReceived += HandleIncomingMessage;

		// Heartbeat
		var token = _cts.Token;
		Task.Run(async () => {
			try
			{
				// while not Disposed
				while (!token.IsCancellationRequested)
				{
					await Task.Delay(2000, token);
					_pipeClient.SendEvent(PipeActions.Heartbeat, null);
				}
			}
			catch (OperationCanceledException) { }
		}, token);
	}

	// --- Command from client to server ---
	public async Task<CommandResult<T>> SendCommandAsync<T>(string action, object payload, int timeoutMs = 10000)
	{
		var msg = new PipeMessage
		{
			Type = MessageType.Command,
			Action = action,
			Payload = payload
		};

		var tcs = new TaskCompletionSource<PipeMessage>(TaskCreationOptions.RunContinuationsAsynchronously);

		if (!_pendingRequests.TryAdd(msg.Id, tcs))
			return new CommandResult<T>(false, default, "ID Collision");

		try
		{
			_pipeClient.Send(msg);

			try
			{
				var response = await tcs.Task.WaitAsync(TimeSpan.FromMilliseconds(timeoutMs));

				if (response.Type == MessageType.Error)
					return new CommandResult<T>(false, default, response.Payload?.ToString() ?? "Unknown error");

				T resultData = default;
				if (response.Payload is JsonElement jsonEl)
					resultData = jsonEl.Deserialize<T>();
				else if (response.Payload is T tPayload)
					resultData = tPayload;

				return new CommandResult<T>(true, resultData, null);
			}
			catch (TimeoutException)
			{
				return new CommandResult<T>(false, default, "Timeout waiting for response from server");
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

	private void HandleIncomingMessage(PipeMessage msg)
	{
		// Server response to client command
		if ((msg.Type == MessageType.Response || msg.Type == MessageType.Error) && !string.IsNullOrEmpty(msg.CorrelationId))
		{
			if (_pendingRequests.TryGetValue(msg.CorrelationId, out var tcs))
			{
				tcs.TrySetResult(msg);
			}
			return;
		}


		// Command from server to client
		if (msg.Type == MessageType.Command)
		{
			Task.Run(async () =>
			{
				try
				{
					if (CommandHandler == null)
						throw new InvalidOperationException("Handler not set");

					// Invoke handler logic
					var result = await CommandHandler(msg.Action, msg.Payload);

					_pipeClient.SendResponse(msg.Id, result);
				}
				catch (Exception ex)
				{
					var err = new PipeMessage
					{
						Type = MessageType.Error,
						Action = null,
						CorrelationId = msg.Id,
						Payload = ExceptionWithStackTrace(ex)
					};

					_pipeClient.Send(err);
				}
			});
		}
	}

	public void SendEvent(string action, object payload)
	{
		_pipeClient.SendEvent(action, payload);
	}

	public void Dispose()
	{
		_cts.Cancel(); // stop Heartbeat
		_cts.Dispose();
		_pipeClient.Dispose();
	}
}

