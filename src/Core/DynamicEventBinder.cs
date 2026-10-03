using System;
using System.Reflection;
using System.Windows.Forms;
using NodeWindowsForms.Core;
using System.Threading;

namespace NodeWindowsForms.Core
{
    public class Throttler
    {
        private DateTime _lastFired = DateTime.MinValue;
        private readonly int _throttleMs;
        private readonly Action<object> _action;
        private System.Threading.Timer _timer;
        private object _lastState;
        private readonly object _lock = new object();

        public Throttler(int throttleMs, Action<object> action)
        {
            _throttleMs = throttleMs;
            _action = action;
        }

        public void Invoke(object state)
        {
            lock (_lock)
            {
                _lastState = state;
                var now = DateTime.UtcNow;
                var elapsed = (now - _lastFired).TotalMilliseconds;

                if (elapsed >= _throttleMs)
                {
                    _lastFired = now;
                    _action(state);
                }
                else
                {
                    if (_timer == null)
                    {
                        var remaining = _throttleMs - (int)elapsed;
                        _timer = new System.Threading.Timer(OnTimer, null, remaining, Timeout.Infinite);
                    }
                }
            }
        }

        private void OnTimer(object state)
        {
            lock (_lock)
            {
                _timer?.Dispose();
                _timer = null;
                _lastFired = DateTime.UtcNow;
                _action(_lastState);
            }
        }
    }

    public static class DynamicEventBinder
    {
        public static void AddIpcEventHandler(object target, string eventName, string targetId)
        {
            EventInfo eventInfo = target.GetType().GetEvent(eventName);

            if (eventInfo == null)
            {
                throw new Exception($"Event '{eventName}' not found on control '{targetId}'.");
            }

            // Create generic delegate triggering IPC event handler
            Delegate handler = CreateDynamicDelegate(eventInfo.EventHandlerType, targetId, eventName);

            eventInfo.AddEventHandler(target, handler);
        }

