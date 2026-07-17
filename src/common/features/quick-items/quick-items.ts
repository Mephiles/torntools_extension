import "./quick-items.css";
import { isUseItem, type TornInternalGetCategoryList } from "@common/pages/item-page";
import { ITEM_RESOLVER, ttStorage } from "@common/utils/context";
import { type DatabaseCache, ttCache } from "@common/utils/data/cache";
import { quick, settings, userdata } from "@common/utils/data/database";
import type { QuickItem } from "@common/utils/data/default-database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements, findParent, isElement, mobile, tablet } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { formatTime } from "@common/utils/functions/formatting";
import { createSwipeSafeClickEvents } from "@common/utils/functions/gestures";
import { addFetchListener, addXHRListener } from "@common/utils/functions/listeners";
import { requireContent, requireItemsLoaded } from "@common/utils/functions/requires";
import {
	ALLOWED_BLOOD,
	type BloodType,
	type ExtractedXID,
	extractXIDFromDOM,
	extractXIDFromHTML,
	extractXIDFromJson,
	extractXIDFromMutations,
	getBloodType,
	getHospitalTime,
	getItemEnergy,
	getMedicalCooldown,
	getPageStatus,
	getUserEnergy,
	getUserLife,
} from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { PHEye, PHPlus, PHX } from "@common/utils/icons/phosphor-icons";
import { isFullItem, type StaticItem } from "@common/utils/torn-api/items.types";
import { Feature } from "@features/feature";
import { calculateAndShowTotalValueInQuickItems, shouldDisplayOpenedValue } from "@features/opened-supply-pack-value/opened-supply-pack-value";
import styles from "./quick-items.module.css";

let movingElement: Element | undefined;
let isEditing = false;

const SPECIAL_MEDICAL_HOSPITAL = 100_000;
const SPECIAL_MEDICAL_LIFE = 100_001;

let medicalLoaded = false;
const medicalQuantities = new Map<number, number>();

