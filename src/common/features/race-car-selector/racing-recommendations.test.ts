import { describe, expect, it } from "bun:test";
import { TRACKS } from "@common/pages/racing-page.ts";
import { getGuideSetup, getRecommendation } from "./racing-recommendations";

describe("race recommendations", () => {
	it("has a recommendation for every track", () => {
		for (const track of TRACKS) expect(getRecommendation(track.name)).toBeDefined();
	});

	it("parses a gearbox and turbo stage out of every guide setup", () => {
		for (const track of TRACKS) {
			const setup = getGuideSetup(track.name);
			expect(["long ratio", "short ratio"]).toContain(setup.gearbox);
			expect(setup.turbo).toMatch(/^t[1-5]$/);
			expect(["dirt", "tarmac"]).toContain(setup.surface);
		}
	});

	it("diffs a dirt track from a tarmac track with the same car, gearbox and turbo", () => {
		expect(getRecommendation("Hammerhead")).toMatchObject({ car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2", surface: "dirt" });
		expect(getRecommendation("Underdog")).toMatchObject({ car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2", surface: "tarmac" });
	});
});
