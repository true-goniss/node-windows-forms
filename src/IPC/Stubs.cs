using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;

namespace Shared
{
	public static class Utils
	{
		public static string ExceptionWithStackTrace(Exception? ex)
		{
			if (ex == null) return "null";

			return "Error: " + ex.Message + " StackTrace: " + ex.StackTrace;
		}
	}
}

public static class PipeExceptions
{
	public const string SERVER_COMMAND_TIMEOUT = "SERVER_COMMAND_TIMEOUT: Timeout waiting for response";
}

public class EventManager<T>
{
	public delegate void MyEventHandler(T eventArgs);

	// Thread-safe dictionary storing immutable handler lists
	private readonly ConcurrentDictionary<string, ImmutableList<MyEventHandler>> _events = new();

	/// <summary>
	/// Delegate for logging exception thrown by event handlers.
	/// Exceptions are swallowed if no delegate is provided.
	/// </summary>
	public Action<Exception>? ErrorHandler { get; set; }

	public void AddEventHandler(string name, MyEventHandler handler)
	{
		if (string.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
		if (handler == null) throw new ArgumentNullException(nameof(handler));

		_events.AddOrUpdate(
			name,
			ImmutableList.Create(handler),
			(key, existingList) => existingList.Add(handler)
		);
	}

	public void RemoveEventHandler(string name, MyEventHandler handler)
	{
		if (string.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
		if (handler == null) throw new ArgumentNullException(nameof(handler));

		_events.AddOrUpdate(
			name,
			ImmutableList<MyEventHandler>.Empty,
			(key, existingList) => existingList.Remove(handler)
		);
	}

	public void TriggerEvents(string name, T eventArgs)
	{
		if (string.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

		if (!_events.TryGetValue(name, out var handlers))
			return;

		// Iterate over immutable list - thread-safe even if collection is modified concurrently
		foreach (var handler in handlers)
		{
			try
			{
				handler?.Invoke(eventArgs);
			}
			catch (Exception ex)
			{
				// Error in one handler should not interrupt execution of remaining handlers
				ErrorHandler?.Invoke(ex);
			}
		}
	}
}
