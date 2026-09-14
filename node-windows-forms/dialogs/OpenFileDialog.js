class OpenFileDialog {
    static async show(session, options = {}) {
        const {
            filter = "All files (*.*)|*.*",
            title = "Open File",
            multiselect = false,
            initialDirectory = ""
        } = options;

        const resultStr = await session.send(null, 'openFileDialog', { filter, title, multiselect, initialDirectory }, { timeout: 0 });
        if (resultStr) {
            return JSON.parse(resultStr);
        }
        return null; // Canceled
    }
}
module.exports = OpenFileDialog;
