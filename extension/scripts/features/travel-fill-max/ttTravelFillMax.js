"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (!isAbroad()) return;

	featureManager.registerFeature(
		"Fill Max",
		"travel",
		() => settings.pages.travel.fillMax,
		null,
		addFillMax,
		removeFillMax,
		{
			storage: ["settings.pages.travel.fillMax"],
		},
		null
	);

	async function addFillMax() {
		const market = await requireElement(".travel-agency-market");

		for (const buyBtn of market.findAll(".buy")) {
			buyBtn.parentElement.classList.add("tt-buy");
			const maxSpan = document.newElement({ type: "span", text: "max", class: "tt-max-buy" });
			buyBtn.parentElement.appendChild(maxSpan);

			maxSpan.addEventListener("click", (event) => {
				event.stopPropagation();

				const row = buyBtn.closest("li");
				const price = parseInt(row.find(".c-price").textContent.replace(/,/g, "").replace("$", ""));
				const userMoney = document.find(".user-info .msg .bold:nth-of-type(2)").textContent.replace(/,/g, "").replace("$", "");
				const bought = parseInt(document.find(".user-info .msg .bold:nth-of-type(3)").textContent);
				let max = parseInt(row.find(".stck-amount").textContent.replace(/,/g, ""));
				let limit = parseInt(document.find(".user-info .msg .bold:nth-of-type(4)").textContent) - bought;

				if (hasAPIData() && settings.apiUsage.user.perks) {
					const itemType = row.find(".type").textContent.split("\n")[1].toLowerCase();
					if (
						(itemType === "flower" && userdata.job_perks.some((perk) => perk.includes("special flowers") && perk.includes("5 additional"))) ||
						(itemType === "plushie" && userdata.job_perks.some((perk) => perk.includes("+5 plushies") && perk.includes("from abroad")))
					)
						limit += 5;
				}

				max = Math.max(limit, max);
				max = Math.floor(userMoney / price) < max ? Math.floor(userMoney / price) : max;

				buyBtn.parentElement.find("input[name='amount']").value = max;
				buyBtn.parentElement.find("input[name='amount']").setAttribute("value", max);

				buyBtn.parentElement.find("input[name='amount']").dispatchEvent(new Event("blur"));
			});
		}
	}

	function removeFillMax() {
		document.findAll(".tt-buy").forEach((x) => x.classList.remove("tt-buy"));
		document.findAll(".tt-max-buy").forEach((x) => x.remove());
	}
})();
