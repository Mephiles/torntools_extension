(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature("Museum Auto Fill", "museum", () => settings.pages.museum.autoFill, addListener, autoFill, null, {
		storage: ["settings.pages.museum.autoFill"],
	});

	function addListener() {
		document.addEventListener("click", (event) => {
			if (feature.enabled() && isElement(event.target) && event.target.closest(".museum-map > .pinpoint, .museum #tabs .boxes > .box")) autoFill();
		});
	}

	async function autoFill() {
		await requireElement("[aria-hidden*='false'] .item-amount.qty");

		const quantities = [];
		findAllElements("[aria-hidden*='false'] .item-amount.qty").forEach((qty) => quantities.push(convertToNumber(qty.textContent) || 0));
		const leastQuantity = !quantities.includes(0) ? quantities.sort((a, b) => a - b)[0] : false;
		if (leastQuantity !== false) {
			const input = document.find<HTMLInputElement>("[aria-hidden*='false'] .set-description input[type*='tel']");
			if (!input.disabled) {
				input.value = leastQuantity;
				input.dispatchEvent(new Event("keyup"));
			}
		}
	}
})();
