import { describe, expect, it } from "bun:test";
import { ttCache } from "./cache";

describe("TTCache", () => {
	it("preserves pending changes when syncing an external cache", () => {
		ttCache.cache = {};
		ttCache.set({ local: "value" }, 1000);

		ttCache.syncCache({ remote: { value: "other", indefinite: true } });

		expect(ttCache.get<string>("local")).toBe("value");
		expect(ttCache.get<string>("remote")).toBe("other");
		ttCache.cache = {};
	});
});
