function createCheckbox(options = {}) {
	options = {
		description: "",
		reverseLabel: false,
		id: getUUID(),
		...options,
	};

	const checkbox = document.newElement({ type: "input", id: options.id, attributes: { type: "checkbox" } });
	const checkboxWrapper = document.newElement({
		type: "div",
		class: "tt-checkbox-wrapper",
		children: [
			...(!options.reverseLabel ? [checkbox] : []),
			document.newElement({ type: "label", text: options.description, attributes: { for: options.id } }),
			...(options.reverseLabel ? [checkbox] : []),
		],
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
