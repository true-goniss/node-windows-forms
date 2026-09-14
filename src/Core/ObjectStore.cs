using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Windows.Forms;

namespace NodeWindowsForms.Core
{
    public static class ObjectStore
    {
        private static ConcurrentDictionary<string, object> _objects = new();

        /// <summary>
        /// Generates a list of all registered controls to send to Node.js.
        /// </summary>
        public static List<object> GetControlManifest()
        {
            var manifest = new List<object>();

            foreach (var kvp in _objects)
            {
                if (kvp.Value is Control ctrl)
                {
                    manifest.Add(new
                    {
                        id = kvp.Key,
                        type = ctrl.GetType().Name, // Type name (Button, Label, Form)
                        name = ctrl.Name,          // Control name (e.g. button1)
                                                   // parentId can be added later for tree construction
                    });
                }
            }
            return manifest;
        }

        public static void Register(string id, object obj)
        {
            _objects[id] = obj;

            if (obj is Control ctrl)
            {
                ctrl.Disposed += (sender, e) =>
                {
                    if (_objects.TryRemove(id, out _))
                    {
                        // Safely emit to JS so it can garbage collect
                        try { IpcHost.SendEvent(id, "destroyed", null); } catch {}
                    }
                };
            }
        }

        public static object Get(string id)
        {
            if (string.IsNullOrEmpty(id)) return null; // [Fix] Prevent ArgumentNullException
            return _objects.TryGetValue(id, out var obj) ? obj : null;
        }

        public static void Remove(string id)
        {
            _objects.TryRemove(id, out _);
        }

        // Helper method to register main Form at startup
        public static void RegisterStartForm(Form form)
        {
            // Register form itself as "mainForm" (or by name)
            Register(form.Name, form);

            // Recursively register controls defined in form designer
            ScanControls(form);
        }

        private static void ScanControls(Control parent)
        {
            foreach (Control c in parent.Controls)
            {
                if (!string.IsNullOrEmpty(c.Name))
                {
                    Register(c.Name, c);
                }
                ScanControls(c);
            }
        }
    }
}