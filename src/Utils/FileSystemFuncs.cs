
static class FileSystemFuncs
{
    public static async Task<int> FileReadInt(string path)
    {
        string text = await FileReadAllText(path);

        if (text == "")
        {
            return 0;
        }
        else
        {
            try
            {
                return Convert.ToInt32(text);
            }
            catch (Exception)
            {
                return 0;
            }
        }
    }

    // this is bad
    public static async Task<bool> FileWriteInt(string path, int value)
    {        
        await WriteFileWithRetries(
            path,
            () => Task.Run(() => File.WriteAllText(path, value.ToString())),
            maxRetries: -1,
            createDirectory: true,
            showFinalErrorMessage: false
        );

        return true;
    }

    public static async Task<bool> WriteFileWithRetries(
    string path,
    Func<Task> writeAction,
    int maxRetries = -1,
    bool createDirectory = false,
    bool showFinalErrorMessage = false,
    string finalErrorMessage = "",
    int delayMs = 1000)
    {
        if (createDirectory)
        {
            string directory = Path.GetDirectoryName(path);
            Directory.CreateDirectory(directory);
        }

        int attempts = 0;
        while (maxRetries == -1 || attempts < maxRetries)
        {
            try
            {
                await writeAction();
                return true;
            }
            catch (Exception)
            {
                attempts++;
                await Task.Delay(delayMs);
            }
        }

        if (showFinalErrorMessage)
        {
            MessageBox.Show(finalErrorMessage);
        }
        return false;
    }


static async Task<string> FileReadAllText(string path)
    {
        if (System.IO.File.Exists(path))
        {
            bool accessSuccess = false;
            do
            {
                EnsureFileDirectory(path);

                try
                {
                    string res = File.ReadAllText(path);
                    return res;
                }
                catch (Exception ex) { await Task.Delay(100); }
            }
            while (!accessSuccess);
        }

        return "";
    }

    static void EnsureFileDirectory(string filePath)
    {
        string directory = (new System.IO.DirectoryInfo(filePath)).Parent.FullName;
        System.IO.Directory.CreateDirectory(directory);
    }
}