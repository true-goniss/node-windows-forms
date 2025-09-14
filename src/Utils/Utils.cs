using System;
using System.IO;
using System.Text;

public static class Utils
{
    // ----------- text ----------- //

    public static string getStringTabs(int count, int tabSize = 4)
    {
        if (count <= 0 || tabSize <= 0)
            return string.Empty;

        return new string(' ', count * tabSize);
    }

    public static string newLine()
    {
        return Environment.NewLine;
    }

    public static string newLineDouble()
    {
        return newLine() + newLine();
    }

    public static void WriteTextToFile(string filePath, string text, Encoding encoding)
    {
        using (StreamWriter writer = new StreamWriter(filePath, false, encoding))
        {
            writer.Write(text);
        }
    }

    public static string DeleteLastSymbol(string input, char symbol)
    {
        int lastIndex = input.LastIndexOf(symbol);
        if (lastIndex >= 0)
        {
            return input.Remove(lastIndex, 1);
        }
        else
        {
            return input;
        }
    }

    public static string GetExecutablePath()
    {
        return Path.GetFullPath(Application.ExecutablePath).Replace(@"\", @"\\").Replace(@"/", @"\\");
    }

    // ----------- controls ----------- //


    public static Dictionary<string, Control> TraverseSubControlsWithTag(Control ctrl, string tag)
    {
        Dictionary<string, Control> controls = new ();
        TraverseSubControlsWithTagInternal(ctrl, tag, controls);
        return controls;
    }

    private static void TraverseSubControlsWithTagInternal(Control ctrl, string tag, Dictionary<string, Control> controls)
    {
        if (ctrl == null || controls == null) return;

        foreach (Control childCtrl in ctrl.Controls)
        {
            if (childCtrl == null) continue;

            string controlTag = childCtrl.Tag?.ToString() ?? "null";
            string controlName = childCtrl.Name ?? string.Empty;

            if (controlTag == tag && !string.IsNullOrEmpty(controlName))
            {
                if (!controls.ContainsKey(controlName))
                    controls[controlName] = childCtrl;
            }

            if (childCtrl is TabControl tabControl)
            {
                foreach (TabPage tabPage in tabControl.TabPages)
                {
                    TraverseSubControlsWithTagInternal(tabPage, tag, controls);
                }
            }

            TraverseSubControlsWithTagInternal(childCtrl, tag, controls);
        }
    }

    // ----------- misc ----------- //

    public static int FindFreePort()
    {
        System.Net.Sockets.TcpListener listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();
        int port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}
