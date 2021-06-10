function createTableRow(rowData, tableColumnsDefs, options) {
	const rowCells = tableColumnsDefs.map((columnDef) =>
		createTableCell(rowData[columnDef.id], columnDef, options.cellRenderers[columnDef.cellRenderer], options)
	);

	const rowElement = document.newElement({
		type: "div",
		class: ["tt-table-row", ...(options.rowClass ? [options.rowClass(rowData)] : [])].join(" "),
		children: rowCells.map((cell) => cell.element),
	});

	function dispose() {
		rowCells.forEach((rowCell) => rowCell.dispose());
	}

	return {
		element: rowElement,
		data: rowData,
		dispose,
	};
}
