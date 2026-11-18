import { describe, expect, test } from "bun:test";
import type { ItemValues, OwnedItem } from "./category-value-calculation";
import { calculateCategoryValues } from "./category-value-calculation";

const values: Record<number, ItemValues> = {
	1: { image: "one.png", marketValue: 100, sellPrice: 50 },
	2: { image: "two.png", marketValue: 100, sellPrice: 250 },
	3: { image: "three.png", marketValue: 0, sellPrice: 0 },
};

function resolve(id: number) {
	return values[id] ?? null;
}

function item(id: number, amount: number, name = `Item ${id}`): OwnedItem {
	return { id, name, amount };
}

describe("calculateCategoryValues", () => {
	test("combo mode takes the highest of market and sell value", () => {
		const result = calculateCategoryValues([item(1, 1), item(2, 1)], resolve, "combo");

		expect(result.rows.map((row) => row.price)).toEqual([100, 250]);
		expect(result.rows.map((row) => row.source)).toEqual(["market", "sell"]);
	});

	test("market and sell modes only use their own value", () => {
		expect(calculateCategoryValues([item(1, 1), item(2, 1)], resolve, "market").rows.map((row) => row.price)).toEqual([100, 100]);
		expect(calculateCategoryValues([item(1, 1), item(2, 1)], resolve, "sell").rows.map((row) => row.price)).toEqual([50, 250]);
	});

	test("items without a usable price are reported as unpriced", () => {
		const result = calculateCategoryValues([item(1, 1), item(3, 2)], resolve, "combo");

		expect(result.unpriced).toEqual(["Item 3"]);
		expect(result.rows.find((row) => row.id === 3)).toMatchObject({ price: 0, source: null, total: 0 });
	});

	test("items missing from the item data are reported as unpriced", () => {
		const result = calculateCategoryValues([item(404, 1, "Unknown")], resolve, "market");

		expect(result.unpriced).toEqual(["Unknown"]);
		expect(result.totalValue).toBe(0);
	});

	test("quantities are summed per item and used for the totals", () => {
		const result = calculateCategoryValues([item(1, 2), item(1, 3), item(2, 1)], resolve, "combo");

		expect(result.rows).toHaveLength(2);
		expect(result.rows[0]).toMatchObject({ quantity: 5, total: 500 });
		expect(result.totalQuantity).toBe(6);
		expect(result.totalValue).toBe(750);
	});

	test("rows are sorted by name", () => {
		const result = calculateCategoryValues([item(2, 1, "Bravo"), item(1, 1, "Alpha")], resolve, "combo");

		expect(result.rows.map((row) => row.name)).toEqual(["Alpha", "Bravo"]);
	});
});
