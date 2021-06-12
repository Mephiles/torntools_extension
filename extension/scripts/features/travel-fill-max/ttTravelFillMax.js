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
		await requireElement(".travel-agency-market");
		const market = document.find(".travel-agency-market");

		for (const buyBtn of market.findAll(".buy")) {
			buyBtn.parentElement.classList.add("tt-buy");
			const maxSpan = document.newElement({ type: "span", text: "fill max", class: "tt-max-buy" });
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

	function removeFillMax() {
		document.findAll(".tt-buy").forEach((x) => x.classList.remove("tt-buy"));
		document.findAll(".tt-max-buy").forEach((x) => x.remove());
	}
})();
