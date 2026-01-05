const COLUMN_SORT_DIRECTION = {
	Asc: "asc",
	Desc: "desc",
} as const;
type COLUMN_SORT_DIRECTION = (typeof COLUMN_SORT_DIRECTION)[keyof typeof COLUMN_SORT_DIRECTION];

type TableCellRenderer<TData> = (data: TData) => BaseElement<Node>;

type ColumnDef<T, P extends keyof T = keyof T> = {
	id: P;
	title: string;
	class?: string;
	width: number;
	sortable?: boolean;
	sortComparator?: (a: T[P], b: T[P], direction: COLUMN_SORT_DIRECTION) => number;
	cellRenderer?: TableCellRenderer<T[P]>;
	/**
	 * When provided {@link TableColumnDef.cellRenderer} is ignored
	 */
	cellRendererSelector?: (rowData: T) => TableCellRenderer<T[P]>;
};

type TableColumnDef<T, K extends keyof T = keyof T> = {
	[P in K]: ColumnDef<T, P>;
}[K];

type TableRowGroupInfo<T> = {
	groupBy: TypedKeyOf<T, string>;
	cellRenderer: TableCellRenderer<string>;
};

function stringCellRenderer(value: string | number): BaseElement<Node> {
	const element = document.createTextNode(value.toString());

	return {
		element,
		dispose: () => {},
	};
}

