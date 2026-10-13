using System;
using System.Buffers;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Responsible for low-level read/write operations using message length framing.
/// Ensures messages are never glued together in the pipe stream.
/// </summary>
public static class PipeProtocol
{
	private const int MaxMessageSize = 10 * 1024 * 1024;

	private static readonly JsonSerializerOptions _opts = new()
	{
		PropertyNameCaseInsensitive = true, // prevent casing mistakes from breaking deserialization
		WriteIndented = false
	};

	public static readonly PipeMessage HeartbeatMessage = new PipeMessage { Type = MessageType.Event, Action = PipeActions.Heartbeat };
	private static readonly byte[] _zeroLength = new byte[8];

	public static async Task SendAsync(Stream stream, PipeMessage message, CancellationToken ct)
	{
		// Zero payload for Heartbeat
		if (message.Action == PipeActions.Heartbeat)
		{
			await stream.WriteAsync(_zeroLength, 0, 8, CancellationToken.None).WaitAsync(ct).ConfigureAwait(false);
			await stream.FlushAsync(CancellationToken.None).WaitAsync(ct).ConfigureAwait(false);
			return;
		}

		// Serialize directly to UTF-8 byte array (avoid string allocations)
		byte[] jsonBytes = JsonSerializer.SerializeToUtf8Bytes(message, _opts);
		int byteCount = jsonBytes.Length;
		int binaryCount = message.BinaryPayload?.Length ?? 0;
		int totalLength = byteCount + 8 + binaryCount;
		
		// Rent 1 combined buffer for payload length prefix and data
		byte[] buffer = ArrayPool<byte>.Shared.Rent(totalLength);
		try
		{
			// Write lengths without allocation
			System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(new Span<byte>(buffer, 0, 4), byteCount);
			System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(new Span<byte>(buffer, 4, 4), binaryCount);
			
			// Copy payload right after the length header
			jsonBytes.CopyTo(new Span<byte>(buffer, 8, byteCount));
			if (binaryCount > 0)
			{
				message.BinaryPayload.CopyTo(new Span<byte>(buffer, 8 + byteCount, binaryCount));
			}

			// Send as a single continuous block = 1 system call to kernel
			await stream.WriteAsync(buffer, 0, totalLength, CancellationToken.None).WaitAsync(ct).ConfigureAwait(false);
			await stream.FlushAsync(CancellationToken.None).WaitAsync(ct).ConfigureAwait(false);
		}
		finally
		{
			ArrayPool<byte>.Shared.Return(buffer);
		}
	}

	public static async Task<PipeMessage> ReadAsync(Stream stream, CancellationToken ct, int timeoutMs = Timeout.Infinite)
	{
		if (timeoutMs == Timeout.Infinite)
		{
			return await ReadInternalAsync(stream, ct).ConfigureAwait(false);
		}

		// Use CancellationTokenSource.CancelAfter for timeout without memory leaks or hanging Task.Delay
		using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
		if (timeoutMs > 0)
		{
			timeoutCts.CancelAfter(timeoutMs);
		}

		try
		{
			return await ReadInternalAsync(stream, timeoutCts.Token).ConfigureAwait(false);
		}
		catch (OperationCanceledException) when (!ct.IsCancellationRequested)
		{
			// If cancelled by internal timeout rather than external token, throw TimeoutException
			throw new TimeoutException($"Read timed out after {timeoutMs} ms.");
		}
	}

	/// <summary>
	/// Read implementation without timeout – uses only provided CancellationToken.
	/// </summary>
	private static async Task<PipeMessage> ReadInternalAsync(Stream stream, CancellationToken ct)
	{
		// Read length header (8 bytes)
		byte[] lenBuffer = ArrayPool<byte>.Shared.Rent(8);
		try
		{
			int bytesRead = await ReadExactAsync(stream, lenBuffer, 8, ct).ConfigureAwait(false);
			if (bytesRead == 0) 
				return null; // Graceful disconnect

			// Read length value without allocation
			int dataLength = System.Buffers.Binary.BinaryPrimitives.ReadInt32LittleEndian(new ReadOnlySpan<byte>(lenBuffer, 0, 4));
			int binaryLength = System.Buffers.Binary.BinaryPrimitives.ReadInt32LittleEndian(new ReadOnlySpan<byte>(lenBuffer, 4, 4));
			
			// Zero payload length indicates Heartbeat
			if (dataLength == 0 && binaryLength == 0)
				return HeartbeatMessage;

			if (dataLength < 0 || dataLength > MaxMessageSize || binaryLength < 0 || binaryLength > MaxMessageSize)
				throw new IOException($"Invalid message lengths: JSON {dataLength}, Binary {binaryLength} (possible corruption).");

			// Read exact message payload body
			byte[] dataBuffer = ArrayPool<byte>.Shared.Rent(dataLength);
			try
			{
				await ReadExactAsync(stream, dataBuffer, dataLength, ct).ConfigureAwait(false);
				
				// Deserialize directly from bytes (no intermediate string allocation)
				var span = new ReadOnlySpan<byte>(dataBuffer, 0, dataLength);
				var message = JsonSerializer.Deserialize<PipeMessage>(span, _opts);

				if (binaryLength > 0)
				{
					byte[] binBuffer = new byte[binaryLength]; // Will be stored in the object, no pooling
					await ReadExactAsync(stream, binBuffer, binaryLength, ct).ConfigureAwait(false);
					if (message != null)
					{
						message.BinaryPayload = binBuffer;
					}
				}

				return message;
			}
			finally
			{
				ArrayPool<byte>.Shared.Return(dataBuffer);
			}
		}
		finally
		{
			ArrayPool<byte>.Shared.Return(lenBuffer);
		}
	}

	private static async Task<int> ReadExactAsync(Stream stream, byte[] buffer, int count, CancellationToken ct)
	{
		int totalRead = 0;
		while (totalRead < count)
		{
			// Use .WaitAsync(ct) to interrupt waiting in .NET even if CancelIoEx fails (Windows Named Pipes quirk)
			int read = await stream.ReadAsync(buffer, totalRead, count - totalRead, CancellationToken.None)
								   .WaitAsync(ct)
								   .ConfigureAwait(false);

			if (read == 0) return 0; // End of stream
			totalRead += read;
		}
		return totalRead;
	}
}