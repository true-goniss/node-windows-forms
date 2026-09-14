using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NodeWindowsForms.Core
{
    public class Dispatcher
    {
        private readonly Control _syncContext; // UI thread execution context

        public Dispatcher(Control syncContext)
        {
            _syncContext = syncContext;
        }

        public Task<object> DispatchAsync(InboundMessage msg)
        {
            var tcs = new TaskCompletionSource<object>();

            // Switch to WinForms UI thread asynchronously to avoid blocking IPC loop
            _syncContext.BeginInvoke(new Action(() =>
            {
                try
                {
                    object result = Execute(msg);
                    tcs.SetResult(result);
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            }));

            return tcs.Task;
        }

        private object Execute(InboundMessage msg)
        {
            // 1. Create Command
            if (msg.Action == "create")
            {
                string typeName = msg.Args.GetProperty("type").GetString();
                string newId = msg.Args.GetProperty("id").GetString();

                // [Fix] Handle null parentId safely
                string parentId = null;
                if (msg.Args.TryGetProperty("parent", out JsonElement parentEl) && parentEl.ValueKind != JsonValueKind.Null)
                {
                    parentId = parentEl.GetString();
                }

                Type type = GetControlType(typeName);
                if (type == null) throw new Exception($"Type {typeName} not found");

                object comp = Activator.CreateInstance(type);
                
                if (comp is Form form)
                {
                    try
                    {
                        var exePath = System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName;
                        form.Icon = System.Drawing.Icon.ExtractAssociatedIcon(exePath);
                    }
                    catch { }
                }

                // Set name if it has a Name property
                PropertyInfo nameProp = type.GetProperty("Name");
                if (nameProp != null && nameProp.CanWrite)
                {
                    nameProp.SetValue(comp, newId);
                }

                ObjectStore.Register(newId, comp);

                // Add to parent if exists
                if (!string.IsNullOrEmpty(parentId))
                {
                    object parent = ObjectStore.Get(parentId);
                    if (parent != null)
                    {
                        if (parent is Control parentCtrl && comp is Control childCtrl)
                        {
                            parentCtrl.Controls.Add(childCtrl);
                        }
                        else if (parent is ToolStrip parentToolStrip && comp is ToolStripItem childItem1)
                        {
                            parentToolStrip.Items.Add(childItem1);
                        }
                        else if (parent is ToolStripMenuItem parentMenuItem && comp is ToolStripItem childItem2)
                        {
                            parentMenuItem.DropDownItems.Add(childItem2);
                        }
                        
                        // Special case: automatically assign MainMenuStrip if we add a MenuStrip to a Form
                        if (parent is Form parentForm && comp is MenuStrip menuStrip)
                        {
                            parentForm.MainMenuStrip = menuStrip;
                        }
                    }
                }

                return "created";
            }

            if (msg.Action == "messageBox")
            {
                string text = msg.Args.GetProperty("text").GetString();
                string caption = msg.Args.TryGetProperty("caption", out var c) && c.ValueKind == JsonValueKind.String ? c.GetString() : "";
                
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                if (msg.Args.TryGetProperty("buttons", out var b) && b.ValueKind == JsonValueKind.String) {
                    Enum.TryParse(b.GetString(), true, out buttons);
                }

                MessageBoxIcon icon = MessageBoxIcon.None;
                if (msg.Args.TryGetProperty("icon", out var ic) && ic.ValueKind == JsonValueKind.String) {
                    Enum.TryParse(ic.GetString(), true, out icon);
                }

                DialogResult dr = MessageBox.Show(text, caption, buttons, icon);
                return dr.ToString();
            }

            if (msg.Action == "openFileDialog")
            {
                using (OpenFileDialog ofd = new OpenFileDialog())
                {
                    if (msg.Args.TryGetProperty("filter", out var fEl) && fEl.ValueKind == JsonValueKind.String) ofd.Filter = fEl.GetString();
                    if (msg.Args.TryGetProperty("title", out var tEl) && tEl.ValueKind == JsonValueKind.String) ofd.Title = tEl.GetString();
                    if (msg.Args.TryGetProperty("multiselect", out var mEl) && mEl.ValueKind == JsonValueKind.True) ofd.Multiselect = true;
                    if (msg.Args.TryGetProperty("initialDirectory", out var iEl) && iEl.ValueKind == JsonValueKind.String) ofd.InitialDirectory = iEl.GetString();

                    DialogResult dr = ofd.ShowDialog();
                    if (dr == DialogResult.OK)
                    {
                        if (ofd.Multiselect) return JsonSerializer.Serialize(ofd.FileNames);
                        return JsonSerializer.Serialize(new[] { ofd.FileName });
                    }
                    return null;
                }
            }

            if (msg.Action == "saveFileDialog")
            {
                using (SaveFileDialog sfd = new SaveFileDialog())
                {
                    if (msg.Args.TryGetProperty("filter", out var fEl) && fEl.ValueKind == JsonValueKind.String) sfd.Filter = fEl.GetString();
                    if (msg.Args.TryGetProperty("title", out var tEl) && tEl.ValueKind == JsonValueKind.String) sfd.Title = tEl.GetString();
                    if (msg.Args.TryGetProperty("initialDirectory", out var iEl) && iEl.ValueKind == JsonValueKind.String) sfd.InitialDirectory = iEl.GetString();
                    if (msg.Args.TryGetProperty("defaultExt", out var dEl) && dEl.ValueKind == JsonValueKind.String) sfd.DefaultExt = dEl.GetString();

                    DialogResult dr = sfd.ShowDialog();
                    if (dr == DialogResult.OK)
                    {
                        return sfd.FileName;
                    }
                    return null;
                }
            }

            if (msg.Action == "folderBrowserDialog")
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    if (msg.Args.TryGetProperty("description", out var dEl) && dEl.ValueKind == JsonValueKind.String) fbd.Description = dEl.GetString();
                    if (msg.Args.TryGetProperty("selectedPath", out var sEl) && sEl.ValueKind == JsonValueKind.String) fbd.SelectedPath = sEl.GetString();
                    if (msg.Args.TryGetProperty("showNewFolderButton", out var shEl) && shEl.ValueKind == JsonValueKind.True) fbd.ShowNewFolderButton = true;
                    if (msg.Args.TryGetProperty("showNewFolderButton", out var shElFalse) && shElFalse.ValueKind == JsonValueKind.False) fbd.ShowNewFolderButton = false;

                    DialogResult dr = fbd.ShowDialog();
                    if (dr == DialogResult.OK)
                    {
                        return fbd.SelectedPath;
                    }
                    return null;
                }
            }

            // 2. Existing Object Logic
            if (string.IsNullOrEmpty(msg.TargetId))
            {
                throw new Exception("TargetId cannot be null or empty");
            }

            object target = ObjectStore.Get(msg.TargetId);
            if (target == null) throw new Exception($"Target {msg.TargetId} not found");

            if (msg.Action == "dispose")
            {
                if (target is Control ctrl)
                {
                    if (ctrl.Parent != null)
                    {
                        ctrl.Parent.Controls.Remove(ctrl);
                    }
                    ctrl.Dispose();
                }
                else if (target is IDisposable disposable)
                {
                    disposable.Dispose();
                }
                
                ObjectStore.Remove(msg.TargetId);
                return "disposed";
            }

            if (msg.Action == "setProperty")
            {
                if (!msg.Args.TryGetProperty("name", out JsonElement nameEl) ||
                    !msg.Args.TryGetProperty("value", out JsonElement valEl))
                {
                    throw new Exception("setProperty missing 'name' or 'value'");
                }

                string propName = nameEl.GetString();
                PropertyInfo prop = target.GetType().GetProperty(propName);
                if (prop == null) throw new Exception($"Property {propName} not found");



                // --- COMPLEX TYPES HANDLING ---
                if (prop.PropertyType == typeof(Point))
                {
                    // [FIX] valEl is a JSON object. Read properties directly using lowercase ('x', 'y') as defined in JS Point.toJSON().
                    int x = valEl.GetProperty("x").GetInt32();
                    int y = valEl.GetProperty("y").GetInt32();
                    Point p = new Point(x, y);
                    prop.SetValue(target, p);
                    return null;
                }

                if (prop.PropertyType == typeof(Size))
                {
                    // [FIX] valEl is a JSON object. Read properties directly using lowercase ('width', 'height').
                    int width = valEl.GetProperty("width").GetInt32();
                    int height = valEl.GetProperty("height").GetInt32();
                    Size s = new Size(width, height);
                    prop.SetValue(target, s);
                    return null;
                }
                
                if (prop.PropertyType == typeof(Padding))
                {
                    if (valEl.ValueKind == JsonValueKind.Number)
                    {
                        prop.SetValue(target, new Padding(valEl.GetInt32()));
                    }
                    else
                    {
                        int left = valEl.TryGetProperty("left", out var l) ? l.GetInt32() : 0;
                        int top = valEl.TryGetProperty("top", out var t) ? t.GetInt32() : 0;
                        int right = valEl.TryGetProperty("right", out var r) ? r.GetInt32() : 0;
                        int bottom = valEl.TryGetProperty("bottom", out var b) ? b.GetInt32() : 0;
                        prop.SetValue(target, new Padding(left, top, right, bottom));
                    }
                    return null;
                }

                // ---------------------------------------------
                if (prop.PropertyType == typeof(Color))
                {
                    // [COLOR LOGIC: Parse string 'a:Xr:Yg:Zb:W']
                    if (valEl.ValueKind != JsonValueKind.String)
                    {
                        throw new Exception("Color property must be set using a string (Color.toString() format).");
                    }

                    string colorString = valEl.GetString();

                    try
                    {
                        // Use robust parsing for 'a:255r:100g:50b:200' format
                        int aStart = colorString.IndexOf("a:") + 2;
                        int aEnd = colorString.IndexOf("r:");
                        int a = int.Parse(colorString.Substring(aStart, aEnd - aStart));

                        int rStart = aEnd + 2;
                        int rEnd = colorString.IndexOf("g:");
                        int r = int.Parse(colorString.Substring(rStart, rEnd - rStart));

                        int gStart = rEnd + 2;
                        int gEnd = colorString.IndexOf("b:");
                        int g = int.Parse(colorString.Substring(gStart, gEnd - gStart));

                        int bStart = gEnd + 2;
                        int b = int.Parse(colorString.Substring(bStart));

                        Color color = Color.FromArgb(a, r, g, b);
                        prop.SetValue(target, color);
                        return null;
                    }
                    catch (Exception ex)
                    {
                        throw new Exception($"Failed to parse Color string '{colorString}'. Expected format 'a:Xr:Yg:Zb:W'. Error: {ex.Message}");
                    }
                }

                if (prop.PropertyType == typeof(System.Drawing.Icon))
                {
                    string iconPath = valEl.GetString();
                    if (!string.IsNullOrEmpty(iconPath))
                    {
                        if (System.IO.File.Exists(iconPath)) {
                            prop.SetValue(target, new System.Drawing.Icon(iconPath));
                        } else if (iconPath == "default") {
                            prop.SetValue(target, System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath));
                        }
                    }
                    return null;
                }

                if (prop.PropertyType == typeof(System.Windows.Forms.ContextMenuStrip))
                {
                    string targetId = valEl.GetString();
                    if (!string.IsNullOrEmpty(targetId))
                    {
                        if (ObjectStore.Get(targetId) is ContextMenuStrip cms)
                        {
                            prop.SetValue(target, cms);
                        }
                    }
                    else 
                    {
                        prop.SetValue(target, null);
                    }
                    return null;
                }

                // [ITEMS LOGIC: Arrays for ComboBox/ListBox]
                if (propName == "Items" && target is ComboBox cb)
                {
                    cb.Items.Clear();
                    foreach (var element in valEl.EnumerateArray())
                    {
                        cb.Items.Add(element.GetString());
                    }
                    return null;
                }
                
                if (propName == "Items" && target is ListBox lb)
                {
                    lb.Items.Clear();
                    foreach (var element in valEl.EnumerateArray())
                    {
                        lb.Items.Add(element.GetString());
                    }
                    return null;
                }

                // Standard property assignment
                object value = ConvertJsonElement(valEl, prop.PropertyType);
                prop.SetValue(target, value);
                return null;
            }

            if (msg.Action == "getProperty")
            {
                string propName = msg.Args.GetProperty("name").GetString();
                PropertyInfo prop = target.GetType().GetProperty(propName);
                if (prop == null) throw new Exception($"Property {propName} not found");

                object value = prop.GetValue(target);

                // --- COMPLEX TYPES SERIALIZATION ---
                if (value is Point pointValue)
                {
                    return SerializePoint(pointValue);
                }
                if (value is Size sizeValue)
                {
                    return SerializeSize(sizeValue);
                }
                if (value is Padding padValue)
                {
                    return SerializePadding(padValue);
                }
                if (value is Color colorValue)
                {
                    // [COLOR LOGIC: Serialize to string 'a:Xr:Yg:Zb:W']
                    return $"a:{colorValue.A}r:{colorValue.R}g:{colorValue.G}b:{colorValue.B}";
                }
                // ------------------------------------------------

                return value;
            }

            if (msg.Action == "addEvent")
            {
                string eventName = msg.Args.GetProperty("name").GetString();
                DynamicEventBinder.AddIpcEventHandler(target, eventName, msg.TargetId);
                return "subscribed";
            }

            if (msg.Action == "invokeMethod")
            {
                string methodName = msg.Args.GetProperty("method").GetString();
                
                if (target is DataGridView dgv)
                {
                    JsonElement methodArgs = msg.Args.GetProperty("args");
                    if (methodName == "AddColumn")
                    {
                        string colName = methodArgs.GetProperty("name").GetString();
                        string colText = methodArgs.GetProperty("text").GetString();
                        dgv.Columns.Add(colName, colText);
                        return null;
                    }
                    if (methodName == "AddRow")
                    {
                        var rowArgs = methodArgs.GetProperty("values");
                        object[] values = new object[rowArgs.GetArrayLength()];
                        int idx = 0;
                        foreach (var el in rowArgs.EnumerateArray())
                        {
                            values[idx++] = el.ValueKind == JsonValueKind.String ? el.GetString() : el.ToString();
                        }
                        dgv.Rows.Add(values);
                        return null;
                    }
                    if (methodName == "ClearRows")
                    {
                        dgv.Rows.Clear();
                        return null;
                    }
                    if (methodName == "GetValue")
                    {
                        int row = methodArgs.GetProperty("row").GetInt32();
                        int col = methodArgs.GetProperty("col").GetInt32();
                        return dgv.Rows[row].Cells[col].Value;
                    }
                    if (methodName == "SetValue")
                    {
                        int row = methodArgs.GetProperty("row").GetInt32();
                        int col = methodArgs.GetProperty("col").GetInt32();
                        JsonElement valEl = methodArgs.GetProperty("value");
                        dgv.Rows[row].Cells[col].Value = valEl.ValueKind == JsonValueKind.String ? valEl.GetString() : valEl.ToString();
                        return null;
                    }
                    if (methodName == "GetSelectedRows")
                    {
                        var indices = new System.Collections.Generic.HashSet<int>();
                        foreach (DataGridViewRow row in dgv.SelectedRows)
                        {
                            indices.Add(row.Index);
                        }
                        if (indices.Count == 0)
                        {
                            foreach (DataGridViewCell cell in dgv.SelectedCells)
                            {
                                indices.Add(cell.RowIndex);
                            }
                        }
                        return System.Linq.Enumerable.ToArray(indices);
                    }
                }

                int argCount = 0;
                JsonElement argsEl = default;
                bool hasArgs = msg.Args.TryGetProperty("args", out argsEl) && argsEl.ValueKind == JsonValueKind.Array;
                if (hasArgs) argCount = argsEl.GetArrayLength();

                MethodInfo targetMethod = null;
                foreach (var m in target.GetType().GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase))
                {
                    if (m.Name.Equals(methodName, StringComparison.OrdinalIgnoreCase) && m.GetParameters().Length == argCount)
                    {
                        targetMethod = m;
                        break;
                    }
                }

                if (targetMethod == null) throw new Exception($"Method {methodName} with {argCount} arguments not found");

                object[] parameters = null;
                if (hasArgs && argCount > 0)
                {
                    var paramInfos = targetMethod.GetParameters();
                    parameters = new object[argCount];
                    int i = 0;
                    foreach (var el in argsEl.EnumerateArray())
                    {
                        parameters[i] = ConvertJsonElement(el, paramInfos[i].ParameterType);
                        i++;
                    }
                }

                object invokeResult = targetMethod.Invoke(target, parameters);
                if (invokeResult != null)
                {
                    return invokeResult.ToString();
                }
                return null;
            }



            return null;
        }

        private string SerializePoint(Point p)
        {
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var payload = new { X = p.X, Y = p.Y, IsEmpty = p.IsEmpty };
            return JsonSerializer.Serialize(payload, options);
        }

        private string SerializeSize(Size s)
        {
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var payload = new { Width = s.Width, Height = s.Height, IsEmpty = s.IsEmpty };
            return JsonSerializer.Serialize(payload, options);
        }

        private string SerializePadding(Padding p)
        {
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var payload = new { Left = p.Left, Top = p.Top, Right = p.Right, Bottom = p.Bottom, All = p.All };
            return JsonSerializer.Serialize(payload, options);
        }

        private object ConvertJsonElement(JsonElement el, Type type)
        {
            if (type == typeof(string)) return el.ToString();
            if (type == typeof(int)) return el.GetInt32();
            if (type == typeof(bool)) return el.GetBoolean();
            
            if (type.IsEnum)
            {
                if (el.ValueKind == JsonValueKind.String)
                {
                    return Enum.Parse(type, el.GetString(), true);
                }
                if (el.ValueKind == JsonValueKind.Number)
                {
                    return Enum.ToObject(type, el.GetInt32());
                }
            }

            return Convert.ChangeType(el.ToString(), type);
        }

        public Type GetControlType(string typeName)
        {
            if (_typeMap.TryGetValue(typeName, out Type controlType))
            {
                return controlType;
            }
            throw new ArgumentException($"Unknown control type: {typeName}");
        }

        private static readonly Dictionary<string, Type> _typeMap = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            ["Button"] = typeof(System.Windows.Forms.Button),
            ["Label"] = typeof(System.Windows.Forms.Label),
            ["Form"] = typeof(System.Windows.Forms.Form),
            ["TextBox"] = typeof(System.Windows.Forms.TextBox),
            ["ComboBox"] = typeof(System.Windows.Forms.ComboBox),
            ["CheckBox"] = typeof(System.Windows.Forms.CheckBox),
            ["RadioButton"] = typeof(System.Windows.Forms.RadioButton),
            ["Panel"] = typeof(System.Windows.Forms.Panel),
            ["FlowLayoutPanel"] = typeof(System.Windows.Forms.FlowLayoutPanel),
            ["TableLayoutPanel"] = typeof(System.Windows.Forms.TableLayoutPanel),
            ["GroupBox"] = typeof(System.Windows.Forms.GroupBox),
            ["ListBox"] = typeof(System.Windows.Forms.ListBox),
            ["ListView"] = typeof(System.Windows.Forms.ListView),
            ["TreeView"] = typeof(System.Windows.Forms.TreeView),
            ["TabControl"] = typeof(System.Windows.Forms.TabControl),
            ["TabPage"] = typeof(System.Windows.Forms.TabPage),
            ["MenuStrip"] = typeof(System.Windows.Forms.MenuStrip),
            ["ToolStrip"] = typeof(System.Windows.Forms.ToolStrip),
            ["StatusStrip"] = typeof(System.Windows.Forms.StatusStrip),
            ["ProgressBar"] = typeof(System.Windows.Forms.ProgressBar),
            ["TrackBar"] = typeof(System.Windows.Forms.TrackBar),
            ["NumericUpDown"] = typeof(System.Windows.Forms.NumericUpDown),
            ["DateTimePicker"] = typeof(System.Windows.Forms.DateTimePicker),
            ["MonthCalendar"] = typeof(System.Windows.Forms.MonthCalendar),
            ["PictureBox"] = typeof(System.Windows.Forms.PictureBox),
            ["DataGridView"] = typeof(System.Windows.Forms.DataGridView),
            ["ToolStripMenuItem"] = typeof(System.Windows.Forms.ToolStripMenuItem),
            ["ContextMenuStrip"] = typeof(System.Windows.Forms.ContextMenuStrip),
            ["NotifyIcon"] = typeof(System.Windows.Forms.NotifyIcon)
        };
    }
}