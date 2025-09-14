using System;
using System.IO;
using System.Text;

public static class Utils
{
    // ----------- text ----------- //

    public static string getStringTabs(int quan)
    {
        string tabs = "";

        for (int i = 1; i < quan; i++)
        {
            tabs += "   ";
        }
        return tabs;
    }

    public static string tabSeveralTimesString(int count)
    {
        string res = "";

        for (int i = 0; i < count; i++)
        {
            res += "    ";
        }

        return res;
    }

    public static string newLineDouble()
    {
        return Environment.NewLine + Environment.NewLine;
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
}