using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO.Pipes;
using System.Text;

public class PipeServer
{
	private readonly string _pipeName;
	private readonly CancellationTokenSource _cts = new();
	private readonly ConcurrentDictionary<string, ServerSession> _clients = new();

	// Event: (ClientId, Message)
	public event Action<string, PipeMessage> OnMessageReceived;
	public event Action<string> OnClientConnected;
	public event Action<string> OnClientDisconnected;

	public PipeServer(string pipeName)
	{
		_pipeName = pipeName;
		Task.Run(ListenLoopAsync);
		Task.Run(HeartbeatMonitorAsync);
	}

	private async Task HeartbeatMonitorAsync()
	{
		while (!_cts.IsCancellationRequested)
		{
			try
			{
				await Task.Delay(5000, _cts.Token);
				var now = DateTime.UtcNow;
				foreach (var kvp in _clients)
				{
					if ((now - kvp.Value.LastHeartbeat).TotalSeconds > 10)
					{
						Console.WriteLine($"[Server] Client {kvp.Key} timed out (no heartbeat). Closing.");
						kvp.Value.Close();
						_clients.TryRemove(kvp.Key, out _);
						var clientId = kvp.Key;
						_ = Task.Run(() =>
						{
							try { OnClientDisconnected?.Invoke(clientId); } catch { }
						});
					}
				}
			}
			catch (OperationCanceledException) { break; }
			catch (Exception) { }
		}
	}

	private async Task ListenLoopAsync()
	{
		while (!_cts.IsCancellationRequested)
		{
			try
			{
				var stream = new NamedPipeServerStream(_pipeName, PipeDirection.InOut,
					NamedPipeServerStream.MaxAllowedServerInstances,
					PipeTransmissionMode.Byte, // Use Byte since custom framing is implemented
					PipeOptions.Asynchronous);

				await stream.WaitForConnectionAsync(_cts.Token);

				// Spawn a separate processing loop for each incoming connection
				_ = ProcessConnectionAsync(stream);
			}
			catch (OperationCanceledException) { break; }
			catch (Exception ex)
			{
				//Console.WriteLine($"[Server] Listener error: {ex.Message}");
				await Task.Delay(50);
			}
		}
	}

	private async Task ProcessConnectionAsync(NamedPipeServerStream stream)
	{
		string clientId = null;
		try
		{
			// Wait for Handshake (registration)
			// Apply registration timeout to prevent dead connection retention
			using var regCts = new CancellationTokenSource(TimeSpan.FromSeconds(8));
			var regMsg = await PipeProtocol.ReadAsync(stream, regCts.Token);

			if (regMsg == null || regMsg.Type != MessageType.Register || string.IsNullOrEmpty(regMsg.TargetId)) // TargetId is used here as ClientId
			{
				//Console.WriteLine("[Server] Bad handshake. Closing.");
				return;
			}

			clientId = regMsg.TargetId; // Client sends its ID in TargetId
			var session = new ServerSession(clientId, stream);

			// Register session
			// If client ID already exists, disconnect old session (reconnect logic)
			if (_clients.TryRemove(clientId, out var oldSession))
			{
				oldSession.Close();
			}

			if (_clients.TryAdd(clientId, session))
			{
				_ = Task.Run(() =>
				{
					try { OnClientConnected?.Invoke(clientId); }
					catch { }
				});
				Console.WriteLine($"[Server] Client registered: {clientId}");

				using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(_cts.Token, session.Cts.Token);
				while (stream.IsConnected && !linkedCts.IsCancellationRequested)
				{
					var msg = await PipeProtocol.ReadAsync(stream, linkedCts.Token);
					if (msg == null) break; // client disconnected

					session.LastHeartbeat = DateTime.UtcNow;

					_ = Task.Run(() =>
					{
						try { OnMessageReceived?.Invoke(clientId, msg); }
						catch { /* ignore */ }
					});
				}
			}
		}
		catch (Exception)
		{
			// ignore disconnect errors
		}
		finally
		{
			if (clientId != null)
			{
				_clients.TryRemove(clientId, out _);
				_ = Task.Run(() =>
				{
					try { OnClientDisconnected?.Invoke(clientId); } catch { }
				});
				// OnClientDisconnected?.Invoke(clientId);
			}
			try { stream.Dispose(); } catch { }
		}
	}

	public async Task<bool> SendToClientAsync(string targetClientId, PipeMessage msg)
	{
		if (_clients.TryGetValue(targetClientId, out var session))
		{
			try
			{
				await session.SendAsync(msg);
				return true;
			}
			catch
			{
				// Send failure, client likely disconnected; read loop will handle disconnect shortly
				return false;
			}
		}
		return false;
	}

	public void Stop()
	{
		_cts.Cancel();
		foreach (var s in _clients.Values) s.Close();
		_clients.Clear();
	}
}