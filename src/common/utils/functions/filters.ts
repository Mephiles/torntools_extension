import "./filters.css";
import { userdata } from "@common/utils/data/database";
import type { WeaponBonusFilter } from "@common/utils/data/default-database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { createCheckboxList } from "@common/utils/elements/checkbox-list/checkbox-list";
import { createMultiSelect, createSelect } from "@common/utils/elements/select/select";
import { DualRangeSlider } from "@common/utils/elements/slider/slider";
import { createTextbox, type TextboxWithoutDescriptionFilter } from "@common/utils/elements/textbox/textbox";
import { hasAPIData } from "@common/utils/functions/api";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { camelCase } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { RANK_TRIGGERS, WEAPON_BONUSES } from "@common/utils/functions/torn";
import { getUUID } from "@common/utils/functions/utilities";
import { PHFillFunnel, PHFillFunnelX } from "@common/utils/icons/phosphor-icons";
import type { UserLastActionStatusEnum } from "tornapi-typescript";

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
	...(hasAPIData() && userdata.faction
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

export const FILTER_REGEXES = {
	activity: /Online|Idle|Offline/g,
} as const;

export type UserActivityStatus = Lowercase<UserLastActionStatusEnum>;

export function getUserActivity(element: ParentNode): UserActivityStatus | "" {
	const icon = element.querySelector("[class*='userOnlineStatusIcon___']");
	if (icon) {
		const label = icon?.getAttribute("alt") || icon.closest("[aria-label]")?.getAttribute("aria-label");
		const labelMatch = label?.match(/\b(online|idle|offline)\b/i);
		if (labelMatch) {
			return labelMatch[1].toLowerCase() as UserActivityStatus;
		}
	}

	const title = element.querySelector("#iconTray li")?.getAttribute("title");
	const titleMatch = title?.match(FILTER_REGEXES.activity);
	if (titleMatch) {
		return titleMatch[0].toLowerCase().trim() as UserActivityStatus;
	}

	return "";
}

type FilterCallback = (() => void) | (() => Promise<void>);

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
		content.querySelector(".statistics .stat-count")!.textContent = count.toString();
		content.querySelector(".statistics .stat-total")!.textContent = total.toString();
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

	let onChangeCallback: ((enabled: boolean) => void) | undefined;
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
		onChangeCallback?.(enabled);
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

interface SectionBuildResult<V> {
	element: HTMLElement;
	getValue(): V;
	onBeforeFilter?(): void;
}

export interface FilterSectionDef<V> {
	readonly key: string;
	readonly title: string;
	build(onChange: () => void): SectionBuildResult<V>;
	test(row: HTMLElement, value: V): boolean;
	/** Return false to hide this section from the UI. Re-evaluated on each reRender. */
	enabled?: () => boolean;
	/** Place this section in the container header options area instead of the body. Default: "body". */
	placement?: "body" | "header";
}

export interface SliderRange {
	start: number;
	end: number;
}

interface CheckboxSectionOptions {
	key: string;
	title: string;
	label?: string;
	defaultValue: boolean;
	test: (row: HTMLElement, checked: boolean) => boolean;
	enabled?: () => boolean;
}

export function checkboxSection(options: CheckboxSectionOptions): FilterSectionDef<boolean> {
	const { key, title, label, defaultValue, test, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const checkbox = createCheckbox({ description: label ?? title });
			checkbox.setChecked(defaultValue);
			checkbox.onChange(onChange);

			return { element: checkbox.element, getValue: () => checkbox.isChecked() };
		},
		test,
	};
}

interface CheckboxesSectionOptions {
	key: string;
	title: string;
	items: { id: string; description: string }[];
	defaults: string[];
	test: (row: HTMLElement, selections: string[]) => boolean;
	orientation?: "column" | "row";
	enabled?: () => boolean;
}

export function checkboxesSection(options: CheckboxesSectionOptions): FilterSectionDef<string[]> {
	const { key, title, items, defaults, test, orientation, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const list = createCheckboxList({ items, orientation: orientation ?? "column", useId: true });
			list.setSelections(defaults ?? []);
			list.onSelectionChange(onChange);

			return { element: list.element, getValue: () => list.getSelections() };
		},
		test,
	};
}

interface SelectOption {
	value: string;
	description: string;
	disabled?: boolean;
}

