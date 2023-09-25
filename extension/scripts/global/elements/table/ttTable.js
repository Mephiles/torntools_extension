const COLUMN_SORT_DIRECTION = {
	Asc: "asc",
	Desc: "desc",
};

function stringCellRenderer(value) {
	const element = document.createTextNode(value);

	return {
		element,
		dispose: () => {},
	};
}

function createTable(tableColumnsDefs, tableRowsData, options = {}) {
	options = {
		stretchColumns: false,
		class: false,
		...options,
		cellRenderers: {
			...options.cellRenderers,
			string: stringCellRenderer,
		},
	};
	let currentSortedHeaderCell;

	const tableHeaders = tableColumnsDefs.map((columnDef) => {
		const headerCell = createTableHeaderCell(columnDef, options);

		headerCell.onColumnSorted((direction) => {
			if (currentSortedHeaderCell && currentSortedHeaderCell !== headerCell) {
				currentSortedHeaderCell.clearColumnSort();
			}

			currentSortedHeaderCell = headerCell;
			sortColumn(columnDef, direction);
		});

		return headerCell;
	});
	const tableRows = tableRowsData.map((rowData) => createTableRow(rowData, tableColumnsDefs, options));

	const tableBodyElem = document.newElement({
		type: "div",
		class: "tt-table-body",
		children: tableRows.map((row) => row.element),
	});
	const tableElem = document.newElement({
		type: "div",
		class: ["tt-table", ...(options.class ? [options.class] : [])],
		children: [
			document.newElement({
				type: "div",
				class: "tt-table-header",
				children: tableHeaders.map((header) => header.element),
			}),
			tableBodyElem,
		],
	});

	function updateData(data) {
		const newRows = data.map((rowData) => createTableRow(rowData, tableColumnsDefs, options));

		tableBodyElem.replaceChildren();
		newRows
			.map((row) => row.element)
			.forEach((row) => {
				tableBodyElem.appendChild(row);
			});
	}

	function sortColumn(columnDef, direction) {
		tableRows.sort((a, b) => {
			if (columnDef.sortComparator) {
				return columnDef.sortComparator(a.data[columnDef.id], b.data[columnDef.id], direction);
			}

			const valueSelector = columnDef.valueSelector ? columnDef.valueSelector : (fieldValue) => fieldValue;
			const valueA = valueSelector(a.data[columnDef.id]);
			const valueB = valueSelector(b.data[columnDef.id]);

			let comparatorResult = 0;

			if (valueA !== null && valueB !== null) {
				if (valueA > valueB) {
					comparatorResult = 1;
				} else if (valueA < valueB) {
					comparatorResult = -1;
				}
			} else if (valueA !== null) {
				comparatorResult = 1;
			} else if (valueB !== null) {
				comparatorResult = -1;
			}

			return comparatorResult * (direction === COLUMN_SORT_DIRECTION.Asc ? 1 : -1);
		});

		for (const tableRow of tableRows) {
			tableBodyElem.appendChild(tableRow.element);
		}
	}

	function dispose() {
		tableHeaders.forEach((tableHeader) => tableHeader.dispose());
		tableRows.forEach((tableRow) => tableRow.dispose());
	}

	return {
		element: tableElem,
		updateData,
		sortColumn,
		dispose,
	};
}
