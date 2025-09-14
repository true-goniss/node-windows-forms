using System.Collections.Generic;

// pipeline

public class CodeFlow<T>
{
    private readonly T _initial;
    private readonly List<Func<T, T>> _operations = new();

    public CodeFlow(T initial) => _initial = initial;

    public CodeFlow<T> WithOperation(Func<T, T> operation)
    {
        _operations.Add(operation);
        return this;
    }

    public T Compose() => _operations.Aggregate(_initial, (current, operation) => operation(current));
}