interface SelectSectionOptions {
	key: string;
	title: string;
	getOptions(): SelectOption[];
	defaultValue: string;
	test: (row: HTMLElement, selected: string) => boolean;
	enabled?: () => boolean;
}

export function selectSection(options: SelectSectionOptions): FilterSectionDef<string> {
	const { key, title, getOptions, defaultValue, test, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const select = createSelect(getOptions());
			select.setSelected(defaultValue);
			select.onChange(onChange);

			return {
				element: select.element,
				getValue: () => select.getSelected(),
				onBeforeFilter() {
					select.updateOptionsList(getOptions());
				},
			};
		},
		test,
	};
}

interface SliderSectionOptions {
	key: string;
	title: string;
	config: { min: number; max: number; step: number };
	defaults: { low: number; high: number };
	formatCounter?: (range: SliderRange) => string;
	test: (row: HTMLElement, range: SliderRange) => boolean;
	enabled?: () => boolean;
}

export function sliderSection(options: SliderSectionOptions): FilterSectionDef<SliderRange> {
	const { key, title, config, defaults, formatCounter, test, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const slider = new DualRangeSlider({
				min: config.min,
				max: config.max,
				step: config.step,
				valueLow: defaults.low,
				valueHigh: defaults.high,
			});

			const counter = elementBuilder({ type: "div", class: "slider-counter", text: "" });
			const section = elementBuilder({ type: "div", class: "tt-slider", children: [slider.slider!, counter] });

			function readRange(): SliderRange {
				const low = parseInt(slider.slider!.dataset!.low!) ?? config.min;
				const high = parseInt(slider.slider!.dataset!.high!) ?? config.max;
				return { start: Math.min(low, high), end: Math.max(low, high) };
			}

			function updateCounter() {
				if (!formatCounter) return;

				counter.textContent = formatCounter(readRange());
			}

			updateCounter();

			new MutationObserver(() => {
				updateCounter();
				onChange();
			}).observe(slider.slider!, { attributes: true });

			return {
				element: section,
				getValue: readRange,
			};
		},
		test,
	};
}

interface TextSectionOptions {
	key: string;
	title: string;
	type?: "text" | "number";
	defaultValue: string;
	test: (row: HTMLElement, value: string) => boolean;
	enabled?: () => boolean;
}

export function textSection(options: TextSectionOptions): FilterSectionDef<string> {
	const { key, title, type, defaultValue, test, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const textbox = createTextbox({ type: type ?? "text" });
			textbox.setValue(defaultValue ?? "");
			textbox.onChange(onChange);

			return { element: textbox.element, getValue: () => textbox.getValue() };
		},
		test,
	};
}

interface MultiSelectSectionOptions {
	key: string;
	title: string;
	items: SelectOption[];
	defaults: string[];
	test: (row: HTMLElement, selections: string[]) => boolean;
	enabled?: () => boolean;
}

export function multiSelectSection(options: MultiSelectSectionOptions): FilterSectionDef<string[]> {
	const { key, title, items, defaults, test, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const multi = createMultiSelect({ select: items, defaults });
			multi.onChange(onChange);
			return { element: multi.element, getValue: () => multi.getSelected() };
		},
		test,
	};
}

export type YNCheckboxState = Record<string, SpecialFilterValue>;

interface YNCheckboxesSectionOptions {
	key: string;
	title: string;
	items: string[];
	defaults: YNCheckboxState;
	test: (row: HTMLElement, selections: YNCheckboxState) => boolean;
	enabled?: () => boolean;
}

