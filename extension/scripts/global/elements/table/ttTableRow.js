function createTableRow(rowData, tableColumnsDefs, options) {
	let isHeader = options.hasHeaders && "header" in rowData;

	let rowCells;
	if (isHeader) {
		rowCells = [createTableCell(rowData.header, { width: 0 }, options.cellRenderers[rowData.cellRenderer ?? "string"], options)];
	} else {
		rowCells = tableColumnsDefs.map((columnDef) =>
			createTableCell(rowData[columnDef.id], columnDef, options.cellRenderers[rowData.cellRenderer ?? columnDef.cellRenderer], options)
		);
	}

	const rowElement = document.newElement({
		type: "div",
		class: ["tt-table-row", ...[options.rowClass ? options.rowClass(rowData, isHeader) : null, isHeader ? "tt-table-row-header" : null]],
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
