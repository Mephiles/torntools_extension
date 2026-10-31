import { describe, expect, it } from "bun:test";
import { getBuild, getMarkTier, hidesMark, PICKPOCKETING_BUILDS, PICKPOCKETING_TIERS } from "./filter-rules";
import type { PickpocketingSelection } from "./filter-rules";

const noSelection: PickpocketingSelection = { tiers: [], builds: [] };

function selection(tiers: string[], builds: string[] = []): PickpocketingSelection {
	return { tiers, builds };
}

describe("getMarkTier", () => {
	it("maps marks to their tier regardless of case and surrounding whitespace", () => {
		expect(getMarkTier("Homeless person")).toBe("safe");
		expect(getMarkTier("  police OFFICER ")).toBe("very-dangerous");
		expect(getMarkTier("Mobster")).toBe("risky");
	});

	it("returns null for marks it does not know", () => {
		expect(getMarkTier("Courier")).toBeNull();
		expect(getMarkTier("")).toBeNull();
		expect(getMarkTier(undefined)).toBeNull();
	});
});

describe("getBuild", () => {
	it("takes the first word of the physical props", () => {
		expect(getBuild(`Average 5'4" 171 lbs`)).toBe("average");
		expect(getBuild(`Skinny 5'11" 140 lbs`)).toBe("skinny");
		expect(getBuild("  Athletics  5'5\"  162 lbs ")).toBe("athletics");
	});

	it("returns null when there are no physical props rendered", () => {
		expect(getBuild(undefined)).toBeNull();
		expect(getBuild("")).toBeNull();
		expect(getBuild("   ")).toBeNull();
	});
});

describe("hidesMark", () => {
	it("hides nothing when nothing is selected", () => {
		expect(hidesMark("Police Officer", `Average 5'4" 171 lbs`, noSelection)).toBe(false);
		expect(hidesMark("Junkie", `Skinny 5'4" 171 lbs`, noSelection)).toBe(false);
	});

	it("hides the marks outside a single selected tier", () => {
		expect(hidesMark("Junkie", undefined, selection(["safe"]))).toBe(false);
		expect(hidesMark("Laborer", undefined, selection(["safe"]))).toBe(true);
		expect(hidesMark("Police Officer", undefined, selection(["safe"]))).toBe(true);
	});

	it("hides the marks outside several selected tiers", () => {
		const tiers = ["safe", "risky"];
		expect(hidesMark("Drunk woman", undefined, selection(tiers))).toBe(false);
		expect(hidesMark("Jogger", undefined, selection(tiers))).toBe(false);
		expect(hidesMark("Thug", undefined, selection(tiers))).toBe(true);
		expect(hidesMark("Cyclist", undefined, selection(tiers))).toBe(true);
	});

	it("keeps every mark when all tiers are selected", () => {
		for (const mark of ["Drunk man", "Postal Worker", "Thug", "Mobster", "Cyclist", "Police Officer"]) {
			expect(hidesMark(mark, undefined, selection([...PICKPOCKETING_TIERS]))).toBe(false);
		}
	});

	it("never hides a mark it does not know", () => {
		expect(hidesMark("Courier", undefined, selection(["safe"]))).toBe(false);
		expect(hidesMark("", undefined, selection(["safe"]))).toBe(false);
	});

	it("hides marks whose build is not selected", () => {
		const skinnyOnly = selection([], ["skinny"]);
		expect(hidesMark("Junkie", `Skinny 5'4" 171 lbs`, skinnyOnly)).toBe(false);
		expect(hidesMark("Junkie", `Muscular 5'4" 171 lbs`, skinnyOnly)).toBe(true);

		const skinnyOrHeavyset = selection([], ["skinny", "heavyset"]);
		expect(hidesMark("Junkie", `SKINNY 5'4" 171 lbs`, skinnyOrHeavyset)).toBe(false);
		expect(hidesMark("Junkie", `Heavyset 5'4" 171 lbs`, skinnyOrHeavyset)).toBe(false);
		expect(hidesMark("Junkie", `Average 5'4" 171 lbs`, skinnyOrHeavyset)).toBe(true);
	});

	it("keeps every mark when all builds are selected", () => {
		for (const build of ["Skinny", "Average", "Athletic", "Muscular", "Heavyset"]) {
			expect(hidesMark("Junkie", `${build} 5'4" 171 lbs`, selection([], [...PICKPOCKETING_BUILDS]))).toBe(false);
		}
	});

	it("never hides a mark without a rendered build, even with builds selected", () => {
		expect(hidesMark("Junkie", undefined, selection([], ["skinny"]))).toBe(false);
		expect(hidesMark("Junkie", "  ", selection([], ["skinny"]))).toBe(false);
	});

	it("requires both conditions when a tier and builds are selected", () => {
		const both = selection(["safe"], ["skinny"]);
		expect(hidesMark("Junkie", `Skinny 5'4" 171 lbs`, both)).toBe(false);
		expect(hidesMark("Junkie", `Average 5'4" 171 lbs`, both)).toBe(true);
		expect(hidesMark("Police Officer", `Skinny 5'4" 171 lbs`, both)).toBe(true);
	});
});
