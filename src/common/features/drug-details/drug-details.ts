import "./drug-details.css";
import { extractArmorySubcategory, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, isElement, isHTMLElement } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { DRUG_INFORMATION, getPage, getPageStatus } from "@common/utils/functions/torn";
import type { DrugDetail } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

interface DrugDetailsOptions {
	react: boolean | (() => boolean);
	target: Document | Element;
	changeListener: boolean;
}

let observer: MutationObserver | undefined;

function initialiseDrugDetails() {
	const page = getPage();
	switch (page) {
		case "item":
			setupXHR({ changeListener: true });
			break;
		case "displaycase":
			setupXHR({ react: true, changeListener: true });
			break;
		case "factions":
			setupXHR({
				react: () =>
					extractArmorySubcategory(findElement("#faction-armoury-tabs > ul > li[aria-selected='true']").getAttribute("aria-controls")!) === "donate",
			});
			break;
		case "bazaar":
			addMutationObserver("[class*='itemsContainner_'], [class*='core-layout_'] [class*='items_']");
			break;
		case "itemmarket":
			addCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEM_DETAILS, ({ item, element }) => {
				if (!FEATURE_MANAGER.isEnabled(DrugDetailsFeature)) return;

				display(item, findElement("[class*='description___']", element));
			});
			break;
	}
}

function setupXHR(options = {}) {
	addXHRListener(({ detail }) => {
		const { page } = detail;
		if (!("json" in detail) || page !== "page") return;

		const { json } = detail;

		showDetails(json.itemID, options).catch((error) => console.error("Couldn't show drug details.", error));
	});
}

function addMutationObserver(selector: string) {
	requireElement(selector).then(() => {
		new MutationObserver(async (mutations) => {
			const viewMutations = mutations.filter((mutation) =>
				Array.from(mutation.addedNodes).some((node) => isElement(node) && Array.from(node.classList).some((c) => c.startsWith("view_"))),
			);
			if (!viewMutations.length) return;

			const newNodes = viewMutations[0].addedNodes;
			let target: Element;
			if (Array.from(newNodes).some((node) => isElement(node) && findElement(":scope > [class*='preloader_']", node, true))) {
				target = await new Promise((resolve) => {
					new MutationObserver((mutations1, observer) => {
						observer.disconnect();
						resolve(mutations1[1].target as Element);
					}).observe(newNodes[0], { childList: true });
				});
			} else {
				target = newNodes[0] as Element;
			}

			let id: number;
			const armoryInfo = findElement("[aria-labelledby*='armory-info-']", target, true);
			if (armoryInfo) {
				id = parseInt(armoryInfo.getAttribute("aria-labelledby")!.match(/armory-info-(\d*)/i)![1]);
			} else {
				const image = findElement("img", target, true);

				if (image) {
					id = convertToNumber(image.src.match(/items\/([0-9]+)\/large.*\.png/i)![1]);
				} else {
					throw new Error("No id found for this item!");
				}
			}

			showDetails(id, { target }).catch((error) => console.error("Couldn't show drug details.", error));
		}).observe(findElement(selector), { subtree: true, childList: true });
	});
}