        private static Delegate CreateDynamicDelegate(Type eventHandlerType, string targetId, string eventName)
        {
            if (eventHandlerType == typeof(EventHandler))
            {
                if (eventName == "TextChanged")
                {
                    // Debouncing/Throttling TextChanged is usually not desired for precise input tracking, 
                    // but we can throttle it to ~16ms (1 frame) to avoid crazy fast pasting spikes.
                    var textThrottler = new Throttler(16, (state) => IpcHost.SendEvent(targetId, eventName, state));
                    return new EventHandler((sender, e) =>
                    {
                        string val = "";
                        if (sender is Control ctrl) val = ctrl.Text;
                        textThrottler.Invoke(new { Type = e.GetType().Name, value = val });
                    });
                }
                
                if (eventName == "ValueChanged")
                {
                    var valThrottler = new Throttler(16, (state) => IpcHost.SendEvent(targetId, eventName, state));
                    return new EventHandler((sender, e) =>
                    {
                        decimal val = 0;
                        if (sender is NumericUpDown nud) val = nud.Value;
                        else if (sender is TrackBar tb) val = tb.Value;
                        valThrottler.Invoke(new { Type = e.GetType().Name, value = val });
                    });
                }
                
                if (eventName == "Scroll")
                {
                    var scrollThrottler = new Throttler(16, (state) => IpcHost.SendEvent(targetId, eventName, state));
                    return new EventHandler((sender, e) =>
                    {
                        int val = 0;
                        if (sender is TrackBar tb) val = tb.Value;
                        scrollThrottler.Invoke(new { Type = e.GetType().Name, value = val });
                    });
                }
                
                if (eventName == "CheckedChanged")
                {
                    return new EventHandler((sender, e) =>
                    {
                        bool chk = false;
                        if (sender is CheckBox cb) chk = cb.Checked;
                        else if (sender is RadioButton rb) chk = rb.Checked;
                        IpcHost.SendEvent(targetId, eventName, new { Type = e.GetType().Name, value = chk });
                    });
                }
                
                if (eventName == "SelectedIndexChanged")
                {
                    return new EventHandler((sender, e) =>
                    {
                        int idx = -1;
                        if (sender is ComboBox cb) idx = cb.SelectedIndex;
                        else if (sender is ListBox lb) idx = lb.SelectedIndex;
                        else if (sender is TabControl tc) idx = tc.SelectedIndex;
                        IpcHost.SendEvent(targetId, eventName, new { Type = e.GetType().Name, value = idx });
                    });
                }
                
                if (eventName == "Resize" || eventName == "SizeChanged")
                {
                    // Resize fires extremely rapidly during window drag. Throttle to 32ms (~30fps)
                    var resizeThrottler = new Throttler(32, (state) => IpcHost.SendEvent(targetId, eventName, state));
                    return new EventHandler((sender, e) =>
                    {
                        if (sender is Control ctrl)
                        {
                            resizeThrottler.Invoke(new { Type = e.GetType().Name, width = ctrl.Width, height = ctrl.Height });
                        }
                    });
                }
                
                return new EventHandler((sender, e) =>
                {
                    // Send basic event metadata
                    IpcHost.SendEvent(targetId, eventName, new { Type = e.GetType().Name });
                });
            }

            // --- MouseEventHandler (object sender, MouseEventArgs e) ---
            if (eventHandlerType == typeof(MouseEventHandler))
            {
                if (eventName == "MouseMove")
                {
                    // MouseMove is the biggest offender for IPC flooding. Throttle to 16ms (~60fps)
                    var mouseThrottler = new Throttler(16, (state) => IpcHost.SendEvent(targetId, eventName, state));
                    return new MouseEventHandler((sender, e) =>
                    {
                        mouseThrottler.Invoke(new
                        {
                            Location = new { X = e.X, Y = e.Y },
                            Button = e.Button.ToString(),
                            Clicks = e.Clicks,
                            Delta = e.Delta
                        });
                    });
                }

                return new MouseEventHandler((sender, e) =>
                {
                    IpcHost.SendEvent(targetId, eventName, new
                    {
                        Location = new { X = e.X, Y = e.Y },
                        Button = e.Button.ToString(),
                        Clicks = e.Clicks,
                        Delta = e.Delta
                    });
                });
            }

            // --- DataGridViewCellEventHandler ---
            if (eventHandlerType == typeof(DataGridViewCellEventHandler))
            {
                return new DataGridViewCellEventHandler((sender, e) =>
                {
                    IpcHost.SendEvent(targetId, eventName, new
                    {
                        ColumnIndex = e.ColumnIndex,
                        RowIndex = e.RowIndex
                    });
                });
            }

            // --- KeyEventHandler ---
            if (eventHandlerType == typeof(KeyEventHandler))
            {
                return new KeyEventHandler((sender, e) =>
                {
                    IpcHost.SendEvent(targetId, eventName, new
                    {
                        KeyCode = e.KeyCode.ToString(),
                        KeyValue = e.KeyValue,
                        Modifiers = e.Modifiers.ToString(),
                        Alt = e.Alt,
                        Control = e.Control,
                        Shift = e.Shift
                    });
                });
            }

            // --- KeyPressEventHandler ---
            if (eventHandlerType == typeof(KeyPressEventHandler))
            {
                return new KeyPressEventHandler((sender, e) =>
                {
                    IpcHost.SendEvent(targetId, eventName, new
                    {
                        KeyChar = e.KeyChar.ToString()
                    });
                });
            }

            // --- FormClosedEventHandler ---
            if (eventHandlerType == typeof(FormClosedEventHandler))
            {
                return new FormClosedEventHandler((sender, e) =>
                {
                    IpcHost.SendEvent(targetId, eventName, new { CloseReason = e.CloseReason.ToString() });
                });
            }

            throw new NotSupportedException($"Event handler type {eventHandlerType.Name} not yet supported by IPC binder.");
        }
    }
}