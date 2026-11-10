import { beforeEach, describe, expect, it, mock } from "bun:test";

const state: { stored?: any; response?: any; selections?: string[] } = {};

mock.module("@common/utils/data/database", () => ({
	torndata: undefined,
	setTorndata(value: any) {
		state.stored = value;
	},
}));

mock.module("@common/utils/context", () => ({
	ttStorage: { set: () => Promise.resolve()},
}));

mock.module("@common/utils/functions/api-fetcher", () => ({
	fetchData: async (_location: string, options: { selections: string[] }) => {
		state.selections = options.selections;
		return state.response;
	},
}));

import { getTorndataUpdateMode, updateTorndata } from "./torndata";

const STATS = { currency: { points_average_cost: 1234 } };
const FRESH_STATS = { currency: { points_average_cost: 5678 } };

const BLACKOUT = new Date("2026-01-01T00:10:00Z");
const AFTER_BLACKOUT = new Date("2026-01-01T12:00:00Z");
const YESTERDAY = Date.parse("2025-12-31T12:00:00Z");

function previous(overrides: any = {}) {
	return {
		date: Date.parse("2026-01-01T00:10:00Z"),
		stats: STATS,
		statsStale: false,
		items: [{ id: 1 }],
		itemsMap: { 1: { id: 1 } },
		education: { courses: [1] },
		...overrides,
	} as any;
}

describe("getTorndataUpdateMode", () => {
	it("should update without stats during the blackout when there is no torndata yet", () => {
		expect(getTorndataUpdateMode(undefined, BLACKOUT)).toBe("partial");
	});

	it("should not update again during the blackout once the bundle is fetched", () => {
		expect(getTorndataUpdateMode(previous({ statsStale: true }), BLACKOUT)).toBe("none");
		expect(getTorndataUpdateMode(previous(), BLACKOUT)).toBe("none");
	});

	it("should only update the stats after the blackout when they are still stale", () => {
		expect(getTorndataUpdateMode(previous({ statsStale: true }), AFTER_BLACKOUT)).toBe("stats-only");
		expect(getTorndataUpdateMode(previous(), AFTER_BLACKOUT)).toBe("none");
	});

	it("should do a single full update after the blackout on a new torn day", () => {
		expect(getTorndataUpdateMode(previous({ date: YESTERDAY }), AFTER_BLACKOUT)).toBe("full");
	});
});

describe("updateTorndata", () => {
	beforeEach(() => {
		state.stored = undefined;
		state.response = undefined;
		state.selections = undefined;
	});

	it("should skip the stats and use fallback stats during the blackout without prior stats", async () => {
		state.response = { items: [{ id: 1 }], education: { courses: [1] } };

		expect(await updateTorndata(false, undefined, BLACKOUT)).toBe("partial");

		expect(state.selections).toEqual(["education", "calendar", "properties", "honors", "medals", "items"]);
		expect(state.stored.stats.currency.points_average_cost).toBe(30_000);
		expect(state.stored.stats.users.total).toBe(-1);
		expect(state.stored.statsStale).toBe(true);
		expect(state.stored.items).toEqual([{ id: 1 }]);
		expect(state.stored.date).toBeGreaterThan(Date.parse("2026-01-01T00:10:00Z"));
	});

	it("should keep the prior stats during the blackout", async () => {
		state.response = { items: [{ id: 2 }] };

		await updateTorndata(false, previous({ date: YESTERDAY }), BLACKOUT);

		expect(state.stored.stats).toEqual(STATS);
		expect(state.stored.statsStale).toBe(true);
		expect(state.stored.items).toEqual([{ id: 2 }]);
		expect(state.stored.itemsMap).toEqual({ 2: { id: 2 } });
	});

	it("should only request the stats after the blackout and merge them", async () => {
		state.response = { stats: FRESH_STATS };

		expect(await updateTorndata(false, previous({ statsStale: true }), AFTER_BLACKOUT)).toBe("stats-only");

		expect(state.selections).toEqual(["stats"]);
		expect(state.stored.stats).toEqual(FRESH_STATS);
		expect(state.stored.statsStale).toBe(false);
		expect(state.stored.education).toEqual({ courses: [1] });
		expect(state.stored.items).toEqual([{ id: 1 }]);
	});

	it("should request everything in a single call on a new torn day", async () => {
		state.response = { items: [{ id: 3 }], stats: FRESH_STATS };

		expect(await updateTorndata(false, previous({ date: YESTERDAY }), AFTER_BLACKOUT)).toBe("full");

		expect(state.selections).toEqual(["education", "calendar", "properties", "honors", "medals", "items", "stats"]);
		expect(state.stored.stats).toEqual(FRESH_STATS);
		expect(state.stored.statsStale).toBe(false);
	});

	it("should keep prior stats and retry when a response has unusable stats", async () => {
		state.response = { items: [{ id: 4 }], stats: { currency: { points_average_cost: 0 } } };

		await updateTorndata(false, previous({ date: YESTERDAY }), BLACKOUT);

		expect(state.stored.stats).toEqual(STATS);
		expect(state.stored.statsStale).toBe(true);
	});

	it("should do a full update when forced", async () => {
		state.response = { items: [{ id: 5 }], stats: FRESH_STATS };

		expect(await updateTorndata(true, previous(), AFTER_BLACKOUT)).toBe("full");
		expect(state.selections).toContain("stats");
	});

	it("should not call the API when nothing is due", async () => {
		expect(await updateTorndata(false, previous(), AFTER_BLACKOUT)).toBe("none");
		expect(state.selections).toBeUndefined();
	});
});
