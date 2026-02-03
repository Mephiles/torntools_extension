(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Fill Max",
		"bazaar",
		() => settings.pages.bazaar.fillMax,
		initialiseListeners,
		addFillMax,
		removeFillMax,
		{
			storage: ["settings.pages.bazaar.fillMax"],
		},
		async () => {
			await checkDevice();

			return true;
		}
	);

	let reactObserver: MutationObserver | undefined;
	function initialiseListeners() {
		if (!mobile) return;

		reactObserver = new MutationObserver(() => maxBuyListener(""));
	}

	async function addFillMax() {
		if (!mobile) document.addEventListener("click", maxBuyListener);
		else {
			await maxBuyListener();
			reactObserver.observe(await requireElement(".ReactVirtualized__Grid__innerScrollContainer"), { childList: true });
		}
	}

	async function removeFillMax() {
		if (!mobile) {
			document.removeEventListener("click", maxBuyListener);
			findAllElements(".tt-max-buy").forEach((x) => x.remove());
		} else {
			await requireElement("[class*='buyForm___']");
			findAllElements("[class*='buyForm___']").forEach((x) => {
				x.classList.remove("tt-fill-max");
				x.find(".tt-max-buy").remove();
			});
			reactObserver.disconnect();
		}
	}

	async function maxBuyListener(clickEvent: any | null = null) {
		if (!mobile) {
			if (!clickEvent || !clickEvent.target.closest("[class*='controlPanelButton___']")) return;
			requireElement("[class*='buyMenu__']").then(() => addButtonAndListener(document.find("[class*='buyMenu__']")));
		} else {
			await requireElement(".ReactVirtualized__Grid__innerScrollContainer [class*='buyForm___']");
			findAllElements(".ReactVirtualized__Grid__innerScrollContainer [class*='itemDescription__']:not(.tt-fill-max)").forEach((buyForm) => {
				buyForm.classList.add("tt-fill-max");
				addButtonAndListener(buyForm);
			});
		}

		function addButtonAndListener(parent: Element) {
			const fillMax = elementBuilder({ type: "span", text: "fill max", class: "tt-max-buy" });
			const buyButton = parent.find("[class*='buy_']");
			buyButton.classList.add("tt-buy");
			buyButton.parentElement.appendChild(fillMax);
			fillMax.addEventListener("click", (event) => {
				event.stopPropagation();
				let max = mobile
					? parseInt(parent.find("[class*='amount__']").firstElementChild.textContent)
					: parseInt(parent.find("[class*='amount__']").childNodes[1].textContent);
				if (!settings.pages.bazaar.maxBuyIgnoreCash) {
					const price = parseInt(parent.find("[class*='price_']").textContent.replace(/[,$]/g, ""));
					const money = parseInt(document.find("#user-money").dataset.money);
					if (Math.floor(money / price) < max) max = Math.floor(money / price);
				}
				if (max > 10000) max = 10000;

				parent.find<HTMLInputElement>("[class*='buyAmountInput_']").value = max.toString();
				parent.find("[class*='buyAmountInput_']").dispatchEvent(new Event("input", { bubbles: true }));
			});
		}
	}
})();
