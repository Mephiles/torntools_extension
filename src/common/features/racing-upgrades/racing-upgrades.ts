import "./racing-upgrades.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findParent } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { applyPlural } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialise() {
	addXHRListener(async ({ detail: { page, xhr, uri } }) => {
		if (!FEATURE_MANAGER.isEnabled(RacingUpgradesFeature)) return;
		if (page !== "page") return;

		if (uri) {
			const sid = uri.sid;
			if (sid !== "racing") return;

			const tab = uri.tab;
			if (tab !== "parts") return;

			await requireElement(".enlist-list");

			for (const car of findAllElements("[step-value='selectParts']:not(.tt-modified)")) {
				car.classList.add("tt-modified");
				car.addEventListener("click", () => requireElement(".pm-categories-wrap").then(showUpgrades));
			}
		} else {
			const params = new URLSearchParams(xhr.requestBody);

			const sid = params.get("sid");
			if (sid !== "racingActions") return;

			const step = params.get("step");
			if (step !== "partsbuy") return;

			const confirm = params.get("confirm");
			if (confirm !== "1") return;

			setTimeout(resetUpgrades, 250);
		}
	});
}

async function startFeature() {
	if (!findElement(".pm-categories-wrap", true)) return;

	await showUpgrades();
}

async function showUpgrades() {
	let parts: string[] = [];
	for (const item of findAllElements(".pm-items-wrap .d-wrap .pm-items .unlock")) {
		parts.push(item.getAttribute("data-part")!);

		for (const property of findAllElements(".properties", item)) {
			const statNew = parseFloat(findElement(".progressbar.progress-light-green, .progressbar.progress-red", property).style.width) / 100;
			const statOld = (statNew * parseFloat(findElement(".progressbar.progress-light-gray", property).style.width)) / 100;
			const difference = Math.round((statNew - statOld) * 100);

			if (Number.isNaN(difference)) continue;

			const bar = elementBuilder("span");

			if (difference !== 0) {
				if (findElement(".bar-tpl-wrap", property).classList.contains("negative")) {
					bar.textContent = `-${difference}%`;
					bar.classList.add("negative");
				} else {
					bar.textContent = `+${difference}%`;
					bar.classList.add("positive");
				}
			} else {
				bar.textContent = `${difference}%`;
			}

			findElement(".name", property).prepend(bar);
		}
	}

	parts = parts.filter((value, index, self) => self.indexOf(value) === index);
	const needed: string[] = [];
	parts.forEach((part) => {
		if (findElement(`.pm-items .bought[data-part="${part}"]`, true)) return;

		const color = `#${(Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6)}`;
		needed.push(`<span class="tt-race-upgrade-needed" part="${part}" style="color: ${color};">${part}</span>`);

		let category: string | undefined;
		for (const item of findAllElements(`.pm-items .unlock[data-part="${part}"]`)) {
			if (!category) {
				category = findParent(item, { class: "pm-items-wrap" })!.getAttribute("category")!;
			}

			item.classList.add("tt-modified");
			findElement(".status", item).style.setProperty("background-color", color);
			findElement(".status", item).classList.add("tt-modified");

			// oxlint-disable-next-line prefer-add-event-listener -- item handlers are replaced on re-render, not stacked
			item.onmouseenter = () => {
				for (const item of findAllElements(".pm-items .unlock")) {
					if (item.getAttribute("data-part") === part) {
						findElement(".title", item).style.setProperty("background-color", color);
						item.style.opacity = "1";
					} else {
						item.style.opacity = "0.5";
					}
				}
			};
			// oxlint-disable-next-line prefer-add-event-listener -- item handlers are replaced on re-render, not stacked
			item.onmouseleave = () => {
				for (const item of findAllElements(".pm-items .unlock")) {
					if (item.getAttribute("data-part") === part) {
						findElement(".title", item).style.setProperty("background-color", "");
					}
					item.style.opacity = "1";
				}
			};
		}

		if (!category) return;

		const elCategory = findElement(`.pm-categories > li[data-category="${category}"]`);
		if (findElement(".tt-race-need-icon", elCategory, true)) {
			findElement(".tt-race-need-icon", elCategory).textContent = (parseInt(findElement(".tt-race-need-icon", elCategory).textContent) + 1).toString();
		} else {
			findElement(".bg-hover", elCategory).appendChild(elementBuilder({ type: "div", class: "tt-race-need-icon", text: 1 }));
		}
	});

	findElement("#racingAdditionalContainer > .info-msg-cont .msg").appendChild(
		elementBuilder({
			type: "p",
			class: "tt-race-upgrades",
			html: `
					<br/>
					<br/>
					${
						needed.length
							? `<strong class="counter">${needed.length}</strong> part${applyPlural(needed.length)} available to upgrade: <strong>${needed.join(
									"<span class='separator'>, </span>",
								)}</strong>`
							: "Your car is <strong style='color: #789e0c;'>FULLY UPGRADED</strong>!"
					}
				`,
		}),
	);
}

function resetUpgrades() {
	for (const item of findAllElements(".pm-items-wrap .d-wrap .pm-items .unlock.tt-modified")) {
		const part = item.getAttribute("data-part");
		if (!findElement(`.pm-items .bought[data-part="${part}"]`, true)) return;

		cleanUpgrade(item, part);
	}
}

function cleanUpgrade(unlockElement: HTMLElement, part: string | null) {
	unlockElement.classList.remove("tt-modified");
	findElement(".status", unlockElement).style.setProperty("background-color", "");
	findElement(".status", unlockElement).classList.remove("tt-modified");
	// oxlint-disable-next-line prefer-add-event-listener -- assignment resets (replaces) the previous handler
	unlockElement.onmouseenter = () => {};
	// oxlint-disable-next-line prefer-add-event-listener -- assignment resets (replaces) the previous handler
	unlockElement.onmouseleave = () => {};

	for (const item of findAllElements(".pm-items .unlock")) {
		if (item.getAttribute("data-part") === part || part === null) {
			findElement(".title", item).style.setProperty("background-color", "");
			item.classList.remove("tt-modified");
		}
		item.style.opacity = "1";
	}

	const category = findParent(unlockElement, { class: "pm-items-wrap" })!.getAttribute("category")!;
	const counter = findElement(`.pm-categories > .unlock[data-category="${category}"] .tt-race-need-icon`);
	counter.textContent = (parseInt(counter.textContent) - 1).toString();
	if (counter.textContent === "0") counter.remove();

	const totalCounter = findElement(".tt-race-upgrades .counter");
	totalCounter.textContent = (parseInt(totalCounter.textContent) - 1).toString();
	if (totalCounter.textContent === "0") {
		findElement(".tt-race-upgrades").remove();
	}

	const neededUpgrade = findElement(`.tt-race-upgrade-needed[part="${part}"]`, true);
	if (neededUpgrade) {
		if (neededUpgrade.nextElementSibling?.classList.contains("separator")) neededUpgrade.nextElementSibling.remove();
		neededUpgrade.remove();
	}
}

export default class RacingUpgradesFeature extends Feature {
	constructor() {
		super("Racing Upgrades", "racing");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.racing.upgrades;
	}

	override storageKeys() {
		return ["settings.pages.racing.upgrades"];
	}

	override initialise() {
		initialise();
	}

	override async execute() {
		await startFeature();
	}
}
