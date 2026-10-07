import { describe, expect, it } from "bun:test";
import { PREFERENCE_SEARCH_DATA, getPreferenceSearchKeywords, preferenceSearchFilter } from "./preference-search-data";

function search(query: string) {
	return PREFERENCE_SEARCH_DATA.map((item) => ({
		item,
		score: preferenceSearchFilter(item.path, query, getPreferenceSearchKeywords(item)),
	}))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);
}

function labels(query: string): string[] {
	return search(query).map((item) => item.label);
}

function sortedLabels(query: string): string[] {
	return labels(query).sort((a, b) => a.localeCompare(b));
}

describe("getPreferenceSearchKeywords", () => {
	it("includes the label, explicit keywords and the section title", () => {
		const item = PREFERENCE_SEARCH_DATA.find((preference) => preference.path === "settings.themes.pages")!;

		const keywords = getPreferenceSearchKeywords(item);

		expect(keywords).toContain("Page Theme");
		expect(keywords).toContain("dark");
		expect(keywords).toContain("light");
	});

	it("does not include the storage path", () => {
		const item = PREFERENCE_SEARCH_DATA.find((preference) => preference.path === "settings.themes.pages")!;

		expect(getPreferenceSearchKeywords(item)).not.toContain("settings.themes.pages");
	});

	it("does not include the section title", () => {
		const item = PREFERENCE_SEARCH_DATA.find((preference) => preference.path === "settings.themes.pages")!;

		expect(getPreferenceSearchKeywords(item)).not.toContain("Internal");
	});
});

describe("preferenceSearchFilter", () => {
	it("shows every item when the query is empty", () => {
		expect(preferenceSearchFilter("settings.themes.pages", "", ["Page Theme"])).toBe(1);
		expect(preferenceSearchFilter("settings.themes.pages", "   ", ["Page Theme"])).toBe(1);
	});

	it("matches nothing when there are no keywords", () => {
		expect(preferenceSearchFilter("settings.themes.pages", "dark", [])).toBe(0);
		expect(preferenceSearchFilter("settings.themes.pages", "dark", undefined)).toBe(0);
	});

	it("scores an exact match highest", () => {
		expect(preferenceSearchFilter("settings.pages.bank", "bank", ["Bank"])).toBe(1);
	});

	it("does not fuzzy match out-of-order characters", () => {
		expect(preferenceSearchFilter("settings.pages.icon.energy", "nrg", ["Icon bars: Energy"])).toBe(0);
	});

	it("requires every term to match (AND semantics)", () => {
		expect(preferenceSearchFilter("", "energy refill", ["Notification: Energy"])).toBe(0);
		expect(preferenceSearchFilter("", "energy refill", ["Notification: Energy refill"])).toBeGreaterThan(0);
	});

	it("is case insensitive", () => {
		expect(preferenceSearchFilter("", "ENERGY", ["Energy drink gains"])).toBe(preferenceSearchFilter("", "energy", ["Energy drink gains"]));
	});

	it("matches word prefixes", () => {
		expect(preferenceSearchFilter("", "notif", ["Notification: Events"])).toBeGreaterThan(0);
	});

	it("matches singular and plural forms", () => {
		expect(preferenceSearchFilter("", "themes", ["Page Theme"])).toBeGreaterThan(0);
		expect(preferenceSearchFilter("", "theme", ["Page Themes"])).toBeGreaterThan(0);
	});

	it("matches separator-insensitive substrings", () => {
		expect(preferenceSearchFilter("", "highlow", ["Enable the high-low helper"])).toBeGreaterThan(0);
	});
});

describe("preference search integration", () => {
	it("finds theme preferences by keyword", () => {
		expect(sortedLabels("dark")).toEqual(["Container Theme", "Page Theme"]);
	});

	it("does not search the storage path", () => {
		expect(labels("settings")).toEqual(["TT settings link"]);
	});

	it("returns no matches for a non-matching query", () => {
		expect(labels("nrg")).toEqual([]);
	});

	it("keeps multi-term searches precise", () => {
		const results = labels("energy refill");

		expect(results).toContain("Notification: Energy refill");
		expect(results).toContain("Reminders: Energy Refill");
		expect(results).not.toContain("Notification: Energy");
	});

	it("is case insensitive over the full data set", () => {
		expect(sortedLabels("ENERGY")).toEqual(sortedLabels("energy"));
	});

	it("does not return short-query substring noise", () => {
		expect(labels("oc")).not.toContain("Display acronyms beside stock names");
	});

	it("excludes unrelated results", () => {
		const results = labels("energy");

		expect(results).toContain("Icon bars: Energy");
		expect(results).not.toContain("Highlight yourself in war reports");
	});
});
