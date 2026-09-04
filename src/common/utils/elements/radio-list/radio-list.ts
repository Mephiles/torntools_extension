import "./radio-list.css";
import { createRadio } from "@common/utils/elements/radio/radio.ts";
import type { RadioObject } from "@common/utils/elements/radio/radio.ts";
import { elementBuilder } from "@common/utils/functions/dom";

interface RadioListOptions {
	items: { value: string; description: string }[];
	orientation: "column" | "row";
	reverseLabel: boolean;
}

export function createRadioList(name: string, partialOptions: Partial<RadioListOptions>) {
	const options: RadioListOptions = {
		items: [],
		orientation: "column",
		reverseLabel: false,
		...partialOptions,
	};

	const radios: { [value: string]: RadioObject } = {};
	let selectionChangeCallback: (() => void) | undefined;

	for (const item of options.items) {
		const radio = createRadio(name, item.value, { description: item.description, reverseLabel: options.reverseLabel });

		radio.onChange(() => {
			if (selectionChangeCallback) {
				selectionChangeCallback();
			}
		});
		radios[item.value] = radio;
	}

	const radioWrapper = elementBuilder({
		type: "div",
		class: ["tt-radio-list-wrapper", options.orientation === "row" ? "tt-radio-list-row" : "tt-radio-list-column"].join(" "),
		children: Object.values(radios).map((radio) => radio.element),
	});

	function setValue(value: string) {
		radios[value]!.setChecked(true);
	}

	function getValue() {
		return Object.values(radios)
			.find((radio) => radio.isChecked())!
			.getValue();
	}

	function onSelectionChange(callback: () => void) {
		selectionChangeCallback = callback;
	}

	function dispose() {
		Object.values(radios).forEach((radio) => radio.dispose());
		selectionChangeCallback = undefined;
	}

	return {
		element: radioWrapper,
		setValue,
		getValue,
		onSelectionChange,
		dispose,
	};
}
