import "./quick-items.css";
import { isUseItem } from "@common/pages/item-page";
import type { TornInternalGetCategoryList } from "@common/pages/item-page";
import { ITEM_RESOLVER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import type { DatabaseCache } from "@common/utils/data/cache";
import { quick, settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements, findParent, mobile, tablet } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { addFetchListener, addXHRListener } from "@common/utils/functions/listeners";
import { requireContent, requireItemsLoaded } from "@common/utils/functions/requires";
import {
	extractXIDFromDOM,
	extractXIDFromHTML,
	extractXIDFromJson,
	extractXIDFromMutations,
	getEquipPosition,
	getPageStatus,
	isEquipable,
} from "@common/utils/functions/torn";
import type { ExtractedXID } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { calculateAndShowTotalValueInQuickItems, shouldDisplayOpenedValue } from "@features/opened-supply-pack-value/opened-supply-pack-value";
import {
	buildResponseLinks,
	createQuickDragHandlers,
	createQuickItemsController,
	formatResponseTimers,
	initialiseQuickItems,
} from "@features/quick-items/shared/quick-items-common.ts";
import type { QuickItem, QuickItemId, UseContext } from "@features/quick-items/shared/quick-items-common.ts";
import { customError, executeSpecialAction, isSpecialAction } from "@features/quick-items/shared/special-actions.ts";
import type { MedicalItemsSource } from "@features/quick-items/shared/special-actions.ts";

let controller: ReturnType<typeof createQuickItemsController> | undefined;

const medicalSource: MedicalItemsSource = {
	loadFromDOM: () => {
		const medicalList = document.querySelector("#medical-items[data-all='1']");
		if (!medicalList) return null;

		return findAllElements("li[data-item][data-qty]", medicalList).map((row) => ({
			id: parseInt(row.dataset.item),
			quantity: parseInt(row.dataset.qty),
		}));
	},
	loadDirectly: async () => {
		const body = new URLSearchParams();
		body.set("step", "getCategoryList");
		body.set("itemName", "Medical");
		body.set("start", "0");

		const response = await fetchData<TornInternalGetCategoryList>("torn_direct", { action: "item.php", method: "POST", body });
		return response.list.map(({ ID: id, Qty: quantity }) => ({ id, quantity }));
	},
};

function initialiseListeners() {
	initialiseQuickItems();

	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, () => {
		setupQuickDragListeners();
	});
	addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, ({ tab }) => {
		setupOverlayItems(tab);
		controller?.refreshEditListeners();
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
	controller = createQuickItemsController({
		title: "Quick Items",
		nextElement: () => document.querySelector(".equipped-items-wrap"),
		savedItems: () => quick.items,
		getOverlayItems: () => [
			...findAllElements("#categoriesItem:not(.no-items)").filter((category) =>
				["Temporary", "Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster", "Other", "Supply Pack"].includes(category.dataset.type),
			),
			...findAllElements("ul.items-cont:not(.no-items)"),
		],
		getSourceItems: () =>
			findAllElements("ul.items-cont[aria-expanded='true'] > li").filter((item) => allowQuickItem(parseInt(item.dataset.item), item.dataset.category)),
		parseSourceItem: (element) => {
			const target = findParent(element, { hasAttribute: "data-item" });
			if (!target) return null;

			return { id: parseInt(target.dataset.item) };
		},
		storageKey: "items",
		allowQuickItem,
		useQuickItem: async (item, context) => {
			if (isSpecialAction(item.id)) {
				await executeSpecialAction(item.id, {
					responseWrap: context.responseWrap,
					useItem: (id) => useQuickItem({ id }, context),
					source: medicalSource,
				});
			} else {
				await useQuickItem(item, context);
			}
		},
	});

	await requireContent();

	controller.create();

	requireItemsLoaded().then(() => setupQuickDragListeners());
}

async function useQuickItem({ id }: QuickItem, context: UseContext) {
	const { itemWrap, responseWrap, innerContent } = context;
	const itemId = id as number;
	const staticItem = ITEM_RESOLVER.getStaticItem(itemId);
	const equipItem = isEquipable(itemId, staticItem?.type);
	const equipPosition = equipItem ? getEquipPosition(itemId, staticItem?.type) : false;

	const xid: number | null = getXID(itemId);
	if (equipItem && xid === null) {
		getXIDWithDirectCall(itemId)
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

	const body = new URLSearchParams();
	if (equipItem) {
		body.set("step", "actionForm");
		body.set("confirm", "1");
		body.set("action", "equip");
		body.set("id", xid.toString());
	} else {
		body.set("step", "useItem");
		body.set("id", itemId.toString());
		body.set("itemID", itemId.toString());
	}

	fetchData("torn_direct", { action: "item.php", method: "POST", body }).then(async (result) => {
		if (typeof result === "object" && isUseItem(body.get("step"), result)) {
			const links = buildResponseLinks(result.success && result.links ? result.links : []);

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
				if (shouldDisplayOpenedValue(itemId)) {
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
					triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: itemId, amount: -1, reason: "usage" });
				}
			}

			formatResponseTimers(responseWrap);
		} else {
			if (result.includes("Wrong itemID")) {
				removeXIDFromCache(itemId);

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

function setupQuickDragListeners() {
	const enableDrag = !mobile && !tablet;
	if (!enableDrag) return;

	const dragHandlers = createQuickDragHandlers({
		containerId: "quickItems",
		resolveQuickItem: (target) => {
			const itemRow = target.closest<HTMLElement>("li[data-item]");
			return itemRow ? parseInt(itemRow.dataset.item) : null;
		},
		addQuickItem: (item, temporary) => controller.addQuickItem(item, temporary),
		saveQuickItems: () => controller.saveQuickItems(),
	});

	for (const item of findAllElements(".items-cont[aria-expanded=true] > li[data-item]")) {
		if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

		const titleWrap = item.querySelector<HTMLElement>(".title-wrap");
		if (titleWrap.hasAttribute("draggable")) continue;

		titleWrap.setAttribute("draggable", "true");
		titleWrap.addEventListener("dragstart", dragHandlers.onDragStart);
		titleWrap.addEventListener("dragend", dragHandlers.onDragEnd);
	}
}

function allowQuickItem(id: QuickItemId, category: string) {
	return (
		["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"].includes(category) ||
		(typeof id === "number" &&
			[
				// Temporary Items
				220, 221, 222, 226, 229, 239, 242, 246, 256, 257, 392, 394, 581, 463, 464, 465, 611, 616, 742, 814, 833, 840, 1042, 1205,
				// Supply Packs
				283, 364, 365, 369, 370, 588, 817, 818, 1057, 1078, 1079, 1080, 1081, 1082, 1083, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121,
				1122, 1239, 1293, 1298,
				// Box Of Tissues
				403,
			].includes(id)) ||
		isSpecialAction(id)
	);
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
		initialiseListeners();
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
