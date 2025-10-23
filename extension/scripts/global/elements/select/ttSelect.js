function createSelect(options) {
	let selectedOptionValue = options[0].value;
	let shownOptions = options;
	let onChangeCallback;

	const select = document.newElement({
		type: "select",
		children: _createOptionsElements(shownOptions),
	});

	function updateOptionsList(options, select = select) {
		// Adding the currently selected option when the current selection is not in new options.
		// Applicable when the user wants to keep the filter selection for other pages.
		if (options.every((option) => option.value !== selectedOptionValue))
			options.unshift(shownOptions.find((option) => option.value === selectedOptionValue));

		const newOptions = _createOptionsElements(options);

		// Removing all the existing options.
		while (select.firstChild) {
			select.removeChild(select.firstChild);
		}

		const documentFragment = document.createDocumentFragment();
		newOptions.forEach((newOption) => documentFragment.appendChild(newOption));
		select.appendChild(documentFragment);

		shownOptions = options;

		// Restore the previous selection.
		setSelected(selectedOptionValue);
	}

	function setSelected(optionValue) {
		const index = shownOptions.findIndex((option) => option.value === optionValue);

		if (index === -1) {
			return false;
		}

		if (shownOptions[index].disabled) {
			return false;
		}

		selectedOptionValue = optionValue;
		select.selectedIndex = index;
	}

	function getSelected() {
		return select.value;
	}

	function onChange(callback) {
		onChangeCallback = callback;
		select.addEventListener("change", _onChangeListener);
	}

	function dispose() {
		if (onChangeCallback) {
			select.removeEventListener("change", _onChangeListener);
			onChangeCallback = undefined;
		}
	}

	function _createOptionsElements(optionsLst) {
		return optionsLst.map((option) =>
			document.newElement({
				type: "option",
				attributes: {
					value: option.value,
					...(option.value === selectedOptionValue ? { selected: true } : {}),
					...(option.disabled ? { disabled: true } : {}),
				},
				text: option.description,
			})
		);
	}

	function _onChangeListener() {
		selectedOptionValue = select.value;

		if (onChangeCallback) {
			onChangeCallback();
		}
	}

	return {
		element: select,
		updateOptionsList,
		setSelected,
		getSelected,
		onChange,
		dispose,
	};
}

function createMultiSelect(options) {
	let selectedValues = Array.isArray(options.defaults) ? options.defaults : [];
	let shownOptions = options.select;
	let onChangeCallback;

	// Container for checkboxes
	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.flexDirection = "column";
	container.style.maxHeight = "100px"; // limit height
	container.style.overflowY = "auto";
	container.style.overflowX = "hidden"; // disable horizontal scrollbar
	container.style.backgroundColor = "#d0d0d0"; // light gray background
	container.style.padding = "5px";
	container.style.borderRadius = "4px";

	function renderOptions() {
		container.innerHTML = "";

		shownOptions.forEach((opt) => {
			const wrapper = document.createElement("label");
			wrapper.style.display = "flex";
			wrapper.style.alignItems = "center";
			wrapper.style.marginBottom = "4px";
			wrapper.style.cursor = opt.disabled ? "not-allowed" : "pointer";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.value = opt.value;
			checkbox.disabled = !!opt.disabled;
			checkbox.checked = selectedValues.includes(opt.value);

			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					if (!selectedValues.includes(opt.value)) selectedValues.push(opt.value);
				} else {
					selectedValues = selectedValues.filter((v) => v !== opt.value);
				}
				if (onChangeCallback) onChangeCallback();
			});

			const text = document.createElement("span");
			text.textContent = opt.description;
			text.style.marginLeft = "6px"; // spacing between checkbox and label

			wrapper.appendChild(checkbox);
			wrapper.appendChild(text);
			container.appendChild(wrapper);
		});
	}

	function setSelected(values) {
		selectedValues = Array.isArray(values) ? values : [values];
		renderOptions();
	}

	function getSelected() {
		return [...selectedValues];
	}

	function onChange(callback) {
		onChangeCallback = callback;
	}

	function updateOptionsList(newList) {
		shownOptions = newList;
		renderOptions();
	}

	renderOptions();

	return {
		element: container,
		getSelected,
		setSelected,
		onChange,
		updateOptionsList,
	};
}
