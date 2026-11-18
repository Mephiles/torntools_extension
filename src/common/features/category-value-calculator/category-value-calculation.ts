export type PriceMode = "combo" | "market" | "sell";

export interface OwnedItem {
	id: number;
	name: string;
	amount: number;
}

export interface ItemValues {
	image: string;
	marketValue: number | null;
	sellPrice: number | null;
}

export type ItemValueResolver = (id: number) => ItemValues | null;

export interface ValueRow {
	id: number;
	name: string;
	image: string;
	quantity: number;
	price: number;
	source: "market" | "sell" | null;
	total: number;
}

export interface ValueResult {
	rows: ValueRow[];
	unpriced: string[];
	totalQuantity: number;
	totalValue: number;
}

function hasValue(value: number | null | undefined): value is number {
	return typeof value === "number" && value > 0;
}

function resolvePrice(values: ItemValues, mode: PriceMode): { price: number; source: "market" | "sell" | null } {
	const market = hasValue(values.marketValue) ? values.marketValue : null;
	const sell = hasValue(values.sellPrice) ? values.sellPrice : null;

	if (mode === "market") return market ? { price: market, source: "market" } : { price: 0, source: null };
	if (mode === "sell") return sell ? { price: sell, source: "sell" } : { price: 0, source: null };

	if (market && sell) return market >= sell ? { price: market, source: "market" } : { price: sell, source: "sell" };
	if (market) return { price: market, source: "market" };
	if (sell) return { price: sell, source: "sell" };

	return { price: 0, source: null };
}

export function calculateCategoryValues(items: OwnedItem[], resolve: ItemValueResolver, mode: PriceMode): ValueResult {
	const quantities = new Map<number, OwnedItem>();
	for (const item of items) {
		const existing = quantities.get(item.id);

		if (existing) existing.amount += item.amount;
		else quantities.set(item.id, { ...item });
	}

	const rows: ValueRow[] = [];
	const unpriced: string[] = [];

	for (const item of quantities.values()) {
		const values = resolve(item.id);
		const { price, source } = values ? resolvePrice(values, mode) : { price: 0, source: null };

		if (!source) unpriced.push(item.name);

		rows.push({
			id: item.id,
			name: item.name,
			image: values?.image ?? "",
			quantity: item.amount,
			price,
			source,
			total: price * item.amount,
		});
	}

	rows.sort((a, b) => a.name.localeCompare(b.name));
	unpriced.sort((a, b) => a.localeCompare(b));

	return {
		rows,
		unpriced,
		totalQuantity: rows.reduce((total, row) => total + row.quantity, 0),
		totalValue: rows.reduce((total, row) => total + row.total, 0),
	};
}
