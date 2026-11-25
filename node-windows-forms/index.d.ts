declare module "node-windows-forms" {
    
    export interface SessionOptions {
        executablePath?: string;
        pipeName?: string;
    }

    export class WinFormsSession {
        constructor(options?: SessionOptions);
        start(): Promise<void>;
        stop(): void;
        
        /** Internal method used by controls */
        send(target: string | null, action: string, args?: any, options?: any): Promise<any>;
    }

    export class EventCallback<T = any> {
        Attach(callback: (event: T) => void | Promise<void>): void;
    }

    export class Control {
        constructor(session: WinFormsSession, parent?: Control, typeName?: string);
        id: string;
        session: WinFormsSession;
        
        Name: string;
        Text: string;
        Width: number;
        Height: number;
        Left: number;
        Top: number;
        Visible: boolean;
        Enabled: boolean;
        Dock: "None" | "Top" | "Bottom" | "Left" | "Right" | "Fill";
        BackColor: string;
        ForeColor: string;

        setLocation(x: number, y: number): Promise<void>;
        setSize(width: number, height: number): Promise<void>;
        focus(): Promise<boolean>;

        OnClick: EventCallback;
        OnDoubleClick: EventCallback;
        OnResize: EventCallback;
        OnSizeChanged: EventCallback;
    }

    export class Form extends Control {
        constructor(session: WinFormsSession);
        show(): Promise<void>;
        showDialog(): Promise<void>;
        hide(): Promise<void>;
        close(): Promise<void>;

        OnFormClosed: EventCallback<{ CloseReason: string }>;
    }

    export class Button extends Control {
        constructor(session: WinFormsSession, parent?: Control);
    }

    export class Label extends Control {
        constructor(session: WinFormsSession, parent?: Control);
    }

    export class TextBox extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        Multiline: boolean;
        ReadOnly: boolean;
        ScrollBars: "None" | "Horizontal" | "Vertical" | "Both";
        appendText(text: string): Promise<void>;
        clear(): Promise<void>;

        OnTextChanged: EventCallback;
    }

    export class NumericUpDown extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        Value: number;
        Minimum: number;
        Maximum: number;
        DecimalPlaces: number;
        Increment: number;
        Hexadecimal: boolean;
        ThousandsSeparator: boolean;
        OnValueChanged: EventCallback;
    }

    export class CheckBox extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        Checked: boolean;
        OnCheckedChanged: EventCallback<{ value: boolean }>;
    }

    export class RadioButton extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        Checked: boolean;
        OnCheckedChanged: EventCallback<{ value: boolean }>;
    }

    export class ComboBox extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        SelectedIndex: number;
        setItems(items: string[]): Promise<void>;
        OnSelectedIndexChanged: EventCallback<{ value: number }>;
    }

    export class Panel extends Control {
        constructor(session: WinFormsSession, parent?: Control);
    }

    export class FlowLayoutPanel extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        FlowDirection: "LeftToRight" | "TopDown" | "RightToLeft" | "BottomUp";
        WrapContents: boolean;
    }

    export class DataGridView extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        AllowUserToAddRows: boolean;
        
        addColumn(name: string, text: string): Promise<void>;
        addRow(values: any[]): Promise<void>;
        clearRows(): Promise<void>;
        
        getValue(rowIndex: number, colIndex: number): Promise<any>;
        setValue(rowIndex: number, colIndex: number, value: any): Promise<void>;
        getSelectedRows(): Promise<number[]>;

        OnCellClick: EventCallback<{ rowIndex: number, columnIndex: number }>;
        OnCellValueChanged: EventCallback<{ rowIndex: number, columnIndex: number }>;
        OnSelectionChanged: EventCallback;
    }

    export interface TreeNodeDescriptor {
        id: string;
        text: string;
        tag?: string;
        parentId?: string | null;
        level: number;
        isExpanded: boolean;
        checked: boolean;
        index: number;
        fullPath: string;
        childCount: number;
    }

    export interface TreeViewNodeSpec {
        text: string;
        tag?: string;
        nodes?: TreeViewNodeSpec[];
    }

    export class TreeView extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        CheckBoxes: boolean;
        ShowLines: boolean;
        ShowRootLines: boolean;
        ShowPlusMinus: boolean;
        FullRowSelect: boolean;
        Scrollable: boolean;
        HideSelection: boolean;
        Indent: number;
        ItemHeight: number;
        PathSeparator: string;

        addNode(textOrSpec: string | TreeViewNodeSpec): Promise<TreeNode>;
        addNodes(nodes: TreeViewNodeSpec[]): Promise<TreeNode[]>;
        clearNodes(): Promise<void>;
        getNodes(parentId?: string): Promise<TreeNode[]>;
        getSelectedNode(): Promise<TreeNode | null>;
        setSelectedNode(nodeOrId: TreeNode | string): Promise<void>;
        expandAll(): Promise<void>;
        collapseAll(): Promise<void>;
        nodeFromDescriptor(descriptor: TreeNodeDescriptor): TreeNode | null;

        OnAfterSelect: EventCallback<{ node: TreeNodeDescriptor, action: string }>;
        OnBeforeExpand: EventCallback<{ node: TreeNodeDescriptor, action: string }>;
        OnAfterExpand: EventCallback<{ node: TreeNodeDescriptor, action: string }>;
        OnAfterCollapse: EventCallback<{ node: TreeNodeDescriptor, action: string }>;
        OnNodeMouseClick: EventCallback<{ node: TreeNodeDescriptor, location: { x: number, y: number }, button: string, clicks: number }>;
        OnNodeMouseDoubleClick: EventCallback<{ node: TreeNodeDescriptor, location: { x: number, y: number }, button: string, clicks: number }>;
    }

    export class TreeNode {
        constructor(session: WinFormsSession, id: string, treeView: TreeView, descriptor?: TreeNodeDescriptor);
        id: string;
        treeView: TreeView;
        info: TreeNodeDescriptor | null;
        Text: string;
        Checked: boolean;
        readonly tag: string | undefined;
        readonly level: number | undefined;
        readonly fullPath: string | undefined;

        getText(): Promise<string>;
        isChecked(): Promise<boolean>;
        setTag(tag: string): Promise<void>;
        addNode(textOrSpec: string | TreeViewNodeSpec): Promise<TreeNode>;
        addNodes(nodes: TreeViewNodeSpec[]): Promise<TreeNode[]>;
        nodes(): Promise<TreeNode[]>;
        getParent(): Promise<TreeNode | null>;
        remove(): Promise<void>;
        expand(): Promise<void>;
        expandAll(): Promise<void>;
        collapse(): Promise<void>;
        select(): Promise<void>;
        refresh(): Promise<TreeNodeDescriptor>;
    }

    export class MenuStrip extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        addMenu(text: string): ToolStripMenuItem;
    }

    export class ContextMenuStrip extends Control {
        constructor(session: WinFormsSession);
        addMenuItem(text: string): ToolStripMenuItem;
    }

    export class ToolStripMenuItem extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        addMenuItem(text: string): ToolStripMenuItem;
    }

    export class NotifyIcon extends Control {
        constructor(session: WinFormsSession);
        Icon: string;
        ContextMenuStrip: string;
    }

    export class ListBox extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        SelectedIndex: number;
        setItems(items: string[]): Promise<void>;
        OnSelectedIndexChanged: EventCallback<{ value: number }>;
    }

    export class PictureBox extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        ImageLocation: string;
        SizeMode: "Normal" | "StretchImage" | "AutoSize" | "CenterImage" | "Zoom";
    }

    export class ProgressBar extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        Value: number;
        Minimum: number;
        Maximum: number;
    }

    export class TrackBar extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        Value: number;
        Minimum: number;
        Maximum: number;
        TickFrequency: number;
        Orientation: "Horizontal" | "Vertical";
        SmallChange: number;
        LargeChange: number;
        OnValueChanged: EventCallback;
        OnScroll: EventCallback;
    }

    export class TabControl extends Control {
        constructor(session: WinFormsSession, parent?: Control);
        SelectedIndex: number;
        OnSelectedIndexChanged: EventCallback<{ value: number }>;
    }

    export class TabPage extends Control {
        constructor(session: WinFormsSession, parent?: Control);
    }

    export interface MessageBoxOptions {
        text: string;
        caption?: string;
        buttons?: "OK" | "OKCancel" | "YesNo" | "YesNoCancel" | "RetryCancel" | "AbortRetryIgnore";
        icon?: "None" | "Hand" | "Question" | "Exclamation" | "Asterisk" | "Stop" | "Error" | "Warning" | "Information";
    }

    export class MessageBox {
        static show(session: WinFormsSession, text: string, caption?: string, buttons?: string, icon?: string): Promise<string>;
        static show(session: WinFormsSession, options: MessageBoxOptions): Promise<string>;
    }

    export interface FileDialogOptions {
        title?: string;
        filter?: string;
        initialDirectory?: string;
    }

    export interface OpenFileDialogOptions extends FileDialogOptions {
        multiselect?: boolean;
    }

    export class OpenFileDialog {
        static show(session: WinFormsSession, options?: OpenFileDialogOptions): Promise<string[] | null>;
    }

    export class SaveFileDialog {
        static show(session: WinFormsSession, options?: FileDialogOptions): Promise<string | null>;
    }

    export interface FolderBrowserDialogOptions {
        description?: string;
        selectedPath?: string;
        showNewFolderButton?: boolean;
    }

    export class FolderBrowserDialog {
        static show(session: WinFormsSession, options?: FolderBrowserDialogOptions): Promise<string | null>;
    }
}
