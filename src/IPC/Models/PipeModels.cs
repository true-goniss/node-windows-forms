// Pipe IPC Constants and Data Transfer Objects.
// All communicating endpoints must use identical model definitions.

public enum MessageType { Register, Command, Response, Event, Error }

public class PipeMessage
{
	public string Id { get; set; } = Guid.NewGuid().ToString(); // Message ID
	public string CorrelationId { get; set; } // Message ID being replied to (null if new request)
	public MessageType Type { get; set; }
	public string TargetId { get; set; } // Target identifier for routing
	public string Tag { get; set; } = ""; // Additional metadata (reserved)
	public string Action { get; set; }   // Action/event name
	public object Payload { get; set; }  // JSON-serializable payload passed between processes as plain text
}

// Command execution result (generic response wrapper)
public record CommandResult<T>(bool Success, T Result, string Reason);

public readonly struct PipeActions
{
	public const string Heartbeat = "Heartbeat";
	public const string Log = "Log";
}
