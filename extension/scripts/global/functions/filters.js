"use strict";

const defaultFactionsItems = [
	{
		value: "",
		description: "All",
	},
	{
		value: "No faction",
		description: "No faction",
	},
	{
		value: "Unknown faction",
		description: "Unknown faction",
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

const FILTER_REGEXES = {
	activity: /(?<=<b>).*(?=<\/b>)/g,
	activity_v2: /\d+_([a-zA-Z]+)-user/,
};

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
		default: false,
		defaults: [],
		orientation: "column",
		noTitle: false,
		style: {},
		...options,
	};

	const isWeaponBonus = options.type === "Weapon Bonus";

	if (options.type === "Activity") {
		options.title = "Activity";
		options.checkboxes = [
			{ id: "online", description: "Online" },
			{ id: "idle", description: "Idle" },
			{ id: "offline", description: "Offline" },
		];
	} else if (isWeaponBonus) {
		options.title = options.title || "Weapon Bonus";
		options.classPrefix = "weaponBonus";
	}

	const ccTitle = (options.classPrefix || options.title.camelCase(true)) + "__section-class";
	const section = document.newElement({ type: "div", class: ccTitle, style: options.style });

	if (!options.noTitle) section.appendChild(document.newElement({ type: "strong", text: options.title }));

	if (options.text) {
		const textbox = createTextbox({
			type: typeof options.text === "string" ? options.text : "text",
		});
		textbox.setValue(options.default);
		textbox.onChange(options.callback);

		section.appendChild(textbox.element);

		return {
			element: section,
			getValue: () => textbox.getValue(),
		};
	}

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
		section.classList.add("tt-yn-checkboxes");

		return {
			element: section,
			getSelections,
		};

		function getSelections(content) {
			// eslint-disable-line no-inner-declarations
			const selections = {};
			for (const specialDiv of [...content.findAll(`.${ccTitle} > div`)]) {
				const checkboxes = specialDiv.findAll("input");
				const yChecked = checkboxes[0].checked;
				const nChecked = checkboxes[1].checked;
				const key = specialDiv.className.split("__")[0];
				if (yChecked && nChecked) selections[key] = "both";
				else if (yChecked) selections[key] = "yes";
				else if (nChecked) selections[key] = "no";
				else selections[key] = "none";
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
		section.classList.add("tt-slider");

		new MutationObserver(options.callback).observe(rangeSlider.slider, { attributes: true });

		return { element: section, getStartEnd, updateCounter };

		function getStartEnd(content) {
			// eslint-disable-line no-inner-declarations
			return { start: content.find(`.${ccTitle} .tt-dual-range`).dataset.low, end: content.find(`.${ccTitle} .tt-dual-range`).dataset.high };
		}

		function updateCounter(string, content) {
			// eslint-disable-line no-inner-declarations
			const counter = content.find(`.${ccTitle} .slider-counter`);
			if (!counter) return;

			counter.textContent = string;
		}
	}

	if (isWeaponBonus) {
		const selectOptions = [{ value: "", description: "None" }, ...WEAPON_BONUSES.map((bonus) => ({ value: bonus.toLowerCase(), description: bonus }))];

		const select1 = createSelect(selectOptions);
		const value1 = createTextbox({ type: "number", style: { width: "40px" } });
		const select2 = createSelect(selectOptions);
		const value2 = createTextbox({ type: "number", style: { width: "40px" } });

		select1.onChange(options.callback);
		value1.onChange(options.callback);
		select2.onChange(options.callback);
		value2.onChange(options.callback);

		if (options.defaults.length >= 1) {
			select1.setSelected(options.defaults[0].bonus);
			value1.setValue(options.defaults[0].value ?? "");
		}
		if (options.defaults.length >= 2) {
			select2.setSelected(options.defaults[1].bonus);
			value2.setValue(options.defaults[1].value ?? "");
		}

		section.appendChild(select1.element);
		section.appendChild(value1.element);
		section.appendChild(select2.element);
		section.appendChild(value2.element);

		return {
			element: section,
			getValues: () =>
				[
					[select1, value1],
					[select2, value2],
				].map(([s, v]) => ({ bonus: s.getSelected(), value: isNaN(v.getValue()) ? "" : parseInt(v.getValue()) })),
		};
	}

	return { element: section };
}

function createStatistics(name = "entries") {
	const statistics = document.newElement({
		type: "div",
		class: "statistics",
		children: [
			"Showing ",
			document.newElement({ type: "strong", class: "stat-count", text: "X" }),
			" of ",
			document.newElement({ type: "strong", class: "stat-total", text: "Y" }),
			` ${name}.`,
		],
	});

	function updateStatistics(count, total, content) {
		content.find(".statistics .stat-count").textContent = count;
		content.find(".statistics .stat-total").textContent = total;
	}

	return { element: statistics, updateStatistics };
}

function getSpecialIcons(li) {
	return [...li.findAll(":scope li[id*='icon']")].map((x) => x.id.split("_")[0]);
}
