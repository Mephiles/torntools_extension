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

function createTableHeaderCell(columnDef, options) {
	let columnSortedCallback;
	let currentDirection;

	const sortIcon = document.newElement({
		type: "i",
		class: "fa-solid tt-table-header-cell-sort-icon tt-hidden",
	});

	const headerCellElement = document.newElement({
		type: "div",
		class: ["tt-table-header-cell", ...(columnDef.class ? [columnDef.class] : [])],
		style: {
			...(options.stretchColumns ? { minWidth: `${columnDef.width}px`, flex: 1 } : { width: `${columnDef.width}px` }),
		},
		children: [
			document.newElement({
				type: "span",
				text: columnDef.title,
				class: "tt-table-header-cell-title",
			}),
			sortIcon,
		],
	});

	if (columnDef.sortable) {
		headerCellElement.addEventListener("click", _sortIconClicked);
		headerCellElement.classList.add("tt-table-header-cell-clickable");
	}

	function setColumnSort(direction) {
		if (!columnDef.sortable) {
			return;
		}

		currentDirection = direction;
		sortIcon.classList.remove("tt-hidden");

		if (direction === COLUMN_SORT_DIRECTION.Asc) {
			sortIcon.classList.remove("fa-caret-up");
			sortIcon.classList.add("fa-caret-down");
		} else {
			sortIcon.classList.remove("fa-caret-down");
			sortIcon.classList.add("fa-caret-up");
		}
	}

	function clearColumnSort() {
		sortIcon.classList.add("tt-hidden");
	}

	function onColumnSorted(callback) {
		columnSortedCallback = callback;
	}

	function dispose() {
		if (columnDef.sortable) {
			headerCellElement.removeEventListener("click", _sortIconClicked);
		}

		columnSortedCallback = undefined;
	}

	function _sortIconClicked() {
		const direction = !currentDirection
			? COLUMN_SORT_DIRECTION.Asc
			: currentDirection === COLUMN_SORT_DIRECTION.Asc
				? COLUMN_SORT_DIRECTION.Desc
				: COLUMN_SORT_DIRECTION.Asc;
		setColumnSort(direction);
		columnSortedCallback(direction);
	}

	return {
		element: headerCellElement,
		setColumnSort,
		clearColumnSort,
		onColumnSorted,
		dispose,
	};
}

function createTableCell(data, columnDef, cellRenderer, options) {
	const cell = cellRenderer(data);
	const cellElement = document.newElement({
		type: "div",
		class: ["tt-table-row-cell", ...(columnDef.class ? [columnDef.class] : [])],
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
