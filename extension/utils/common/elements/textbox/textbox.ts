import "./textbox.css";
import { getUUID } from "@/utils/common/functions/utilities";
import { elementBuilder } from "@/utils/common/functions/dom";

interface TextboxOptions {
	description: string | { before?: string; after?: string } | null;
	id: string;
	type: "text" | "number";
	attributes: { [key: string]: string };
	style: { [key: string]: string };
}

type TextboxFilter = {
	setValue: (value: string) => void;
	setNumberValue: (value: string | number | null) => void;
	getValue: () => string;
	onChange: (callback: () => void) => void;
	dispose: () => void;
};
type TextboxWithDescriptionFilter = TextboxFilter & { element: HTMLElement };
export type TextboxWithoutDescriptionFilter = TextboxFilter & { element: HTMLInputElement };

export function createTextbox(partialOptions: Partial<Omit<TextboxOptions, "description">>): TextboxWithoutDescriptionFilter;
export function createTextbox(partialOptions: Partial<TextboxOptions>): TextboxWithDescriptionFilter;

export function createTextbox(partialOptions: Partial<TextboxOptions>): TextboxWithDescriptionFilter | TextboxWithoutDescriptionFilter {
	const options: TextboxOptions = {
		description: null,
		id: getUUID(),
		type: "text",
		attributes: {},
		style: {},
		...partialOptions,
	};

	const textbox = elementBuilder({
		type: "input",
		class: "tt-textbox",
		id: options.id,
		attributes: { ...options.attributes, type: options.type },
		style: options.style,
	});

	let element: HTMLElement;
	if (options.description) {
		element = elementBuilder({ type: "div", class: "tt-textbox-wrapper" });

		if (typeof options.description === "string") {
			element.appendChild(elementBuilder({ type: "label", text: options.description, attributes: { for: options.id } }));
			element.appendChild(textbox);
		} else {
			element.appendChild(elementBuilder({ type: "label", text: options.description.before, attributes: { for: options.id } }));
			element.appendChild(textbox);
			element.appendChild(elementBuilder({ type: "label", text: options.description.after, attributes: { for: options.id } }));
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
