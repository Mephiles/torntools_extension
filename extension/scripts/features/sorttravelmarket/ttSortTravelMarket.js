"use strict";

(async () => {
	featureManager.registerFeature(
		"Sort Market",
		"travel",
		() => settings.pages.travel.sortable,
		null,
		makeSortable,
		removeSortable,
		{
			storage: ["settings.pages.travel.sortable"],
		},
		null,
	);

	function makeSortable() {
		const market = document.find(".travel-agency-market");

		if (!market) {
			console.log("No market");
			return;
		}

		for (const buyBtn of market.findAll(".buy")) {
			const maxSpan = document.newElement({ type: "span", text: "fill max", class: "tt-max-buy bold" });
			buyBtn.parentElement.appendChild(maxSpan);

			maxSpan.addEventListener("click", (event) => {
				event.stopPropagation();

				let max = parseInt(buyBtn.parentElement.parentElement.find(".stck-amount").innerText.replace(/,/g, ""));
				const price = parseInt(buyBtn.parentElement.parentElement.find(".c-price").innerText.replace(/,/g, "").replace("$", ""));
				const userMoney = document.find(".user-info .msg .bold:nth-of-type(2)").innerText.replace(/,/g, "").replace("$", "");
				const bought = parseInt(document.find(".user-info .msg .bold:nth-of-type(3)").innerText);
				const limit = parseInt(document.find(".user-info .msg .bold:nth-of-type(4)").innerText) - bought;

				max = max > limit ? limit : max;
				max = Math.floor(userMoney / price) < max ? Math.floor(userMoney / price) : max;

				buyBtn.parentElement.find("input[name='amount']").value = max;
				buyBtn.parentElement.find("input[name='amount']").setAttribute("value", max);

				buyBtn.parentElement.find("input[name='amount']").dispatchEvent(new Event("blur"));
			});
		}
	}

	function removeSortable() {
		document.findAll(".tt-max-buy").forEach((x) => x.remove());
	}
})();