export function ynCheckboxesSection(options: YNCheckboxesSectionOptions): FilterSectionDef<YNCheckboxState> {
	const { key, title, items, defaults, test, enabled } = options;

	return {
		key,
		title,
		enabled,
		build(onChange: () => void) {
			const wrapper = elementBuilder({ type: "div", class: "tt-yn-checkboxes" });

			const checkboxPairs = items.map((item) => {
				const ccKey = camelCase(item);
				const pairDiv = elementBuilder({ type: "div", class: ccKey });
				const yCheckbox = createCheckbox({ description: "Y:", reverseLabel: true });
				const nCheckbox = createCheckbox({ description: "N:", reverseLabel: true });

				const value = defaults[ccKey];
				if (value === "yes" || value === "both") yCheckbox.setChecked(true);
				if (value === "no" || value === "both") nCheckbox.setChecked(true);

				yCheckbox.onChange(onChange);
				nCheckbox.onChange(onChange);

				pairDiv.appendChild(yCheckbox.element);
				pairDiv.appendChild(nCheckbox.element);
				pairDiv.appendChild(elementBuilder({ type: "label", text: item }));
				wrapper.appendChild(pairDiv);

				return { element: pairDiv, ccKey, yCheckbox, nCheckbox };
			});

			return {
				element: wrapper,
				getValue(): YNCheckboxState {
					const selections: YNCheckboxState = {};
					for (const pair of checkboxPairs) {
						const yChecked = pair.yCheckbox.isChecked();
						const nChecked = pair.nCheckbox.isChecked();

						if (yChecked && nChecked) selections[pair.ccKey] = "both";
						else if (yChecked) selections[pair.ccKey] = "yes";
						else if (nChecked) selections[pair.ccKey] = "no";
						else selections[pair.ccKey] = "none";
					}
					return selections;
				},
			};
		},
		test,
	};
}

type ContainerPosition = { parentElement: Node } | { nextElement: Node } | { previousElement: Node };

export interface FilterController {
	rerenderSections(): void;
	run(): Promise<void>;
	runScoped(options?: { rows?: HTMLElement[]; sections?: string[] | null }): Promise<void>;
	dispose(): void;
}

interface FilterSectionInstance {
	key: string;
	getValue(): unknown;
	test(row: HTMLElement, value: unknown): boolean;
	onBeforeFilter?(): void;
}

type ActivityPresetSectionOptions = { preset: "activity"; defaults: string[] };
type FactionPresetSectionOptions = { preset: "faction"; getOptions(): SelectOption[]; default: string };
type FFScorePresetSectionOptions = { preset: "ff-score"; defaults: { min: number | null; max: number | null }; enabled(): boolean };
type StatsEstimatesPresetSectionOptions = { preset: "stats-estimates"; enabled(): boolean; defaults: string[] };
type PresetSectionOptions = ActivityPresetSectionOptions | FactionPresetSectionOptions | FFScorePresetSectionOptions | StatsEstimatesPresetSectionOptions;

