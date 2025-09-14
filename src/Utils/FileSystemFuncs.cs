
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

    public static async Task<bool> FileWriteInt(string path, int value)
    {
        return await FileWriteAllText(path, value.ToString());
    }

    static async Task<bool> FileWriteAllText(string path, string content)
    {
        bool accessSuccess = false;
        do
        {
            string directory = (new System.IO.DirectoryInfo(path)).Parent.FullName;
            System.IO.Directory.CreateDirectory(directory);

            try
            {
                System.IO.File.WriteAllText(path, content);
                accessSuccess = true;
            }
            catch (Exception ex) { await Task.Delay(100); }
        }
        while (!accessSuccess);

        return accessSuccess;
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