const MEDICAL_EFFECT_REGEX = /Reduces hospital time by (\d+) (?:mins|minutes) and restores (\d+)% life. Increases medical cooldown by (\d+) mins./;

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

	addCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, ({ item, amount }) => {
		updateItemAmount(item, amount);
	});
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, () => {
		setupQuickDragListeners();
	});
	addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, ({ tab }) => {
		setupOverlayItems(tab);
		attachEditListeners(isEditing);
	});
	addCustomListener(EVENT_CHANNELS.ITEM_EQUIPPED, ({ item, equip }) => {
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
	content.appendChild(elementBuilder({ type: "div", class: ["inner-content", styles.quickItemsList] }));
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
	options.appendChild(
		elementBuilder({
			type: "div",
			class: "option",
			id: "custom-actions-button",
			children: [PHEye(), "Specials"],
			events: {
				click: (event) => {
					event.stopPropagation();

					toggleSpecialQuickOptions(content);
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
	if (!allowQuickItem(id, ITEM_RESOLVER.getStaticItem(id)?.type)) return null;

	const dataset: Record<string, any> = { ...data };
	let equipPosition: number | false | undefined;
	if (isEquipable(id, ITEM_RESOLVER.getStaticItem(id)?.type)) {
		equipPosition = getEquipPosition(id, ITEM_RESOLVER.getStaticItem(id)?.type);
		data.equipPosition = equipPosition;
	} else if (isSpecialAction(id)) {
		const action = getSpecialAction(id);

		dataset.action = action.name;
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

				if (isSpecialAction(id)) {
					await executeSpecialAction(id, responseWrap);
				} else {
					await useQuickItem(id, itemWrap, responseWrap, equipPosition, innerContent);
				}
			}),
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
			draggable: !(mobile || tablet),
		},
	});
	if (isSpecialAction(id)) {
		const specialAction = getSpecialAction(id);

		itemWrap.setAttribute("title", specialAction.name);
		itemWrap.appendChild(elementBuilder({ type: "div", class: styles.name, text: specialAction.name }));
	} else {
		itemWrap.appendChild(
			elementBuilder({
				type: "div",
				class: "pic",
				attributes: { style: `background-image: url(/images/items/${id}/medium.png)` },
			}),
		);
		const item = ITEM_RESOLVER.getStaticItem(id);
		if (item) {
			itemWrap.setAttribute("title", item.name);
			itemWrap.appendChild(elementBuilder({ type: "div", class: styles.name, text: item.name }));

			// TODO: API Inventory Block.
			/*if (settings.apiUsage.user.inventory) {
                const inventoryItem = findItemsInList(userdata.inventory, { ID: id }, { single: true });
                const amount = inventoryItem ? inventoryItem.quantity : 0;

                itemWrap.appendChild(elementBuilder({ type: "div", class: "sub-text quantity", attributes: { quantity: amount }, text: amount + "x" }));

                if (inventoryItem.equipped) itemWrap.classList.add("equipped");
            }*/
		} else {
			itemWrap.appendChild(elementBuilder({ type: "div", class: styles.name, text: id }));
		}
	}

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
	innerContent.appendChild(itemWrap);
	return itemWrap;
}

async function useQuickItem(id: number, itemWrap: Element, responseWrap: HTMLElement, equipPosition: number | false, innerContent: Element) {
	const equipItem = isEquipable(id, ITEM_RESOLVER.getStaticItem(id)?.type);
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
					customError(responseWrap, "We were missing information for this item, we got that now. Try again.");
				} else {
					customError(responseWrap, "Couldn't get the missing information. You might not have this item anymore.");
				}
			})
			.catch((cause) => {
				responseWrap.textContent = "";
				customError(responseWrap, "We were missing information for this item, but something went wrong when getting that information. Try again.");
				console.error(cause);
			});
		return;
	}

	if (settings.pages.items.energyWarning && !equipItem && ["Drug", "Energy Drink"].includes(ITEM_RESOLVER.getStaticItem(id)?.type)) {
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
				count.textContent = formatTime(
					{ seconds: parseInt(count.dataset.time) },
					{
						type: "timer",
						daysToHours: true,
					},
				);
			}
		} else {
			if (result.includes("Wrong itemID")) {
				removeXIDFromCache(id);

				responseWrap.style.display = "block";
				responseWrap.textContent = "";
				customError(
					responseWrap,
					"We are missing information for this item. Use the item again to fetch that information, and then another time to use the item.",
				);
				return;
			}

			responseWrap.style.display = "block";
			responseWrap.innerHTML = result;

			findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`, innerContent).forEach((x) => x.classList.remove("equipped"));

			if (result.includes(" equipped ")) {
				findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`, innerContent).forEach((x) => x.classList.remove("equipped"));
				itemWrap.classList.add("equipped");
			} else if (result.includes(" unequipped "))
				findAllElements(`.item.equipped[data-equip-position="${equipPosition}"]`, innerContent).forEach((x) => x.classList.remove("equipped"));
		}
	});
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

			const itemRow = event.target.closest<HTMLElement>("li[data-item]");

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
		].includes(id) ||
		isSpecialAction(id)
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
	const equipPosition = getEquipPosition(id, ITEM_RESOLVER.getStaticItem(id)?.type);
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

	ttCache.setIndefinite(cacheObject, "xid--temp");
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
	body.set("q", ITEM_RESOLVER.getStaticItem(item)?.name);

	const result = await fetchData("torn_direct", { action: "item.php", method: "POST", body });

	const extracted = extractXIDFromHTML(result.html);
	cacheXID(extracted);

	return extracted.length > 0;
}

function removeXIDFromCache(item: number) {
	ttCache.remove("xid--temp", item);
}

function toggleSpecialQuickOptions(content: HTMLElement) {
	const existingOptions = content.querySelector(`.${styles.specialOptions}`);
	if (existingOptions) {
		existingOptions.remove();
		return;
	}

	content.appendChild(
		elementBuilder({
			type: "div",
			class: styles.specialOptions,
			children: [
				elementBuilder({ type: "hr" }),
				elementBuilder({
					type: "div",
					class: styles.specialTitle,
					text: "Special Options",
				}),
				buildSpecialActionPreview(SPECIAL_MEDICAL_HOSPITAL),
				buildSpecialActionPreview(SPECIAL_MEDICAL_LIFE),
			],
		}),
	);
}

