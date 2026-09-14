class FolderBrowserDialog {
    static async show(session, options = {}) {
        const {
            description = "",
            selectedPath = "",
            showNewFolderButton = true
        } = options;

        return await session.send(null, 'folderBrowserDialog', { 
            description, 
            selectedPath, 
            showNewFolderButton 
        }, { timeout: 0 });
    }
}
module.exports = FolderBrowserDialog;
