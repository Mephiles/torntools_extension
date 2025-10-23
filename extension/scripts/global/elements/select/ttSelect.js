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
	const container = document.newElement({
		type: "div",
		class: "tt-multi-select",
	});

	function renderOptions() {
		container.innerHTML = "";

		shownOptions.forEach((opt) => {
			const wrapper = document.newElement({ type: "label" });
			if (opt.disabled) wrapper.setAttribute("disabled", true);

			const checkbox = document.newElement({
				type: "input",
				value: opt.value,
				attributes: { type: "checkbox", checked: selectedValues.includes(opt.value) },
				events: {
					change: () => {
						if (checkbox.checked) {
							if (!selectedValues.includes(opt.value)) selectedValues.push(opt.value);
						} else {
							selectedValues = selectedValues.filter((v) => v !== opt.value);
						}
						if (onChangeCallback) onChangeCallback();
					},
				},
			});
			checkbox.disabled = !!opt.disabled;

			const text = document.newElement({ type: "span", text: opt.description });

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
