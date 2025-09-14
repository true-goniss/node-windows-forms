using System;
using System.Collections.Generic;


public class EventManager<T>
{
    public delegate void MyEventHandler(T eventArgs);

    private Dictionary<string, List<MyEventHandler>> _events = new();

    public void AddEventHandler(string name, MyEventHandler handler)
    {
        if (!_events.ContainsKey(name) || _events[name] == null)
        {
            _events[name] = new();
        }

        _events[name].Add(handler);
    }

    public void RemoveEventHandler(string name, MyEventHandler handler)
    {
        if (!_events.ContainsKey(name) || _events[name] == null) return;

        _events[name].Remove(handler);
    }

    public void TriggerEvents(string name, T eventArgs)
    {
        if (!_events.ContainsKey(name) || _events[name] == null) return;

        var eventHandlers = _events[name];

        foreach (var handler in eventHandlers)
        {
            handler?.Invoke(eventArgs);
        }
    }
}