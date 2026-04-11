import "./quick-items.css";
import { Feature } from "@/features/feature-manager";
import { calculateAndShowTotalValueInQuickItems, shouldDisplayOpenedValue } from "@/features/opened-supply-pack-value/opened-supply-pack-value";
import { isUseItem } from "@/pages/item-page";
import { type DatabaseCache, ttCache } from "@/utils/common/data/cache";
import { quick, settings, torndata } from "@/utils/common/data/database";
import type { QuickItem } from "@/utils/common/data/default-database";
import { ttStorage } from "@/utils/common/data/storage";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, findParent, isElement, mobile, tablet } from "@/utils/common/functions/dom";
import { formatTime } from "@/utils/common/functions/formatting";
import { addFetchListener, addXHRListener, CUSTOM_LISTENERS, EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireContent, requireItemsLoaded } from "@/utils/common/functions/requires";
import {
	type ExtractedXID,
	extractXIDFromDOM,
	extractXIDFromHTML,
	extractXIDFromJson,
	extractXIDFromMutations,
	getItemEnergy,
	getPageStatus,
	getUserEnergy,
} from "@/utils/common/functions/torn";
import { getTornItemName, getTornItemType, TORN_ITEMS } from "@/utils/common/functions/torn-items";
import { PHPlus, PHX } from "@/utils/common/icons/phosphor-icons";

let movingElement: Element | undefined;
let isEditing = false;

