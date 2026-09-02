import "./filters.css";
import { userdata } from "@common/utils/data/database";
import type { WeaponBonusFilter } from "@common/utils/data/default-database";
import { createCheckboxDuo } from "@common/utils/elements/checkbox-duo/checkbox-duo";
import { createCheckboxList } from "@common/utils/elements/checkbox-list/checkbox-list";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { createRadioList } from "@common/utils/elements/radio-list/radio-list.ts";
import { createMultiSelect, createSelect } from "@common/utils/elements/select/select";
import { DualRangeSlider } from "@common/utils/elements/slider/slider";
import { createTextbox } from "@common/utils/elements/textbox/textbox";
import type { TextboxWithoutDescriptionFilter } from "@common/utils/elements/textbox/textbox";
import { hasAPIData } from "@common/utils/functions/api";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import type { ContainerOptions, ContainerPosition } from "@common/utils/functions/containers";
import { elementBuilder } from "@common/utils/functions/dom";
import { createFilterPresets } from "@common/utils/functions/filter-presets";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
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
	const icon = findElement("[class*='userOnlineStatusIcon___']", element, true);
	if (icon) {
		const label = icon?.getAttribute("alt") || icon.closest("[aria-label]")?.getAttribute("aria-label");
		const labelMatch = label?.match(/\b(online|idle|offline)\b/i);
		if (labelMatch) {
			return labelMatch[1].toLowerCase() as UserActivityStatus;
		}
	}

	const title = findElement("#iconTray li", element, true)?.getAttribute("title");
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
		findElement(".statistics .stat-count", content).textContent = count.toString();
		findElement(".statistics .stat-total", content).textContent = total.toString();
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
	setValue?(value: V): void;
	onBeforeFilter?(): void;
}

export interface FilterSectionDef<V> {
	readonly key: string;
	readonly title: string;
	readonly priority?: number;
	/** When true, if this section's test returns true the row skips all remaining filter checks. */
	readonly isExemption?: boolean;
	build?(onChange: () => void): SectionBuildResult<V>;
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
	priority?: number;
	defaultValue: boolean;
	test: (row: HTMLElement, checked: boolean) => boolean;
	enabled?: () => boolean;
}

export function checkboxSection(options: CheckboxSectionOptions): FilterSectionDef<boolean> {
	const { key, title, label, priority, defaultValue, test, enabled } = options;

	return {
		key,
		title,
		priority,
		enabled,
		build(onChange: () => void) {
			const checkbox = createCheckbox({ description: label ?? title });
			checkbox.setChecked(defaultValue);
			checkbox.onChange(onChange);

			return { element: checkbox.element, getValue: () => checkbox.isChecked(), setValue: (value) => checkbox.setChecked(value) };
		},
		test,
	};
}

interface CheckboxesSectionOptions {
	key: string;
	title: string;
	priority?: number;
	items: { id: string; description: string }[];
	defaults: string[];
	test: (row: HTMLElement, selections: string[]) => boolean;
	orientation?: "column" | "row";
	enabled?: () => boolean;
	isExemption?: boolean;
}

