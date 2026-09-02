import "./quick-crimes.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { quick, settings } from "@common/utils/data/database";
import { usingFirefox } from "@common/utils/functions/browser";
import { createContainer, findContainer } from "@common/utils/functions/containers";
import { elementBuilder, getSearchParameters, isElement, mobile, tablet } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { PHFillPlus, PHX } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";

interface QuickCrime {
	step: string;
	nerve: number;
	name: string;
	icon: string;
	text: string;
}

let movingElement: Element | undefined;
let showCrimesAgainOnFirefoxObserver: MutationObserver | undefined;

function initialise() {
	addCustomListener(EVENT_CHANNELS.CRIMES_LOADED, async () => {
		if (!FEATURE_MANAGER.isEnabled(QuickCrimesFeature)) return;

		await loadCrimes();
	});
	addCustomListener(EVENT_CHANNELS.CRIMES_CRIME, async () => {
		if (!FEATURE_MANAGER.isEnabled(QuickCrimesFeature)) return;

		await loadCrimes();
	});
}

async function loadCrimes() {
	await requireElement(".specials-cont-wrap form[name='crimes'], #defaultCountdown");

	const isTouchDevice = mobile || tablet;
	const { container, content, options } = createContainer("Quick Crimes", {
		previousElement: findElement(".content-title"),
		allowDragging: true,
		compact: true,
	});
	showCrimesAgainOnFirefox(container.id);

	content.appendChild(elementBuilder({ type: "div", class: "inner-content" }));

	options.appendChild(
		elementBuilder({
			type: "div",
			class: "option",
			id: "edit-items-button",
			children: [PHFillPlus(), "Edit"],
			events: {
				click: (event) => {
					event.stopPropagation();

					const enabled = findElement("#edit-items-button", options).classList.toggle("tt-overlay-item");

					for (const crime of findAllElements(".quick-item", content)) {
						const item = findElement(".forced-item", crime);
						if (enabled) {
							crime.classList.add("tt-overlay-item", "removable");
							item.classList.remove("item");
						} else {
							crime.classList.remove("tt-overlay-item", "removable");
							item.classList.add("item");
						}
					}

					if (enabled) {
						findElement(".tt-overlay").classList.remove("tt-hidden");

						const draggableCrimes = findAllElements(".specials-cont-wrap form[name='crimes'] .item[draggable='true']");
						if (draggableCrimes.length) {
							draggableCrimes[0].closest(".specials-cont-wrap form[name='crimes']").classList.add("tt-overlay-item");

							for (const crime of draggableCrimes) {
								crime.addEventListener("click", onCrimeClick);
								crime.setAttribute("draggable", "false");
							}
						}
					} else {
						findElement(".tt-overlay").classList.add("tt-hidden");

						const nonDraggableCrimes = findAllElements(".specials-cont-wrap form[name='crimes'] .item[draggable='false']");
						if (nonDraggableCrimes.length) {
							nonDraggableCrimes[0].closest(".specials-cont-wrap form[name='crimes']").classList.remove("tt-overlay-item");

							for (const crime of nonDraggableCrimes) {
								crime.removeEventListener("click", onCrimeClick);
								crime.setAttribute("draggable", "true");
							}
						}
					}
				},
			},
		}),
	);

	for (const quickCrime of quick.crimes) {
		addQuickCrime(quickCrime, false);
	}

	makeDraggable();

	function makeDraggable() {
		const form = findElement(".specials-cont-wrap form[name='crimes']", true);
		if (!form?.hasAttribute("action")) return;

		const action = `${location.origin}/${form.getAttribute("action")}`;
		const step = getSearchParameters(action).get("step");
		if (!["docrime2", "docrime4"].includes(step)) return;

		for (const crime of findAllElements("ul.item", form)) {
			if (crime.hasAttribute("draggable")) continue;

			crime.setAttribute("draggable", "true");
			if (!isTouchDevice) {
				crime.addEventListener("dragstart", onDragStart);
				crime.addEventListener("dragend", onDragEnd);
			}
		}
	}

	function onDragStart(event: DragEvent) {
		if (!isElement(event.target)) return;
		const target = event.target;

		event.dataTransfer.setData("text/plain", null);

		setTimeout(() => {
			findElement("#quickCrimes > main").classList.add("drag-progress");
			if (findElement("#quickCrimes .temp.quick-item", true)) return;

			const form = findElement(".specials-cont-wrap form[name='crimes']");
			const nerve = parseInt(findElement<HTMLInputElement>("input[name='nervetake']", form).value);

			const action = `${location.origin}/${form.getAttribute("action")}`;
			const step = getSearchParameters(action).get("step");

			const data = {
				step,
				nerve,
				name: findElement<HTMLInputElement>(".choice-container input", target).value,
				icon: findElement<HTMLImageElement>(".title img", target).src,
				text: findElement(".bonus", target).textContent.trim(),
			};

			addQuickCrime(data, true);
		});
	}

	async function onDragEnd() {
		if (findElement("#quickCrimes .temp.quick-item", true)) {
			findElement("#quickCrimes .temp.quick-item").remove();
		}

		findElement("#quickCrimes > main").classList.remove("drag-progress");

		await saveCrimes();
	}

	function addQuickCrime(data: QuickCrime, temporary: boolean) {
		const content = findContainer("Quick Crimes", { selector: ":scope > main" });
		const innerContent = findElement(".inner-content", content);

		const { step, nerve, name, icon, text } = data;

		if (findElement(`.quick-item[data-id='${name}']`, innerContent, true)) return null;

		const closeIcon = elementBuilder({
			type: "svg",
			class: "tt-close-icon",
			children: [PHX()],
			attributes: { title: "Remove quick access. " },
			events: {
				click: async (event) => {
					event.stopPropagation();
					closeIcon.dispatchEvent(new Event("mouseout"));
					itemWrap.remove();
					await saveCrimes();
				},
			},
		});

		const itemWrap = elementBuilder({
			type: "form",
			class: `quick-item ${temporary ? "temp" : ""}`,
			dataset: data,
			children: [
				elementBuilder({ type: "input", attributes: { name: "nervetake", type: "hidden", value: nerve } }),
				elementBuilder({ type: "input", attributes: { name: "crime", type: "hidden", value: name } }),
				elementBuilder({
					type: "ul",
					class: "item forced-item",
					children: [
						elementBuilder({ type: "div", class: "pic", attributes: { style: `background-image: url(${icon})` } }),
						elementBuilder({ type: "div", class: "text", text: `${text} (-${nerve} nerve)` }),
					],
				}),
				closeIcon,
			],
			events: {
				async click() {
					if (itemWrap.classList.contains("removable")) {
						itemWrap.remove();
						await saveCrimes();
					}
				},
				dragstart(event) {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setDragImage(event.currentTarget as Element, 0, 0);

					movingElement = event.currentTarget as Element;
				},
				async dragend() {
					movingElement.classList.remove("temp");
					movingElement = undefined;

					await saveCrimes();
				},
				dragover(event) {
					event.preventDefault();
				},
				dragenter(event) {
					if (movingElement !== event.currentTarget && isElement(event.currentTarget)) {
						const children = Array.from(innerContent.children);

						if (children.indexOf(movingElement) > children.indexOf(event.currentTarget))
							innerContent.insertBefore(movingElement, event.currentTarget);
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
				action: `crimes.php?step=${step}`,
				method: "post",
				name: "crimes",
				draggable: !isTouchDevice,
			},
		});
		innerContent.appendChild(itemWrap);

		return itemWrap;
	}

	async function saveCrimes() {
		const content = findContainer("Quick Crimes", { selector: ":scope > main" });

		await ttStorage.change({
			quick: {
				crimes: findAllElements(".quick-item", content).map((crime) => ({
					step: crime.dataset.step,
					nerve: parseInt(crime.dataset.nerve),
					name: crime.dataset.name,
					icon: crime.dataset.icon,
					text: crime.dataset.text,
				})),
			},
		});
	}

	async function onCrimeClick(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();

		if (!isElement(event.target)) return;

		const item = event.target.closest(".item");

		const form = findElement(".specials-cont-wrap form[name='crimes']");
		const nerve = parseInt(findElement<HTMLInputElement>("input[name='nervetake']", form).value);

		const action = `${location.origin}/${form.getAttribute("action")}`;
		const step = getSearchParameters(action).get("step");

		const data = {
			step,
			nerve,
			name: findElement<HTMLInputElement>(".choice-container input", item).value,
			icon: findElement<HTMLImageElement>(".title img", item).src,
			text: findElement(".bonus", item).textContent.trim(),
		};

		const quick = addQuickCrime(data, false);

		quick.classList.add("removable", "tt-overlay-item");
		findElement(".item", quick).classList.remove("item");

		await saveCrimes();
	}
}

function showCrimesAgainOnFirefox(containerId: string) {
	if (!usingFirefox()) return;

	if (showCrimesAgainOnFirefoxObserver) {
		showCrimesAgainOnFirefoxObserver.disconnect();
		showCrimesAgainOnFirefoxObserver = undefined;
		return;
	}

	showCrimesAgainOnFirefoxObserver = new MutationObserver(async (mutations) => {
		const hasRemovedQuickCrimes = !mutations
			.filter((mutation) => mutation.removedNodes.length)
			.flatMap((mutation) => Array.from(mutation.removedNodes))
			.filter(isElement)
			.some((node) => node.id === containerId);
		if (hasRemovedQuickCrimes) return;

		await loadCrimes();
	});
	showCrimesAgainOnFirefoxObserver.observe(findElement(".content-wrapper"), { childList: true, attributes: true, subtree: true });
}

export default class QuickCrimesFeature extends Feature {
	constructor() {
		super("Quick Crimes", "crimes");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.crimes.quickCrimes;
	}

	override initialise() {
		initialise();
	}

	override async execute() {
		await loadCrimes();
	}

	override storageKeys() {
		return ["settings.pages.crimes.quickCrimes"];
	}
}
