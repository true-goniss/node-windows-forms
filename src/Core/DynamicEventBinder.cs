using System;
using System.Reflection;
using System.Windows.Forms;
using NodeWindowsForms.Core;

namespace NodeWindowsForms.Core
{
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
                    return new EventHandler((sender, e) =>
                    {
                        string val = "";
                        if (sender is Control ctrl) val = ctrl.Text;
                        IpcHost.SendEvent(targetId, eventName, new { Type = e.GetType().Name, value = val });
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
                    return new EventHandler((sender, e) =>
                    {
                        if (sender is Control ctrl)
                        {
                            IpcHost.SendEvent(targetId, eventName, new { Type = e.GetType().Name, width = ctrl.Width, height = ctrl.Height });
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
                return new MouseEventHandler((sender, e) =>
                {
                    // Send mouse event details
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