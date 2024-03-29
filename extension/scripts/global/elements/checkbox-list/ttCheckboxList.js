function createCheckboxList(options) {
	options = {
		items: {},
		orientation: "column",
		reverseLabel: false,
		useId: "",
		...options,
	};

	let selectedIds = {};
	const checkboxes = {};
	let selectionChangeCallback;

	for (const item of options.items) {
		const checkbox = options.useId
			? createCheckbox({ description: item.description, reverseLabel: options.reverseLabel, id: item.id })
			: createCheckbox({ description: item.description, reverseLabel: options.reverseLabel });

		checkbox.onChange(() => {
			if (checkbox.isChecked()) {
				selectedIds[item.id] = true;
			} else {
				delete selectedIds[item.id];
			}

			if (selectionChangeCallback) {
				selectionChangeCallback();
			}
		});
		checkboxes[item.id] = checkbox;
	}

	const checkboxWrapper = document.newElement({
		type: "div",
		class: ["tt-checkbox-list-wrapper", options.orientation === "row" ? "tt-checkbox-list-row" : "tt-checkbox-list-column"].join(" "),
		children: Object.values(checkboxes).map((checkbox) => checkbox.element),
	});

	function setSelections(selectedItemIds) {
		selectedIds = selectedItemIds.reduce((object, id) => ({ ...object, [id]: true }), {});

		for (const id in checkboxes) {
			checkboxes[id].setChecked(selectedIds[id] || false);
		}
	}

	function getSelections() {
		return Object.keys(selectedIds);
	}

	function onSelectionChange(callback) {
		selectionChangeCallback = callback;
	}

	function dispose() {
		Object.values(checkboxes).forEach((checkbox) => checkbox.dispose());
		selectionChangeCallback = undefined;
	}

	return {
		element: checkboxWrapper,
		setSelections,
		getSelections,
		onSelectionChange,
		dispose,
	};
}
