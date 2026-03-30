(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Stocks Money Input",
		"stocks",
		() => settings.pages.stocks.moneyInput,
		null,
		addMoneyInputListeners,
		removeMoneyInputListeners,
		{
			storage: ["settings.pages.stocks.moneyInput"],
		},
		null
	);

	async function addMoneyInputs(e: { target: EventTarget }) {
		if (!isHTMLElement(e.target)) return;

		const stockOwnedElement = e.target.closest("li[class*='stockOwned__']");
		if (!stockOwnedElement) return;

		for (const blockType of ["[class*='buyBlock__']", "[class*='sellBlock__']"]) {
			const moneyInputElement = elementBuilder({
				type: "div",
				class: "tt-money-input",
				children: [
					elementBuilder({ type: "span", text: "TornTools money input:" }),
					elementBuilder({
						type: "input",
						events: {
							input: (e: Event) => {
								if (!isHTMLElement(e.target)) return;

								const input = (e.target as HTMLInputElement).value;
								let money;
								if (input.endsWith("k") || input.endsWith("K")) {
									money = parseFloat(input.substring(0, input.length)) * 1000;
								} else if (input.endsWith("m") || input.endsWith("M")) {
									money = parseFloat(input.substring(0, input.length)) * 1000 * 1000;
								} else if (input.endsWith("b") || input.endsWith("B")) {
									money = parseFloat(input.substring(0, input.length)) * 1000 * 1000 * 1000;
								} else {
									money = parseFloat(input);
								}
								if (isNaN(money)) return;

								const stockRow = document.querySelector("[class*='stockOwned__'][class*='active__']")?.parentElement;
								if (!stockRow) return;

								const stockPrice = parseFloat(stockRow.querySelector("li[class*='stockPrice__'] [class*='price__']").textContent);
								const quantityToPurchase = Math.ceil(money / stockPrice);
								if (quantityToPurchase <= 0) return;

								const stockBuyInput = document.querySelector(
									"[class*='stockDropdown__'] " + blockType + " input.input-money:not([type='hidden'])"
								) as HTMLInputElement;
								updateReactInput(stockBuyInput, quantityToPurchase.toString());
							},
						},
					}),
				],
			});

			(await requireElement("[class*='stockDropdown__'] " + blockType + " [class*='manageBlock__']")).appendChild(moneyInputElement);
		}
	}

	async function addMoneyInputListeners() {
		await requireElement("[class*='stockMarket__'] ul[class*='stock__'] li[class*='stockOwned__']");
		const stockMarketRoot = document.querySelector("[class*='stockMarket__']");
		stockMarketRoot.addEventListener("click", addMoneyInputs);

		if (location.href.includes("&tab=owned")) addMoneyInputs({ target: findAllElements("li[class*='stockOwned__'][class*='active__']")[0] });

		document.body.classList.add("tt-stock-money-input");
	}

	async function removeMoneyInputListeners() {
		const stockMarketRoot = await requireElement("[class*='stockMarket__']");
		stockMarketRoot?.removeEventListener("click", addMoneyInputs);
		findAllElements(".tt-money-input").forEach((x) => x.remove());
		document.body.classList.remove("tt-stock-money-input");
	}
})();
