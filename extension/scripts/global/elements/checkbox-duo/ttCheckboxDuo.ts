interface CheckboxDuoOptions {
	description: string;
	id: string;
	indicator: "icon" | "text";
}

function createCheckboxDuo(partialOptions: Partial<CheckboxDuoOptions> = {}) {
	const options: CheckboxDuoOptions = {
		description: "",
		id: getUUID(),
		indicator: "text",
		...partialOptions,
	};

	let isHTML: boolean, descriptionYes: string, descriptionNo: string;
	switch (options.indicator) {
		case "icon":
			isHTML = true;
			descriptionYes = "<i class='icon fa-solid fa-arrow-up'></i>";
			descriptionNo = "<i class='icon fa-solid fa-arrow-down'></i>";
			break;
		case "text":
		default:
			isHTML = false;
			descriptionYes = "Y:";
			descriptionNo = "N:";
			break;
	}

	const yesCheckbox = createCheckbox({ description: descriptionYes, isHTML, reverseLabel: true, class: "duo-yes" });
	const noCheckbox = createCheckbox({ description: descriptionNo, isHTML, reverseLabel: true, class: "duo-no" });

	const checkboxWrapper = document.newElement({
		type: "div",
		class: "tt-checkbox-duo",
		children: [yesCheckbox.element, noCheckbox.element, document.newElement({ type: "label", text: options.description })],
		events: {
			click(event) {
				event.stopPropagation();
			},
		},
	});

	function setValue(value: "yes" | "no" | "both" | "none") {
		yesCheckbox.setChecked(value === "yes" || value === "both");
		noCheckbox.setChecked(value === "no" || value === "both");
	}

	function getValue() {
		const yes = yesCheckbox.isChecked();
		const no = noCheckbox.isChecked();

		if (yes && no) return "both";
		else if (yes) return "yes";
		else if (no) return "no";
		else return "none";
	}

	function onChange(callback: () => void) {
		yesCheckbox.onChange(callback);
		noCheckbox.onChange(callback);
	}

	function dispose() {
		yesCheckbox.dispose();
		noCheckbox.dispose();
	}

	return {
		element: checkboxWrapper,
		setValue,
		getValue,
		onChange,
		dispose,
	};
}