export function presetSection(options: ActivityPresetSectionOptions): FilterSectionDef<string[]>;
export function presetSection(options: FactionPresetSectionOptions): FilterSectionDef<string>;
export function presetSection(options: FFScorePresetSectionOptions): FilterSectionDef<{ min: number; max: number }>;
export function presetSection(options: StatsEstimatesPresetSectionOptions): FilterSectionDef<string[]>;
export function presetSection(options: PresetSectionOptions): FilterSectionDef<unknown> {
	if (options.preset === "activity") {
		return checkboxesSection({
			key: "activity",
			title: "Activity",
			items: [
				{ id: "online", description: "Online" },
				{ id: "idle", description: "Idle" },
				{ id: "offline", description: "Offline" },
			],
			defaults: options.defaults,
			test: (row, activity) => {
				if (!activity.length || activity.length === 3) return true;

				const userActivity = getUserActivity(row);

				return activity.some((x) => x.trim() === userActivity);
			},
		});
	} else if (options.preset === "faction") {
		return selectSection({
			key: "faction",
			title: "Faction",
			getOptions: options.getOptions,
			defaultValue: options.default,
			test: (row, faction) => {
				if (!faction) return true;

				const factionElement = row.querySelector<HTMLAnchorElement>(".user.faction")!;
				const hasFaction = !!factionElement.href;

				if (faction === "No faction") return !hasFaction;
				if (faction === "In a faction") return hasFaction;

				const factionName = factionElement.hasAttribute("rel")
					? factionElement.querySelector<HTMLImageElement>(":scope > img")?.getAttribute("title")?.trim() || "N/A"
					: factionElement.textContent.trim();

				if (faction === "Unknown faction") return hasFaction && factionName === "N/A";
				else return hasFaction && factionName !== "N/A" && factionName === faction;
			},
		});
	} else if (options.preset === "ff-score") {
		return {
			key: "ffScore",
			title: "FF Score",
			enabled: options.enabled,
			build(onChange: () => void) {
				const minTextbox = createTextbox({
					type: "number",
					description: "Min",
					attributes: { step: "0.1" },
					style: { maxWidth: "40px", marginLeft: "2px" },
				});
				minTextbox.setValue(options.defaults?.min?.toString() ?? "");
				minTextbox.onChange(onChange);

				const maxTextbox = createTextbox({
					type: "number",
					description: "Max",
					attributes: { step: "0.1" },
					style: { maxWidth: "40px", marginLeft: "2px" },
				});
				maxTextbox.setValue(options.defaults?.max?.toString() ?? "");
				maxTextbox.onChange(onChange);

				const wrapper = elementBuilder({
					type: "div",
					children: [minTextbox.element, maxTextbox.element],
				});

				return {
					element: wrapper,
					getValue() {
						return {
							min: parseFloat(minTextbox.getValue()),
							max: parseFloat(maxTextbox.getValue()),
						};
					},
				};
			},
			test: (row, { min, max }) => {
				const gauge = row.querySelector<HTMLElement>(".tt-ff-scouter-indicator.indicator-lines");
				if (!gauge) return true;

				const ff = parseFloat(gauge.getAttribute("data-ff-scout")!);
				if (Number.isNaN(ff)) return true;

				if (max && !Number.isNaN(max) && ff > max) return false;
				if (min && !Number.isNaN(min) && ff < min) return false;

				return true;
			},
		} satisfies FilterSectionDef<{ min: number; max: number }>;
	} else if (options.preset === "stats-estimates") {
		const items = [{ id: "none", description: "none" }, ...RANK_TRIGGERS.stats.map((t) => ({ id: t, description: t })), { id: "n/a", description: "N/A" }];

		return checkboxesSection({
			key: "statsEstimates",
			title: "Stats Estimates",
			enabled: options.enabled,
			items,
			defaults: options.defaults,
			test: (row, estimates) => {
				if (!estimates.length || estimates.length === items.length) return true;

				const estimate = row.dataset.estimate?.toLowerCase();
				if (estimate || !row.classList.contains("tt-estimated")) {
					return estimates.includes(estimate ?? "");
				}
				return true;
			},
		});
	}

	throw new Error(`Invalid preset options where provided: '${JSON.stringify(options)}`);
}

