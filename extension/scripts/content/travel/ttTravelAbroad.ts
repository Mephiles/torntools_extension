(async () => {
	if (!isAbroad()) return;

	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		if (sid !== "travelData") return;

		const step = params.get("step");
		if (step !== "shop") return;

		const items = (json.stock as any[]).map<SyncItem>((s) => ({ id: s.ID, quantity: s.stock, cost: s.price }));
		const country: string = json.country;

		triggerCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD, { country, items } satisfies TravelAbroadShopLoadDetails);
	});
})();

interface AbroadItem {
	id: number;
	quantity: number;
	cost: number;
}

interface TravelAbroadShopLoadDetails {
	items: AbroadItem[];
	country: string;
}

function markTravelTableColumns() {
	document.findAll("[class*='stockHeader___'] > *:not([tt-content-type])").forEach((header) => {
		let contentType: string;
		if (header.textContent === "Item") contentType = "item";
		else if (header.textContent === "Name") contentType = "name";
		else if (header.textContent === "Type") contentType = "type";
		else if (header.textContent === "Cost") contentType = "cost";
		else if (header.textContent === "Stock") contentType = "stock";
		else if (header.textContent === "Amount") contentType = "amount";
		else if (header.textContent === "Buy") contentType = "buy";
		else return;

		header.dataset.ttContentType = contentType;
	});
	requireElement("[class*='stockTableWrapper___'] [class*='row___'] > *:not([tt-content-type])").then(() => {
		document.findAll("[class*='stockTableWrapper___'] [class*='row___'] > *:not([tt-content-type])").forEach((row) => {
			let contentType: string;
			if (row.className.includes("imageCell___")) contentType = "item";
			else if (row.className.includes("itemName___")) contentType = "name";
			else if (row.textContent.startsWith("type")) contentType = "type";
			else if (row.textContent.startsWith("cost")) contentType = "cost";
			else if (row.textContent.startsWith("stock")) contentType = "stock";
			else if (row.tagName === "FORM") contentType = "amount";
			else if (row.className.includes("buyCell___")) contentType = "buy";
			else return;

			row.dataset.ttContentType = contentType;
		});
	});
}
