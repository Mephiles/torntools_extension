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
	let maxSize = options.size || 10;
	
	let onChangeCallback;

	const select = document.newElement({
		type: "select",
		attributes: { multiple: true, size: Math.min(shownOptions.length, maxSize) },
		children: _createOptionsElements(shownOptions),
	});

	// Toggle selection with click/tap
	select.addEventListener("mousedown", function (e) {
		// Prevent default selection behavior
		e.preventDefault();

		const option = e.target;
		if (option.tagName.toLowerCase() === "option" && !option.disabled) {
			option.selected = !option.selected; // Toggle selection manually

			selectedValues = [...select.selectedOptions].map((opt) => opt.value);

			if (onChangeCallback) onChangeCallback();
		}
	});

	function _createOptionsElements(list) {
		return list.map((opt) =>
			document.newElement({
				type: "option",
				attributes: {
					value: opt.value,
					...(selectedValues.includes(opt.value) ? { selected: true } : {}),
					...(opt.disabled ? { disabled: true } : {}),
				},
				text: opt.description,
			})
		);
	}

	function setSelected(values) {
		selectedValues = Array.isArray(values) ? values : [values];
		for (const opt of select.options) {
			opt.selected = selectedValues.includes(opt.value);
		}
	}

	function getSelected() {
		return [...select.selectedOptions].map((opt) => opt.value);
	}

	function onChange(callback) {
		onChangeCallback = callback;
		select.addEventListener("change", _onChangeListener);
	}

	function updateOptionsList(newList, selectEl = select) {
		const fragment = document.createDocumentFragment();
		const newOptions = _createOptionsElements(newList);
		selectEl.innerHTML = "";
		newOptions.forEach((o) => fragment.appendChild(o));
		selectEl.appendChild(fragment);
		shownOptions = newList;
		setSelected(selectedValues);
	}

	function dispose() {
		if (onChangeCallback) {
			select.removeEventListener("change", _onChangeListener);
			onChangeCallback = undefined;
		}
	}

	function _onChangeListener() {
		selectedValues = getSelected();
		if (onChangeCallback) onChangeCallback();
	}

	return {
		element: select,
		getSelected,
		setSelected,
		onChange,
		updateOptionsList,
		dispose,
	};
}