function buildSpecialActionPreview(id: number) {
	const action = getSpecialAction(id);

	return elementBuilder({
		type: "div",
		class: [styles.specialActionPreview, action.class],
		text: action.name,
		events: {
			click() {
				addQuickItem({ id });
				void saveQuickItems();
			},
		},
	});
}

function isSpecialAction(id: number) {
	return [SPECIAL_MEDICAL_LIFE, SPECIAL_MEDICAL_HOSPITAL].includes(id);
}

function getSpecialAction(id: number) {
	if (id === SPECIAL_MEDICAL_HOSPITAL) {
		return {
			name: "Medical: Leave Hospital",
			class: "special-medical-hospital",
		};
	} else if (id === SPECIAL_MEDICAL_LIFE) {
		return {
			name: "Medical: Optimal Life",
			class: "special-medical-life",
		};
	}
}

async function executeSpecialAction(id: number, responseWrap: HTMLElement) {
	if (!isSpecialAction(id)) return;

	responseWrap.style.display = "block";
	responseWrap.textContent = "";

	await loadMedicalItems(false);

	if (id === SPECIAL_MEDICAL_HOSPITAL) {
		await executeMedicalHospitalAction(responseWrap);
	} else if (id === SPECIAL_MEDICAL_LIFE) {
		await executeMedicalLifeAction(responseWrap);
	}
}

async function executeMedicalHospitalAction(responseWrap: HTMLElement) {
	const hospitalTime = getHospitalTime();
	if (hospitalTime === null) {
		customError(responseWrap, "You aren't hospitalized.");
		return;
	}

	if (!medicalLoaded) {
		await loadMedicalItems(true)
			.then(() => customError(responseWrap, "Loaded your medical items to find the best fit. Click again to continue."))
			.catch(() => customError(responseWrap, "Failed to load your medical items. Try again or report this issue to the TornTools developers."));
		return;
	}

	const minutesLeft = (hospitalTime - Date.now()) / TO_MILLIS.MINUTES;
	const path = findOptimalHospitalItems(minutesLeft, getBloodType());
	if (!path) {
		customError(responseWrap, "We couldn't find any feasible item to use.");
		return;
	} else if ("error" in path) {
		customError(responseWrap, path.error);
		return;
	}

	const currentCooldown = await getMedicalCooldown();
	if (!currentCooldown) {
		customError(responseWrap, "Failed to get your current cooldown timer. Report this to the TornTools developers.");
		return;
	}

	const cooldownRequired = path.items.reduce((total, item) => total + item.cooldown, 0);
	if (currentCooldown.remainder < cooldownRequired) {
		customError(responseWrap, "You don't have sufficient cooldown left to leave the hospital.");
		return;
	}

	const bestItem = path.items[0];
	await useQuickItem(bestItem.id, null, responseWrap, false, null);
	medicalQuantities.set(bestItem.id, medicalQuantities.get(bestItem.id) - 1);
}

async function executeMedicalLifeAction(responseWrap: HTMLElement) {
	const [life, maxLife] = getUserLife();
	if (life >= maxLife) {
		customError(responseWrap, "You are already at full life.");
		return;
	}

	if (!medicalLoaded) {
		await loadMedicalItems(true)
			.then(() => customError(responseWrap, "Loaded your medical items to find the best fit. Click again to continue."))
			.catch(() => customError(responseWrap, "Failed to load your medical items. Try again or report this issue to the TornTools developers."));
		return;
	}

	const missingLife = maxLife - life;
	const percentage = (missingLife / maxLife) * 100;

	const item = getOptimalLifeItem(percentage, getBloodType());
	if (!item) {
		customError(responseWrap, "There is no good medical item present in your inventory to actually use.");
		return;
	}

	await useQuickItem(item.id, null, responseWrap, false, null);
	medicalQuantities.set(item.id, medicalQuantities.get(item.id) - 1);
}

type MedicalStaticItem = StaticItem & {
	quantity: number;
	medical: {
		time: number;
		life: number;
		cooldown: number;
	};
};

type OptimalHospitalResponse = { error: string } | { items: { id: number; cooldown: number }[] };

