using System;
using System.Collections.Generic;
using System.IO.Pipes;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public class ServerSession
{
	public string ClientId { get; }
	public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;
	public CancellationTokenSource Cts { get; } = new();
	private readonly NamedPipeServerStream _stream;
	private readonly SemaphoreSlim _writeLock = new(1, 1);

	public ServerSession(string clientId, NamedPipeServerStream stream)
	{
		ClientId = clientId;
		_stream = stream;
	}

	public async Task SendAsync(PipeMessage msg)
	{
		// Lock is required as multiple server threads may write to the same client
		// Try acquiring write lock with timeout
		if (!await _writeLock.WaitAsync(TimeSpan.FromSeconds(10)))
		{
			// Timeout expired - connection considered dead/hung.
			// Close stream to force disconnect.
			Close();
			throw new TimeoutException("Write lock timeout");
		}

		try
		{
			if (_stream.IsConnected)
			{
				await PipeProtocol.SendAsync(_stream, msg, CancellationToken.None);
			}
		}
		finally
		{
			// Release semaphore if not disposed
			try { _writeLock.Release(); } catch (ObjectDisposedException) { }
		}
	}

	public void Close()
	{
		try
		{
			// Only cancel token here. Stream disposal occurs
			// in ProcessConnectionAsync finally block after ReadAsync completes.
			Cts?.Cancel();
			_writeLock?.Dispose();
		}
		catch { }
	}
}
