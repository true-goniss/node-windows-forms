class SaveFileDialog {
    static async show(session, options = {}) {
        const {
            filter = "All files (*.*)|*.*",
            title = "Save File",
            initialDirectory = "",
            defaultExt = ""
        } = options;

        return await session.send(null, 'saveFileDialog', { filter, title, initialDirectory, defaultExt }, { timeout: 0 });
    }
}
module.exports = SaveFileDialog;
