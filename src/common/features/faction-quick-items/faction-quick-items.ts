import "./faction-quick-items.css";
import { isInternalFaction } from "@common/pages/factions-page";
import type { TornInternalArmouryTabContent } from "@common/pages/factions-page";
import type { TornInternalUseItem } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { quick, settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { findContainer } from "@common/utils/functions/containers";
import { elementBuilder, findParent, mobile, tablet } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import {
	buildResponseLinks,
	createQuickDragHandlers,
	createQuickItemsController,
	formatResponseTimers,
	initialiseQuickItems,
	parseQuickItemId,
} from "@features/quick-items/shared/quick-items-common.ts";
import type { QuickItem, QuickItemId, UseContext } from "@features/quick-items/shared/quick-items-common.ts";
import { executeSpecialAction, isSpecialAction } from "@features/quick-items/shared/special-actions.ts";
import type { MedicalItemsSource } from "@features/quick-items/shared/special-actions.ts";
import commonStyles from "@features/quick-items/shared/quick-items-common.module.css";

let controller: ReturnType<typeof createQuickItemsController> | undefined;

const medicalSource: MedicalItemsSource = {
	loadFromDOM: () => {
		const medicalList = findElement(".armoury-tabs[id*='medical']:has(.item-list)", true);
		if (!medicalList) return null;

		return findAllElements(".item-list > li", medicalList).map((row) => ({
			id: parseInt(findElement(".img-wrap[data-itemid]", row).dataset.itemid!),
			quantity: parseInt(findElement(".qty", row).textContent),
		}));
	},
	loadDirectly: async () => {
		const body = new URLSearchParams();
		body.set("step", "armouryTabContent");
		body.set("type", "medical");
		body.set("start", "0");

		const response = await fetchData<TornInternalArmouryTabContent>("torn_direct", { action: "factions.php", method: "POST", body });
		return response.items.filter((item) => item.itemActions.usable).map(({ itemID: id, qty: quantity }) => ({ id, quantity }));
	},
};

function addListener() {
	initialiseQuickItems();

	addCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, async ({ section }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionQuickItemsFeature)) return;

		if (["medical", "drugs", "boosters", "points", "donate", "consumables", "loot", "utilities"].includes(section)) {
			await showQuickItems(section);
			setupQuickDragListeners();
			controller?.refreshEditListeners();
		} else hideQuickItems();
	});
}

async function showQuickItems(section: string) {
	if (!section) return;

	const presentFilter = findContainer("Faction Quick Items");
	if (presentFilter) {
		presentFilter.classList.remove("tt-hidden");
		return;
	}

	controller = createQuickItemsController({
		title: "Faction Quick Items",
		containerClass: "mt10",
		nextElement: () => findElement("#faction-armoury > hr"),
		savedItems: () => quick.factionItems,
		getOverlayItems: () => [
			...findAllElements("#faction-armoury-tabs .torn-tabs > li").filter((category) =>
				["Medical", "Drugs", "Boosters", "Points", "Consumables", "Loot", "Utilities"].includes(
					findElement("a.ui-tabs-anchor", category).textContent.trim(),
				),
			),
			...findAllElements(
				".armoury-medical-wrap, .armoury-drugs-wrap, .armoury-boosters-wrap, .armoury-points-wrap, .armoury-consumables-wrap, .armoury-temporary-wrap",
			),
		],
		getSourceItems: () => [
			...findAllElements(".armoury-tabs .item-list > li").filter((item) => {
				const imgWrap = findElement(".img-wrap", item);

				return allowQuickItem(imgWrap.dataset.itemid!, findElement(".type", item, true)?.textContent ?? null);
			}),
			...findAllElements("#armoury-points .give[data-role='give'], #armoury-points .give[data-role='refill']"),
		],
		parseSourceItem: (element) => {
			const target = element.dataset.type === "tt-points" ? element : findParent(element, { tag: "LI" })!;
			const id = findElement(".img-wrap", target).dataset.itemid!;

			return { id: parseQuickItemId(id) };
		},
		onEditToggle: (editing) => {
			findAllElements(
				".armoury-medical-wrap, .armoury-drugs-wrap, .armoury-boosters-wrap, .armoury-points-wrap, .armoury-consumables-wrap, .armoury-temporary-wrap",
			).forEach((item) => item.classList.toggle("tt-overlay-item-notbroken", editing));
		},
		storageKey: "factionItems",
		allowQuickItem,
		useQuickItem,
		buildAdditionalItems: (item, wrapper) => {
			if (item.id === "points-energy") {
				wrapper.appendChild(
					elementBuilder({
						type: "div",
						class: "pic icon-refill",
						children: [elementBuilder({ type: "i", class: "currency-points" })],
					}),
				);
				wrapper.setAttribute("title", "Energy Refill");
				wrapper.appendChild(elementBuilder({ type: "div", class: commonStyles.name, text: "Energy Refill" }));
			} else if (item.id === "points-nerve") {
				wrapper.appendChild(
					elementBuilder({
						type: "div",
						class: "pic icon-refill",
						children: [elementBuilder({ type: "i", class: "currency-points" })],
					}),
				);
				wrapper.setAttribute("title", "Nerve Refill");
				wrapper.appendChild(elementBuilder({ type: "div", class: commonStyles.name, text: "Nerve Refill" }));
			} else {
				throw new Error("Unsupported additional item.");
			}
		},
	});
	controller.create();

	requireElement(".armoury-tabs[aria-expanded=true] .name, .armoury-donate-wrap[aria-expanded=true]").then(setupQuickDragListeners);
}