export function createFilter<State extends Record<string, unknown> & { enabled: boolean } = Record<string, unknown> & { enabled: boolean }>(options: {
	rowSelector: string;
	container: {
		title: string;
		class?: string;
		compact?: boolean;
		filter?: boolean;
		collapsible?: boolean;
		applyRounding?: boolean;
	} & ContainerPosition;
	sections?: FilterSectionDef<unknown>[];
	statisticsLabel?: string;
	enabled?: boolean;
	onStateChange?: (state: State) => void | Promise<void>;
}): FilterController {
	const sections: FilterSectionInstance[] = [];
	const sectionDefs: FilterSectionDef<unknown>[] = options.sections ?? [];
	const { rowSelector, container: containerOpts, statisticsLabel, enabled: initialEnabled, onStateChange } = options;

	const { content, options: headerOptions } = createContainer(containerOpts.title, {
		filter: true,
		compact: true,
		...containerOpts,
	});

	const statistics: StatisticsResult = createStatistics(statisticsLabel ?? "entries", false, false);
	content.appendChild(statistics.element);

	const sectionWrapper = elementBuilder({ type: "div", class: "content" });
	content.appendChild(sectionWrapper);

	const wrapperMap = new Map<string, HTMLElement>();

	function _toggleSiblings(row: HTMLElement, hide: boolean): void {
		const sibling = row.nextElementSibling;
		if (!sibling) return;

		const isClass = (element: Element, className: string) => element.classList.contains(className);
		const nextNext = sibling.nextElementSibling;

		if (isClass(sibling, "tt-last-action") || isClass(sibling, "tt-stats-estimate")) {
			sibling.classList.toggle("tt-hidden", hide);
			if (nextNext && (isClass(nextNext, "tt-last-action") || isClass(nextNext, "tt-stats-estimate"))) {
				nextNext.classList.toggle("tt-hidden", hide);
			}
		}
	}

	function applyFilter(rows: HTMLElement[], activeSections: FilterSectionInstance[], values: Map<string, unknown>): void {
		rowLoop: for (const row of rows) {
			for (const section of activeSections) {
				try {
					if (!section.test(row, values.get(section.key))) {
						row.classList.add("tt-hidden");
						row.dataset.hideReason = section.key;
						_toggleSiblings(row, true);
						continue rowLoop;
					}
				} catch (e) {
					console.warn(`TT Filters: Something went wrong when filtering '${section?.key}' in the '${containerOpts?.title}'`, e);
				}
			}

			row.classList.remove("tt-hidden");
			_toggleSiblings(row, false);
			delete row.dataset.hideReason;
		}
	}

	async function run() {
		await requireElement(rowSelector);

		sections.forEach((section) => section.onBeforeFilter?.());

		const enabled = funnel.isEnabled();
		const values = new Map<string, unknown>();
		for (const section of sections) {
			values.set(section.key, section.getValue());
		}

		const state = { enabled } as Record<string, unknown> & { enabled: boolean };
		for (const [key, value] of values) {
			state[key] = value;
		}

		if (onStateChange) {
			await onStateChange(state as State);
		}

		if (!enabled) {
			findAllElements(`${rowSelector}.tt-hidden`).forEach((row) => {
				row.classList.remove("tt-hidden");
				delete row.dataset.hideReason;
			});
			const allRows = findAllElements(rowSelector);
			statistics.updateStatistics(allRows.length, allRows.length, content);
			return;
		}

		const rows = findAllElements<HTMLElement>(rowSelector);
		applyFilter(rows, sections, values);

		const visible = rows.filter((r) => !r.classList.contains("tt-hidden")).length;
		statistics.updateStatistics(visible, rows.length, content);
	}

	async function runScoped(options?: { rows?: HTMLElement[]; sections?: string[] | null }) {
		const scopedRows = options?.rows ?? findAllElements<HTMLElement>(rowSelector);
		const activeSections = options?.sections ? sections.filter((s) => options.sections.includes(s.key)) : sections;

		activeSections.forEach((s) => s.onBeforeFilter?.());

		const enabled = funnel.isEnabled();
		const values = new Map<string, unknown>();
		for (const section of activeSections) {
			values.set(section.key, section.getValue());
		}

		if (!enabled) {
			scopedRows.forEach((row) => {
				row.classList.remove("tt-hidden");
				delete row.dataset.hideReason;
			});
		} else {
			applyFilter(scopedRows, activeSections, values);
		}

		const allRows = findAllElements(rowSelector);
		const visible = allRows.filter((r) => !r.classList.contains("tt-hidden")).length;
		statistics.updateStatistics(visible, allRows.length, content);
	}

	const funnel = createFilterEnabledFunnel();
	funnel.setEnabled(initialEnabled ?? true);
	funnel.onChange(() => run());
	headerOptions.appendChild(funnel.element);

	function addSection(section: FilterSectionDef<unknown>): void {
		const trigger = () => run();
		const built = section.build(trigger);
		const isHeader = section.placement === "header";

		const wrapper = elementBuilder({
			type: "div",
			children: [!isHeader && section.title ? elementBuilder({ type: "strong", text: section.title }) : null, built.element],
		});

		if (isHeader) {
			headerOptions.appendChild(wrapper);
		} else {
			sectionWrapper.appendChild(wrapper);
		}
		wrapperMap.set(section.key, wrapper);

		sections.push({
			key: section.key,
			getValue: built.getValue.bind(built),
			test: section.test,
			onBeforeFilter: built.onBeforeFilter?.bind(built),
		});
	}

	function removeSection(key: string): void {
		const wrapper = wrapperMap.get(key);
		if (wrapper) {
			wrapper.remove();
			wrapperMap.delete(key);
		}

		const idx = sections.findIndex((s) => s.key === key);
		if (idx !== -1) {
			sections.splice(idx, 1);
		}
	}

	function rerenderSections(): void {
		wrapperMap.keys().forEach(removeSection);

		sectionDefs.filter((def) => !def.enabled || def.enabled()).forEach(addSection);

		void run();
	}

	rerenderSections();

	return {
		rerenderSections,
		run,
		runScoped,
		dispose() {
			removeContainer(containerOpts.title);
			funnel.dispose();
			findAllElements(`${rowSelector}.tt-hidden`).forEach((row) => {
				row.classList.remove("tt-hidden");
				delete row.dataset.hideReason;
			});
		},
	} satisfies FilterController;
}
