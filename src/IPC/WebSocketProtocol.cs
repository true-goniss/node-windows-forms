using System;
using System.Buffers;
using System.IO;
using System.Net.WebSockets;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Responsible for WebSocket read/write operations.
/// Uses native WebSocket framing (each message is a distinct frame).
/// </summary>
public static class WebSocketProtocol
{
	private const int MaxMessageSize = 10 * 1024 * 1024;

	private static readonly JsonSerializerOptions _opts = new()
	{
		PropertyNameCaseInsensitive = true,
		WriteIndented = false
	};

	public static async Task SendAsync(WebSocket socket, PipeMessage message, CancellationToken ct)
	{
		if (socket.State != WebSocketState.Open)
			return;

		// Heartbeat is sent as an empty text frame
		if (message.Action == PipeActions.Heartbeat)
		{
			await socket.SendAsync(Array.Empty<byte>(), WebSocketMessageType.Text, true, ct).ConfigureAwait(false);
			return;
		}

		byte[] jsonBytes = JsonSerializer.SerializeToUtf8Bytes(message, _opts);
		
		await socket.SendAsync(new ArraySegment<byte>(jsonBytes), WebSocketMessageType.Text, true, ct).ConfigureAwait(false);
	}

	public static async Task<PipeMessage> ReadAsync(WebSocket socket, CancellationToken ct, int timeoutMs = Timeout.Infinite)
	{
		if (timeoutMs == Timeout.Infinite)
		{
			return await ReadInternalAsync(socket, ct).ConfigureAwait(false);
		}

		using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
		if (timeoutMs > 0)
		{
			timeoutCts.CancelAfter(timeoutMs);
		}

		try
		{
			return await ReadInternalAsync(socket, timeoutCts.Token).ConfigureAwait(false);
		}
		catch (OperationCanceledException) when (!ct.IsCancellationRequested)
		{
			throw new TimeoutException($"Read timed out after {timeoutMs} ms.");
		}
	}

	private static async Task<PipeMessage> ReadInternalAsync(WebSocket socket, CancellationToken ct)
	{
		// Use MemoryStream to assemble fragmented WebSocket messages
		using var ms = new MemoryStream();
		var buffer = ArrayPool<byte>.Shared.Rent(4096);
		try
		{
			WebSocketReceiveResult result;
			do
			{
				result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), ct).ConfigureAwait(false);
				
				if (result.MessageType == WebSocketMessageType.Close)
					return null;

				ms.Write(buffer, 0, result.Count);
				
				if (ms.Length > MaxMessageSize)
					throw new IOException($"Message exceeds maximum size of {MaxMessageSize} bytes.");
					
			} while (!result.EndOfMessage);

			var dataLength = (int)ms.Length;
			if (dataLength == 0)
				return PipeProtocol.HeartbeatMessage;

			var span = new ReadOnlySpan<byte>(ms.GetBuffer(), 0, dataLength);
			return JsonSerializer.Deserialize<PipeMessage>(span, _opts);
		}
		finally
		{
			ArrayPool<byte>.Shared.Return(buffer);
		}
	}
}