function initialiseQuickItems() {
	document.addEventListener("click", (event) => {
		if (isElement(event.target) && event.target.classList.contains("close-act")) {
			const responseWrap = findParent(event.target, { class: "response-wrap" });

			if (responseWrap) responseWrap.style.display = "none";
		}
	});
	setInterval(() => {
		for (const timer of findAllElements(".counter-wrap.tt-modified")) {
			let secondsLeft: number;
			if ("secondsLeft" in timer.dataset) secondsLeft = parseInt(timer.dataset.secondsLeft);
			else secondsLeft = parseInt(timer.dataset.time);
			secondsLeft--;
			if (secondsLeft < 0) secondsLeft = 0;

			timer.textContent = formatTime({ seconds: secondsLeft }, { type: "timer", daysToHours: true });

			timer.dataset.secondsLeft = `${secondsLeft}`;
		}
	}, 1000);

	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_AMOUNT].push(({ item, amount }) => {
		updateItemAmount(item, amount);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(() => {
		setupQuickDragListeners();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(({ tab }) => {
		setupOverlayItems(tab);
		attachEditListeners(isEditing);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_EQUIPPED].push(({ item, equip }) => {
		updateEquippedItem(item, equip);
	});

	cacheXID(extractXIDFromDOM(document));
	new MutationObserver((mutations) => {
		cacheXID(extractXIDFromMutations(mutations));
	}).observe(document, { childList: true, subtree: true });
	addFetchListener(({ detail: { json, text } }) => {
		if (json) cacheXID(extractXIDFromJson(json));
		else cacheXID(extractXIDFromHTML(text));
	});
	addXHRListener(({ detail: { xhr, json } }) => {
		if (json) cacheXID(extractXIDFromJson(json));
		cacheXID(extractXIDFromHTML(xhr.responseText));
	});
}

async function loadQuickItems() {
	await requireContent();

	const { content, options } = createContainer("Quick Items", {
		nextElement: document.querySelector(".equipped-items-wrap"),
		spacer: true,
		allowDragging: true,
		compact: true,
	});
	content.appendChild(elementBuilder({ type: "div", class: "inner-content" }));
	content.appendChild(elementBuilder({ type: "div", class: "response-wrap" }));
	options.appendChild(
		elementBuilder({
			type: "div",
			class: "option",
			id: "edit-items-button",
			children: [PHPlus(), "Edit"],
			events: {
				click: (event) => {
					event.stopPropagation();

					const enabled = options.querySelector("#edit-items-button").classList.toggle("tt-overlay-item");
					isEditing = enabled;

					const content = findContainer("Quick Items", { selector: ":scope > main" });
					for (const quick of findAllElements(".item", content)) {
						if (enabled) {
							quick.classList.add("tt-overlay-item");
							quick.classList.add("removable");
						} else {
							quick.classList.remove("tt-overlay-item");
							quick.classList.remove("removable");
						}
					}

					for (const category of findAllElements("#categoriesItem:not(.no-items)")) {
						if (
							!["Temporary", "Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster", "Other", "Supply Pack"].includes(
								category.dataset.type,
							)
						)
							continue;

						if (enabled) category.classList.add("tt-overlay-item");
						else category.classList.remove("tt-overlay-item");
					}
					for (const item of findAllElements("ul.items-cont:not(.no-items)")) {
						if (enabled) item.classList.add("tt-overlay-item");
						else item.classList.remove("tt-overlay-item");
					}

					if (enabled) document.querySelector(".tt-overlay").classList.remove("tt-hidden");
					else document.querySelector(".tt-overlay").classList.add("tt-hidden");

					attachEditListeners(enabled);
				},
			},
		}),
	);

	for (const quickItem of quick.items) {
		addQuickItem(quickItem, false);
	}

	requireItemsLoaded().then(() => {
		setupQuickDragListeners();
	});
}

function addQuickItem(data: QuickItem & { equipPosition?: false | number }, temporary = false) {
	const content = findContainer("Quick Items", { selector: ":scope > main" });
	const innerContent = content.querySelector(".inner-content");
	const responseWrap = content.querySelector<HTMLElement>(".response-wrap");

	const { id } = data;

	if (innerContent.querySelector(`.item[data-id='${id}']`)) return innerContent.querySelector(`.item[data-id='${id}']`);
	if (!allowQuickItem(id, getTornItemType(id))) return null;

	let equipPosition: number | false | undefined;
	if (isEquipable(id, getTornItemType(id))) {
		equipPosition = getEquipPosition(id, getTornItemType(id));
		data.equipPosition = equipPosition;
	}

	const itemWrap = elementBuilder({
		type: "div",
		class: temporary ? "temp item" : "item",
		dataset: data,
		events: {
			click: async () => {
				if (itemWrap.classList.contains("removable")) {
					itemWrap.remove();
					itemWrap.dispatchEvent(new Event("mouseout"));
					closeIcon.dispatchEvent(new Event("mouseout"));
					await saveQuickItems();
					return;
				}

				const equipItem = isEquipable(id, getTornItemType(id));
				// TODO: API Inventory Block.
				/*if (equipItem) {
					responseWrap.textContent = "";
					responseWrap.appendChild(elementBuilder({ type: "div", text: "Due to a change in Torn API's policies, we are no" }));
					return;
				}*/
				const xid: number | null = getXID(id);
				if (equipItem && xid === null) {
					getXIDWithDirectCall(id)
						.then((result) => {
							responseWrap.style.display = "block";
							responseWrap.textContent = "";

							if (result) {
								responseWrap.appendChild(
									elementBuilder({
										type: "div",
										class: "custom-error",
										text: "We were missing information for this item, we got that now. Try again.",
									}),
								);
							} else {
								responseWrap.appendChild(
									elementBuilder({
										type: "div",
										class: "custom-error",
										text: "Could't get the missing information. You might not have this item anymore.",
									}),
								);
							}
						})
						.catch((cause) => {
							responseWrap.textContent = "";
							responseWrap.appendChild(
								elementBuilder({
									type: "div",
									class: "custom-error",
									text: "We were missing information for this item, but something went wrong when getting that information. Try again.",
								}),
							);
							console.error(cause);
						});
					return;
				}

				if (settings.pages.items.energyWarning && !equipItem && hasAPIData() && ["Drug", "Energy Drink"].includes(getTornItemType(id))) {
					const received = getItemEnergy(id);
					if (received) {
						const [current, max] = getUserEnergy();
						if (current > max && received + current > 1000) {
							if (!confirm("Are you sure to use this item ? It will get you to more than 1000E.")) return;
						}
					}
				}

				const body = new URLSearchParams();
				if (equipItem) {
					body.set("step", "actionForm");
					body.set("confirm", "1");
					body.set("action", "equip");
					body.set("id", xid.toString());
				} else {
					body.set("step", "useItem");
					body.set("id", id.toString());
					body.set("itemID", id.toString());
				}

				fetchData("torn_direct", { action: "item.php", method: "POST", body }).then(async (result) => {
					if (typeof result === "object" && isUseItem(body.get("step"), result)) {
						const links = [elementBuilder({ type: "a", href: "#", class: "close-act t-blue h", text: "Close" })];

						if (result.success) {
							if (result.links) {
								for (const link of result.links) {
									links.push(
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
							}
						}

						responseWrap.style.display = "block";
						responseWrap.textContent = "";
						responseWrap.appendChild(
							elementBuilder({
								type: "div",
								class: "action-wrap use-act use-action",
								children: [
									elementBuilder({
										type: "form",
										dataset: { action: "useItem" },
										attributes: { method: "post" },
										children: [
											elementBuilder({ type: "p", html: result.text }),
											elementBuilder({ type: "p", children: links }),
											elementBuilder({ type: "div", class: "clear" }),
										],
									}),
								],
							}),
						);

						if (result.success) {
							if (shouldDisplayOpenedValue(id)) {
								calculateAndShowTotalValueInQuickItems(result, responseWrap);
							}

							if (result.items) {
								if (result.items.itemAppear) {
									result.items.itemAppear
										.filter((item) => "ID" in item)
										.forEach((item) => {
											triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, {
												item: parseInt(item.ID),
												amount: parseInt(item.qty),
												reason: "usage",
											});
										});
								}
								if (result.items.itemDisappear) {
									for (const item of result.items.itemDisappear) {
										triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, {
											item: parseInt(item.ID),
											amount: -parseInt(item.qty),
											reason: "usage",
										});
									}
								}
							} else {
								triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: id, amount: -1, reason: "usage" });
							}
						}

						for (const count of findAllElements(".counter-wrap", responseWrap)) {
							count.classList.add("tt-modified");
							count.textContent = formatTime({ seconds: parseInt(count.dataset.time) }, { type: "timer", daysToHours: true });
						}
					} else {
						if (result.includes("Wrong itemID")) {
							await removeXIDFromCache(id);

							responseWrap.style.display = "block";
							responseWrap.textContent = "";
							responseWrap.appendChild(
								elementBuilder({
									type: "div",
									class: "custom-error",
									text: "We are missing information for this item. Use the item again to fetch that information, and then another time to use the item.",
								}),
							);
							return;
						}

						responseWrap.style.display = "block";
						responseWrap.innerHTML = result;

						findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`, innerContent).forEach((x) => x.classList.remove("equipped"));

						if (result.includes(" equipped ")) {
							findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`, innerContent).forEach((x) =>
								x.classList.remove("equipped"),
							);
							itemWrap.classList.add("equipped");
						} else if (result.includes(" unequipped "))
							findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`, innerContent).forEach((x) =>
								x.classList.remove("equipped"),
							);
					}
				});
			},
			dragstart(event) {
				if (!isElement(event.currentTarget)) return;

				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setDragImage(event.currentTarget, 0, 0);

				movingElement = event.currentTarget;
			},
			async dragend() {
				movingElement.classList.remove("temp");
				movingElement = undefined;

				await saveQuickItems();
			},
			dragover(event) {
				event.preventDefault();
			},
			dragenter(event) {
				if (movingElement !== event.currentTarget && isElement(event.currentTarget)) {
					const children = Array.from(innerContent.children);

					if (children.indexOf(movingElement) > children.indexOf(event.currentTarget)) innerContent.insertBefore(movingElement, event.currentTarget);
					else if (event.currentTarget.nextElementSibling) {
						innerContent.insertBefore(movingElement, event.currentTarget.nextElementSibling);
					} else {
						innerContent.appendChild(movingElement);
					}
					movingElement.classList.add("temp");
				}
			},
		},
		attributes: {
			draggable: true,
		},
	});
	itemWrap.appendChild(elementBuilder({ type: "div", class: "pic", attributes: { style: `background-image: url(/images/items/${id}/medium.png)` } }));
	if (hasAPIData()) {
		itemWrap.setAttribute("title", torndata.itemsMap[id].name);
		itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: torndata.itemsMap[id].name }));

		// TODO: API Inventory Block.
		/*if (settings.apiUsage.user.inventory) {
			const inventoryItem = findItemsInList(userdata.inventory, { ID: id }, { single: true });
			const amount = inventoryItem ? inventoryItem.quantity : 0;

			itemWrap.appendChild(elementBuilder({ type: "div", class: "sub-text quantity", attributes: { quantity: amount }, text: amount + "x" }));

			if (inventoryItem.equipped) itemWrap.classList.add("equipped");
		}*/
	} else if (id in TORN_ITEMS) {
		itemWrap.setAttribute("title", TORN_ITEMS[id].name);
		itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: TORN_ITEMS[id].name }));
	} else {
		itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: id }));
	}

	const closeIcon = elementBuilder({
		type: "div",
		class: "tt-close-icon",
		children: [PHX()],
		attributes: { title: "Remove quick access." },
		events: {
			click: async (event) => {
				event.stopPropagation();
				itemWrap.dispatchEvent(new Event("mouseout"));
				closeIcon.dispatchEvent(new Event("mouseout"));
				itemWrap.remove();

				await saveQuickItems();
			},
		},
	});
	itemWrap.appendChild(closeIcon);
	innerContent.appendChild(itemWrap);
	return itemWrap;
}

async function onItemClickQuickEdit(event: MouseEvent) {
	event.stopPropagation();
	event.preventDefault();

	const target = findParent(event.target as Element, { hasAttribute: "data-item" });
	const id = parseInt(target.dataset.item);

	const item = addQuickItem({ id }, false);
	if (item) item.classList.add("tt-overlay-item", "removable");

	await saveQuickItems();
}

async function saveQuickItems() {
	const content = findContainer("Quick Items", { selector: ":scope > main" });

	await ttStorage.change({
		quick: {
			items: findAllElements(".item", content).map<QuickItem>((x) => ({ id: parseInt(x.dataset.id) })),
		},
	});
}

function setupQuickDragListeners() {
	const enableDrag = !mobile && !tablet;
	if (!enableDrag) return;

	for (const item of findAllElements(".items-cont[aria-expanded=true] > li[data-item]")) {
		if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

		const titleWrap = item.querySelector<HTMLElement>(".title-wrap");
		if (titleWrap.hasAttribute("draggable")) continue;

		titleWrap.setAttribute("draggable", "true");
		titleWrap.addEventListener("dragstart", onDragStart);
		titleWrap.addEventListener("dragend", onDragEnd);
	}

	function onDragStart(event: DragEvent) {
		event.dataTransfer.setData("text/plain", null);

		setTimeout(() => {
			document.querySelector("#quickItems > main").classList.add("drag-progress");
			if (document.querySelector("#quickItems .temp.item") || !isElement(event.target)) return;

			const itemRow = event.target.closest("li[data-item]") as HTMLElement;

			const id = parseInt(itemRow.dataset.item);

			addQuickItem({ id }, true);
		}, 10);
	}

	async function onDragEnd() {
		if (document.querySelector("#quickItems .temp.item")) {
			document.querySelector("#quickItems .temp.item").remove();
		}

		document.querySelector("#quickItems > main").classList.remove("drag-progress");

		await saveQuickItems();
	}
}

function allowQuickItem(id: number, category: string) {
	return (
		["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"].includes(category) ||
		[
			// Temporary Items
			220, 221, 222, 226, 229, 239, 242, 246, 256, 257, 392, 394, 581, 463, 464, 465, 611, 616, 742, 814, 833, 840, 1042, 1205,
			// Supply Packs
			283, 364, 365, 369, 370, 588, 817, 818, 1057, 1078, 1079, 1080, 1081, 1082, 1083, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122,
			1239, 1293, 1298,
			// Box Of Tissues
			403,
		].includes(id)
	);
}

function isEquipable(_id: number, category: string) {
	return ["Weapon"].includes(category);
}

function getEquipPosition(_id: number, category: string) {
	// 4 = Body Armor
	// 6 = Helmet
	// 7 = Pants
	// 8 = Boots
	// 9 = Gloves
	// 10 = CLOTHING - Jacket
	switch (category) {
		case "Primary":
			return 1;
		case "Secondary":
			return 2;
		case "Melee":
			return 3;
		case "Temporary":
			return 5;
		case "Defensive":
			return -1; // CHECKME - Get right position;
		default:
			return false;
	}
}

function updateItemAmount(id: number, change: number) {
	const quickQuantity = findContainer("Quick Items", { selector: `.item[data-id="${id}"] .quantity` });
	if (quickQuantity) {
		let newQuantity = parseInt(quickQuantity.getAttribute("quantity")) + change;
		if (newQuantity < 0) newQuantity = 0;

		quickQuantity.textContent = `${newQuantity}x`;
		quickQuantity.setAttribute("quantity", newQuantity.toString());
	}
}

function updateEquippedItem(id: number, isEquip: boolean) {
	const equipPosition = getEquipPosition(id, getTornItemType(id));
	findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`).forEach((x) => x.classList.remove("equipped"));

	if (isEquip && document.querySelector(`.item[data-id="${id}"]`)) document.querySelector(`.item[data-id="${id}"]`).classList.add("equipped");
}

function setupOverlayItems(tab: Element) {
	for (const item of findAllElements("li[data-item][data-category]", tab)) {
		if (allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

		item.classList.add("tt-overlay-ignore");
	}
}

function attachEditListeners(enabled: boolean) {
	if (enabled) {
		for (const item of findAllElements("ul.items-cont[aria-expanded='true'] > li")) {
			if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

			item.addEventListener("click", onItemClickQuickEdit);
		}
	} else {
		for (const item of findAllElements("ul.items-cont[aria-expanded='true'] > li")) {
			if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

			item.removeEventListener("click", onItemClickQuickEdit);
		}
	}
}

function cacheXID(xids: ExtractedXID[]) {
	if (!xids.length) return;

	const cacheObject: DatabaseCache = xids.reduce(
		(map, c) => {
			if (!(c.item in map)) map[c.item] = c.xid;
			return map;
		},
		{} as Record<number, number>,
	);

	void ttCache.setIndefinite(cacheObject, "xid--temp");
}

function getXID(item: number): number | null {
	const fromDOM: ExtractedXID | undefined = extractXIDFromDOM(document).find((e) => e.item === item);
	if (fromDOM) return fromDOM.xid;

	if (ttCache.hasValue("xid--temp", item)) {
		return ttCache.get("xid--temp", item);
	}

	return null;
}

async function getXIDWithDirectCall(item: number): Promise<boolean> {
	const body = new URLSearchParams();
	body.set("step", "getSearchList");
	body.set("q", getTornItemName(item));

	const result = await fetchData("torn_direct", { action: "item.php", method: "POST", body });

	const extracted = extractXIDFromHTML(result.html);
	cacheXID(extracted);

	return extracted.length > 0;
}

async function removeXIDFromCache(item: number) {
	await ttCache.remove("xid--temp", item);
}

export default class QuickItemsFeature extends Feature {
	constructor() {
		super("Quick Items", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.quickItems;
	}

	initialise() {
		initialiseQuickItems();
	}

	async execute() {
		await loadQuickItems();
	}

	cleanup() {
		removeContainer("Quick Items");
	}

	storageKeys() {
		return ["settings.pages.items.quickItems"];
	}
}
