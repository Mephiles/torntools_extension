import "./racing-upgrades.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, findParent } from "@/utils/common/functions/dom";
import { applyPlural } from "@/utils/common/functions/formatting";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function initialise() {
	addXHRListener(async ({ detail: { page, xhr, uri } }) => {
		if (!FEATURE_MANAGER.isEnabled(RacingUpgradesFeature)) return;

		if ((page === "page" || page === "loader") && uri) {
			const sid = uri.sid;
			if (sid !== "racing") return;

			const tab = uri.tab;
			if (tab !== "parts") return;

			await requireElement(".enlist-list");

			for (const car of findAllElements("[step-value='selectParts']:not(.tt-modified)")) {
				car.classList.add("tt-modified");
				car.addEventListener("click", () => requireElement(".pm-categories-wrap").then(showUpgrades));
			}
		} else if (page === "page" || page === "loader2") {
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
	if (!document.querySelector(".pm-categories-wrap")) return;

	await showUpgrades();
}

async function showUpgrades() {
	let parts: string[] = [];
	for (const item of findAllElements(".pm-items-wrap .d-wrap .pm-items .unlock")) {
		parts.push(item.getAttribute("data-part"));

		for (const property of findAllElements(".properties", item)) {
			const statNew = parseFloat(property.querySelector<HTMLElement>(".progressbar.progress-light-green, .progressbar.progress-red").style.width) / 100;
			const statOld = (statNew * parseFloat(property.querySelector<HTMLElement>(".progressbar.progress-light-gray").style.width)) / 100;
			const difference = Math.round((statNew - statOld) * 100);

			if (Number.isNaN(difference)) continue;

			const bar = elementBuilder("span");

			if (difference !== 0) {
				if (property.querySelector(".bar-tpl-wrap").classList.contains("negative")) {
					bar.textContent = `-${difference}%`;
					bar.classList.add("negative");
				} else {
					bar.textContent = `+${difference}%`;
					bar.classList.add("positive");
				}
			} else {
				bar.textContent = `${difference}%`;
			}

			property.querySelector(".name").prepend(bar);
		}
	}

	parts = parts.filter((value, index, self) => self.indexOf(value) === index);
	const needed = [];
	parts.forEach((part) => {
		if (document.querySelector(`.pm-items .bought[data-part="${part}"]`)) return;

		const color = `#${(Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6)}`;
		needed.push(`<span class="tt-race-upgrade-needed" part="${part}" style="color: ${color};">${part}</span>`);

		let category: string;
		for (const item of findAllElements(`.pm-items .unlock[data-part="${part}"]`)) {
			if (!category) category = findParent(item, { class: "pm-items-wrap" }).getAttribute("category");

			item.classList.add("tt-modified");
			item.querySelector<HTMLElement>(".status").style["background-color"] = color;
			item.querySelector(".status").classList.add("tt-modified");

			item.onmouseenter = () => {
				for (const item of findAllElements(".pm-items .unlock")) {
					if (item.getAttribute("data-part") === part) {
						item.querySelector<HTMLElement>(".title").style["background-color"] = color;
						item.style.opacity = "1";
					} else {
						item.style.opacity = "0.5";
					}
				}
			};
			item.onmouseleave = () => {
				for (const item of findAllElements(".pm-items .unlock")) {
					if (item.getAttribute("data-part") === part) {
						item.querySelector<HTMLElement>(".title").style["background-color"] = "";
					}
					item.style.opacity = "1";
				}
			};
		}

		const elCategory = document.querySelector(`.pm-categories > li[data-category="${category}"]`);
		if (elCategory.querySelector(".tt-race-need-icon")) {
			elCategory.querySelector(".tt-race-need-icon").textContent = (parseInt(elCategory.querySelector(".tt-race-need-icon").textContent) + 1).toString();
		} else {
			elCategory.querySelector(".bg-hover").appendChild(elementBuilder({ type: "div", class: "tt-race-need-icon", text: 1 }));
		}
	});

	document.querySelector("#racingAdditionalContainer > .info-msg-cont .msg").appendChild(
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
		if (!document.querySelector(`.pm-items .bought[data-part="${part}"]`)) return;

		cleanUpgrade(item, part);
	}
}

function cleanUpgrade(unlockElement: HTMLElement, part: string | null) {
	unlockElement.classList.remove("tt-modified");
	unlockElement.querySelector<HTMLElement>(".status").style["background-color"] = "";
	unlockElement.querySelector(".status").classList.remove("tt-modified");
	unlockElement.onmouseenter = () => {};
	unlockElement.onmouseleave = () => {};

	for (const item of findAllElements(".pm-items .unlock")) {
		if (item.getAttribute("data-part") === part || part === null) {
			item.querySelector<HTMLElement>(".title").style["background-color"] = "";
			item.classList.remove("tt-modified");
		}
		item.style.opacity = "1";
	}

	const category = findParent(unlockElement, { class: "pm-items-wrap" }).getAttribute("category");
	const counter = document.querySelector(`.pm-categories > .unlock[data-category="${category}"] .tt-race-need-icon`);
	counter.textContent = (parseInt(counter.textContent) - 1).toString();
	if (counter.textContent === "0") counter.remove();

	const totalCounter = document.querySelector(".tt-race-upgrades .counter");
	totalCounter.textContent = (parseInt(totalCounter.textContent) - 1).toString();
	if (totalCounter.textContent === "0") {
		document.querySelector(".tt-race-upgrades").remove();
	}

	const neededUpgrade = document.querySelector(`.tt-race-upgrade-needed[part="${part}"]`);
	if (neededUpgrade) {
		if (neededUpgrade.nextElementSibling?.classList.contains("separator")) neededUpgrade.nextElementSibling.remove();
		neededUpgrade.remove();
	}
}

function removeUpgrades() {
	findAllElements(".tt-race-need-icon, .tt-race-upgrades").forEach((element) => element.remove());
	findAllElements(".pm-items-wrap .d-wrap .pm-items .unlock.tt-modified").forEach((upgrade) => cleanUpgrade(upgrade, null));
}

export default class RacingUpgradesFeature extends Feature {
	constructor() {
		super("Racing Upgrades", "racing");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.racing.upgrades;
	}

	storageKeys() {
		return ["settings.pages.racing.upgrades"];
	}

	initialise() {
		initialise();
	}

	async execute() {
		await startFeature();
	}

	cleanup(): void {
		removeUpgrades();
	}
}
