namespace DesignerApp;

static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        
        var mainForm = new Form1();
        mainForm.Name = "Form1"; 
        
        // Start IPC Host in Attach Mode
        var host = new NodeWindowsForms.Core.IpcHost(mainForm, "DesignerAppPipe", false);
        host.StartLoop();
        
        Application.Run(mainForm);
    }    
}