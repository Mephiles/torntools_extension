import "./radio.css";
import { elementBuilder } from "@common/utils/functions/dom";

interface RadioOptions {
	description: string | Node;
	isHTML: boolean;
	reverseLabel: boolean;
	class: string;
}

export interface RadioObject {
	element: HTMLDivElement;
	setChecked: (isChecked: boolean) => void;
	isChecked: () => boolean;
	getValue: () => string;
	onChange: (callback: () => void) => void;
	dispose: () => void;
}

export function createRadio(name: string, value: string, partialOptions: Partial<RadioOptions> = {}): RadioObject {
	const options: RadioOptions = {
		description: "",
		isHTML: false,
		reverseLabel: false,
		class: "",
		...partialOptions,
	};

	const radio = elementBuilder({ type: "input", attributes: { type: "radio", name, value } });
	let label: HTMLElement;
	if (typeof options.description === "object") {
		label = elementBuilder({
			type: "label",
			children: [options.description],
		});
	} else {
		label = elementBuilder({
			type: "label",
			[options.isHTML ? "html" : "text"]: options.description,
		});
	}

	label.insertAdjacentElement("afterbegin", radio);

	const checkboxWrapper = elementBuilder({
		type: "div",
		class: `tt-radio-wrapper ${options.reverseLabel ? "reverse-label" : ""} ${options.class}`,
		children: [label],
		events: {
			click(event) {
				event.stopPropagation();
			},
		},
	});

	let onChangeCallback: (() => void) | undefined;

	function setChecked(isChecked: boolean) {
		radio.checked = isChecked;
	}

	function isChecked() {
		return radio.checked;
	}

	function onChange(callback: () => void) {
		onChangeCallback = callback;
		radio.addEventListener("change", _onChangeListener);
	}

	function dispose() {
		if (onChangeCallback) {
			radio.removeEventListener("change", _onChangeListener);
			onChangeCallback = undefined;
		}
	}

	function _onChangeListener() {
		onChangeCallback?.();
	}

	return {
		element: checkboxWrapper,
		setChecked,
		isChecked,
		getValue: () => value,
		onChange,
		dispose,
	};
}
