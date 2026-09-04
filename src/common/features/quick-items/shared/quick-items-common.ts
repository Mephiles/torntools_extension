import { ITEM_RESOLVER, ttStorage } from "@common/utils/context.ts";
import { settings } from "@common/utils/data/database.ts";
import { createContainer } from "@common/utils/functions/containers.ts";
import { elementBuilder, findParent, isElement, isHTMLElement, mobile, tablet } from "@common/utils/functions/dom.ts";
import { findAllElements, findElement } from "@common/utils/functions/find-elements.ts";
import { formatTime } from "@common/utils/functions/formatting.ts";
import { createSwipeSafeClickEvents } from "@common/utils/functions/gestures.ts";
import { ALLOWED_BLOOD, getBloodType, getEquipPosition, getItemEnergy, getUserEnergy, isEquipable } from "@common/utils/functions/torn.ts";
import { PHEye, PHPlus, PHX } from "@common/utils/icons/phosphor-icons.ts";
import { getSpecialAction, isSpecialAction, toggleSpecialQuickOptions } from "@features/quick-items/shared/special-actions.ts";
import "@features/highlight-blood-bags/highlight-blood-bags.css";
import styles from "./quick-items-common.module.css";
import "./quick-items-common.css";

const IRRADIATED_BLOOD_BAG = 1012;

export type QuickItem = { id: QuickItemId };
export type QuickItemId = number | string;

export function parseQuickItemId(value: string): QuickItemId {
	return Number.isNaN(parseInt(value)) ? value : parseInt(value);
}

export function buildResponseLinks(links: { title: string; url: string; class: string; attr: string }[]) {
	const built = [elementBuilder({ type: "a", href: "#", class: "close-act t-blue h", text: "Close" })];
	for (const link of links) {
		built.push(
			elementBuilder({
				type: "a",
				class: `t-blue h m-left10 ${link.class}`,
				href: link.url,
				text: link.title,
				attributes: Object.fromEntries(
					link.attr
						.split(" ")
						.filter((x) => !!x)
						.map((x) => x.split("=")),
				),
			}),
		);
	}
	return built;
}

export function formatResponseTimers(responseWrap: HTMLElement) {
	for (const count of findAllElements(".counter-wrap", responseWrap)) {
		count.classList.add("tt-modified");
		count.textContent = formatTime({ seconds: parseInt(count.dataset.time!) }, { type: "timer", daysToHours: true });
	}
}

export interface QuickDragHandlerOptions {
	containerId: string;
	resolveQuickItem: (target: Element) => QuickItemId | null;
	addQuickItem: (item: QuickItem, temporary?: boolean) => void;
	saveQuickItems: () => Promise<void>;
}

export function createQuickDragHandlers(options: QuickDragHandlerOptions) {
	const container = `#${options.containerId}`;

	return {
		onDragStart(event: DragEvent) {
			event.dataTransfer?.setData("text/plain", "");

			setTimeout(() => {
				findElement(`${container} > main`).classList.add("drag-progress");
				if (findElement(`${container} .temp.item`, true) || !isElement(event.target)) return;

				const id = options.resolveQuickItem(event.target);
				if (id === null) return;

				options.addQuickItem({ id }, true);
			}, 10);
		},
		async onDragEnd() {
			findElement(`${container} .temp.item`, true)?.remove();
			findElement(`${container} > main`).classList.remove("drag-progress");

			await options.saveQuickItems();
		},
	};
}

export function initialiseQuickItems() {
	document.addEventListener("click", (event) => {
		if (isElement(event.target) && event.target.classList.contains("close-act")) {
			const responseWrap = findParent(event.target, { class: "response-wrap" });

			if (responseWrap) responseWrap.style.display = "none";
		}
	});

	setInterval(() => {
		for (const timer of findAllElements(".counter-wrap.tt-modified")) {
			const secondsLeft = Math.max(0, parseInt(timer.dataset.secondsLeft ?? timer.dataset.time!) - 1);

			timer.textContent = formatTime({ seconds: secondsLeft }, { type: "timer", daysToHours: true });
			timer.dataset.secondsLeft = `${secondsLeft}`;
		}
	}, 1000);
}

export interface QuickItemsControllerOptions {
	title: string;
	containerClass?: string;
	nextElement: () => HTMLElement;
	getOverlayItems: () => HTMLElement[];
	getSourceItems: () => HTMLElement[];
	parseSourceItem: (element: HTMLElement) => QuickItem | null;
	onEditToggle?: (editing: boolean) => void;
	allowQuickItem: (id: QuickItemId, category: string | null) => boolean;
	savedItems: () => QuickItem[];
	storageKey: "items" | "factionItems";

	// Temporary options
	useQuickItem: (item: QuickItem, context: UseContext) => void | Promise<void>;
	buildAdditionalItems?: (item: QuickItem, wrapper: HTMLElement) => void;
}

