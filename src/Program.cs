using System;
using System.Windows.Forms;
using NodeWindowsForms.Core;

namespace NodeWindowsForms
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            ApplicationConfiguration.Initialize();
            var mainForm = new Form();
            try { mainForm.Icon = System.Drawing.Icon.ExtractAssociatedIcon(System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName); } catch { }
            mainForm.Name = "Form1"; // Important for default manifest registration
            
            string pipeName = "DefaultWinFormsPipe";
            bool isSpawnMode = false;
            
            if (args.Length > 0)
            {
                pipeName = args[0];
            }
            if (args.Length > 1 && args[1] == "--spawn")
            {
                isSpawnMode = true;
            }

            // The IpcHost takes over the form and starts the background loop
            var host = new NodeWindowsForms.Core.IpcHost(mainForm, pipeName, isSpawnMode);
            host.StartLoop();

            Application.Run(mainForm);
        }
    }
}
