function createTableHeaderCell(columnDef, options) {
	let columnSortedCallback;
	let currentDirection;

	const sortIcon = document.newElement({
		type: "i",
		class: "fas tt-table-header-cell-sort-icon tt-hidden",
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
