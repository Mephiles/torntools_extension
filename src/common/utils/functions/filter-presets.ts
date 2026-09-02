import "./filter-presets.css";
import { ttStorage } from "@common/utils/context";
import { filters } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { PHFillCaretDown, PHFillPlus, PHPencilSimple, PHTrash } from "@common/utils/icons/phosphor-icons";

interface FilterPresetsOptions {
	storageKey: string;
	/** Maximum number of presets (default: 3). */
	max?: number;
	headerOptions: HTMLElement;
	content: HTMLElement;
	captureValues: () => Record<string, unknown>;
	setValues: (values: Record<string, unknown>) => void;
	run: () => Promise<void>;
}

export interface FilterPreset {
	name: string;
	label?: string;
	state: Record<string, unknown>;
}

export interface FilterPresets {
	collapsed: boolean;
	presets: FilterPreset[];
}

export type FilterPresetsMap = { [filterKey: string]: FilterPresets };

export function createFilterPresets(options: FilterPresetsOptions) {
	const panel = elementBuilder({ type: "div", class: "tt-filter-presets" });
	const quickButtons = elementBuilder({ type: "div", class: "tt-filter-preset-quick" });
	const title = options.headerOptions.parentElement;
	const titleText = title ? findElement(":scope > .text", title, true) : undefined;
	if (titleText) {
		title.parentElement!.classList.add("tt-has-presets");
		title.insertBefore(quickButtons, titleText.nextSibling);
	} else {
		options.headerOptions.appendChild(quickButtons);
	}

	const header = elementBuilder({
		type: "div",
		class: "tt-filter-presets-header",
		events: { click: () => persist({ ...presetsData, collapsed: !presetsData.collapsed }) },
		children: [elementBuilder({ type: "strong", text: "Presets" }), PHFillCaretDown({ class: "icon" })],
	});
	const body = elementBuilder({ type: "div", class: "tt-filter-presets-body" });
	panel.replaceChildren(header, body);
	options.content.insertBefore(panel, options.content.firstChild);

	const maxPresets = options.max ?? 3;

	let presetsData: FilterPresets = filters.presets[options.storageKey] ?? { collapsed: false, presets: [] };
	let editingIndex: number | null = null;

	function persist(data: FilterPresets) {
		presetsData = data;
		void ttStorage.change({ filters: { presets: { [options.storageKey]: data } } });
		render();
	}

	function render() {
		header.classList.toggle("collapsed", presetsData.collapsed);
		renderQuickButtons();
		renderBody();
	}

	async function loadPreset(preset: FilterPreset) {
		options.setValues(preset.state);
		await options.run();
	}

	function renderQuickButtons() {
		quickButtons.replaceChildren(
			...presetsData.presets.map((preset) =>
				elementBuilder({
					type: "button",
					class: ["tt-btn", "tt-filter-preset-quick-btn"],
					attributes: { title: `Load preset: ${preset.name}` },
					text: preset.label || preset.name,
					events: {
						click: (event) => {
							event.stopPropagation();
							void loadPreset(preset);
						},
					},
				}),
			),
		);
	}

	function renderBody() {
		const list = elementBuilder({ type: "div", class: "tt-filter-presets-list" });
		const atLimit = presetsData.presets.length >= maxPresets;

		body.innerHTML = "";

		presetsData.presets.forEach((preset, index) => {
			list.appendChild(editingIndex === index ? renderEditForm(preset, index) : renderPresetRow(preset, index));
		});

		if (presetsData.presets.length > 0) body.appendChild(list);

		if (atLimit) {
			body.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-filter-presets-limit",
					text: `Preset limit reached (max ${maxPresets}). Delete a preset to add a new one.`,
				}),
			);
		} else {
			body.appendChild(renderAddForm());
		}
	}

	function renderPresetRow(preset: FilterPreset, index: number): HTMLElement {
		return elementBuilder({
			type: "div",
			class: "tt-filter-presets-row",
			children: [
				elementBuilder({ type: "span", class: "tt-filter-presets-row-name", text: preset.name }),
				preset.label ? elementBuilder({ type: "span", class: "tt-filter-presets-row-label", text: preset.label }) : null,
				buildRowActionButton(PHPencilSimple({}), "Edit preset", () => {
					editingIndex = index;
					renderBody();
				}),
				buildRowActionButton(PHTrash({}), "Delete preset", () => deletePreset(index)),
			],
		});
	}

	function buildRowActionButton(icon: SVGElement, tooltip: string, onClick: () => void): HTMLButtonElement {
		const button = elementBuilder({
			type: "button",
			class: "tt-btn tt-filter-presets-icon-btn",
			attributes: { title: tooltip },
			children: [icon],
			events: {
				click: (event) => {
					event.stopPropagation();
					button.dispatchEvent(new Event("mouseout")); // dismiss native title tooltip before the button is removed
					onClick();
				},
			},
		});
		return button;
	}

	function renderEditForm(preset: FilterPreset, index: number): HTMLElement {
		const nameInput = elementBuilder({ type: "input", class: "tt-input tt-filter-presets-name", value: preset.name });
		const labelInput = elementBuilder({ type: "input", class: "tt-input tt-filter-presets-label", value: preset.label ?? "" });
		const renameButton = elementBuilder({
			type: "button",
			class: "tt-btn tt-filter-presets-save",
			text: "Save name & label",
			events: { click: () => renamePreset(index, nameInput.value, labelInput.value) },
		});
		const saveSelectionButton = elementBuilder({
			type: "button",
			class: "tt-btn tt-filter-presets-save",
			text: "Save selection",
			events: { click: () => savePresetSelection(index) },
		});

		nameInput.addEventListener("input", () => (renameButton.disabled = !nameInput.value.trim()));

		return elementBuilder({
			type: "div",
			class: "tt-filter-presets-row tt-filter-presets-editing",
			children: [
				elementBuilder({
					type: "div",
					class: "tt-filter-presets-fields",
					children: [elementBuilder({ type: "span", text: "Name" }), nameInput, elementBuilder({ type: "span", text: "Label" }), labelInput],
				}),
				elementBuilder({
					type: "div",
					class: "tt-filter-presets-actions",
					children: [
						renameButton,
						saveSelectionButton,
						elementBuilder({
							type: "button",
							class: "tt-btn tt-filter-presets-cancel",
							text: "Cancel",
							events: {
								click: () => {
									editingIndex = null;
									renderBody();
								},
							},
						}),
					],
				}),
			],
		});
	}

	function renderAddForm(): HTMLElement {
		const nameInput = elementBuilder({ type: "input", class: "tt-input tt-filter-presets-name", attributes: { placeholder: "Preset name" } });
		const labelInput = elementBuilder({ type: "input", class: "tt-input tt-filter-presets-label", attributes: { placeholder: "Label (optional)" } });
		const addBtn = elementBuilder({
			type: "button",
			class: "tt-btn tt-filter-presets-save",
			children: [PHFillPlus({}), elementBuilder({ type: "span", text: "Add preset" })],
			events: { click: () => addPreset(nameInput.value, labelInput.value) },
		});

		nameInput.addEventListener("input", () => (addBtn.disabled = !nameInput.value.trim()));

		return elementBuilder({
			type: "div",
			class: "tt-filter-presets-add",
			children: [
				elementBuilder({
					type: "div",
					class: "tt-filter-presets-fields",
					children: [nameInput, labelInput],
				}),
				addBtn,
			],
		});
	}

	function addPreset(name: string, label: string) {
		if (presetsData.presets.length >= maxPresets) return;
		const trimmedName = name.trim();
		if (!trimmedName) return;

		persist({
			...presetsData,
			presets: [
				...presetsData.presets,
				{
					name: trimmedName,
					label: label.trim() || undefined,
					state: options.captureValues(),
				},
			],
		});
	}

	function renamePreset(index: number, name: string, label: string) {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		editingIndex = null;
		persist({
			...presetsData,
			presets: presetsData.presets.map((preset, i) => {
				if (i !== index) return preset;
				return {
					...preset,
					name: trimmedName,
					label: label.trim() || undefined,
				};
			}),
		});
	}

	function savePresetSelection(index: number) {
		editingIndex = null;
		persist({
			...presetsData,
			presets: presetsData.presets.map((preset, i) => {
				if (i !== index) return preset;
				return { ...preset, state: options.captureValues() };
			}),
		});
	}

	function deletePreset(index: number) {
		editingIndex = null;
		persist({
			...presetsData,
			presets: presetsData.presets.filter((_, i) => i !== index),
		});
	}

	function dispose() {
		panel.remove();
		quickButtons.remove();
	}

	render();

	return { dispose };
}
