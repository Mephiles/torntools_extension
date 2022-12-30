function createTextbox(options = {}) {
	options = {
		description: false,
		id: getUUID(),
		type: "text",
		attributes: {},
		style: {},
		...options,
	};

	const textbox = document.newElement({ type: "input", class: "tt-textbox", id: options.id, attributes: { ...options.attributes, type: options.type }, style: options.style });

	let element;
	if (options.description) {
		element = document.newElement({ type: "div", class: "tt-textbox-wrapper" });

		if (typeof options.description === "string") {
			element.appendChild(document.newElement({ type: "label", text: options.description, attributes: { for: options.id } }));
			element.appendChild(textbox);
		} else {
			element.appendChild(document.newElement({ type: "label", text: options.description.before, attributes: { for: options.id } }));
			element.appendChild(textbox);
			element.appendChild(document.newElement({ type: "label", text: options.description.after, attributes: { for: options.id } }));
		}
	} else {
		element = textbox;
	}

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
		element,
		setValue,
		getValue,
		onChange,
		dispose,
	};
}
