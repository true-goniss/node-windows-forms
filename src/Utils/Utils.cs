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
        Dictionary<string, Control> controls = new Dictionary<string, Control>();

        foreach (Control childCtrl in ctrl.Controls)
        {
            string controlTag = (childCtrl.Tag == null) ? "null" : childCtrl.Tag.ToString();

            if (controlTag == tag && childCtrl.Name != "")
            {
                try
                {
                    controls.Add(childCtrl.Name, childCtrl);
                }
                catch (Exception ee) { }
            }

            if (childCtrl is System.Windows.Forms.Timer)
            {
                string h = "";
            }

            if (childCtrl is TabControl)
            {
                TabControl tc = childCtrl as TabControl;

                foreach (TabPage tabPage in tc.TabPages)
                {
                    controls.Concat(TraverseSubControlsWithTag(tabPage, tag));
                }
            }

            controls.Concat(TraverseSubControlsWithTag(childCtrl, tag));
        }

        return controls;
    }
}