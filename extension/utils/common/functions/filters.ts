import "./filters.css";
import { userdata } from "@/utils/common/data/database";
import type { WeaponBonusFilter } from "@/utils/common/data/default-database";
import { createCheckbox } from "@/utils/common/elements/checkbox/checkbox";
import { createCheckboxList } from "@/utils/common/elements/checkbox-list/checkbox-list";
import { createMultiSelect, createSelect, type SelectOption } from "@/utils/common/elements/select/select";
import { DualRangeSlider } from "@/utils/common/elements/slider/slider";
import { createTextbox, type TextboxWithoutDescriptionFilter } from "@/utils/common/elements/textbox/textbox";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { camelCase } from "@/utils/common/functions/formatting";
import { WEAPON_BONUSES } from "@/utils/common/functions/torn";
import { getUUID } from "@/utils/common/functions/utilities";
import { PHFillFunnel, PHFillFunnelX } from "@/utils/common/icons/phosphor-icons";

export type SpecialFilterValue = "both" | "yes" | "no" | "none";

interface FilterOption {
	value: string;
	description: string;
	disabled?: boolean;
}

export interface StatisticsResult {
	element: HTMLElement;
	updateStatistics: (count: number, total: number, content: HTMLElement) => void;
}

export const defaultFactionsItems: FilterOption[] = [
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

export const FILTER_REGEXES: Record<string, RegExp> = {
	activity: /Online|Idle|Offline/g,
	activity_v2_svg: /online|idle|offline/,
};

type FilterCallback = (() => void) | (() => Promise<void>);
interface CommonOptions {
	title: string;
	noTitle?: boolean;
	callback: FilterCallback;
	style?: Record<string, string>;
}

type SelectOptions = CommonOptions & {
	select: FilterOption[];
	default: string;
};
type MultiSelectSectionOptions = CommonOptions & {
	select: FilterOption[];
	multiSelect: true;
	defaults: string[];
};
type CheckboxSectionOptions = CommonOptions & {
	checkbox: string;
	default: boolean;
};
type CheckboxesOptions = CommonOptions &
	(
		| {
				checkboxes: { id: string; description: string }[];
				defaults: string[];
		  }
		| {
				checkboxes: { id: number; description: string }[];
				defaults: number[];
		  }
	) & { orientation?: "column" | "row" };
type YNCheckboxesOptions = CommonOptions & {
	ynCheckboxes: string[];
	defaults: Record<string, SpecialFilterValue>;
};
type SliderOptions = CommonOptions & {
	slider: {
		min: number;
		max: number;
		step: number;
		valueLow: number;
		valueHigh: number;
	};
};
type TextOptions = CommonOptions & {
	text: true | string;
	default: string;
};

type PresetOptions = Omit<Omit<CommonOptions, "title">, "noTitle"> &
	(
		| { type: "Activity"; defaults: string[] }
		| { type: "HideRaces"; defaults: string[] }
		| { type: "LevelAll" | "LevelPlayer"; typeData: { valueLow: number; valueHigh: number } }
	);

export function createFilterSection(options: Omit<CommonOptions, "callback">): any;
export function createFilterSection(options: SelectOptions): any;
export function createFilterSection(options: MultiSelectSectionOptions): any;
export function createFilterSection(options: PresetOptions): any;
export function createFilterSection(options: CheckboxSectionOptions): any;
export function createFilterSection(options: CheckboxesOptions): any;
export function createFilterSection(options: YNCheckboxesOptions): any;
export function createFilterSection(options: SliderOptions): any;
export function createFilterSection(options: TextOptions): any;

export function createFilterSection(
	options:
		| Omit<CommonOptions, "callback">
		| SelectOptions
		| MultiSelectSectionOptions
		| PresetOptions
		| CheckboxSectionOptions
		| CheckboxesOptions
		| YNCheckboxesOptions
		| SliderOptions
		| TextOptions,
): any {
	if ("type" in options) {
		// Handle PresetOptions
		if (options.type === "Activity") {
			return createFilterSection({
				title: "Activity",
				checkboxes: [
					{ id: "online", description: "Online" },
					{ id: "idle", description: "Idle" },
					{ id: "offline", description: "Offline" },
				],
				defaults: options.defaults,
				callback: options.callback,
			});
		} else if (options.type === "HideRaces") {
			return createFilterSection({
				title: "Hide Races",
				checkboxes: [
					{ id: "full", description: "Full" },
					{ id: "protected", description: "Protected" },
					{ id: "incompatible", description: "Incompatible" },
					{ id: "paid", description: "With Fee" },
				],
				defaults: options.defaults,
				callback: options.callback,
			});
		} else if (options.type === "LevelAll") {
			return createFilterSection({
				title: "Level Filter",
				noTitle: true,
				slider: {
					min: 0,
					max: 100,
					step: 1,
					valueLow: options.typeData.valueLow,
					valueHigh: options.typeData.valueHigh,
				},
				callback: options.callback,
			});
		} else if (options.type === "LevelPlayer") {
			return createFilterSection({
				title: "Level Filter",
				noTitle: true,
				slider: {
					min: 1,
					max: 100,
					step: 1,
					valueLow: options.typeData.valueLow,
					valueHigh: options.typeData.valueHigh,
				},
				callback: options.callback,
			});
		}
		return null;
	}

	const ccTitle = `${camelCase(options.title)}__section-class`;
	const section = elementBuilder({ type: "div", class: ccTitle, style: options.style });

	if (!options.noTitle) section.appendChild(elementBuilder({ type: "strong", text: options.title }));

	if (isTextOptions(options)) {
		const textbox = createTextbox({
			type: (typeof options.text === "string" ? options.text : "text") as "text" | "number",
		});
		textbox.setValue(options.default);
		textbox.onChange(options.callback);

		section.appendChild(textbox.element);

		return {
			element: section,
			getValue: () => textbox.getValue(),
		};
	}

	if (isCheckboxOptions(options)) {
		const checkbox = createCheckbox({ description: options.checkbox });
		checkbox.onChange(options.callback);
		checkbox.setChecked(options.default);
		section.appendChild(checkbox.element);

		return {
			element: section,
			isChecked: (content: Element) => content.querySelector<HTMLInputElement>(`.${ccTitle} input`)?.checked ?? false,
		};
	}

	if (isCheckboxesOptions(options)) {
		const checkboxes = createCheckboxList({ items: options.checkboxes, orientation: options.orientation ?? "column", useId: true });
		checkboxes.onSelectionChange(options.callback);
		checkboxes.setSelections((Array.isArray(options.defaults) ? options.defaults : []) as string[]);
		section.appendChild(checkboxes.element);

		return {
			element: section,
			getSelections: (content: Element) =>
				findAllElements(`.${ccTitle} input:checked`, content).map((x) => x.getAttribute("id")?.toLowerCase().trim() ?? ""),
		};
	}

	if (isYNCheckboxesOptions(options)) {
		options.ynCheckboxes.forEach((key) => {
			const ccKey = camelCase(key);
			const checkboxesDiv = elementBuilder({ type: "div", class: ccKey });
			const yCheckbox = createCheckbox({ description: "Y:", reverseLabel: true });
			const nCheckbox = createCheckbox({ description: "N:", reverseLabel: true });
			const value = options.defaults[ccKey];
			if (value === "yes" || value === "both") yCheckbox.setChecked(true);
			if (value === "no" || value === "both") nCheckbox.setChecked(true);
			yCheckbox.onChange(options.callback);
			nCheckbox.onChange(options.callback);
			checkboxesDiv.appendChild(yCheckbox.element);
			checkboxesDiv.appendChild(nCheckbox.element);
			checkboxesDiv.appendChild(elementBuilder({ type: "label", text: key }));
			section.appendChild(checkboxesDiv);
		});
		section.classList.add("tt-yn-checkboxes");

		return {
			element: section,
			getSelections,
		};

		function getSelections(content: HTMLElement) {
			const selections: { [key: string]: string } = {};
			for (const specialDiv of findAllElements(`.${ccTitle} > div`, content)) {
				const checkboxes = findAllElements("input", specialDiv);
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

	if (isMultiSelectOptions(options)) {
		const multiSelect = createMultiSelect({
			select: options.select.filter((opt) => opt.value !== ""),
			defaults: (Array.isArray(options.defaults) ? options.defaults : []) as string[],
		});

		multiSelect.onChange(options.callback);
		section.appendChild(multiSelect.element);

		return {
			element: section,
			getSelected: () => multiSelect.getSelected(),
			updateOptions: (newOptions: SelectOption[]) => multiSelect.updateOptionsList(newOptions),
		};
	}

	if (isSelectOptions(options)) {
		const select = createSelect(options.select);
		select.setSelected(options.default ?? "");
		select.onChange(options.callback);
		section.appendChild(select.element);

		return {
			element: section,
			getSelected: (content: Element) => content.querySelector<HTMLSelectElement>(`.${ccTitle} select`)?.value ?? "",
			updateOptions: (newOptions: SelectOption[], content: Element) => select.updateOptionsList(newOptions, content.querySelector(`.${ccTitle} select`)),
		};
	}

	if (isSliderOptions(options)) {
		const rangeSlider = new DualRangeSlider(options.slider);
		section.appendChild(rangeSlider.slider);
		section.appendChild(elementBuilder({ type: "div", class: "slider-counter", text: "" }));
		section.classList.add("tt-slider");

		new MutationObserver(options.callback).observe(rangeSlider.slider, { attributes: true });

		return { element: section, getStartEnd, updateCounter };

		function getStartEnd(content: Element) {
			const rangeElement = content.querySelector<HTMLElement>(`.${ccTitle} .tt-dual-range`);
			if (!rangeElement) {
				return { start: (options as SliderOptions).slider.valueLow, end: (options as SliderOptions).slider.valueHigh };
			}

			return { start: rangeElement.dataset.low, end: rangeElement.dataset.high };
		}

		function updateCounter(string: string, content: Element) {
			const counter = content.querySelector(`.${ccTitle} .slider-counter`);
			if (!counter) return;

			counter.textContent = string;
		}
	}

	return { element: section };
}

function isTextOptions(options: any): options is TextOptions {
	return "text" in options;
}

function isCheckboxOptions(options: any): options is CheckboxSectionOptions {
	return "checkbox" in options;
}

function isCheckboxesOptions(options: any): options is CheckboxesOptions {
	return "checkboxes" in options;
}

function isYNCheckboxesOptions(options: any): options is YNCheckboxesOptions {
	return "ynCheckboxes" in options;
}

function isMultiSelectOptions(options: any): options is MultiSelectSectionOptions {
	return "select" in options && "multiSelect" in options;
}

function isSelectOptions(options: any): options is SelectOptions {
	return "select" in options && !("type" in options);
}

function isSliderOptions(options: any): options is SliderOptions {
	return "slider" in options;
}

interface WeaponBonusOptions {
	callback: FilterCallback;
	defaults: WeaponBonusFilter[];
	configuration?: {
		anyWeaponBonus?: boolean;
	};
}

export function createWeaponBonusSection(options: WeaponBonusOptions) {
	const ccTitle = "weaponBonus__section-class";
	const section = elementBuilder({ type: "div", class: ccTitle });

	const selectOptions = [
		{ value: "", description: "None" },
		options.configuration?.anyWeaponBonus ? { value: "any", description: "Any" } : undefined,
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
		value1.setValue(options.defaults[0].value?.toString() ?? "");
	}
	if (options.defaults.length >= 2) {
		select2.setSelected(options.defaults[1].bonus);
		value2.setValue(options.defaults[1].value?.toString() ?? "");
	}

	section.appendChild(select1.element);
	section.appendChild(value1.element);
	section.appendChild(select2.element);
	section.appendChild(value2.element);

	return {
		element: section,
		getValues: (): { bonus: string; value: number }[] => {
			const s: [ReturnType<typeof createSelect>, TextboxWithoutDescriptionFilter][] = [
				[select1, value1],
				[select2, value2],
			];

			return s.map(([select, textbox]) => ({
				bonus: select.getSelected(),
				value: Number.isNaN(parseInt(textbox.getValue())) ? 0 : parseInt(textbox.getValue()),
			}));
		},
	};
}

export function createStatistics(name = "entries", addBrackets = false, lowercase = false): StatisticsResult {
	const statistics = elementBuilder({
		type: "div",
		class: "statistics",
		children: [
			`${addBrackets ? "(" : ""}${lowercase ? "s" : "S"}howing `,
			elementBuilder({ type: "strong", class: "stat-count", text: "X" }),
			" of ",
			elementBuilder({ type: "strong", class: "stat-total", text: "Y" }),
			` ${name}${addBrackets ? ")" : "."}`,
		],
	});

	function updateStatistics(count: number, total: number, content: HTMLElement) {
		content.querySelector(".statistics .stat-count").textContent = count.toString();
		content.querySelector(".statistics .stat-total").textContent = total.toString();
	}

	return { element: statistics, updateStatistics };
}

export function getSpecialIcons(li: HTMLElement): string[] {
	return findAllElements(":scope li[id*='icon']", li).map((x) => x.id.split("_")[0]);
}

interface FilterEnabledFunnelOptions {
	id: string;
	class: string;
}

export interface FilterEnabledFunnelObject {
	element: HTMLDivElement;
	setEnabled: (isEnabled: boolean) => void;
	isEnabled: () => boolean;
	onChange: (callback: (enabled: boolean) => void) => void;
	dispose: () => void;
}

export function createFilterEnabledFunnel(partialOptions: Partial<FilterEnabledFunnelOptions> = {}): FilterEnabledFunnelObject {
	const options: FilterEnabledFunnelOptions = {
		id: getUUID(),
		class: "",
		...partialOptions,
	};

	const iconWrapper = elementBuilder({
		type: "div",
		class: ["tt-filter-enabled-funnel", options.class],
		attributes: { id: options.id, title: "Disable this filter." },
	});

	let onChangeCallback: (enabled: boolean) => void;
	let enabled = false;

	function updateIcon() {
		iconWrapper.innerHTML = "";
		iconWrapper.appendChild(enabled ? PHFillFunnel() : PHFillFunnelX());
		iconWrapper.setAttribute("title", enabled ? "Disable this filter." : "Enable this filter.");
	}

	function setEnabled(isEnabled: boolean) {
		enabled = isEnabled;
		updateIcon();
	}

	function isEnabled() {
		return enabled;
	}

	function onChange(callback: (enabled: boolean) => void) {
		onChangeCallback = callback;
		iconWrapper.addEventListener("click", _onClickListener);
	}

	function dispose() {
		if (onChangeCallback) {
			iconWrapper.removeEventListener("click", _onClickListener);
			onChangeCallback = undefined;
		}
	}

	function _onClickListener(event: PointerEvent) {
		event.stopPropagation();

		enabled = !enabled;
		updateIcon();
		onChangeCallback(enabled);
	}

	updateIcon();

	return {
		element: iconWrapper,
		setEnabled,
		isEnabled,
		onChange,
		dispose,
	};
}
