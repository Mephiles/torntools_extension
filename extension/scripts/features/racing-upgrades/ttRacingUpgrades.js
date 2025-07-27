"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Racing Upgrades",
		"racing",
		() => settings.pages.racing.upgrades,
		initialise,
		startFeature,
		removeUpgrades,
		{
			storage: ["settings.pages.racing.upgrades"],
		},
		null
	);

	function initialise() {
		addXHRListener(async ({ detail: { page, xhr, uri } }) => {
			if (!feature.enabled()) return;

			if ((page === "page" || page === "loader") && uri) {
				const sid = uri.sid;
				if (sid !== "racing") return;

				const tab = uri.tab;
				if (tab !== "parts") return;

				await requireElement(".enlist-list");

				for (const car of document.findAll("[step-value='selectParts']:not(.tt-modified)")) {
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

	function startFeature() {
		if (!document.find(".pm-categories-wrap")) return;

		showUpgrades();
	}

	async function showUpgrades() {
		let parts = [];
		for (const item of document.findAll(".pm-items-wrap .d-wrap .pm-items .unlock")) {
			parts.push(item.getAttribute("data-part"));

			for (const property of item.findAll(".properties")) {
				const statNew = parseFloat(property.find(".progressbar.progress-light-green, .progressbar.progress-red").style.width) / 100;
				const statOld = (statNew * parseFloat(property.find(".progressbar.progress-light-gray").style.width)) / 100;
				const difference = Math.round((statNew - statOld) * 100);

				if (isNaN(difference)) continue;

				const bar = document.newElement("span");

				if (difference !== 0) {
					if (property.find(".bar-tpl-wrap").classList.contains("negative")) {
						bar.textContent = `-${difference}%`;
						bar.classList.add("negative");
					} else {
						bar.textContent = `+${difference}%`;
						bar.classList.add("positive");
					}
				} else {
					bar.textContent = `${difference}%`;
				}

				property.find(".name").prepend(bar);
			}
		}

		parts = parts.filter((value, index, self) => self.indexOf(value) === index);
		const needed = [];
		parts.forEach((part) => {
			if (document.find(`.pm-items .bought[data-part="${part}"]`)) return;

			const color = `#${(Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6)}`;
			needed.push(`<span class="tt-race-upgrade-needed" part="${part}" style="color: ${color};">${part}</span>`);

			let category;
			for (const item of document.findAll(`.pm-items .unlock[data-part="${part}"]`)) {
				if (!category) category = findParent(item, { class: "pm-items-wrap" }).getAttribute("category");

				item.classList.add("tt-modified");
				item.find(".status").style["background-color"] = color;
				item.find(".status").classList.add("tt-modified");

				item.onmouseenter = () => {
					for (const item of document.findAll(".pm-items .unlock")) {
						if (item.getAttribute("data-part") === part) {
							item.find(".title").style["background-color"] = color;
							item.style.opacity = 1;
						} else {
							item.style.opacity = 0.5;
						}
					}
				};
				item.onmouseleave = () => {
					for (const item of document.findAll(".pm-items .unlock")) {
						if (item.getAttribute("data-part") === part) {
							item.find(".title").style["background-color"] = "";
						}
						item.style.opacity = 1;
					}
				};
			}

			const elCategory = document.find(`.pm-categories > li[data-category="${category}"]`);
			if (elCategory.find(".tt-race-need-icon")) {
				elCategory.find(".tt-race-need-icon").textContent = parseInt(elCategory.find(".tt-race-need-icon").textContent) + 1;
			} else {
				elCategory.find(".bg-hover").appendChild(document.newElement({ type: "div", class: "tt-race-need-icon", text: 1 }));
			}
		});

		document.find("#racingAdditionalContainer > .info-msg-cont .msg").appendChild(
			document.newElement({
				type: "p",
				class: "tt-race-upgrades",
				html: `
					<br/>
					<br/>
					${
						needed.length
							? `<strong class="counter">${needed.length}</strong> part${applyPlural(needed.length)} available to upgrade: <strong>${needed.join(
									"<span class='separator'>, </span>"
								)}</strong>`
							: "Your car is <strong style='color: #789e0c;'>FULLY UPGRADED</strong>!"
					}
				`,
			})
		);
	}

	function resetUpgrades() {
		for (const item of document.findAll(".pm-items-wrap .d-wrap .pm-items .unlock.tt-modified")) {
			const part = item.getAttribute("data-part");
			if (!document.find(`.pm-items .bought[data-part="${part}"]`)) return;

			cleanUpgrade(item);
		}
	}

	function cleanUpgrade(unlockElement) {
		unlockElement.classList.remove("tt-modified");
		unlockElement.find(".status").style["background-color"] = "";
		unlockElement.find(".status").classList.remove("tt-modified");
		unlockElement.onmouseenter = () => {};
		unlockElement.onmouseleave = () => {};

		for (const item of document.findAll(".pm-items .unlock")) {
			if (item.getAttribute("data-part") === part) {
				item.find(".title").style["background-color"] = "";
				item.classList.remove("tt-modified");
			}
			item.style.opacity = 1;
		}

		const category = findParent(unlockElement, { class: "pm-items-wrap" }).getAttribute("category");
		const counter = document.find(`.pm-categories > .unlock[data-category="${category}"] .tt-race-need-icon`);
		counter.textContent = parseInt(counter.textContent) - 1;
		if (counter.textContent === "0") counter.remove();

		const totalCounter = document.find(".tt-race-upgrades .counter");
		totalCounter.textContent = parseInt(totalCounter.textContent) - 1;
		if (totalCounter.textContent === "0") {
			document.find(".tt-race-upgrades").remove();
		}

		const neededUpgrade = document.find(`.tt-race-upgrade-needed[part="${part}"]`);
		if (neededUpgrade) {
			if (neededUpgrade.nextElementSibling && neededUpgrade.nextElementSibling.classList.contains("separator")) neededUpgrade.nextElementSibling.remove();
			neededUpgrade.remove();
		}
	}

	function removeUpgrades() {
		document.findAll(".tt-race-need-icon, .tt-race-upgrades").forEach((element) => element.remove());
		document.findAll(".pm-items-wrap .d-wrap .pm-items .unlock.tt-modified").forEach((upgrade) => cleanUpgrade(upgrade));
	}
})();
