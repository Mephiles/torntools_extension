import "./drug-details.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { DRUG_INFORMATION, DrugDetail, getPage, getPageStatus } from "@/utils/common/functions/torn";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { extractArmorySubcategory, isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { addXHRListener, CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";

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
					extractArmorySubcategory(document.querySelector("#faction-armoury-tabs > ul > li[aria-selected='true']").getAttribute("aria-controls")) ===
					"donate",
			});
			break;
		case "bazaar":
			addMutationObserver("[class*='itemsContainner_'], [class*='core-layout_'] [class*='items_']");
			break;
		case "itemmarket":
			CUSTOM_LISTENERS[EVENT_CHANNELS.ITEMMARKET_ITEM_DETAILS].push(({ item, element }) => {
				if (!FEATURE_MANAGER.isEnabled(DrugDetailsFeature)) return;

				display(item, element.querySelector("[class*='description___']"));
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
				Array.from(mutation.addedNodes).some((node) => isElement(node) && Array.from(node.classList).some((c) => c.startsWith("view_")))
			);
			if (!viewMutations.length) return;

			const newNodes = viewMutations[0].addedNodes;
			let target: Element;
			if (Array.from(newNodes).some((node) => isElement(node) && node.querySelector(":scope > [class*='preloader_']"))) {
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
			const armoryInfo = target.querySelector("[aria-labelledby*='armory-info-']");
			if (armoryInfo) {
				id = parseInt(armoryInfo.getAttribute("aria-labelledby").match(/armory-info-(\d*)/i)[1]);
			} else {
				const image = target.querySelector("img");

				if (image) {
					id = convertToNumber(image.src.match(/items\/([0-9]+)\/large.*\.png/i)[1]);
				} else {
					throw new Error("No id found for this item!");
				}
			}

			showDetails(id, { target }).catch((error) => console.error("Couldn't show drug details.", error));
		}).observe(document.querySelector(selector), { subtree: true, childList: true });
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
		options.target.querySelector(".info-active .show-item-info[data-reactid]")
	) {
		const reactid = options.target.querySelector<HTMLElement>(".info-active .show-item-info").dataset.reactid;

		await requireElement(`[data-reactid="${reactid}"] .ajax-placeholder, [data-reactid="${reactid}"] .ajax-preloader`, { invert: true });

		element = options.target.querySelector(`[data-reactid="${reactid}"]`);
	} else {
		element = findElement();
		await requireElement(".ajax-placeholder, .ajax-preloader", { invert: true, parent: element });
	}

	const details = DRUG_INFORMATION[id];
	if (!details) return;

	[element.querySelector(".info-msg, [class*='description___']"), document.querySelector(`.info-wrap[aria-labelledby="armory-info-${id}-"] .info-msg`)]
		.filter((info) => !!info)
		.forEach((info) => {
			show(info, details);
			if (options.changeListener) watchChanges(element, details);
		});

	function findElement() {
		return (
			options.target.querySelector(`li[itemid="${id}"] .view-item-info`) ||
			options.target.querySelector(
				[
					getPage() === "imarket" ? ".details-wrap[style*='display: block;'], #drugs .m-items-list > .show-item-info" : "",
					["item", "bazaar", "displaycase"].includes(getPage()) ? ".show-item-info" : "",
					getPage() === "factions" ? ".view-item-info[style*='display: block;']" : "",
				]
					.filter((x) => x)
					.join(", ")
			)
		);
	}

	function watchChanges(element: Element, details: DrugDetail) {
		if (observer) observer.disconnect();

		observer = new MutationObserver((mutations, observer) => {
			const filteredMutations = mutations.filter((mutation) =>
				Array.from(mutation.addedNodes).some((node) => isElement(node) && node.classList.contains("info-wrap"))
			);
			if (!filteredMutations.length) return;

			const newElement = findElement();
			show(newElement.querySelector(".info-msg"), details);
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
		parent.appendChild(elementBuilder({ type: "div", class: "item-effect pro mt10", text: "Pros:" }));

		for (const effect of details.pros) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect pro tabbed",
					text: effect,
				})
			);
		}
	}

	// Cons
	if (details.cons) {
		parent.appendChild(elementBuilder({ type: "div", class: "item-effect con", text: "Cons:" }));

		for (const effect of details.cons) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: effect,
				})
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
			})
		);
	}

	// Overdose
	if (details.overdose) {
		parent.appendChild(elementBuilder({ type: "div", class: "item-effect con", text: "Overdose:" }));

		// bars
		if (details.overdose.bars) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: "Bars",
				})
			);

			for (const effect of details.overdose.bars) {
				parent.appendChild(
					elementBuilder({
						type: "div",
						class: "item-effect con double-tabbed",
						text: effect,
					})
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
				})
			);
		}

		// hospital time
		if (details.overdose.hosp_time) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: `Hospital: ${details.overdose.hosp_time}`,
				})
			);
		}

		// extra
		if (details.overdose.extra) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "item-effect con tabbed",
					text: `Extra: ${details.overdose.extra}`,
				})
			);
		}
	}
}

export default class DrugDetailsFeature extends Feature {
	constructor() {
		super("Drug Details", "items");
	}

	precondition() {
		return getPageStatus().access && !(getPage() === "factions" && !isInternalFaction);
	}

	isEnabled() {
		return settings.pages.items.drugDetails;
	}

	initialise() {
		initialiseDrugDetails();
	}

	execute() {
		// No execute needed as this is event-based
	}

	cleanup() {
		if (observer) observer.disconnect();
	}

	storageKeys() {
		return ["settings.pages.items.drugDetails"];
	}
}
