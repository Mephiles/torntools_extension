import { describe, expect, it } from "bun:test";
import { CONTRIBUTOR_COLORS } from "@common/utils/team";
import { buildContributors, toDisplayableChangelogEntry } from "@extension/utils/changelog";
import type { ChangelogEntry } from "@extension/utils/changelog";

describe("buildContributors", () => {
	it("keeps the fixed color for core contributors", () => {
		const contributors = buildContributors(["Mephiles", "DeKleineKobini"]);

		expect(contributors).toEqual([
			{ key: "Mephiles", id: 2087524, name: "Mephiles", color: "green" },
			{ key: "DeKleineKobini", id: 2114440, name: "DeKleineKobini", color: "orange" },
		]);
	});

	it("assigns palette colors to non-core contributors in order of appearance", () => {
		const contributors = buildContributors(["Callz", "xhang98", "Weav3r"]);

		expect(contributors.map((contributor) => contributor.color)).toEqual([CONTRIBUTOR_COLORS[0], CONTRIBUTOR_COLORS[1], CONTRIBUTOR_COLORS[2]]);
	});

	it("ignores core contributors when assigning palette colors", () => {
		const contributors = buildContributors(["DeKleineKobini", "Callz", "xhang98"]);

		expect(contributors.map((contributor) => contributor.color)).toEqual(["orange", CONTRIBUTOR_COLORS[0], CONTRIBUTOR_COLORS[1]]);
	});

	it("assigns colors per version, resetting between versions", () => {
		const first = buildContributors(["Callz", "xhang98"]);
		const second = buildContributors(["xhang98", "Callz"]);

		expect(first.map((contributor) => contributor.color)).toEqual([CONTRIBUTOR_COLORS[0], CONTRIBUTOR_COLORS[1]]);
		expect(second.map((contributor) => contributor.color)).toEqual([CONTRIBUTOR_COLORS[0], CONTRIBUTOR_COLORS[1]]);
	});

	it("cycles through the palette when there are more non-core contributors than colors", () => {
		const names = Array.from({ length: CONTRIBUTOR_COLORS.length + 1 }, (_, index) => `Anonymous${index}`);

		const contributors = buildContributors(names);

		expect(contributors.at(0)?.color).toBe(CONTRIBUTOR_COLORS[0]);
		expect(contributors.at(-1)?.color).toBe(CONTRIBUTOR_COLORS[0]);
	});

	it("falls back to the contributor name and a null id for unknown contributors", () => {
		const contributors = buildContributors(["UnknownPerson"]);

		expect(contributors).toEqual([{ key: "UnknownPerson", id: null, name: "UnknownPerson", color: CONTRIBUTOR_COLORS[0] }]);
	});
});

describe("toDisplayableChangelogEntry", () => {
	const entry: ChangelogEntry = {
		version: { major: 9, minor: 3, build: 1 },
		date: false,
		logs: {
			features: [
				{ message: "Non-core change", contributor: "Callz" },
				{ message: "Core change", contributor: "DeKleineKobini" },
				{ message: "No contributor" },
			],
		},
	};

	it("colors logs based on the contributor assigned for this version", () => {
		const result = toDisplayableChangelogEntry(entry);

		expect(result.logs.features.map((log) => log.color)).toEqual([CONTRIBUTOR_COLORS[0], "orange", "gray"]);
	});

	it("only lists unique contributors", () => {
		const result = toDisplayableChangelogEntry({
			...entry,
			logs: {
				features: [
					{ message: "First", contributor: "Callz" },
					{ message: "Second", contributor: "Callz" },
				],
			},
		});

		expect(result.contributors).toHaveLength(1);
		expect(result.contributors[0].color).toBe(CONTRIBUTOR_COLORS[0]);
	});
});
