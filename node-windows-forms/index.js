const { WinFormsSession } = require('./NodeWinForms');

// Controls
const Form = require('./controls/Form');
const Button = require('./controls/Button');
const TextBox = require('./controls/TextBox');
const NumericUpDown = require('./controls/NumericUpDown');
const Label = require('./controls/Label');
const ComboBox = require('./controls/ComboBox');
const CheckBox = require('./controls/CheckBox');
const RadioButton = require('./controls/RadioButton');
const Panel = require('./controls/Panel');
const FlowLayoutPanel = require('./controls/FlowLayoutPanel');
const DataGridView = require('./controls/DataGridView');
const TreeView = require('./controls/TreeView');
const TreeNode = require('./controls/TreeNode');
const MenuStrip = require('./controls/MenuStrip');
const ContextMenuStrip = require('./controls/ContextMenuStrip');
const ToolStripMenuItem = require('./controls/ToolStripMenuItem');
const NotifyIcon = require('./controls/NotifyIcon');
const ListBox = require('./controls/ListBox');
const PictureBox = require('./controls/PictureBox');
const ProgressBar = require('./controls/ProgressBar');
const TrackBar = require('./controls/TrackBar');
const TabControl = require('./controls/TabControl');
const TabPage = require('./controls/TabPage');

// Types
const { Point, Size, Color, Font } = require('./controls/types/csharpTypes');

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
    NumericUpDown,
    Label,
    ComboBox,
    CheckBox,
    RadioButton,
    Panel,
    FlowLayoutPanel,
    DataGridView,
    TreeView,
    TreeNode,
    MenuStrip,
    ContextMenuStrip,
    ToolStripMenuItem,
    NotifyIcon,
    ListBox,
    PictureBox,
    ProgressBar,
    TrackBar,
    TabControl,
    TabPage,

    // Types
    Point,
    Size,
    Color,
    Font,

    MessageBox,
    OpenFileDialog,
    SaveFileDialog,
    FolderBrowserDialog
};
