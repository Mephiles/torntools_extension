import "./quick-crimes.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { quick, settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, getSearchParameters, isElement, mobile, tablet } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { ttStorage } from "@/utils/common/data/storage";
import { usingFirefox } from "@/utils/common/functions/browser";
import { PHFillPlus, PHX } from "@/utils/common/icons/phosphor-icons";

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
	CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES_LOADED].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(QuickCrimesFeature)) return;

		await loadCrimes();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES_CRIME].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(QuickCrimesFeature)) return;

		await loadCrimes();
	});
}

async function loadCrimes() {
	await requireElement(".specials-cont-wrap form[name='crimes'], #defaultCountdown");

	const isTouchDevice = mobile || tablet;
	const { container, content, options } = createContainer("Quick Crimes", {
		previousElement: document.querySelector(".content-title"),
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

					const enabled = options.querySelector("#edit-items-button").classList.toggle("tt-overlay-item");

					for (const crime of findAllElements(".quick-item", content)) {
						const item = crime.querySelector(".forced-item");
						if (enabled) {
							crime.classList.add("tt-overlay-item", "removable");
							item.classList.remove("item");
						} else {
							crime.classList.remove("tt-overlay-item", "removable");
							item.classList.add("item");
						}
					}

					if (enabled) {
						document.querySelector(".tt-overlay").classList.remove("tt-hidden");

						const draggableCrimes = findAllElements(".specials-cont-wrap form[name='crimes'] .item[draggable='true']");
						if (draggableCrimes.length) {
							draggableCrimes[0].closest(".specials-cont-wrap form[name='crimes']").classList.add("tt-overlay-item");

							for (const crime of draggableCrimes) {
								crime.addEventListener("click", onCrimeClick);
								crime.setAttribute("draggable", "false");
							}
						}
					} else {
						document.querySelector(".tt-overlay").classList.add("tt-hidden");

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
		})
	);

	for (const quickCrime of quick.crimes) {
		addQuickCrime(quickCrime, false);
	}

	makeDraggable();

	function makeDraggable() {
		const form = document.querySelector(".specials-cont-wrap form[name='crimes']");
		if (!form || !form.hasAttribute("action")) return;

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
			document.querySelector("#quickCrimes > main").classList.add("drag-progress");
			if (document.querySelector("#quickCrimes .temp.quick-item")) return;

			const form = document.querySelector(".specials-cont-wrap form[name='crimes']");
			const nerve = parseInt(form.querySelector<HTMLInputElement>("input[name='nervetake']").value);

			const action = `${location.origin}/${form.getAttribute("action")}`;
			const step = getSearchParameters(action).get("step");

			const data = {
				step,
				nerve,
				name: target.querySelector<HTMLInputElement>(".choice-container input").value,
				icon: target.querySelector<HTMLImageElement>(".title img").src,
				text: target.querySelector(".bonus").textContent.trim(),
			};

			addQuickCrime(data, true);
		});
	}

	async function onDragEnd() {
		if (document.querySelector("#quickCrimes .temp.quick-item")) {
			document.querySelector("#quickCrimes .temp.quick-item").remove();
		}

		document.querySelector("#quickCrimes > main").classList.remove("drag-progress");

		await saveCrimes();
	}

	function addQuickCrime(data: QuickCrime, temporary: boolean) {
		const content = findContainer("Quick Crimes", { selector: ":scope > main" });
		const innerContent = content.querySelector(".inner-content");

		const { step, nerve, name, icon, text } = data;

		if (innerContent.querySelector(`.quick-item[data-id='${name}']`)) return null;

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
						const children = [...innerContent.children];

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
				draggable: true,
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

		const form = document.querySelector(".specials-cont-wrap form[name='crimes']");
		const nerve = parseInt(form.querySelector<HTMLInputElement>("input[name='nervetake']").value);

		const action = `${location.origin}/${form.getAttribute("action")}`;
		const step = getSearchParameters(action).get("step");

		const data = {
			step,
			nerve,
			name: item.querySelector<HTMLInputElement>(".choice-container input").value,
			icon: item.querySelector<HTMLImageElement>(".title img").src,
			text: item.querySelector(".bonus").textContent.trim(),
		};

		const quick = addQuickCrime(data, false);

		quick.classList.add("removable", "tt-overlay-item");
		quick.querySelector(".item").classList.remove("item");

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
			.map((node) => node.id)
			.find((id) => id === containerId);
		if (hasRemovedQuickCrimes) return;

		await loadCrimes();
	});
	showCrimesAgainOnFirefoxObserver.observe(document.querySelector(".content-wrapper"), { childList: true, attributes: true, subtree: true });
}

function dispose() {
	removeContainer("Quick Crimes");
	if (showCrimesAgainOnFirefoxObserver) {
		showCrimesAgainOnFirefoxObserver.disconnect();
		showCrimesAgainOnFirefoxObserver = undefined;
	}
}

export default class QuickCrimesFeature extends Feature {
	constructor() {
		super("Quick Crimes", "crimes");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.crimes.quickCrimes;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await loadCrimes();
	}

	cleanup() {
		dispose();
	}

	storageKeys() {
		return ["settings.pages.crimes.quickCrimes"];
	}
}
