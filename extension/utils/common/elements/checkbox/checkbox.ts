import "./checkbox.css";
import { elementBuilder } from "@/utils/common/functions/dom";
import { getUUID } from "@/utils/common/functions/utilities";

interface CheckboxOptions {
	description: string | Node;
	isHTML: boolean;
	reverseLabel: boolean;
	id: string;
	class: string;
}

export interface CheckboxObject {
	element: HTMLDivElement;
	setChecked: (isChecked: boolean) => void;
	isChecked: () => boolean;
	onChange: (callback: () => void) => void;
	dispose: () => void;
}

export function createCheckbox(partialOptions: Partial<CheckboxOptions> = {}): CheckboxObject {
	const options: CheckboxOptions = {
		description: "",
		isHTML: false,
		reverseLabel: false,
		id: getUUID(),
		class: "",
		...partialOptions,
	};

	const checkbox = elementBuilder({ type: "input", id: options.id, attributes: { type: "checkbox" } });
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

	label.insertAdjacentElement("afterbegin", checkbox);

	const checkboxWrapper = elementBuilder({
		type: "div",
		class: `tt-checkbox-wrapper ${options.reverseLabel ? "reverse-label" : ""} ${options.class}`,
		children: [label],
		events: {
			click(event) {
				event.stopPropagation();
			},
		},
	});

	let onChangeCallback: () => void;

	function setChecked(isChecked: boolean) {
		checkbox.checked = isChecked;
	}

	function isChecked() {
		return checkbox.checked;
	}

	function onChange(callback: () => void) {
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
