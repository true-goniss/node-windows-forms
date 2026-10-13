using System.Collections.Concurrent;
using System.IO.Pipes;
using System.Runtime.InteropServices.ObjectiveC;

public class PipeClient : IDisposable
{
	private readonly string _pipeName;
	private readonly string _myClientId;
	private readonly CancellationTokenSource _globalCts = new();

	// Thread-safe Producer-Consumer blocking queue. Messages accumulate here when offline.
	private readonly BlockingCollection<PipeMessage> _sendQueue = new();

	public event Action<PipeMessage> OnMessageReceived;
	public event Action<bool> OnConnectionStatusChanged;

	public PipeClient(string pipeName, string clientId)
	{
		_pipeName = pipeName;
		_myClientId = clientId;

		// Start unified lifecycle loop
		Task.Run(LifeCycleLoop);
	}

	/// <summary>
	/// Main loop controlling connection, handshake, and reconnect logic.
	/// </summary>
	private async Task LifeCycleLoop()
	{
		while (!_globalCts.IsCancellationRequested)
		{
			NamedPipeClientStream client = null;
			try
			{
				// 1. Connection attempt
				client = new NamedPipeClientStream(".", _pipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
				await client.ConnectAsync(2000, _globalCts.Token); // 2 sec connection timeout

				// 2. Handshake (synchronous within task, performed first)
				var handshakeMsg = new PipeMessage
				{
					Type = MessageType.Register,
					TargetId = _myClientId // Send client ID to server
				};

				// Send directly bypassing queue to guarantee order
				await PipeProtocol.SendAsync(client, handshakeMsg, _globalCts.Token);

				// Connected and registered
				OnConnectionStatusChanged?.Invoke(true);
				Console.WriteLine($"[Client {_myClientId}] Connected and Registered.");

				// 3. Start read and write loops concurrently
				// Use CTS linked to this specific connection
				using var connectionCts = CancellationTokenSource.CreateLinkedTokenSource(_globalCts.Token);

				var readTask = ProcessReadLoop(client, connectionCts.Token);
				var writeTask = ProcessWriteLoop(client, connectionCts.Token);

				// Wait until either task fails (read or write error)
				await Task.WhenAny(readTask, writeTask);

				// Cancel second task if first fails
				connectionCts.Cancel();

				// Await completion to gracefully release resources
				try { await Task.WhenAll(readTask, writeTask); } catch { }
			}
			catch (TimeoutException)
			{
				// Server not found, wait and retry
			}
			catch (Exception ex)
			{
				Console.WriteLine($"[Client] Connection error: {ex.Message}");
			}
			finally
			{
				OnConnectionStatusChanged?.Invoke(false);
				client?.Dispose();

				// Pause before reconnect
				if (!_globalCts.IsCancellationRequested)
					await Task.Delay(2000);
			}
		}
	}

	private async Task ProcessReadLoop(NamedPipeClientStream stream, CancellationToken ct)
	{
		try
		{
			while (!ct.IsCancellationRequested)
			{
				PipeMessage msg = null;
				try
				{
					msg = await PipeProtocol.ReadAsync(stream, ct);
				}
				catch (TimeoutException)
				{
					break; // Exit loop, finally block will close stream
				}

				if (msg == null) break; // Server closed connection

				// Invoke event on separate task/pool to avoid blocking read loop
				_ = Task.Run(() => OnMessageReceived?.Invoke(msg));
			}
		}
		catch (OperationCanceledException) {
			string c = "";
		}
		catch (Exception ex)
		{
			// Any IO error interrupts loop and triggers reconnect
			throw;
		}
	}

	private async Task ProcessWriteLoop(NamedPipeClientStream stream, CancellationToken ct)
	{
		try
		{
			// GetConsumingEnumerable blocks while queue is empty, replacing timers
			foreach (var msg in _sendQueue.GetConsumingEnumerable(ct))
			{
				if(msg.Action != PipeActions.Heartbeat)
				{
					string h = "";
				}
				await PipeProtocol.SendAsync(stream, msg, ct);
			}
		}
		catch (OperationCanceledException) { }
		catch (Exception)
		{
			// Throw on write error so LifeCycleLoop recognizes dead connection and reconnects
			throw;
		}
	}

	// Public send method (places item into queue)
	public void Send(string action, object payload, string correlationId = null)
	{
		var msg = new PipeMessage
		{
			Type = MessageType.Command,
			Action = action, 
			Payload = payload,
			CorrelationId = correlationId
		};

		Send(msg);
	}

	public void Send(PipeMessage msg)
	{
		_sendQueue.Add(msg);
	}

	public void SendResponse(string originalMessageId, object payload)
	{
		var msg = new PipeMessage
		{
			Type = MessageType.Response,
			Action = null,
			CorrelationId = originalMessageId,
			Payload = payload
		};

		Send(msg);
	}

	public void SendEvent(string action, object payload = null)
	{
		var msg = new PipeMessage
		{
			Type = MessageType.Event,
			Action = action,
			Payload = payload
		};
		Send(msg);
	}

	public void Dispose()
	{
		_globalCts.Cancel();
		_sendQueue.CompleteAdding();
		_sendQueue.Dispose();
	}
}