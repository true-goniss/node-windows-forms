const Control = require('./Control');

class DataGridView extends Control {
    constructor(session, idOrParent) {
        super(session, idOrParent);
    }

    // Properties
    get ColumnHeadersVisible() { return this._state['ColumnHeadersVisible']; }
    set ColumnHeadersVisible(val) { this.setProperty('ColumnHeadersVisible', val); }

    get RowHeadersVisible() { return this._state['RowHeadersVisible']; }
    set RowHeadersVisible(val) { this.setProperty('RowHeadersVisible', val); }

    get AllowUserToAddRows() { return this._state['AllowUserToAddRows']; }
    set AllowUserToAddRows(val) { this.setProperty('AllowUserToAddRows', val); }

    get ReadOnly() { return this._state['ReadOnly']; }
    set ReadOnly(val) { this.setProperty('ReadOnly', val); }

    // Methods
    addColumn(name, text) {
        return this.invokeMethod('AddColumn', { name, text });
    }

    addRow(valuesArray) {
        return this.invokeMethod('AddRow', { values: valuesArray });
    }

    clearRows() {
        return this.invokeMethod('ClearRows');
    }

    async getValue(rowIndex, colIndex) {
        return await this.invokeMethod('GetValue', { row: rowIndex, col: colIndex });
    }

    async setValue(rowIndex, colIndex, value) {
        return await this.invokeMethod('SetValue', { row: rowIndex, col: colIndex, value: value });
    }

    async getSelectedRows() {
        return await this.invokeMethod('GetSelectedRows');
    }

}

Object.defineProperty(DataGridView.prototype, 'OnCellClick', DataGridView.prototype._createEventHandlerGetter('CellClick'));
Object.defineProperty(DataGridView.prototype, 'OnCellValueChanged', DataGridView.prototype._createEventHandlerGetter('CellValueChanged'));
Object.defineProperty(DataGridView.prototype, 'OnSelectionChanged', DataGridView.prototype._createEventHandlerGetter('SelectionChanged'));

module.exports = DataGridView;
