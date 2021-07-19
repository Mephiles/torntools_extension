function createTextbox() {
	const textbox = document.newElement({ type: "input", class: "tt-textbox", attributes: { type: "text" } });

	let onChangeCallback;

	function setValue(value) {
		textbox.value = value;
	}

	function getValue() {
		return textbox.value;
	}

	function onChange(callback) {
		onChangeCallback = callback;
		textbox.addEventListener("input", _onChangeListener);
	}

	function dispose() {
		if (onChangeCallback) {
			textbox.removeEventListener("input", _onChangeListener);
			onChangeCallback = undefined;
		}
	}

	function _onChangeListener() {
		onChangeCallback();
	}

	return {
		element: textbox,
		setValue,
		getValue,
		onChange,
		dispose,
	};
}
