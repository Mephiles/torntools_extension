const defaultFactionsItems = [
	{
		value: "",
		description: "All",
	},
	...(hasAPIData() && !!userdata.faction.faction_id
		? [
				{
					value: userdata.faction.faction_tag,
					description: userdata.faction.faction_tag,
				},
		  ]
		: []),
	{
		value: "------",
		description: "------",
		disabled: true,
	},
];

function createFilterSection(options) {
	options = {
		type: "",
		title: "",
		checkbox: "",
		checkboxes: [],
		ynCheckboxes: [],
		select: [],
		slider: {},
		callback: () => {},
		defaults: [],
		orientation: "column",
		noTitle: false,
		...options,
	};

	if (options.type === "Activity") {
		options.title = "Activity";
		options.checkboxes = [
			{ id: "online", description: "Online" },
			{ id: "idle", description: "Idle" },
			{ id: "offline", description: "Offline" },
		];
	}

	const ccTitle = options.title.camelCase(true);
	const section = document.newElement({ type: "div", class: ccTitle });

	if (!options.noTitle) section.appendChild(document.newElement({ type: "strong", text: options.title }));

	if (options.checkbox) {
		const checkbox = createCheckbox({ description: options.checkbox });
		checkbox.onChange(options.callback);
		checkbox.setChecked(options.defaults);
		section.appendChild(checkbox.element);

		return {
			element: section,
			isChecked: (content) => content.find(`.${ccTitle} input`).checked,
		};
	}

	if (options.checkboxes.length) {
		const checkboxes = createCheckboxList({ items: options.checkboxes, orientation: options.orientation, useId: true });
		checkboxes.onSelectionChange(options.callback);
		checkboxes.setSelections(options.defaults);
		section.appendChild(checkboxes.element);

		return {
			element: section,
			getSelections: (content) => [...content.findAll(`.${ccTitle} input:checked`)].map((x) => x.getAttribute("id").toLowerCase().trim()),
		};
	}

	if (options.ynCheckboxes.length) {
		options.ynCheckboxes.forEach((key) => {
			const ccKey = key.camelCase(true);
			const checkboxesDiv = document.newElement({ type: "div", class: ccKey });
			const yCheckbox = createCheckbox({ description: "Y:", reverseLabel: true });
			const nCheckbox = createCheckbox({ description: "N:", reverseLabel: true });
			const value = options.defaults[ccKey];
			if (value === "yes" || value === "both") yCheckbox.setChecked(true);
			if (value === "no" || value === "both") nCheckbox.setChecked(true);
			yCheckbox.onChange(options.callback);
			nCheckbox.onChange(options.callback);
			checkboxesDiv.appendChild(yCheckbox.element);
			checkboxesDiv.appendChild(nCheckbox.element);
			checkboxesDiv.appendChild(document.newElement({ type: "label", text: key }));
			section.appendChild(checkboxesDiv);
		});

		return {
			element: section,
			getSelections,
		};

		function getSelections(content) {
			const selections = {};
			for (const specialDiv of [...content.findAll(`.${ccTitle} > div`)]) {
				const checkboxes = specialDiv.findAll("input");
				const yChecked = checkboxes[0].checked;
				const nChecked = checkboxes[1].checked;
				const key = specialDiv.className;
				if (yChecked && nChecked) selections[key] = "both";
				else if (yChecked) selections[key] = "yes";
				else if (nChecked) selections[key] = "no";
			}
			return selections;
		}
	}

	if (options.select.length) {
		const select = createSelect(options.select);
		select.setSelected(options.defaults);
		select.onChange(options.callback);
		section.appendChild(select.element);

		return {
			element: section,
			getSelected: (content) => content.find(`.${ccTitle} select`).value,
			updateOptions: (newOptions, content) => select.updateOptionsList(newOptions, content.find(`.${ccTitle} select`)),
		};
	}

	if (options.slider && Object.keys(options.slider).length) {
		const rangeSlider = new DualRangeSlider(options.slider);
		section.appendChild(rangeSlider.slider);
		section.appendChild(document.newElement({ type: "div", class: "slider-counter", text: "" }));

		new MutationObserver(options.callback).observe(rangeSlider.slider, { attributes: true });

		return { element: section, getStartEnd, updateCounter };

		function getStartEnd() {
			return { start: rangeSlider.slider.dataset.low, end: rangeSlider.slider.dataset.high };
		}

		function updateCounter(string, content) {
			content.find(`.${ccTitle} .slider-counter`).innerText = string;
		}
	}
}

function createStatistics() {
	const statistics = document.newElement({
		type: "div",
		class: "statistics",
		children: [
			"Showing ",
			document.newElement({ type: "strong", class: "count", text: "X" }),
			" of ",
			document.newElement({ type: "strong", class: "total", text: "Y" }),
			" items",
		],
	});

	function updateStatistics(count, total, content) {
		content.find(".statistics .count").innerText = count;
		content.find(".statistics .total").innerText = total;
	}

	return { element: statistics, updateStatistics };
}

function getSpecialIcons(li) {
	return [...li.findAll(":scope li[id*='icon']")].map(x => x.id.split("_")[0]);
}
