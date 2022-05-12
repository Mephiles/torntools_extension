"use strict";

(async () => {
	const page = getPage();

	if (page === "factions") {
		const params = getSearchParameters();
		if (params.get("step") !== "your") return;
	}

	const feature = featureManager.registerFeature("Medical Life", "items", () => settings.pages.items.medicalLife, addListener, undefined, undefined, {
		storage: ["settings.pages.items.medicalLife"],
	});

	const MEDICAL_ITEMS = {
		66: 15,
		67: 10,
		68: 5,
		732: 30,
		733: 30,
		734: 30,
		735: 30,
		736: 30,
		737: 30,
		738: 30,
		739: 30,
	};

	function addListener() {
		if (page === "item") {
			addXHRListener(({ detail: { page, xhr } }) => {
				if (!feature.enabled()) return;

				if (page !== "item") return;

				const params = new URLSearchParams(xhr.requestBody);
				if (params.get("action") !== "use") return;

				const id = params.get("id").getNumber();
				if (!doesRestoreLife(id)) return;

				showInformation(id);
			});
		} else if (page === "factions") {
			document.find("#faction-armoury").addEventListener("click", (event) => {
				if (!feature.enabled()) return;

				if (!event.target.classList.contains("use")) return;

				const id = event.target.closest(".item-use-act").find(".use-cont").dataset.itemid.getNumber();
				if (!doesRestoreLife(id)) return;

				showInformation(id);
			});
		}
	}

	function doesRestoreLife(id) {
		return id in MEDICAL_ITEMS;
	}

	async function showInformation(id) {
		const perks = userdata.education_perks
			.filter((perk) => perk.includes("Medical item effectiveness"))
			.map((perk) => parseInt(perk.match(/\+ (\d+)%/i)[1]))
			.totalSum();
		const percentage = (1 + perks / 100) * MEDICAL_ITEMS[id];

		const lifeValues = document.find("#barLife [class*='bar-value___']").textContent.split("/");
		const currentLife = parseInt(lifeValues[0]);
		const maximumLife = parseInt(lifeValues[1]);

		const replenish = Math.max(Math.min(maximumLife * (percentage / 100), maximumLife - currentLife), 0);
		const newLife = currentLife + replenish;

		let actionWrap;
		if (page === "item") {
			actionWrap = await requireElement(".use-action[style*='display: block;'] #wai-action-desc, .use-action:not([style]) #wai-action-desc");
		} else if (page === "factions") {
			actionWrap = await requireElement(`.action-cont[data-itemid='${id}'] .confirm`);
		}

		const text = `Your life total will be ${newLife.roundNearest(1)}/${maximumLife.roundNearest(1)}.`;

		if (actionWrap.find(".tt-medical-life")) {
			actionWrap.find(".tt-medical-life").textContent = text;
		} else {
			actionWrap.appendChild(document.newElement({ type: "strong", class: ["tt-medical-life", page], text }));
		}
	}
})();