async function showDetails(id: number, partialOptions: Partial<DrugDetailsOptions> = {}) {
	const options: DrugDetailsOptions = {
		react: false,
		target: document,
		changeListener: false,
		...partialOptions,
	};

	if (!FEATURE_MANAGER.isEnabled(DrugDetailsFeature)) return;

	let element: Element;

	if (
		options.react &&
		(typeof options.react !== "function" || options.react()) &&
		findElement(".info-active .show-item-info[data-reactid]", options.target, true)
	) {
		const reactid = findElement(".info-active .show-item-info", options.target).dataset.reactid;

		await requireElement(`[data-reactid="${reactid}"] .ajax-placeholder, [data-reactid="${reactid}"] .ajax-preloader`, { invert: true });

		element = findElement(`[data-reactid="${reactid}"]`, options.target);
	} else {
		const wrapper = findWrapper();
		if (!wrapper) return;

		element = wrapper;
		await requireElement(".ajax-placeholder, .ajax-preloader", { invert: true, parent: element });
	}

	const details = DRUG_INFORMATION[id];
	if (!details) return;

	[findElement(".info-msg, [class*='description___']", element), findElement(`.info-wrap[aria-labelledby="armory-info-${id}-"] .info-msg`, true)]
		.filter((info) => !!info)
		.forEach((info) => {
			show(info, details);
			if (options.changeListener) watchChanges(element, details);
		});

	function findWrapper() {
		return (
			findElement(`li[itemid="${id}"] .view-item-info`, options.target, true) ||
			findElement(
				[
					["item", "bazaar", "displaycase"].includes(getPage()) ? ".show-item-info" : "",
					getPage() === "factions" ? ".view-item-info[style*='display: block;']" : "",
				]
					.filter(Boolean)
					.join(", "),
				options.target,
				true,
			)
		);
	}

	function watchChanges(element: Element, details: DrugDetail) {
		if (observer) observer.disconnect();

		observer = new MutationObserver((mutations, observer) => {
			const filteredMutations = mutations.filter(
				(mutation) =>
					Array.from(mutation.addedNodes).some((node) => isElement(node) && node.classList.contains("info-wrap")) ||
					Array.from(mutation.removedNodes).some((node) => isHTMLElement(node) && node.dataset?.addedBy === "TornTools"),
			);
			if (!filteredMutations.length) return;

			const newElement = findWrapper();
			if (!newElement) {
				observer.disconnect();
				return;
			}

			const info = findElement(".info-msg, [class*='description___']", newElement, true);
			if (info) show(info, details);
			observer.disconnect();
			watchChanges(newElement, details);
		});
		observer.observe(element, { childList: true, attributes: true, subtree: true });
	}
}

function display(id: number, parent: Element) {
	const details = DRUG_INFORMATION[id];
	if (!details) return;

	show(parent, details);
}

function show(parent: Element, details: DrugDetail) {
	// Remove current info
	parent.classList.add("tt-modified");
	findAllElements(".item-effect", parent).forEach((effect) => effect.remove());

	// Pros
	if (details.pros) {
		parent.appendChild(elementBuilder({ type: "div", class: "item-effect pro mt10", text: "Pros:", dataset: { addedBy: "TornTools" } }));

		for (const effect of details.pros) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect pro tabbed",
					text: effect,
					dataset: { addedBy: "TornTools" },
				}),
			);
		}
	}

	// Cons
	if (details.cons) {
		parent.appendChild(elementBuilder({ type: "div", class: "item-effect con", text: "Cons:", dataset: { addedBy: "TornTools" } }));

		for (const effect of details.cons) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: effect,
					dataset: { addedBy: "TornTools" },
				}),
			);
		}
	}

	// Cooldown
	if (details.cooldown) {
		parent.appendChild(
			elementBuilder({
				type: "div",
				class: "item-effect con",
				text: `Cooldown: ${details.cooldown}`,
				dataset: { addedBy: "TornTools" },
			}),
		);
	}

	// Overdose
	if (details.overdose) {
		parent.appendChild(elementBuilder({ type: "div", class: "item-effect con", text: "Overdose:", dataset: { addedBy: "TornTools" } }));

		// bars
		if (details.overdose.bars) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: "Bars",
					dataset: { addedBy: "TornTools" },
				}),
			);

			for (const effect of details.overdose.bars) {
				parent.appendChild(
					elementBuilder({
						type: "div",
						class: "item-effect con double-tabbed",
						text: effect,
						dataset: { addedBy: "TornTools" },
					}),
				);
			}
		}

		// stats
		if (details.overdose.stats) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: `Stats: ${details.overdose.stats}`,
					dataset: { addedBy: "TornTools" },
				}),
			);
		}

		// hospital time
		if (details.overdose.hosp_time) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: `Hospital: ${details.overdose.hosp_time}`,
					dataset: { addedBy: "TornTools" },
				}),
			);
		}

		// extra
		if (details.overdose.extra) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: `Extra: ${details.overdose.extra}`,
					dataset: { addedBy: "TornTools" },
				}),
			);
		}
	}
}

export default class DrugDetailsFeature extends Feature {
	constructor() {
		super("Drug Details", "items");
	}

	override precondition() {
		return getPageStatus().access && !(getPage() === "factions" && !isInternalFaction);
	}

	override isEnabled() {
		return settings.pages.items.drugDetails;
	}

	override initialise() {
		initialiseDrugDetails();
	}

	override execute() {
		// No execute needed as this is event-based
	}

	override storageKeys() {
		return ["settings.pages.items.drugDetails"];
	}
}
