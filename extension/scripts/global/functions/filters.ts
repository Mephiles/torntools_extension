interface FilterOption {
	value: string;
	description: string;
	disabled?: boolean;
}

interface StatisticsResult {
	element: HTMLElement;
	updateStatistics: (count: number, total: number, content: HTMLElement) => void;
}

const defaultFactionsItems: FilterOption[] = [
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
	{
		value: "In a faction",
		description: "In a faction",
	},
	...(hasAPIData() && !!userdata.faction
		? [
				{
					value: userdata.faction.tag,
					description: userdata.faction.tag,
				},
			]
		: []),
	{
		value: "------",
		description: "------",
		disabled: true,
	},
];

const FILTER_REGEXES: Record<string, RegExp> = {
	activity: /Online|Idle|Offline/g,
	activity_v2_svg: /online|idle|offline/,
};

function createFilterSection(options: any): any {
	options = {
		type: "",
		title: "",
		text: "",
		checkbox: "",
		checkboxes: [],
		ynCheckboxes: [],
		select: [],
		multiSelect: false,
		slider: {
			min: 0,
			max: 100,
			step: 1,
			valueLow: 0,
			valueHigh: 100,
		},
		callback: () => {},
		default: false,
		defaults: [],
		orientation: "column",
		noTitle: false,
		style: {},
		configuration: {
			anyWeaponBonus: false,
			...(options.configuration ?? {}),
		},
		...options,
	};

	const isWeaponBonus = options.type === "Weapon Bonus";
	const isLevelAll = options.type === "LevelAll";
	const isLevelPlayer = options.type === "LevelPlayer";

	if (options.type === "Activity") {
		options.title = "Activity";
		options.checkboxes = [
			{ id: "online", description: "Online" },
			{ id: "idle", description: "Idle" },
			{ id: "offline", description: "Offline" },
		];
	} else if (options.type === "HideRaces") {
		options.title = "Hide Races";
		options.checkboxes = [
			{ id: "full", description: "Full" },
			{ id: "protected", description: "Protected" },
			{ id: "incompatible", description: "Incompatible" },
			{ id: "paid", description: "With Fee" },
		];
	} else if (isWeaponBonus) {
		options.title = options.title || "Weapon Bonus";
		options.classPrefix = "weaponBonus";
	} else if (isLevelAll || isLevelPlayer) {
		options.title = "Level Filter";
		options.noTitle = true;
		options.slider = {
			min: isLevelAll ? 0 : 1,
			max: 100,
			step: 1,
			valueLow: options.typeData.valueLow,
			valueHigh: options.typeData.valueHigh,
		};
	}

	const ccTitle = (options.classPrefix || options.title.camelCase(true)) + "__section-class";
	const section = document.newElement({ type: "div", class: ccTitle, style: options.style });

	if (!options.noTitle) section.appendChild(document.newElement({ type: "strong", text: options.title }));

	if (options.text) {
		const textbox = createTextbox({
			type: (typeof options.text === "string" ? options.text : "text") as "text" | "number",
		});
		textbox.setValue(options.default as string);
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
		checkbox.setChecked(!!options.defaults);
		section.appendChild(checkbox.element);

		return {
			element: section,
			isChecked: (content) => (content.find(`.${ccTitle} input`) as HTMLInputElement)?.checked ?? false,
		};
	}

	if (options.checkboxes.length) {
		const checkboxes = createCheckboxList({ items: options.checkboxes, orientation: options.orientation, useId: true });
		checkboxes.onSelectionChange(options.callback);
		checkboxes.setSelections((Array.isArray(options.defaults) ? options.defaults : []) as string[]);
		section.appendChild(checkboxes.element);

		return {
			element: section,
			getSelections: (content) => [...content.findAll(`.${ccTitle} input:checked`)].map((x) => x.getAttribute("id")?.toLowerCase().trim() ?? ""),
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

		function getSelections(content: HTMLElement) {
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
		if (options.multiSelect) {
			const multiSelect = createMultiSelect({
				select: options.select.filter((opt) => opt.value !== ""),
				defaults: (Array.isArray(options.defaults) ? options.defaults : []) as string[],
			});

			multiSelect.onChange(options.callback);
			section.appendChild(multiSelect.element);

			return {
				element: section,
				getSelected: () => multiSelect.getSelected(),
				updateOptions: (newOptions) => multiSelect.updateOptionsList(newOptions),
			};
		} else {
			const select = createSelect(options.select);
			select.setSelected((Array.isArray(options.defaults) ? options.defaults[0] : "") as string);
			select.onChange(options.callback);
			section.appendChild(select.element);

			return {
				element: section,
				getSelected: (content) => (content.find(`.${ccTitle} select`) as HTMLSelectElement)?.value ?? "",
				updateOptions: (newOptions, content) => select.updateOptionsList(newOptions, content.find(`.${ccTitle} select`)),
			};
		}
	}

	if (options.slider && Object.keys(options.slider).length) {
		const rangeSlider = new DualRangeSlider(options.slider);
		section.appendChild(rangeSlider.slider);
		section.appendChild(document.newElement({ type: "div", class: "slider-counter", text: "" }));
		section.classList.add("tt-slider");

		new MutationObserver(options.callback).observe(rangeSlider.slider, { attributes: true });

		return { element: section, getStartEnd, updateCounter };

		function getStartEnd(content) {
			const rangeElement = content.find(`.${ccTitle} .tt-dual-range`);
			if (!rangeElement) {
				return { start: options.slider.valueLow, end: options.slider.valueHigh };
			}

			// eslint-disable-line no-inner-declarations
			return { start: rangeElement.dataset.low, end: rangeElement.dataset.high };
		}

		function updateCounter(string, content) {
			// eslint-disable-line no-inner-declarations
			const counter = content.find(`.${ccTitle} .slider-counter`);
			if (!counter) return;

			counter.textContent = string;
		}
	}

	if (isWeaponBonus) {
		const selectOptions = [
			{ value: "", description: "None" },
			options.configuration.anyWeaponBonus ? { value: "any", description: "Any" } : undefined,
			...WEAPON_BONUSES.map((bonus) => ({ value: bonus.toLowerCase(), description: bonus })),
		].filter((option) => !!option);

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
				].map(
					([s, v]) =>
						// @ts-expect-error Pre-migration shenanigans
						({ bonus: s.getSelected() as string, value: isNaN(v.getValue()) ? 0 : parseInt(v.getValue()) }) as { bonus: string; value: number }
				),
		};
	}

	return { element: section };
}

function createStatistics(name = "entries", addBrackets = false, lowercase = false): StatisticsResult {
	const statistics = document.newElement({
		type: "div",
		class: "statistics",
		children: [
			(addBrackets ? "(" : "") + `${lowercase ? "s" : "S"}howing `,
			document.newElement({ type: "strong", class: "stat-count", text: "X" }),
			" of ",
			document.newElement({ type: "strong", class: "stat-total", text: "Y" }),
			` ${name}` + (addBrackets ? ")" : "."),
		],
	});

	function updateStatistics(count: number, total: number, content: HTMLElement) {
		content.find(".statistics .stat-count").textContent = count.toString();
		content.find(".statistics .stat-total").textContent = total.toString();
	}

	return { element: statistics, updateStatistics };
}

function getSpecialIcons(li: HTMLElement): string[] {
	return [...li.findAll(":scope li[id*='icon']")].map((x) => x.id.split("_")[0]);
}
