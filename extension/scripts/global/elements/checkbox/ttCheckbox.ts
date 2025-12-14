interface CheckboxOptions {
	description: string;
	isHTML: boolean;
	reverseLabel: boolean;
	id: string;
	class: string;
}

interface CheckboxObject {
	element: HTMLDivElement;
	setChecked: (isChecked: boolean) => void;
	isChecked: () => boolean;
	onChange: (callback: () => void) => void;
	dispose: () => void;
}

function createCheckbox(partialOptions: Partial<CheckboxOptions> = {}): CheckboxObject {
	const options: CheckboxOptions = {
		description: "",
		isHTML: false,
		reverseLabel: false,
		id: getUUID(),
		class: "",
		...partialOptions,
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

	let onChangeCallback: () => void | undefined;

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
