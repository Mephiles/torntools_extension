import { describe, expect, it } from "bun:test";
import { calculateOC } from "@extension/entrypoints/background/updates-helper";
import type { FactionV1Crimes } from "@utils/functions/api-v1.types";

describe("updates", () => {
	describe("calculateOC", () => {
		const MOCK_CRIMES: FactionV1Crimes = {
			"1": {
				crime_id: 8,
				crime_name: "Political Assassination",
				initiated: 1,
				initiated_by: 2552575,
				money_gain: 100000000,
				participants: [
					{
						"1": null,
					},
					{
						"2": null,
					},
					{
						"3": null,
					},
					{
						"2114440": null,
					},
				],
				planned_by: 2534927,
				respect_gain: 222,
				success: 1,
				time_completed: 1775634154,
				time_left: 0,
				time_ready: 1775633772,
				time_started: 1774942572,
			},
			"2": {
				crime_id: 8,
				crime_name: "Political Assassination",
				initiated: 0,
				initiated_by: 0,
				money_gain: 0,
				participants: [
					{
						"1": {
							color: "green",
							description: "Okay",
							details: "",
							state: "Okay",
							until: 0,
						},
					},
					{
						"2": {
							color: "green",
							description: "Okay",
							details: "",
							state: "Okay",
							until: 0,
						},
					},
					{
						"3": {
							color: "green",
							description: "Okay",
							details: "",
							state: "Okay",
							until: 0,
						},
					},
					{
						"2114440": {
							color: "green",
							description: "Okay",
							details: "",
							state: "Okay",
							until: 0,
						},
					},
				],
				planned_by: 2320794,
				respect_gain: 0,
				success: 0,
				time_completed: 0,
				time_left: 672708,
				time_ready: 1778336029,
				time_started: 1777644829,
			},
		};

		it("should find oc", () => {
			expect(calculateOC(MOCK_CRIMES, 2114440)).toBe(1778336029000);
		});
		it("should not find oc", () => {
			expect(calculateOC(MOCK_CRIMES, 2114441)).toBe(-1);
		});
	});
});
