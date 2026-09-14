const { WinFormsSession } = require('./NodeWinForms');

// Controls
const Form = require('./controls/Form');
const Button = require('./controls/Button');
const TextBox = require('./controls/TextBox');
const Label = require('./controls/Label');
const ComboBox = require('./controls/ComboBox');
const CheckBox = require('./controls/CheckBox');
const Panel = require('./controls/Panel');
const FlowLayoutPanel = require('./controls/FlowLayoutPanel');
const DataGridView = require('./controls/DataGridView');
const MenuStrip = require('./controls/MenuStrip');
const ContextMenuStrip = require('./controls/ContextMenuStrip');
const ToolStripMenuItem = require('./controls/ToolStripMenuItem');
const NotifyIcon = require('./controls/NotifyIcon');
const ListBox = require('./controls/ListBox');
const PictureBox = require('./controls/PictureBox');
const ProgressBar = require('./controls/ProgressBar');
const TabControl = require('./controls/TabControl');
const TabPage = require('./controls/TabPage');

// Dialogs
const MessageBox = require('./dialogs/MessageBox');
const OpenFileDialog = require('./dialogs/OpenFileDialog');
const SaveFileDialog = require('./dialogs/SaveFileDialog');
const FolderBrowserDialog = require('./dialogs/FolderBrowserDialog');

module.exports = {
    WinFormsSession,
    Form,
    Button,
    TextBox,
    Label,
    ComboBox,
    CheckBox,
    Panel,
    FlowLayoutPanel,
    DataGridView,
    MenuStrip,
    ContextMenuStrip,
    ToolStripMenuItem,
    NotifyIcon,
    ListBox,
    PictureBox,
    ProgressBar,
    TabControl,
    TabPage,

    MessageBox,
    OpenFileDialog,
    SaveFileDialog,
    FolderBrowserDialog
};
