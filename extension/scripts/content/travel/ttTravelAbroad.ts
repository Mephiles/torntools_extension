interface InternalTornTravelDataShop {
	country: string;
	money: number;
	shops?: {
		name: string;
		stock: {
			ID: number;
			name: string;
			type2: string;
			price: number;
			stock: number;
		}[];
	}[];
	stock?: { ID: number; name: string; type2: string; price: number; stock: number }[];
	travelDuration: number;
}

(async () => {
	if (!isAbroad()) return;

	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		if (sid !== "travelData") return;

		const step = params.get("step");
		if (step !== "shop") return;

		const data = json as InternalTornTravelDataShop;

		let items: SyncItem[];
		if ("shops" in data) {
			items = data.shops
				.flatMap((shop) => shop.stock)
				.map((s) => ({
					id: s.ID,
					quantity: s.stock,
					cost: s.price,
				}));
		} else if ("stock" in data) {
			items = data.stock.map<SyncItem>((s) => ({ id: s.ID, quantity: s.stock, cost: s.price }));
		} else {
			throw new Error("Unexpected abroad travel data response!");
		}

		const country: string = json.country;

		triggerCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD, {
			country,
			items,
		});
	});
	document.addEventListener("click", (event) => {
		if (isElement(event.target) && event.target.className?.includes("yesNoButton")) {
			triggerCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH);
		}
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
	document.findAll("[class*='itemsHeader___'] > *:not([data-tt-content-type])").forEach((header) => {
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
	requireElement("[class*='stockTableWrapper___'] [class*='row___']").then(() => {
		document.findAll("[class*='stockTableWrapper___'] [class*='row___'] > *:not([data-tt-content-type])").forEach((row) => {
			let contentType: string;
			if (row.className.includes("imageCell___")) contentType = "item";
			else if (row.className.includes("itemName___")) contentType = "name";
			else if (row.textContent.startsWith("type")) contentType = "type";
			else if (row.textContent.startsWith("cost") || row.textContent.startsWith("$")) contentType = "cost";
			else if (row.textContent.startsWith("stock")) contentType = "stock";
			else if (row.tagName === "FORM") contentType = "amount";
			else if (row.className.includes("buyCell___")) contentType = "buy";
			else return;

			row.dataset.ttContentType = contentType;
		});
	});
}
