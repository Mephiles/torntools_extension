import { describe, expect, it } from "bun:test";
import { buildGymTitleHTML, parseGymTitleLabel } from "./gym-title-label";

describe("parseGymTitleLabel", () => {
	it("parses the canonical label", () => {
		expect(parseGymTitleLabel("Frontline Fitness. Membership cost - $50,000,000. Energy usage - 25 per train.")).toEqual({
			name: "Frontline Fitness",
			lines: ["Membership cost - $50,000,000", "Energy usage - 25 per train"],
		});
	});

	it("keeps a period inside the name", () => {
		expect(parseGymTitleLabel("Mr. Isoyamas. Membership cost - $500,000. Energy usage - 5 per train.")).toEqual({
			name: "Mr. Isoyamas",
			lines: ["Membership cost - $500,000", "Energy usage - 5 per train"],
		});
	});

	it("keeps the specialist marker in the name", () => {
		expect(parseGymTitleLabel("Balboas Gym (Specialist). Membership cost - $1,000,000. Energy usage - 10 per train.")).toEqual({
			name: "Balboas Gym (Specialist)",
			lines: ["Membership cost - $1,000,000", "Energy usage - 10 per train"],
		});
	});

	it("returns only the cost line when there is no energy usage", () => {
		expect(parseGymTitleLabel("Frontline Fitness. Membership cost - $50,000,000.")).toEqual({
			name: "Frontline Fitness",
			lines: ["Membership cost - $50,000,000"],
		});
	});

	it("returns only the energy line when there is no cost", () => {
		expect(parseGymTitleLabel("Frontline Fitness. Energy usage - 25 per train.")).toEqual({
			name: "Frontline Fitness",
			lines: ["Energy usage - 25 per train"],
		});
	});

	it("returns no lines for a name-only label", () => {
		expect(parseGymTitleLabel("Frontline Fitness.")).toEqual({ name: "Frontline Fitness", lines: [] });
	});

	it("parses a label without trailing periods", () => {
		expect(parseGymTitleLabel("Frontline Fitness Membership cost - $50,000,000 Energy usage - 25 per train")).toEqual({
			name: "Frontline Fitness",
			lines: ["Membership cost - $50,000,000", "Energy usage - 25 per train"],
		});
	});

	it("normalises irregular whitespace", () => {
		expect(parseGymTitleLabel("  Frontline \n Fitness.\tMembership   cost  -  $50,000,000.   Energy usage - 25 per train. ")).toEqual({
			name: "Frontline Fitness",
			lines: ["Membership cost - $50,000,000", "Energy usage - 25 per train"],
		});
	});

	it("finds the name after a detail fragment", () => {
		expect(parseGymTitleLabel("Membership cost - $50,000,000. Frontline Fitness. Energy usage - 25 per train.")).toEqual({
			name: "Frontline Fitness",
			lines: ["Membership cost - $50,000,000", "Energy usage - 25 per train"],
		});
	});

	it("accepts a colon between the keyword and the value", () => {
		expect(parseGymTitleLabel("Frontline Fitness. Membership cost: $50,000,000. Energy usage: 25 per train.")).toEqual({
			name: "Frontline Fitness",
			lines: ["Membership cost: $50,000,000", "Energy usage: 25 per train"],
		});
	});

	it("keeps the label order of the detail lines", () => {
		expect(parseGymTitleLabel("Frontline Fitness. Energy usage - 25 per train. Membership cost - $50,000,000.")).toEqual({
			name: "Frontline Fitness",
			lines: ["Energy usage - 25 per train", "Membership cost - $50,000,000"],
		});
	});

	it("returns null for an empty label", () => {
		expect(parseGymTitleLabel("")).toBeNull();
	});

	it("returns null for a whitespace-only label", () => {
		expect(parseGymTitleLabel("  \n\t ")).toBeNull();
	});

	it("returns null when there is no name", () => {
		expect(parseGymTitleLabel("Membership cost - $50,000,000. Energy usage - 25 per train.")).toBeNull();
	});
});

describe("buildGymTitleHTML", () => {
	const classes = { tooltip: "tt-gym-tooltip", name: "tt-gym-name", info: "tt-gym-info" };

	it("wraps the name and detail lines in the tooltip classes", () => {
		expect(buildGymTitleHTML({ name: "Average Gym", lines: ["Membership cost - $50,000,000", "Energy usage - 25 per train"] }, classes)).toBe(
			'<div class="tt-gym-tooltip"><div class="tt-gym-name">Average Gym</div><div class="tt-gym-info"><p>Membership cost - $50,000,000</p><p>Energy usage - 25 per train</p></div></div>',
		);
	});

	it("renders no info block when there are no detail lines", () => {
		expect(buildGymTitleHTML({ name: "Average Gym", lines: [] }, classes)).toBe(
			'<div class="tt-gym-tooltip"><div class="tt-gym-name">Average Gym</div></div>',
		);
	});

	it("escapes HTML characters in the name and the detail lines", () => {
		expect(buildGymTitleHTML({ name: "A & B <Gym>", lines: ["Membership cost - <$5>"] }, classes)).toBe(
			'<div class="tt-gym-tooltip"><div class="tt-gym-name">A &amp; B &lt;Gym&gt;</div><div class="tt-gym-info"><p>Membership cost - &lt;$5&gt;</p></div></div>',
		);
	});
});