function createTableHeaderCell<T>(
	columnDef: TableColumnDef<T>,
	options: { stretchColumns: boolean; onColumnSorted?: (direction: COLUMN_SORT_DIRECTION) => void }
) {
	let currentDirection: COLUMN_SORT_DIRECTION;

	const sortIcon = document.newElement({
		type: "i",
		class: "fa-solid tt-table-header-cell-sort-icon tt-hidden",
	});

	const headerCellElement = document.newElement({
		type: "div",
		class: ["tt-table-header-cell", ...(columnDef.class ? [columnDef.class] : [])],
		style: {
			...(options.stretchColumns ? { minWidth: `${columnDef.width}px`, flex: "1" } : { width: `${columnDef.width}px` }),
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

	function setColumnSort(direction: COLUMN_SORT_DIRECTION) {
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

	function dispose() {
		if (columnDef.sortable) {
			headerCellElement.removeEventListener("click", _sortIconClicked);
		}
	}

	function _sortIconClicked() {
		const direction = !currentDirection
			? COLUMN_SORT_DIRECTION.Asc
			: currentDirection === COLUMN_SORT_DIRECTION.Asc
				? COLUMN_SORT_DIRECTION.Desc
				: COLUMN_SORT_DIRECTION.Asc;
		setColumnSort(direction);
		options.onColumnSorted?.(direction);
	}

	return {
		element: headerCellElement,
		setColumnSort,
		clearColumnSort,
		dispose,
	};
}

type TableHeaderCell<T> = ReturnType<typeof createTableHeaderCell<T>>;

function createTableCell<T, K extends keyof T>(rowData: T, data: T[K], columnDef: TableColumnDef<T, K>, options: { stretchCell: boolean }) {
	const cellRenderer = columnDef.cellRendererSelector ? columnDef.cellRendererSelector(rowData) : columnDef.cellRenderer;
	const cell = cellRenderer(data);
	const cellElement = document.newElement({
		type: "div",
		class: ["tt-table-row-cell", ...(columnDef.class ? [columnDef.class] : [])],
		style: {
			...(options.stretchCell ? { minWidth: `${columnDef.width}px`, flex: "1" } : { width: `${columnDef.width}px` }),
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

type TableCell<T, K extends keyof T = keyof T> = ReturnType<typeof createTableCell<T, K>>;

function createTableRow<T extends Record<string, any>>(
	rowData: T,
	tableColumnsDefs: TableColumnDef<T>[],
	options: { rowClass?: (rowData: T) => string; stretchColumns: boolean }
) {
	const rowCells = tableColumnsDefs.map((columnDef) => createTableCell(rowData, rowData[columnDef.id], columnDef, { stretchCell: options.stretchColumns }));

	const rowElement = document.newElement({
		type: "div",
		class: ["tt-table-row", ...(options.rowClass ? [options.rowClass(rowData)] : [])],
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

type TableRow<T> = ReturnType<typeof createTableRow<T>>;

function _createRowGroup<T>(groupKey: string, rowGroupInfo: TableRowGroupInfo<T>): BaseElement {
	const rowGroupCell = rowGroupInfo.cellRenderer(groupKey);
	const groupHeader = document.newElement({
		type: "div",
		class: ["tt-table-row-header"],
		children: [rowGroupCell.element],
	});

	return {
		element: groupHeader,
		dispose: () => {
			rowGroupCell.dispose();
		},
	};
}

function createTable<T>(
	tableColumnsDefs: TableColumnDef<T>[],
	tableRowsData: T[],
	options: {
		tableClass?: string;
		rowClass?: (data: T) => string;
		stretchColumns: boolean;
		rowGroupInfo?: TableRowGroupInfo<T>;
	}
) {
	options = {
		stretchColumns: false,
		...options,
	};
	let sortInfo: { columnId: keyof T; direction: COLUMN_SORT_DIRECTION } = undefined;
	let tableRows = _createTableRows(tableRowsData);

	const tableHeaders = tableColumnsDefs.map((columnDef) => {
		const headerCell = createTableHeaderCell(columnDef, {
			stretchColumns: options.stretchColumns,
			onColumnSorted: (direction) => {
				sortColumn(columnDef.id, direction);
			},
		});

		return headerCell;
	});

	const tableBodyElem = document.newElement({
		type: "div",
		class: "tt-table-body",
		children: tableRows.map((row) => row.element),
	});
	const tableElem = document.newElement({
		type: "div",
		class: ["tt-table", ...(options.tableClass ? [options.tableClass] : [])],
		children: [
			document.newElement({
				type: "div",
				class: "tt-table-header",
				children: tableHeaders.map((header) => header.element),
			}),
			tableBodyElem,
		],
	});

	function _createTableRows(data: T[]): BaseElement<Node>[] {
		const rows = data.map((rowData) =>
			createTableRow(rowData, tableColumnsDefs, {
				rowClass: options.rowClass,
				stretchColumns: options.stretchColumns,
			})
		);

		if (!options.rowGroupInfo) {
			return rows;
		}

		const groups = groupBy(rows, (row) => [getTypedKeyOf(row.data, options.rowGroupInfo.groupBy), row]);

		return Object.entries(groups).flatMap(([groupKey, rows]) => {
			const rowGroup = _createRowGroup(groupKey, options.rowGroupInfo);

			if (!sortInfo) {
				return [rowGroup, ...rows];
			}

			const sortedColumnDef = tableColumnsDefs.find((columnDef) => (columnDef.id = sortInfo.columnId));

			rows.sort((a, b) => {
				if (sortedColumnDef.sortComparator) {
					return sortedColumnDef.sortComparator(a.data[sortedColumnDef.id], b.data[sortedColumnDef.id], sortInfo.direction);
				}

				// TODO: Built in sorts for string, number, date? Throw otherwise?
				const valueA = a.data[sortedColumnDef.id];
				const valueB = b.data[sortedColumnDef.id];

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

				return comparatorResult * (sortInfo.direction === COLUMN_SORT_DIRECTION.Asc ? 1 : -1);
			});

			return [rowGroup, ...rows];
		});
	}

	function updateData(data: T[]) {
		tableRows.forEach((row) => row.dispose());
		tableRows = _createTableRows(data);

		tableBodyElem.replaceChildren(...tableRows.map((row) => row.element));
	}

	function sortColumn(columnId: keyof T, direction: COLUMN_SORT_DIRECTION) {
		if (sortInfo) {
			const colDefIndex = tableColumnsDefs.findIndex((columnDef) => (columnDef.id = sortInfo.columnId));
			tableHeaders[colDefIndex].clearColumnSort();
			sortInfo = undefined;
		}

		const colDefIndex = tableColumnsDefs.findIndex((columnDef) => (columnDef.id = columnId));

		if (colDefIndex === -1) {
			throw new Error(`ttTable: Cannot sort column ${columnId.toString()} as there is no colDef for it`);
		}

		const tableHeader = tableHeaders[colDefIndex];
		tableHeader.setColumnSort(direction);
		sortInfo = { columnId, direction };

		tableRows.forEach((row) => row.dispose());
		tableRows = _createTableRows(tableRowsData);

		tableBodyElem.replaceChildren(...tableRows.map((row) => row.element));
	}

	function dispose() {
		tableHeaders.forEach((tableHeader) => tableHeader.dispose());
		tableRows.forEach((tableRow) => tableRow.dispose());
		tableElem.remove();
	}

	return {
		element: tableElem,
		updateData,
		sortColumn,
		dispose,
	};
}

type TableElement<T> = ReturnType<typeof createTable<T>>;