function setupQuickDragListeners() {
	const enableDrag = !mobile && !tablet;
	const tab = findElement("#faction-armoury-tabs .armoury-tabs[aria-expanded='true']");

	const dragHandlers = createQuickDragHandlers({
		containerId: "factionQuickItems",
		resolveQuickItem: (target) => {
			let element = target;
			if (!element.hasAttribute("draggable")) element = element.closest("[draggable]") ?? element;

			return parseQuickItemId(findElement(".img-wrap", element).dataset.itemid!);
		},
		addQuickItem: (item, temporary) => controller!.addQuickItem(item, temporary),
		saveQuickItems: () => controller!.saveQuickItems(),
	});

	if (tab.id === "tab=armoury&sub=points") {
		for (const item of findAllElements(".give[data-role]", tab)) {
			const type = item.textContent.trim().split(" ")[1].toLowerCase();

			item.dataset.type = "tt-points";
			if (enableDrag) {
				item.setAttribute("draggable", "true");
				item.addEventListener("dragstart", dragHandlers.onDragStart);
				item.addEventListener("dragend", dragHandlers.onDragEnd);
			}

			item.appendChild(
				elementBuilder({
					type: "div",
					class: "img-wrap tt-lazy-magic",
					dataset: { itemid: `points-${type}` },
					style: { display: "none" },
				}),
			);
		}
	} else {
		for (const item of findAllElements(".item-list > li", tab)) {
			const imgWrap = findElement(".img-wrap", item);

			if (!allowQuickItem(parseInt(imgWrap.dataset.itemid!), findElement(".type", item, true)?.textContent ?? null)) continue;

			if (enableDrag) {
				item.setAttribute("draggable", "true");
				item.addEventListener("dragstart", dragHandlers.onDragStart);
				item.addEventListener("dragend", dragHandlers.onDragEnd);
			}
		}
	}
}

async function useQuickItem({ id }: QuickItem, context: UseContext) {
	const { responseWrap } = context;
	const body = new URLSearchParams();

	if (id === "points-energy" || id === "points-nerve") {
		body.set("step", "armouryRefillEnergy");
		if (id === "points-energy") body.set("step", "armouryRefillEnergy");
		else if (id === "points-nerve") body.set("step", "armouryRefillNerve");

		fetchData("torn_direct", { action: "factions.php", method: "POST", body }).then((result) => {
			responseWrap.style.display = "block";
			responseWrap.innerHTML = "";

			responseWrap.appendChild(elementBuilder({ type: "span", class: `t-${result.success ? "green" : "red"} bold`, html: result.message }));
			responseWrap.appendChild(
				elementBuilder({
					type: "div",
					style: { display: "block" },
					children: [elementBuilder({ type: "a", href: "#", class: "close-act t-blue bold c-pointer", text: "Okay" })],
				}),
			);
		});
	} else if (isSpecialAction(id)) {
		await executeSpecialAction(id, {
			responseWrap: context.responseWrap,
			useItem: (itemId) => useQuickItem({ id: itemId }, context),
			source: medicalSource,
		});
	} else {
		Object.entries({ step: "useItem", fac: "1", itemID: id }).forEach(([key, value]) => body.set(key, value.toString()));

		fetchData<TornInternalUseItem>("torn_direct", { action: "item.php", method: "POST", body }).then(async (result) => {
			if (typeof result !== "object") return;

			const links = buildResponseLinks("links" in result ? result.links : []);

			responseWrap.style.display = "block";
			responseWrap.innerHTML = "";
			responseWrap.appendChild(
				elementBuilder({
					type: "div",
					class: "armoury-tabs",
					children: [
						elementBuilder({
							type: "ul",
							class: "item-list",
							children: [
								elementBuilder({
									type: "li",
									class: "item-use-act",
									children: [
										elementBuilder({
											type: "div",
											class: "name",
											children: [elementBuilder({ type: "span", class: "qty", text: "10000" })],
										}),
										elementBuilder({
											type: "div",
											class: "use-cont action-cont",
											children: [
												elementBuilder({
													type: "div",
													class: "use-wrap",
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
													style: { display: "block" },
												}),
											],
											dataset: { itemid: id },
										}),
										elementBuilder({ type: "div", class: "clear" }),
									],
								}),
							],
						}),
					],
				}),
			);

			formatResponseTimers(responseWrap);
		});
	}
}

function allowQuickItem(id: QuickItemId, category: string | null) {
	return (
		isSpecialAction(id) ||
		["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"].includes(category ?? "") ||
		id === "points-energy" ||
		id === "points-nerve"
	);
}

function hideQuickItems() {
	findContainer("Faction Quick Items")?.classList?.add("tt-hidden");
}

export default class FactionQuickItemsFeature extends Feature {
	constructor() {
		super("Faction Quick Items", "faction");
	}

	override precondition() {
		return isInternalFaction && getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.faction.quickItems;
	}

	override initialise() {
		addListener();
	}

	override storageKeys() {
		return ["settings.pages.faction.quickItems"];
	}
}
