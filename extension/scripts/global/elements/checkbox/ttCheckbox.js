function createCheckbox(options = {}) {
	options = {
		description: "",
		isHTML: false,
		reverseLabel: false,
		id: getUUID(),
		class: "",
		...options,
	};

	const checkbox = document.newElement({ type: "input", id: options.id, attributes: { type: "checkbox" } });
	const label = document.newElement({
		type: "label",
		[options.isHTML ? "html" : "text"]: options.description,
	});
	label.insertAdjacentElement("afterbegin", checkbox);

	const checkboxWrapper = document.newElement({
		type: "div",
		class: `tt-checkbox-wrapper ${options.reverseLabel ? "reverse-label" : ""} ${options.class}`,
		children: [label],
		events: {
			click(event) {
				event.stopPropagation();
			},
		},
	});

	let onChangeCallback;

	function setChecked(isChecked) {
		checkbox.checked = isChecked;
	}

	function isChecked() {
		return checkbox.checked;
	}

	function onChange(callback) {
		onChangeCallback = callback;
		checkbox.addEventListener("change", _onChangeListener);
	}

	function dispose() {
		if (onChangeCallback) {
			checkbox.removeEventListener("change", _onChangeListener);
			onChangeCallback = undefined;
		}
	}

	function _onChangeListener() {
		onChangeCallback();
	}

	return {
		element: checkboxWrapper,
		setChecked,
		isChecked,
		onChange,
		dispose,
	};
}
