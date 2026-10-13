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
		}
	});
});