export function checkboxesSection(options: CheckboxesSectionOptions): FilterSectionDef<string[]> {
	const { key, title, priority, items, defaults, test, orientation, enabled, isExemption } = options;

	return {
		key,
		title,
		priority,
		enabled,
		isExemption,
		build(onChange: () => void) {
			const list = createCheckboxList({ items, orientation: orientation ?? "column", useId: true });
			list.setSelections(defaults ?? []);
			list.onSelectionChange(onChange);

			return { element: list.element, getValue: () => list.getSelections(), setValue: (value) => list.setSelections(value ?? []) };
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
	priority?: number;
	getOptions(): SelectOption[];
	defaultValue: string;
	test: (row: HTMLElement, selected: string) => boolean;
	enabled?: () => boolean;
}

export function selectSection(options: SelectSectionOptions): FilterSectionDef<string> {
	const { key, title, priority, getOptions, defaultValue, test, enabled } = options;

	return {
		key,
		title,
		priority,
		enabled,
		build(onChange: () => void) {
			const select = createSelect(getOptions());
			select.setSelected(defaultValue);
			select.onChange(onChange);

			return {
				element: select.element,
				getValue: () => select.getSelected(),
				setValue: (value) => select.setSelected(value),
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
	priority?: number;
	config: { min: number; max: number; step: number };
	defaults: { low: number; high: number };
	formatCounter?: (range: SliderRange) => string;
	test: (row: HTMLElement, range: SliderRange) => boolean;
	enabled?: () => boolean;
}

export function sliderSection(options: SliderSectionOptions): FilterSectionDef<SliderRange> {
	const { key, title, priority, config, defaults, formatCounter, test, enabled } = options;

	return {
		key,
		title,
		priority,
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

			let suppressChange = false;

			new MutationObserver(() => {
				updateCounter();
				if (suppressChange) {
					// setValue mutates the slider synchronously; all mutations arrive in this single observer batch.
					suppressChange = false;
					return;
				}
				onChange();
			}).observe(slider.slider!, { attributes: true });

			return {
				element: section,
				getValue: readRange,
				setValue(range) {
					// The MutationObserver above fires onChange async; suppress it so the preset loader can run() once itself.
					suppressChange = true;
					slider.setRange(range.start, range.end);
				},
			};
		},
		test,
	};
}

interface TextSectionOptions {
	key: string;
	title: string;
	priority?: number;
	type?: "text" | "number";
	defaultValue: string;
	test: (row: HTMLElement, value: string) => boolean;
	enabled?: () => boolean;
}

export function textSection(options: TextSectionOptions): FilterSectionDef<string> {
	const { key, title, priority, type, defaultValue, test, enabled } = options;

	return {
		key,
		title,
		priority,
		enabled,
		build(onChange: () => void) {
			const textbox = createTextbox({ type: type ?? "text" });
			textbox.setValue(defaultValue ?? "");
			textbox.onChange(onChange);

			return { element: textbox.element, getValue: () => textbox.getValue(), setValue: (value) => textbox.setValue(value ?? "") };
		},
		test,
	};
}

export function selectorExemption(options: { key: string; selector: string; priority?: number }): FilterSectionDef<true> {
	return {
		key: options.key,
		title: "",
		isExemption: true,
		priority: options.priority ?? 0,
		test: (row) => !!findElement(options.selector, row, true),
	};
}

interface MultiSelectSectionOptions {
	key: string;
	title: string;
	priority?: number;
	items: SelectOption[];
	defaults: string[];
	test: (row: HTMLElement, selections: string[]) => boolean;
	enabled?: () => boolean;
}

export function multiSelectSection(options: MultiSelectSectionOptions): FilterSectionDef<string[]> {
	const { key, title, priority, items, defaults, test, enabled } = options;

	return {
		key,
		title,
		priority,
		enabled,
		build(onChange: () => void) {
			const multi = createMultiSelect({ select: items, defaults });
			multi.onChange(onChange);
			return { element: multi.element, getValue: () => multi.getSelected(), setValue: (value) => multi.setSelected(value ?? []) };
		},
		test,
	};
}

export type DuoCheckboxState = Record<string, SpecialFilterValue>;

type DuoCheckboxItem = string | { id: string; description?: string; indicator?: "icon" | "text" };

interface DuoCheckboxesSectionOptions {
	key: string;
	title: string;
	priority?: number;
	items: DuoCheckboxItem[];
	defaults: DuoCheckboxState;
	test: (row: HTMLElement, selections: DuoCheckboxState) => boolean;
	enabled?: () => boolean;
}

export function duoCheckboxesSection(options: DuoCheckboxesSectionOptions): FilterSectionDef<DuoCheckboxState> {
	const { key, title, priority, items, defaults, test, enabled } = options;

	return {
		key,
		title,
		priority,
		enabled,
		build(onChange: () => void) {
			const wrapper = elementBuilder({ type: "div", class: "tt-yn-checkboxes" });

			const duoInstances = items.map((item) => {
				const id = typeof item === "string" ? item : item.id;
				const description = typeof item === "string" ? item : (item.description ?? item.id);
				const indicator = typeof item === "string" ? "text" : (item.indicator ?? "text");
				const ccKey = camelCase(id);

				const duo = createCheckboxDuo({ description, indicator });
				duo.setValue(defaults[ccKey] ?? "none");
				duo.onChange(onChange);
				wrapper.appendChild(duo.element);

				return { ccKey, duo };
			});

			return {
				element: wrapper,
				getValue(): DuoCheckboxState {
					const selections: DuoCheckboxState = {};
					for (const { ccKey, duo } of duoInstances) {
						selections[ccKey] = duo.getValue();
					}
					return selections;
				},
				setValue(value: DuoCheckboxState) {
					for (const { ccKey, duo } of duoInstances) {
						duo.setValue(value[ccKey] ?? "none");
					}
				},
			};
		},
		test,
	};
}

interface RadioSectionOptions {
	key: string;
	name?: string;
	title: string;
	priority?: number;
	items: { value: string; description: string }[];
	defaultValue: string;
	test: (row: HTMLElement, value: string) => boolean;
	orientation?: "column" | "row";
	enabled?: () => boolean;
}

export function radioSection(options: RadioSectionOptions): FilterSectionDef<string> {
	const { key, title, priority, items, defaultValue, test, orientation, enabled } = options;
	let name = options.name ?? key;

	return {
		key,
		title,
		priority,
		enabled,
		build(onChange: () => void) {
			const list = createRadioList(name, { items, orientation: orientation ?? "column" });
			list.setValue(defaultValue);
			list.onSelectionChange(onChange);

			return { element: list.element, getValue: () => list.getValue(), setValue: (value) => list.setValue(value) };
		},
		test,
	};
}

export interface FilterController {
	rerenderSections(): void;
	run(): Promise<void>;
	runScoped(options?: { rows?: HTMLElement[]; sections?: string[] | null }): Promise<void>;
	/** Returns filtered rows. Omit `visible` for all, `true` for visible, `false` for hidden. */
	getRows(visible?: boolean): HTMLElement[];
	reattach(position: ContainerPosition): void;
	dispose(): void;
}

interface FilterSectionInstance {
	key: string;
	priority: number;
	isExemption?: boolean;
	getValue(): unknown;
	setValue?(value: unknown): void;
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

				const factionElement = findElement<HTMLAnchorElement>(".user.faction", row);
				const hasFaction = !!factionElement.href;

				if (faction === "No faction") return !hasFaction;
				if (faction === "In a faction") return hasFaction;

				const factionName = factionElement.hasAttribute("rel")
					? findElement(":scope > img", factionElement, true)?.getAttribute("title")?.trim() || "N/A"
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
					setValue({ min, max }: { min: number | null; max: number | null }) {
						minTextbox.setNumberValue(min);
						maxTextbox.setNumberValue(max);
					},
				};
			},
			test: (row, { min, max }) => {
				let ff: number;

				if (row.dataset.ffScout) ff = parseFloat(row.dataset.ffScout);
				else {
					const gauge = findElement(".tt-ff-scouter-indicator.indicator-lines", row, true);
					if (gauge) ff = parseFloat(gauge.getAttribute("data-ff-scout")!);
				}

				if (Number.isNaN(ff) || ff < 0) return true;

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
			priority: 100,
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

const DEFAULT_PRIORITY = 50;

// oxlint-disable-next-line no-unnecessary-type-parameters -- public generic API; callers pass explicit State type args
export function createFilter<State extends Record<string, unknown> & { enabled: boolean } = Record<string, unknown> & { enabled: boolean }>(options: {
	rowSelector: string;
	container: { title: string } & Partial<ContainerOptions> & ContainerPosition;
	sections?: FilterSectionDef<unknown>[];
	statisticsLabel?: string;
	enabled?: boolean;
	onStateChange?: (state: State) => void | Promise<void>;
	onAfterRun?: () => void | Promise<void>;
	/** Prevents infinite-scroll triggers by preserving the row container's height.
	 *  Pass a number to specify row height in px (default: 36). */
	preserveHeight?: boolean | number;
	/** Enable saveable/loadable filter presets. `key` is the filter's key in `filters` storage. */
	presets?: { key: string; max?: number };
}): FilterController {
	const sections: FilterSectionInstance[] = [];
	const sectionDefs: FilterSectionDef<unknown>[] = options.sections ?? [];
	const { rowSelector, container: containerOpts, statisticsLabel, enabled: initialEnabled, onStateChange, onAfterRun, preserveHeight } = options;
	const rowHeight = typeof preserveHeight === "number" ? preserveHeight : 36;

	const {
		container,
		content,
		options: headerOptions,
	} = createContainer(containerOpts.title, {
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

	/**
	 * Prevents infinite-scroll from triggering when rows are hidden and the list shrinks.
	 * Pads just enough so the visible content extends 200px past the viewport bottom,
	 * never exceeding the natural unfiltered height.
	 * When filter is disabled / disposed, min-height is cleared.
	 */
	function _compensateHeight(rows: HTMLElement[]): void {
		if (!preserveHeight || !rows.length) return;

		const list = rows[0]?.parentElement;
		if (!list) return;

		const hiddenCount = rows.filter((r) => r.classList.contains("tt-hidden")).length;
		if (hiddenCount === 0) {
			delete list.style.minHeight;
			return;
		}

		const listTop = list.getBoundingClientRect().top;
		const visibleHeight = (rows.length - hiddenCount) * rowHeight;
		const contentBottom = listTop + visibleHeight;

		const viewportHeight = window.innerHeight;
		const buffer = 200;
		const target = viewportHeight + buffer;

		if (contentBottom >= target) {
			delete list.style.minHeight;
			return;
		}

		const deficit = target - contentBottom;
		const compensated = visibleHeight + deficit;
		const naturalHeight = rows.length * rowHeight;

		list.style.minHeight = `${Math.min(compensated, naturalHeight)}px`;
	}

	function applyFilter(rows: HTMLElement[], activeSections: FilterSectionInstance[], values: Map<string, unknown>): void {
		const activeSectionReasons = activeSections.map((s) => s.key);

		rowLoop: for (const row of rows) {
			for (const section of activeSections) {
				try {
					if (!section.test(row, values.get(section.key))) {
						if (section.isExemption) continue;
						row.classList.add("tt-hidden");
						row.dataset.hideReason = section.key;
						_toggleSiblings(row, true);
						continue rowLoop;
					}
					if (section.isExemption) break;
				} catch (e) {
					console.warn(`TT Filters: Something went wrong when filtering '${section?.key}' in the '${containerOpts?.title}'`, e);
				}
			}

			if (activeSectionReasons.includes(row.dataset.hideReason)) {
				row.classList.remove("tt-hidden");
				_toggleSiblings(row, false);
				delete row.dataset.hideReason;
			}
		}
	}

	async function run() {
		await requireElement(rowSelector);

		sections.sort((a, b) => a.priority - b.priority);

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
			_compensateHeight(findAllElements(rowSelector));
			const allRows = findAllElements(rowSelector);
			statistics.updateStatistics(allRows.length, allRows.length, content);
			await onAfterRun?.();
			return;
		}

		const rows = findAllElements(rowSelector);
		applyFilter(rows, sections, values);
		_compensateHeight(rows);

		const visible = rows.filter((r) => !r.classList.contains("tt-hidden")).length;
		statistics.updateStatistics(visible, rows.length, content);

		await onAfterRun?.();
	}

	async function runScoped(options?: { rows?: HTMLElement[]; sections?: string[] | null }) {
		const scopedRows = options?.rows ?? findAllElements(rowSelector);
		const activeSections = options?.sections ? sections.filter((s) => options.sections.includes(s.key)) : sections;
		activeSections.sort((a, b) => a.priority - b.priority);

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

		_compensateHeight(scopedRows);

		const allRows = findAllElements(rowSelector);
		const visible = allRows.filter((r) => !r.classList.contains("tt-hidden")).length;
		statistics.updateStatistics(visible, allRows.length, content);

		await onAfterRun?.();
	}

	const funnel = createFilterEnabledFunnel();
	funnel.setEnabled(initialEnabled ?? true);
	funnel.onChange(() => run());
	headerOptions.appendChild(funnel.element);

	function addSection(section: FilterSectionDef<unknown>): void {
		const trigger = () => run();
		const built = section.build?.(trigger);
		const isHeader = section.placement === "header";

		if (built) {
			const wrapper = elementBuilder({
				type: "div",
				children: [!isHeader && section.title ? elementBuilder({ type: "strong", text: section.title }) : null, built.element],
			});

			if (isHeader) headerOptions.appendChild(wrapper);
			else sectionWrapper.appendChild(wrapper);

			wrapperMap.set(section.key, wrapper);
		}

		sections.push({
			key: section.key,
			priority: section.priority ?? DEFAULT_PRIORITY,
			isExemption: section.isExemption,
			getValue: built?.getValue.bind(built) ?? (() => true),
			setValue: built?.setValue?.bind(built),
			test: section.test,
			onBeforeFilter: built?.onBeforeFilter?.bind(built),
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
		sections.slice().forEach((s) => removeSection(s.key));

		sectionDefs.filter((def) => !def.enabled || def.enabled()).forEach(addSection);

		void run();
	}

	rerenderSections();

	let presets: ReturnType<typeof createFilterPresets> | undefined;
	if (options.presets) {
		presets = createFilterPresets({
			storageKey: options.presets.key,
			max: options.presets.max,
			headerOptions,
			content,
			captureValues: () => {
				return sections.reduce<Record<string, unknown>>((acc, section) => {
					acc[section.key] = section.getValue();
					return acc;
				}, {});
			},
			setValues: (values) => {
				sections.forEach((section) => section.setValue?.(values[section.key]));
			},
			run,
		});
	}

	return {
		rerenderSections,
		run,
		runScoped,
		getRows(visible?: boolean): HTMLElement[] {
			const rows = findAllElements(rowSelector);
			if (visible === undefined) return rows;
			return rows.filter((r) => (visible ? !r.classList.contains("tt-hidden") : r.classList.contains("tt-hidden")));
		},
		reattach(position: ContainerPosition): void {
			let parentElement: Element;
			if ("parentElement" in position) parentElement = position.parentElement;
			else if ("nextElement" in position) parentElement = position.nextElement.parentElement!;
			else if ("previousElement" in position) parentElement = position.previousElement.parentElement!;
			else parentElement = findElement(".content-wrapper");

			if ("nextElement" in position) parentElement.insertBefore(container, position.nextElement);
			else if ("previousElement" in position) parentElement.insertBefore(container, position.previousElement.nextSibling);
			else parentElement.appendChild(container);
		},
		dispose() {
			removeContainer(containerOpts.title);
			funnel.dispose();
			presets?.dispose();
			findAllElements(`${rowSelector}.tt-hidden`).forEach((row) => {
				row.classList.remove("tt-hidden");
				delete row.dataset.hideReason;
			});
			const rows = findAllElements(rowSelector);
			_compensateHeight(rows);
		},
	} satisfies FilterController;
}