function findOptimalHospitalItems(minutesLeft: number, bloodType: BloodType | null): OptimalHospitalResponse {
	const items = availableMedicalItems(bloodType);
	if (!items.length) return { error: "We couldn't find any feasible item to use." };

	let ongoingMinutesLeft = minutesLeft;
	const ids: { id: number; cooldown: number }[] = [];
	while (ongoingMinutesLeft > 0) {
		const remainderItems = items.filter(({ quantity }) => quantity > 0);
		if (!remainderItems.length) return { error: "You lack the items to leave the hospital." };

		const item = remainderItems.find((i) => i.medical.time >= ongoingMinutesLeft) ?? remainderItems[remainderItems.length - 1];
		item.quantity--;
		ids.push({ id: item.id, cooldown: item.medical.cooldown });
		ongoingMinutesLeft -= item.medical.time;
	}

	return { items: ids };
}

function getOptimalLifeItem(percentageMissing: number, bloodType: BloodType | null): MedicalStaticItem | null {
	const items = availableMedicalItems(bloodType);
	if (!items.length) return null;

	const fillItems = items.filter((item) => item.medical.life >= percentageMissing);
	if (fillItems.length) return fillItems[0];

	const bestLife = items[items.length - 1].medical.life;
	return items.find((i) => i.medical.life === bestLife);
}

function availableMedicalItems(bloodType: BloodType | null) {
	const perks = (hasAPIData() ? (userdata?.education_perks ?? []) : [])
		.filter((perk) => perk.toLowerCase().includes("medical item effectiveness"))
		.map((perk) => parseInt(perk.match(/\+ (\d+)%/i)[1]))
		.reduce((a, b) => a + b, 0);

	return (ITEM_RESOLVER.hasFullItems() ? ITEM_RESOLVER.getAllFullItems() : ITEM_RESOLVER.getAllStaticItems())
		.filter(({ type, effect }) => type === "Medical" && effect)
		.map((item): MedicalStaticItem => {
			const effectMatched = MEDICAL_EFFECT_REGEX.exec(item.effect);
			if (!effectMatched) return null;

			if (item.name.startsWith("Blood Bag") && (bloodType === null || !ALLOWED_BLOOD[bloodType].includes(item.id))) return null;

			const time = (1 + perks / 100) * parseInt(effectMatched[1]);
			const life = (1 + perks / 100) * parseInt(effectMatched[2]);
			const cooldown = parseInt(effectMatched[3]);
			const quantity = medicalQuantities.get(item.id) ?? 0;

			return {
				...item,
				quantity,
				medical: {
					time,
					life,
					cooldown,
				},
			};
		})
		.filter((item) => !!item)
		.filter((item) => item.quantity > 0)
		.sort((a, b) => {
			if (b.medical.time !== a.medical.time) return a.medical.time - b.medical.time;
			if (b.medical.cooldown !== a.medical.cooldown) return a.medical.cooldown - b.medical.cooldown;

			if (isFullItem(a) && isFullItem(b)) {
				return a.value.market_price - b.value.market_price;
			}

			return a.name.localeCompare(b.name);
		});
}

async function loadMedicalItems(manualAction: boolean) {
	if (medicalLoaded) return;

	const medicalList = document.querySelector("#medical-items[data-all='1']");
	if (medicalList) {
		findAllElements("li[data-item][data-qty]", medicalList)
			.map((row) => ({
				id: parseInt(row.dataset.item!),
				quantity: parseInt(row.dataset.qty!),
			}))
			.forEach(({ id, quantity }) => medicalQuantities.set(id, quantity));

		medicalLoaded = true;
	} else if (manualAction) {
		return loadMedicalItemsDirectly();
	}
}

async function loadMedicalItemsDirectly() {
	const body = new URLSearchParams();
	body.set("step", "getCategoryList");
	body.set("itemName", "Medical");
	body.set("start", "0");

	const response = await fetchData<TornInternalGetCategoryList>("torn_direct", { action: "item.php", method: "POST", body });
	response.list.forEach(({ ID: id, Qty: quantity }) => medicalQuantities.set(id, quantity));
	medicalLoaded = true;
}

function customError(responseWrap: Element, message: string) {
	responseWrap.appendChild(elementBuilder({ type: "div", class: "custom-error", text: message }));
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
