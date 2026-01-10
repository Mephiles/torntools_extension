interface TextboxOptions {
	description: string | { before?: string; after?: string } | null;
	id: string;
	type: "text" | "number";
	attributes: { [key: string]: string };
	style: { [key: string]: string };
}

function createTextbox(partialOptions: Partial<TextboxOptions> = {}) {
	const options: TextboxOptions = {
		description: null,
		id: getUUID(),
		type: "text",
		attributes: {},
		style: {},
		...partialOptions,
	};

	const textbox = document.newElement({
		type: "input",
		class: "tt-textbox",
		id: options.id,
		attributes: { ...options.attributes, type: options.type },
		style: options.style,
	});

	let element: HTMLElement;
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

	let onChangeCallback: () => void | undefined;

	function setValue(value: string) {
		textbox.value = value;
	}

	function setNumberValue(value: string | number | null) {
		if (value === null || isNaN(parseInt(value.toString())) || !["string", "number"].includes(typeof value)) value = "";

		textbox.value = value.toString();
	}

	function getValue() {
		return textbox.value;
	}

	function onChange(callback: () => void) {
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
		setNumberValue,
		getValue,
		onChange,
		dispose,
	};
}
