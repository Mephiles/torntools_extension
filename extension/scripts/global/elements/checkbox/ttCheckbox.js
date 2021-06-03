function createCheckbox(description) {
	const id = getUUID();
	const checkbox = document.newElement({
		type: "input",
		id,
		attributes: {
			type: "checkbox",
		},
	});
	const checkboxWrapper = document.newElement({
		type: "div",
		class: "tt-checkbox-wrapper",
		children: [
			checkbox,
			document.newElement({
				type: "label",
				attributes: {
					for: id,
				},
				text: description,
			}),
		],
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
