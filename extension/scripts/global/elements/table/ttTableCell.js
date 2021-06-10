function createTableCell(data, columnDef, cellRenderer, options) {
	const cell = cellRenderer(data);
	const cellElement = document.newElement({
		type: "div",
		class: "tt-table-row-cell",
		style: {
			...(options.stretchColumns ? { minWidth: `${columnDef.width}px`, flex: 1 } : { width: `${columnDef.width}px` }),
		},
		children: [cell.element],
	});

	function dispose() {
		cell.dispose();
	}

	return {
		element: cellElement,
		dispose,
	};
}