export interface UseContext {
	itemWrap: HTMLElement;
	responseWrap: HTMLElement;
	innerContent: HTMLElement;
}

export function createQuickItemsController(options: QuickItemsControllerOptions) {
	let controlledContainerElements:
		| {
				container: HTMLElement;
				content: HTMLElement;
				innerContent: HTMLElement;
				responseWrap: HTMLElement;
		  }
		| undefined;
	let isEditing = false;
	let movingElement: Element | undefined;
	const editListenerItems = new Set<HTMLElement>();

	function requireContainerElements() {
		return controlledContainerElements!;
	}

	function create() {
		const {
			container,
			content,
			options: containerOptions,
		} = createContainer(options.title, {
			class: [options.containerClass, "tt-quick-items-common"],
			nextElement: options.nextElement(),
			allowDragging: true,
			compact: true,
		});

		const innerContent = elementBuilder({ type: "div", class: ["inner-content", styles.quickItemsList] });
		const responseWrap = elementBuilder({ type: "div", class: "response-wrap" });
		content.append(innerContent, responseWrap);

		containerOptions.append(
			elementBuilder({
				type: "div",
				class: "option",
				id: "edit-items-button",
				children: [PHPlus(), "Edit"],
				events: {
					click: (event) => {
						event.stopPropagation();
						isEditing = (event.currentTarget as Element).classList.toggle("tt-overlay-item");

						const elements = requireContainerElements();
						findAllElements(".item", elements.content).forEach((item) => {
							item.classList.toggle("tt-overlay-item", isEditing);
							item.classList.toggle("removable", isEditing);
						});
						options.getOverlayItems().forEach((item) => item.classList.toggle("tt-overlay-item", isEditing));
						options.onEditToggle?.(isEditing);
						findElement(".tt-overlay", true)?.classList.toggle("tt-hidden", !isEditing);
						if (isEditing) attachEditListeners();
						else detachEditListeners();
					},
				},
			}),
			elementBuilder({
				type: "div",
				class: "option",
				id: "custom-actions-button",
				children: [PHEye(), "Specials"],
				events: {
					click: (event) => {
						event.stopPropagation();

						toggleSpecialQuickOptions(content, addQuickItem, saveQuickItems);
					},
				},
			}),
		);

		controlledContainerElements = { container, content, innerContent, responseWrap };

		options.savedItems().forEach((item) => addQuickItem(item));

		return { content, options: containerOptions };
	}

	function attachEditListeners() {
		if (!isEditing) return;

		const sourceItems = new Set(options.getSourceItems());
		for (const item of editListenerItems) {
			if (sourceItems.has(item)) continue;

			item.removeEventListener("click", onItemClickQuickEdit);
			editListenerItems.delete(item);
		}

		for (const item of sourceItems) {
			item.addEventListener("click", onItemClickQuickEdit);
			editListenerItems.add(item);
		}
	}

	function detachEditListeners() {
		for (const item of editListenerItems) item.removeEventListener("click", onItemClickQuickEdit);
		editListenerItems.clear();
	}

	async function onItemClickQuickEdit(event: MouseEvent) {
		if (!isEditing) return;

		event.stopPropagation();
		event.preventDefault();

		if (!isHTMLElement(event.target)) return;

		const item = options.parseSourceItem(event.target);
		if (!item) return;

		const itemElement = addQuickItem(item, false);
		if (itemElement) itemElement.classList.add("tt-overlay-item", "removable");

		await saveQuickItems();
	}

	function addQuickItem(item: QuickItem, temporary = false) {
		const { id } = item;
		const elements = requireContainerElements();

		const existingItem = findElement(`.item[data-id='${id}']`, elements.content, true);
		if (existingItem) return existingItem;

		if (!options.allowQuickItem(id, typeof id === "number" ? (ITEM_RESOLVER.getStaticItem(id)?.type ?? null) : null)) return null;

		const dataset: Record<string, any> = { id };
		if (isSpecialAction(id)) {
			const action = getSpecialAction(id);

			dataset.action = action.name;
		} else if (typeof id === "number" && isEquipable(id, ITEM_RESOLVER.getStaticItem(id)?.type ?? "")) {
			dataset.equipPosition = getEquipPosition(id, ITEM_RESOLVER.getStaticItem(id)?.type ?? "");
		}

		const itemWrap = elementBuilder({
			type: "div",
			class: ["item", styles.quickItem, temporary ? "temp" : null],
			dataset,
			events: {
				...createSwipeSafeClickEvents(async () => {
					if (itemWrap.classList.contains("removable")) {
						itemWrap.remove();
						itemWrap.dispatchEvent(new Event("mouseout"));
						closeIcon.dispatchEvent(new Event("mouseout"));
						await saveQuickItems();
						return;
					}

					if (
						settings.pages.items.energyWarning &&
						typeof id === "number" &&
						["Drug", "Energy Drink"].includes(ITEM_RESOLVER.getStaticItem(id)?.type ?? "")
					) {
						const received = getItemEnergy(id);
						if (received) {
							const [current, max] = getUserEnergy();
							if (current > max && received + current > 1000 && !confirm("Are you sure to use this item ? It will get you to more than 1000E."))
								return;
						}
					}

					await options.useQuickItem(item, {
						itemWrap,
						responseWrap: elements.responseWrap,
						innerContent: elements.innerContent,
					});
				}),
				dragstart(event) {
					if (!isElement(event.currentTarget) || !event.dataTransfer) return;

					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setDragImage(event.currentTarget, 0, 0);

					movingElement = event.currentTarget;
				},
				async dragend() {
					movingElement?.classList.remove("temp");
					movingElement = undefined;

					await saveQuickItems();
				},
				dragover(event) {
					event.preventDefault();
				},
				dragenter(event) {
					if (!movingElement || movingElement === event.currentTarget || !isElement(event.currentTarget)) return;

					const children = Array.from(elements.innerContent.children);

					if (children.indexOf(movingElement) > children.indexOf(event.currentTarget)) {
						elements.innerContent.insertBefore(movingElement, event.currentTarget);
					} else if (event.currentTarget.nextElementSibling) {
						elements.innerContent.insertBefore(movingElement, event.currentTarget.nextElementSibling);
					} else {
						elements.innerContent.appendChild(movingElement);
					}
					movingElement.classList.add("temp");
				},
			},
			attributes: {
				draggable: !(mobile || tablet),
			},
		});

		buildItem(item, itemWrap);

		const closeIcon = elementBuilder({
			type: "div",
			class: "tt-close-icon",
			children: [PHX()],
			attributes: { title: "Remove quick access." },
			events: createSwipeSafeClickEvents(async (event) => {
				event.stopPropagation();
				itemWrap.dispatchEvent(new Event("mouseout"));
				closeIcon.dispatchEvent(new Event("mouseout"));
				itemWrap.remove();

				await saveQuickItems();
			}),
		});
		itemWrap.appendChild(closeIcon);
		elements.innerContent.appendChild(itemWrap);
		return itemWrap;
	}

	function buildItem(item: QuickItem, wrapper: HTMLElement) {
		if (typeof item.id === "number") {
			wrapper.appendChild(
				elementBuilder({ type: "div", class: "pic", attributes: { style: `background-image: url(/images/items/${item.id}/medium.png)` } }),
			);

			const staticItem = ITEM_RESOLVER.getStaticItem(item.id);
			if (staticItem) {
				wrapper.setAttribute("title", staticItem.name);
				wrapper.appendChild(elementBuilder({ type: "div", class: styles.name, text: staticItem.name }));

				highlightBloodBag(item.id, staticItem.name, wrapper);
			} else {
				wrapper.appendChild(elementBuilder({ type: "div", class: styles.name, text: item.id }));
			}
		} else if (isSpecialAction(item.id)) {
			const specialAction = getSpecialAction(item.id);

			wrapper.setAttribute("title", specialAction.name);
			wrapper.appendChild(elementBuilder({ type: "div", class: styles.name, text: specialAction.name }));
		} else if (options.buildAdditionalItems) {
			options.buildAdditionalItems(item, wrapper);
		} else {
			throw new Error("Failed to build the quick item due to a missing additional item builder.");
		}
	}

	function highlightBloodBag(id: number, name: string, wrapper: HTMLElement) {
		wrapper.classList.remove("good-blood", "bad-blood");

		if (
			!settings.pages.items.highlightQuickItemBloodBags ||
			settings.pages.items.highlightBloodBags === "none" ||
			!name.startsWith("Blood Bag : ") ||
			id === IRRADIATED_BLOOD_BAG
		)
			return;

		const bloodType = getBloodType();
		const allowedBlood: number[] = (bloodType && ALLOWED_BLOOD[bloodType]) ?? [];
		wrapper.classList.add(allowedBlood.includes(id) ? "good-blood" : "bad-blood");
	}

	async function saveQuickItems() {
		const elements = requireContainerElements();
		await ttStorage.change({
			quick: {
				[options.storageKey]: findAllElements(".item", elements.innerContent).map((x) => ({ id: parseQuickItemId(x.dataset.id!) })),
			},
		});
	}

	function dispose() {
		detachEditListeners();
		controlledContainerElements?.container.remove();
		controlledContainerElements = undefined;
	}

	return {
		create,
		refreshEditListeners: () => attachEditListeners(),
		dispose,
		addQuickItem,
		saveQuickItems,
	};
}
