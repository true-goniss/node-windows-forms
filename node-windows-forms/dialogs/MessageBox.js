class MessageBox {
    static async show(session, textOrOptions, caption = "", buttons = "OK", icon = "None") {
        if (typeof textOrOptions === 'object') {
            return await session.send(null, 'messageBox', {
                text: textOrOptions.text || "",
                caption: textOrOptions.caption || "",
                buttons: textOrOptions.buttons || "OK",
                icon: textOrOptions.icon || "None"
            }, { timeout: 0 });
        }
        return await session.send(null, 'messageBox', { text: textOrOptions, caption, buttons, icon }, { timeout: 0 });
    }
}
module.exports = MessageBox;
